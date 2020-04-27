import { useState } from "react";

export function useForceUpdate(): () => void {
  const [, updateState] = useState(true);
  return () => {
    updateState((state) => !state);
  };
}
