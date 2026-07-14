export type YandexMetrikaFn = (
  counterId: number,
  method: string,
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    ym?: YandexMetrikaFn;
  }
}

export {};
