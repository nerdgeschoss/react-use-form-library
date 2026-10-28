// The library has no @types/react-dom; the hook tests only need these two functions.
declare module 'react-dom' {
  import { ReactElement } from 'react';
  export function render(element: ReactElement, container: Element): void;
}

declare module 'react-dom/test-utils' {
  export function act(callback: () => void): void;
  export function act(callback: () => Promise<void>): Promise<void>;
}
