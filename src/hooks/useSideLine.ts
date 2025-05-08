import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./useStore";
import { PositionType } from "@/types/sheet";
import { useComputed } from "./useComputed";

export const useSideLine = (options: {
  currentHoverCell: [number, number] | null;
  scrollPosition: PositionType;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef, scrollPosition } = options;
  const {
    data,
    headerColsWidth,
    headerRowsHeight,
    sideLineMode,
    currentSideLineIndex,
    currentSideLinePosition,
    isMouseDown,
    zoomSize,
    setIsMouseDown,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    setSideLineMode,
    setCurrentSideLinePosition,
    setCurrentSideLineIndex,
  } = useStore();
  const { getLeft, getTop } = useComputed();
  const lastValidPosition = useRef<[number, number] | null>(null);
  const stableTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [cursor, setCursor] = useState("cell");
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);
  useEffect(() => {
    const _setCursor = (cursor: string) => {
      setCursor((_cursor) => {
        if (_cursor === cursor) return _cursor;
        return cursor;
      });
    };
    if (!currentHoverCell) {
      _setCursor("default");
      return;
    }
    const range = Math.max(8, 8 * zoomSize); // 根据缩放
    const [rowIndex, colIndex] = currentHoverCell;
    const currentCell = data[rowIndex][colIndex];
    if (!currentPosition) {
      _setCursor("default");
      return;
    }
    if (currentCell?.readOnly) {
      if (rowIndex === 0 && colIndex === 0) {
        _setCursor("se-resize");
        return;
      }
      const [x, y] = currentPosition || [0, 0];
      if (rowIndex === 0) {
        const cellWidth = headerColsWidth[colIndex];
        const left = getLeft(colIndex);
        const offset = x - left;

        // 增加边缘检测的精确度
        if (offset <= range && colIndex > 1) {
          setCurrentSideLineIndex(() => [-1, colIndex - 1]);
          setSideLineMode("col");
          _setCursor("col-resize");
          return;
        }
        if (offset >= cellWidth - range && offset <= cellWidth) {
          setCurrentSideLineIndex(() => [-1, colIndex]);
          setSideLineMode("col");
          _setCursor("col-resize");
          return;
        }
        _setCursor("default");
        return;
      }
      if (colIndex === 0) {
        const cellHeight = headerRowsHeight[rowIndex];
        const top = getTop(rowIndex);
        const offset = y - top;
        if (offset <= range && rowIndex > 1) {
          setCurrentSideLineIndex(() => [rowIndex - 1, -1]);
          setSideLineMode("row");
          _setCursor("row-resize");
          return;
        }
        if (offset >= cellHeight - range && offset <= cellHeight) {
          setCurrentSideLineIndex(() => [rowIndex, -1]);
          setSideLineMode("row");
          _setCursor("row-resize");
          return;
        }
        _setCursor("default");
        return;
      }
    }
    _setCursor("cell");
    return () => {
      _setCursor("default"); // 清理时重置 cursor
    };
  }, [
    currentHoverCell,
    currentPosition,
    isMouseDown,
    headerColsWidth,
    headerRowsHeight,
    data,
    zoomSize,
    scrollPosition,
    getLeft,
    getTop,
    setCurrentSideLineIndex,
    setSideLineMode,
  ]);
  const clearState = useCallback(() => {
    setCurrentSideLinePosition([-1, -1]);
    setCurrentSideLineIndex([-1, -1]);
    setIsMouseDown(false);
    setCursor("cell");
  }, [setCurrentSideLineIndex, setCurrentSideLinePosition, setIsMouseDown]);
  const handleMouseUp = useCallback(() => {
    clearState();
    if (isMouseDown) {
      if (sideLineMode === "col") {
        const currentColSideLineIndex = currentSideLineIndex[1];
        const currentColSideLinePosition = currentSideLinePosition[0];
        const left = getLeft(currentColSideLineIndex);
        let width = currentColSideLinePosition - left;
        if (width <= 0) {
          width = 0;
        }
        headerColsWidth[currentColSideLineIndex] = width;
        setHeaderColsWidth([...headerColsWidth]);
        setCurrentSideLineIndex((p) => [p[0], -1]);
        setCurrentSideLinePosition((p) => [p[0], -1]);
      }
      if (sideLineMode === "row") {
        const currentRowSideLineIndex = currentSideLineIndex[0];
        const currentRowSideLinePosition = currentSideLinePosition[1];
        const top = getTop(currentRowSideLineIndex);
        let height = currentRowSideLinePosition - top;
        if (height <= 0) {
          height = 0;
        }
        headerRowsHeight[currentRowSideLineIndex] = height;
        setHeaderRowsHeight([...headerRowsHeight]);
        setCurrentSideLineIndex((p) => [-1, p[1]]);
        setCurrentSideLinePosition((p) => [-1, p[1]]);
      }
    }
  }, [
    clearState,
    getLeft,
    getTop,
    currentSideLineIndex,
    currentSideLinePosition,
    headerColsWidth,
    headerRowsHeight,
    isMouseDown,
    setCurrentSideLineIndex,
    setCurrentSideLinePosition,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    sideLineMode,
  ]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (stableTimeoutRef.current) {
          clearTimeout(stableTimeoutRef.current);
        }
        stableTimeoutRef.current = setTimeout(() => {
          lastValidPosition.current = [x, y];
        }, 0);
        setCurrentPosition((_currentPosition) => {
          if (_currentPosition?.[0] === x && _currentPosition?.[1] === y) {
            return _currentPosition;
          } else {
            return [x, y];
          }
        });
        if (isMouseDown) {
          setCurrentSideLinePosition([x, y]);
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [canvasRef, handleMouseUp, isMouseDown, setCurrentSideLinePosition]);

  return {
    setCurrentPosition,
    setIsMouseDown,
    handleMouseUp,
    cursor,
  };
};
