import type { GaussianSandbox } from "./GaussianSandbox";

export interface SandboxUiElements {
  readonly openButton: HTMLButtonElement;
  readonly fileInput: HTMLInputElement;
  readonly octreeToggle: HTMLInputElement;
  readonly lodColorToggle: HTMLInputElement;
}

export class SandboxUi {
  private readonly applySpatialDebugState = () => {
    this.sandbox.setOctreeHelperVisible(this.elements.octreeToggle.checked);
    this.sandbox.setLodColoringEnabled(this.elements.lodColorToggle.checked);
  };
  private readonly openFilePicker = () => this.elements.fileInput.click();
  private readonly loadSelectedFile = () => {
    const file = this.elements.fileInput.files?.[0];
    if (file !== undefined) void this.sandbox.loadFile(file);
    this.elements.fileInput.value = "";
  };
  private readonly handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    document.body.dataset.dragging = "true";
  };
  private readonly handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };
  private readonly handleDragLeave = (event: DragEvent) => {
    if (event.relatedTarget === null) delete document.body.dataset.dragging;
  };
  private readonly handleDrop = (event: DragEvent) => {
    event.preventDefault();
    delete document.body.dataset.dragging;
    const file = event.dataTransfer?.files[0];
    if (file !== undefined) void this.sandbox.loadFile(file);
  };

  constructor(
    private readonly sandbox: GaussianSandbox,
    private readonly elements: SandboxUiElements,
  ) {
    elements.octreeToggle.addEventListener(
      "change",
      this.applySpatialDebugState,
    );
    elements.lodColorToggle.addEventListener(
      "change",
      this.applySpatialDebugState,
    );
    elements.openButton.addEventListener("click", this.openFilePicker);
    elements.fileInput.addEventListener("change", this.loadSelectedFile);
    addEventListener("dragenter", this.handleDragEnter);
    addEventListener("dragover", this.handleDragOver);
    addEventListener("dragleave", this.handleDragLeave);
    addEventListener("drop", this.handleDrop);
    this.applySpatialDebugState();
  }

  dispose(): void {
    const elements = this.elements;
    elements.octreeToggle.removeEventListener(
      "change",
      this.applySpatialDebugState,
    );
    elements.lodColorToggle.removeEventListener(
      "change",
      this.applySpatialDebugState,
    );
    elements.openButton.removeEventListener("click", this.openFilePicker);
    elements.fileInput.removeEventListener("change", this.loadSelectedFile);
    removeEventListener("dragenter", this.handleDragEnter);
    removeEventListener("dragover", this.handleDragOver);
    removeEventListener("dragleave", this.handleDragLeave);
    removeEventListener("drop", this.handleDrop);
    delete document.body.dataset.dragging;
  }
}
