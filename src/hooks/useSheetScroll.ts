import { PositionType } from "@/types/sheet";
import { useState, useCallback, useRef, useEffect } from "react";
import { useStore } from "./useStore";

export const useSheetScroll = (config: {
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}) => {
  const {
    selectedCell,
    zoomSize,
    cellInputActions,
    scrollPosition,
    isFocused,
    setZoomSize,
    getCurrentCell,
    setScrollPosition,
  } = useStore();
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
      if (selectedCell) {
        const currentCell = getCurrentCell(selectedCell.row, selectedCell.col);
        if (currentCell) {
          cellInputActions?.updateInputSize(currentCell);
        }
      }
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
  }, [
    cellInputActions,
    config,
    selectedCell,
    setScrollPosition,
    getCurrentCell,
  ]);

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
      let deltaX = e.deltaX;
      let deltaY = e.deltaY;
      // 兼容 Windows 下 shift+滚轮横向滚动
      if (e.shiftKey && deltaX === 0 && deltaY !== 0) {
        deltaX = deltaY;
        deltaY = 0;
      }
      // 如果是ctrl或者cmd键按下，不处理滚轮事件
      if (e.ctrlKey || e.metaKey) {
        if (isFocused.current) return;
        const role = (e.target as HTMLElement).role;
        // 判断事件是否发生在 textarea 内
        const isInputInner = !!(
          role && ["cellInput", "cellInputInner"].includes(role)
        );
        if (!isInputInner) {
          if (e.deltaY <= 0) {
            setZoomSize(zoomSize + 0.1);
          } else {
            setZoomSize(zoomSize - 0.1);
          }
        }
        return;
      }
      const maxScrollX = config.totalWidth - config.viewportWidth;
      const maxScrollY = config.totalHeight - config.viewportHeight;
      // 如果两个方向都不需要滚动，直接返回
      if (maxScrollX <= 0 && maxScrollY <= 0) {
        return;
      }
      let newScrollX = scrollPosition.x;
      let newScrollY = scrollPosition.y;
      // 只在需要横向滚动时处理横向滚动
      if (maxScrollX > 0) {
        newScrollX = Math.min(
          Math.max(0, scrollPosition.x + e.deltaX),
          maxScrollX,
        );
      }
      // 只在需要纵向滚动时处理纵向滚动
      if (maxScrollY > 0) {
        newScrollY = Math.min(
          Math.max(0, scrollPosition.y + e.deltaY),
          maxScrollY,
        );
      }
      // 只有当位置真正改变时才更新状态
      if (newScrollY !== scrollPosition.y || newScrollX !== scrollPosition.x) {
        setScrollPosition({
          x: newScrollX,
          y: newScrollY,
        });
        if (selectedCell) {
          const currentCell = getCurrentCell(
            selectedCell.row,
            selectedCell.col,
          );
          if (currentCell) {
            cellInputActions?.updateInputSize(currentCell, {
              scrollPosition: {
                x: newScrollX,
                y: newScrollY,
              },
            });
          }
        }
      }
    },
    [
      isFocused,
      config.totalWidth,
      config.viewportWidth,
      config.totalHeight,
      config.viewportHeight,
      scrollPosition.x,
      scrollPosition.y,
      selectedCell,
      setZoomSize,
      zoomSize,
      cellInputActions,
      setScrollPosition,
      getCurrentCell,
    ],
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
