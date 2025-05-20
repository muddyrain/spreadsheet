import { useState, useCallback } from "react";

export function useSetState<T extends object>(
  initialState: T,
): [T, (newState: Partial<T> | ((prevState: T) => Partial<T>)) => void] {
  const [state, setState] = useState<T>(initialState);

  const setPartialState = useCallback(
    (newState: Partial<T> | ((prevState: T) => Partial<T>)) => {
      setState((prevState) => {
        const newStateValue =
          typeof newState === "function" ? newState(prevState) : newState;
        return { ...prevState, ...newStateValue };
      });
    },
    [],
  );

  return [state, setPartialState];
}
