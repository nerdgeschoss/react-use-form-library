import { useState } from 'react';

export function useForceUpdate(): () => void {
  const [, updateState] = useState(0);
  return () => {
    updateState((state) => state + 1);
  };
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

export function copy<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.slice() as unknown as T;
  } else if (value && typeof value === 'object') {
    return { ...value };
  }
  return value;
}
