export interface IOverlay<T = any> {
  setLayer(id: string, payload: T | null): this;
  showLayer(id: string, isEnabled: boolean): void;
  setScaling?(scale: number): void;
  dispose(): void;
}
