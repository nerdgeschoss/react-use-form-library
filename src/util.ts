import { useState } from 'react';

export function useForceUpdate(): () => void {
  const [, updateState] = useState(true);
  return () => {
    updateState((state) => !state);
  };
}

export function isEmpty(value: object): boolean {
  return !Object.keys(value).length;
}

export function uniq(value: string[]): string[] {
  return [...new Set(value)];
}

export function compact<T>(array: Array<T | undefined | false | null>): T[] {
  return array.filter(Boolean) as T[];
}
