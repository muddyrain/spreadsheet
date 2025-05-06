import { RefObject, useEffect, useCallback } from "react";

type Handler = () => void;

export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  handler: Handler,
  enabled: boolean = true,
) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    },
    [ref, handler],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [enabled, handleClickOutside]);
};
