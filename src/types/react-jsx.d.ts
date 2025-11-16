/**
 * Local TypeScript declarations to avoid missing 'react/jsx-runtime' and
 * provide a fallback for JSX.IntrinsicElements when @types/react is not
 * yet installed. This is a small, temporary shim — prefer installing
 * `@types/react` and `@types/react-dom` for full typings.
 */

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export function jsxDEV(type: any, props?: any, key?: any): any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
