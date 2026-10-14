# Композиция Gaussian-пассов

`gaussianPass(renderer, camera, store, options)` — стандартный пресет. Он
создаёт публичные логические пассы, соединяет типизированные выходы и передаёт
сборку в `composeGaussianPass`. Создание отдельных compute-ядер остаётся внутри
соответствующего пасса. Один логический пасс может запускать несколько ядер.

## Стандартная сборка

```ts
const pass = gaussianPass(renderer, camera, store, { outputDepth: true });
pass.passes.projection.nodes.gaussianColorNode = gaussianColor.mul(tint);
pass.passes.raster.nodes.rasterDiscardNode = rasterViewDepth.greaterThan(limit);

// Здесь виден конкретный производитель данных:
pass.passes.raster.inputs.projection === pass.passes.projection.output;
```

| Пасс                       | Входы                               | Выход                                                                  | Работа / TSL-параметры                                                                                                     |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GaussianDataPass`         | Store или выход другого data-пасса  | `GaussianData`: means, shape, rotations, SH и active slots             | По умолчанию передаёт буферы без копирования и ничего не рисует; custom runtime может производить буферы                   |
| `GaussianTransformPass`    | Store или выход другого data-пасса  | Отдельный `GaussianData` с преобразованной геометрией                  | Один compute-проход; `positionNode`, `scaleNode`, `rotationNode`, `opacityNode`                                            |
| `GaussianProjectionPass`   | GaussianData                        | projectedMean, projectedConic, projectedColor, tileCounts              | Проекция, поддержка эллипса и число тайлов; `gaussianProjectionNode`, позиции, scale, rotation, opacity, color, visibility |
| `GaussianOrderingPass`     | GaussianData, проекция              | visibleOffsets, depthSortedGaussians, depthOrderedTileCounts, dispatch | Scan видимости, compaction, radix по глубине, gather счётчиков; TSL-слотов нет                                             |
| `GaussianIntersectionPass` | GaussianData, проекция, порядок     | intersectionOffsets, sortedIntersections, dispatch, rasterDispatch     | Scan, проверка вместимости, emit, стабильная сортировка по тайлу; TSL-слотов нет                                           |
| `GaussianRasterPass`       | GaussianData, проекция, пересечения | tileOffsets, color, depth                                              | Tile ranges, direct/chunk raster, composition; pixelValue, break, color, alpha, discard, outputDepth, outputValid          |

Ресурсы проекции индексируются **активным ordinal**, исходная геометрия —
**source GPU slot**. Это разные пространства индексов. В projectedColor.w
остаётся упакованный source slot; дополнительный data-пасс сохраняет slot ID,
object ID и активный draw cut. Сортировка видимых гауссиан по глубине выполняется
до стабильной сортировки пересечений по тайлу.

## Явная сборка с подготовкой геометрии

```ts
import {
  GaussianTransformPass,
  GaussianProjectionPass,
  GaussianOrderingPass,
  GaussianIntersectionPass,
  GaussianRasterPass,
  composeGaussianPass,
  gaussianPositionLocal,
  gaussianScale,
} from "3dgs-tile-webgpu";
import { uniform } from "three/tsl";
import { Vector3 } from "three/webgpu";

const data = new GaussianTransformPass(store);
const offset = uniform(new Vector3());
data.nodes.positionNode = gaussianPositionLocal.add(offset);
data.nodes.scaleNode = gaussianScale.mul(1.1);

const projection = new GaussianProjectionPass(data.output);
const ordering = new GaussianOrderingPass(data.output, projection.output);
const intersections = new GaussianIntersectionPass(
  data.output,
  projection.output,
  ordering.output,
);
const raster = new GaussianRasterPass(
  data.output,
  projection.output,
  intersections.output,
);
const pass = composeGaussianPass(
  renderer,
  camera,
  { data, projection, ordering, intersections, raster },
  { redrawStrategy: "auto", outputDepth: true },
);

// Изменение значения uniform не требует пересборки shader graph.
offset.value.set(0.5, 0, 0);
data.invalidate();
pass.render();

// Вторая независимая деформация может потреблять первый data.output:
// const nextData = new GaussianTransformPass(data.output);
// Тогда downstream-пассы собираются от nextData.output.
```

Подготовка геометрии выполняется перед проекцией. Её means используются также
растеризатором (включая доступ к object ID). Преобразование действительно
материализует буферы; это не переименование старого projection callback.

`GaussianTransformPass` работает в локальных координатах исходного объекта.
Доступны `gaussianIndex`, `gaussianObjectId`, `gaussianPositionLocal`,
`gaussianScale`, `gaussianRotation`, `gaussianOpacity`. Каждый слот вычисляется
из входных значений этого пасса, а не из соседнего изменённого слота. Камера,
projected bounds, raster accessors и object matrix здесь недоступны; проверка
охватывает и отложенные тела `Fn`. Для зависимых преобразований можно собрать
последовательность data-пассов. World-space и camera-specific модификации
остаются в `projection.nodes`.

Float32 и compact geometry декодируются в три отдельных vec4-f32 буфера:
means (xyz + исходный objectId), scale/opacity, quaternion xyzw. Дополнительная
память — 48 байт на source slot. Один transform dispatch использует шесть storage
bindings; обрабатывается весь source slot диапазон, не только текущий LOD cut.
SH остаётся в исходной упаковке; индексы активных слотов синхронизируются при
изменении draw cut. Identity `GaussianDataPass` стандартного пресета не добавляет
буферов или dispatch. Полноценный skinning, joint palettes, SH rotation и
расширение консервативных LOD/BVH bounds не реализованы этим изменением.

## Собственный производитель буферов

`new GaussianDataPass(store, factory)` или `new GaussianDataPass(previous.output,
factory)` создаёт data-пасс с собственным runtime. Фабрика получает `source`,
`renderer` и `bindings`. Возвращаемый `GaussianDataPassRuntime` имеет пять методов:

| Метод                | Контракт                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `getData()`          | Текущий GaussianData; identity/схема меняются только в `updateData`, active slots могут меняться между кадрами |
| `updateData(source)` | Обновить вход после смены store layout до перепривязки consumers                                               |
| `encode(renderer)`   | Записать GPU-выход до запуска проекции; на CPU он может оставаться пустым                                      |
| `getComputeNodes()`  | Все compute-узлы для компиляции с нулевым dispatch при warmup                                                  |
| `dispose()`          | Освободить собственные ресурсы и leases после безопасного завершения GPU-использования                         |

Для риггинга custom runtime может читать joint palette и записывать geometry
buffers с теми же source slot/object ID и draw cut. `bindings.storage`,
`bindings.replace`, `bindings.retire`, `bindings.afterSubmittedWork` позволяют
обновлять storage bindings и не удалять ресурсы, которые ещё используются GPU.
Источник нельзя уничтожать, пока producer/consumer его читает: `GaussianData`
поддерживает `retain`/`release`. Встроенный transform показывает такую реализацию.

## Получение ресурсов и lifetime

Каждый `output` — типизированный порт с именем и producer identity.
`inputs` показывают соединения без поиска приватных полей. `output.available`
означает, что ресурс создан на CPU; это **не** подтверждение окончания GPU-работы.
`output.read()` возвращает текущие атрибуты/текстуры и бросает явную ошибку до
подготовки или после dispose. Нужно читать порт повторно после layout/growth:
атрибут мог быть заменён. Возвращённые ресурсы заимствованы; consumer не должен
их освобождать. `pass.outputReadyNode` и `pass.getOutputStatus()` сохраняют
прежнюю семантику полноты/свежести результата.

Одна сборка имеет один render runtime и устройство. Использование одного
экземпляра логического пасса в двух `composeGaussianPass` отклоняется, включая
upstream data-пассы. Для другой камеры создайте отдельные логические пассы; один
Store можно использовать совместно. Общий GPU-producer, исполняющийся один раз
для нескольких камер, потребует отдельного внешнего владельца/scheduler.

Граф проверяет точные producer connections до первого render. Этот PR
поддерживает явную стандартную tiled topology и последовательность data-пассов;
произвольный DAG с пользовательскими raster/order passes и автоматически
выведенным scheduler не вводится. Runtime по-прежнему отвечает за размер
viewport, store/LOD, redraw/cache, warmup, вместимость пересечений и overflow
feedback. TSL rebuild затрагивает только владельца изменённого слота.

## Совместимость

Прежние `pass.gaussianColorNode`, `pass.gaussianPositionLocalNode`,
`pass.rasterColorNode` и остальные direct-slot aliases сохранены и помечены
`@deprecated`. Они адресуют `passes.projection.nodes` либо `passes.raster.nodes`
и сохраняют прежний domain. Например, старый `gaussianPositionLocalNode`
изменяет позицию внутри проекции; для материализации геометрии нужно явно
выбрать `GaussianTransformPass.nodes.positionNode`.

`getTextureNode`, `getColorNode`, depth output, debug/stats и `getResources`
совместимы. Существующие потребители, включая camera_path, не требуют изменения
для стандартного пресета.

## Проверки

`npm run typecheck`, `npm test`, `npm run build`, `npm run sandbox:build`.
Для WebGPU-проверки запустите `npm run dev` и откройте
`/test/browser/composition.html` в браузере с WebGPU. Страница выполняет
реальные compute dispatch и readback: сравнивает identity transform со
стандартным пресетом, меняет uniform и TSL-узел, проверяет рост store layout
и два последовательных data-пасса. JSON-результат показывает численную разницу,
буферы и WebGPU validation errors. В headless Chromium/SwiftShader identity
разница составила 0, смещения составили 0.5, 1 и 1.25, ошибок не было.
Проверка на физических GPU и профиль больших сцен в этот результат не входят.
