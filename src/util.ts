import { useEffect, useRef, useState } from 'react';

export function useForceUpdate(): () => void {
  const mounted = useRef(false);
  const [, updateState] = useState(0);

  function handleUpdate(): void {
    if (mounted.current) {
      updateState((state) => state + 1);
    }
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return () => {
    handleUpdate();
  };
}

export function isEqual<T>(a: T, b: T): boolean {
  if (a === b) return true; // faster in case there's actual equality
  if (a == null || b == null) return a === b;

  // Dates: compare by time.
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }

  const aPlain = Array.isArray(a) || isObject(a);
  const bPlain = Array.isArray(b) || isObject(b);
  if (!aPlain || !bPlain) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => isEqual(value, b[index]));
  }

  // Both plain objects: key-order-independent, and treats a missing key and
  // an explicit `undefined` as equal.
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const key of keys) {
    if (!isEqual(ao[key], bo[key])) return false;
  }
  return true;
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
  } else if (value && isObject(value)) {
    return { ...value };
  }
  return value;
}

export function isObject(value: unknown): boolean {
  return !!value && typeof value === 'object' && value.constructor === Object;
}
