/**
 * Global type augmentations for third-party libraries
 * that add properties to the window object.
 */

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: {
          theme?: string;
          size?: string;
          type?: string;
          shape?: string;
          text?: string;
          logo_alignment?: string;
        },
      ) => void;
      prompt: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export {};
