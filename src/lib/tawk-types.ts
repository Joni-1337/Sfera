export type TawkApi = {
  maximize?: () => void;
  minimize?: () => void;
  showWidget?: () => void;
  hideWidget?: () => void;
  popup?: () => void;
  onLoad?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

export {};
