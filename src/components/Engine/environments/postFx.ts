/**
 * Post-processing defaults used by the EnvironmentService scaffold.
 * Only includes the minimal options we actively wire in the initial implementation.
 */

export type DefaultPostProcessingOptions = {
  /** Enable FXAA (fast approximate anti-aliasing). */
  enableFastApproximateAntialiasing: boolean;
  /** Enable the bloom effect to accent bright areas. */
  enableBloom: boolean;
  /** Bloom threshold (brightness level above which bloom is applied). Typical 0.6..1.0. */
  bloomThreshold: number;
  /** Bloom weight (overall influence of the bloom on the image). Typical 0.2..0.6. */
  bloomWeight: number;
};

export const defaultPostProcessingOptions: DefaultPostProcessingOptions = {
  enableFastApproximateAntialiasing: true,
  enableBloom: true,
  bloomThreshold: 0.8,
  bloomWeight: 0.35,
};
