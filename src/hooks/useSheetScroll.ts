import { PositionType } from "@/types/sheet";
import { useState, useCallback, useRef, useEffect } from "react";
import { useStore } from "./useStore";

export const useSheetScroll = (config: {
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}) => {
  const { scrollPosition, setScrollPosition } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"horizontal" | "vertical" | null>(
    null,
  );
  // dragRef 结构补全
  const dragRef = useRef<{
    startPos: PositionType;
    lastScrollPos: PositionType;
    isDragging: boolean;
    dragType: "horizontal" | "vertical" | null;
  }>({
    startPos: { x: 0, y: 0 },
    lastScrollPos: { x: 0, y: 0 },
    isDragging: false,
    dragType: null,
  });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const { startPos, lastScrollPos, dragType } = dragRef.current;

      if (dragType === "horizontal") {
        const deltaX = e.clientX - startPos.x;
        const scrollRatio = config.viewportWidth / config.totalWidth;
        const scrollDelta = deltaX / scrollRatio;
        const newScrollX = Math.max(
          0,
          Math.min(
            config.totalWidth - config.viewportWidth,
            lastScrollPos.x + scrollDelta,
          ),
        );
        const newPosition = { x: newScrollX, y: lastScrollPos.y };
        if (newScrollX !== lastScrollPos.x) {
          setScrollPosition(newPosition);
        }
      } else if (dragType === "vertical") {
        const deltaY = e.clientY - startPos.y;
        const scrollRatio = config.viewportHeight / config.totalHeight;
        const scrollDelta = deltaY / scrollRatio;
        const newScrollY = Math.max(
          0,
          Math.min(
            config.totalHeight - config.viewportHeight,
            lastScrollPos.y + scrollDelta,
          ),
        );
        const newPosition = { x: lastScrollPos.x, y: newScrollY };
        if (newScrollY !== lastScrollPos.y) {
          setScrollPosition(newPosition);
        }
      }
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
      dragRef.current.dragType = null;
      setIsDragging(false);
      setDragType(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [config, setScrollPosition]);

  const handleScrollbarDragStart = useCallback(
    (e: React.MouseEvent, type: "horizontal" | "vertical") => {
      setIsDragging(true);
      setDragType(type);
      dragRef.current = {
        startPos: { x: e.clientX, y: e.clientY },
        lastScrollPos: scrollPosition,
        isDragging: true,
        dragType: type,
      };
    },
    [scrollPosition],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (config.totalHeight <= config.viewportHeight) return;
      const maxScrollX = config.totalWidth - config.viewportWidth;
      const maxScrollY = config.totalHeight - config.viewportHeight;
      const newScrollX = Math.min(
        Math.max(0, scrollPosition.x + e.deltaX),
        maxScrollX,
      );
      const newScrollY = Math.min(
        Math.max(0, scrollPosition.y + e.deltaY),
        maxScrollY,
      );

      if (newScrollX !== scrollPosition.x || newScrollY !== scrollPosition.y) {
        setScrollPosition({
          x: newScrollX,
          y: newScrollY,
        });
      }
    },
    [scrollPosition, config, setScrollPosition],
  );

  // handleScrollbarDragEnd 只用于外部主动取消拖动（一般用不到）
  const handleScrollbarDragEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    dragRef.current.dragType = null;
    setIsDragging(false);
    setDragType(null);
  }, []);

  return {
    scrollPosition,
    isDragging,
    dragType,
    handleScrollbarDragStart,
    handleWheel,
    handleScrollbarDragEnd,
  };
};
