import type { GaussianCloud, GaussianStore } from "../../src/index";

/** Owns user-facing loading and packed-cloud status text. */
export class CloudStatus {
  constructor(private readonly element: HTMLElement) {}

  loading(url: string): void {
    this.set(`Loading ${url}…`);
  }

  parsing(fileName: string): void {
    this.set(`Parsing ${fileName}…`);
  }

  preparing(source: string, sourceCount: number): void {
    this.set(
      `${source}: ${sourceCount.toLocaleString()} Gaussians · preparing GPU resources…`,
    );
  }

  packed(
    source: string,
    sourceCount: number,
    cloud: GaussianCloud,
    store: GaussianStore,
  ): void {
    this.set(
      `${source}: ${sourceCount.toLocaleString()}→${cloud.gaussianCount.toLocaleString()} Gaussians · packed ${store.packedShFormat.toUpperCase()} SH degree ${store.shDegree}`,
    );
  }

  error(error: unknown): void {
    this.element.textContent =
      error instanceof Error ? error.message : String(error);
    this.element.dataset.error = "true";
    console.error(error);
  }

  private set(message: string): void {
    this.element.textContent = message;
    delete this.element.dataset.error;
  }
}
