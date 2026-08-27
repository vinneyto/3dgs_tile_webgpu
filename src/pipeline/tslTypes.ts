import type { Node } from "three/webgpu";
import { uint } from "three/tsl";

type IndexedNode<TNodeType extends string> = {
  element(index: Node | number): Node<TNodeType>;
};

/**
 * Three.js exposes element() on matrix and workgroup-array node proxies at
 * runtime, while the r185 declaration files do not describe those overloads.
 */
export function uintElement(node: unknown, index: Node | number): Node<"uint"> {
  return (node as IndexedNode<"uint">).element(
    typeof index === "number" ? uint(index) : index,
  );
}

export function vec4Element(node: unknown, index: Node | number): Node<"vec4"> {
  return (node as IndexedNode<"vec4">).element(
    typeof index === "number" ? uint(index) : index,
  );
}
