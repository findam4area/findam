declare module "lenis" {
  export interface LenisOptions {
    duration?: number;
    easing?: (t: number) => number;
    smooth?: boolean;
    smoothTouch?: boolean;
    touchMultiplier?: number;
  }

  export interface ScrollToOptions {
    offset?: number;
    duration?: number;
    immediate?: boolean;
    lock?: boolean;
    force?: boolean;
    onComplete?: () => void;
  }

  export default class Lenis {
    constructor(options?: LenisOptions);
    raf(time: number): void;
    scrollTo(
      target: string | number | HTMLElement,
      options?: ScrollToOptions,
    ): void;
    destroy(): void;
    start(): void;
    stop(): void;
  }
}
