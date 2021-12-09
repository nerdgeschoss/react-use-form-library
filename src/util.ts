import { useState } from 'react';

export function useForceUpdate(): () => void {
  const [, updateState] = useState(0);
  return () => {
    updateState((state) => state + 1);
  };
}

export function isEmpty(value: object): boolean {
  return !Object.keys(value).length;
}

export function isEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function uniq(value: string[]): string[] {
  return [...new Set(value)];
}

export function compact<T>(array: Array<T | undefined | false | null>): T[] {
  return array.filter(Boolean) as T[];
}

export function isFunction(value: unknown): boolean {
  return !!value && value instanceof Function;
}
