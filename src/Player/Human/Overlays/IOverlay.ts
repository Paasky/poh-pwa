export interface IOverlay<T = unknown> {
  /**
   * Updates or creates a named layer.
   * Passing null disposes the layer's resources.
   */
  setLayer(id: string, payload: T | null): this;

  /** Toggles the visibility of a specific layer without rebuilding it. */
  showLayer(id: string, isEnabled: boolean): void;

  /** Fully disposes the overlay and all its GPU resources. */
  dispose(): void;
}
