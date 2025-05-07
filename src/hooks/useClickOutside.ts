import { RefObject, useEffect, useCallback } from "react";

type Handler = () => void;

export const useClickOutside = (
  refs: RefObject<HTMLElement | null>[] | RefObject<HTMLElement | null>,
  handler: Handler,
  enabled: boolean = true,
) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      const isOutside = refsArray.every(
        (ref) => !ref.current || !ref.current.contains(event.target as Node),
      );
      if (isOutside) {
        handler();
      }
    },
    [refs, handler],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [enabled, handleClickOutside]);
};
