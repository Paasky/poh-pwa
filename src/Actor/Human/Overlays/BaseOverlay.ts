import { IOverlay } from "./IOverlay";

/**
 * BaseOverlay provides common orchestration logic for all layered overlays.
 * It handles layer storage, visibility, and batching of refresh calls via microtasks.
 */
export abstract class BaseOverlay<T> implements IOverlay<T> {
  protected readonly layers = new Map<string, T>();
  protected readonly layerVisibility = new Map<string, boolean>();
  protected readonly dirtyLayers = new Set<string>();
  private _refreshPending = false;

  public setLayer(id: string, payload: T | null): this {
    if (!payload) {
      if (this.layers.has(id)) {
        this.layers.delete(id);
        this.dirtyLayers.add(id);
        this.onLayerRemoved(id);
        this.triggerRefresh();
      }
    } else {
      this.layers.set(id, payload);
      this.dirtyLayers.add(id);
      if (!this.layerVisibility.has(id)) {
        this.layerVisibility.set(id, true);
      }
      this.onLayerUpdated(id, payload);
      this.triggerRefresh();
    }
    return this;
  }

  public showLayer(id: string, isEnabled: boolean): void {
    if (this.layerVisibility.get(id) === isEnabled) return;
    this.layerVisibility.set(id, isEnabled);
    this.dirtyLayers.add(id);
    this.onVisibilityChanged(id, isEnabled);
    this.triggerRefresh();
  }

  /** Batch refresh to the next microtask to prevent redundant updates */
  protected triggerRefresh(): void {
    if (this._refreshPending) return;
    this._refreshPending = true;
    Promise.resolve().then(() => {
      try {
        this.onRefresh();
      } finally {
        this._refreshPending = false;
        this.dirtyLayers.clear();
      }
    });
  }

  /** Specific rendering logic implemented by subclasses */
  protected abstract onRefresh(): void;

  public abstract dispose(): void;

  /** Lifecycle hooks for subclasses */
  protected onLayerUpdated(_id: string, _payload: T): void {}
  protected onLayerRemoved(_id: string): void {}
  protected onVisibilityChanged(_id: string, _isEnabled: boolean): void {}
}
