import { IOverlay } from "./IOverlay";

/**
 * BaseOverlay provides common orchestration logic for all layered overlays.
 * It handles layer storage, visibility, and batching of refresh calls via microtasks.
 */
export abstract class BaseOverlay<T> implements IOverlay<T> {
  protected readonly layers = new Map<string, T>();
  protected readonly layerVisibility = new Map<string, boolean>();
  private _refreshPending = false;

  public setLayer(id: string, payload: T | null): this {
    if (!payload) {
      if (this.layers.has(id)) {
        this.layers.delete(id);
        this.onLayerRemoved(id);
        this.triggerRefresh();
      }
    } else {
      this.layers.set(id, payload);
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
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error in ${this.constructor.name}.onRefresh:`, e);
      } finally {
        this._refreshPending = false;
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
