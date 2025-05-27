import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./useStore";
import { useComputed } from "./useComputed";
import { PaintCursorURL } from "@/assets";
import { produce } from "immer";

export const useCursor = (options: {
  currentHoverCell: [number, number] | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef } = options;
  const {
    data,
    selectedCell,
    scrollPosition,
    headerColsWidth,
    headerRowsHeight,
    sideLineMode,
    currentSideLineIndex,
    currentSideLinePosition,
    isMouseDown,
    zoomSize,
    cellInputActions,
    dispatch,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    formatBrushStyles,
  } = useStore();
  const { getLeft, getTop } = useComputed();
  const lastValidPosition = useRef<[number, number] | null>(null);
  const stableTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);
  const _setCursor = useCallback(
    (cursor: string) => {
      dispatch((state) => {
        const _cursor = state.cursor;
        if (_cursor === cursor)
          return {
            ...state,
            cursor: _cursor,
          };
        return {
          ...state,
          cursor,
        };
      });
    },
    [dispatch],
  );
  useEffect(() => {
    if (currentHoverCell) {
      const range = 5 * zoomSize;
      const [rowIndex, colIndex] = currentHoverCell;
      const currentCell = data?.[rowIndex]?.[colIndex];
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
            if (!isMouseDown) {
              dispatch(() => ({
                currentSideLineIndex: [-1, colIndex - 1],
              }));
            }
            dispatch(() => ({
              sideLineMode: "col",
            }));
            _setCursor("col-resize");
            return;
          }
          if (offset >= cellWidth - range && offset <= cellWidth) {
            if (!isMouseDown) {
              dispatch(() => ({
                currentSideLineIndex: [-1, colIndex],
              }));
            }
            dispatch(() => ({
              sideLineMode: "col",
            }));
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
            if (!isMouseDown) {
              dispatch(() => ({
                currentSideLineIndex: [rowIndex - 1, -1],
              }));
            }
            dispatch(() => ({
              sideLineMode: "row",
            }));
            _setCursor("row-resize");
            return;
          }
          if (offset >= cellHeight - range && offset <= cellHeight) {
            if (!isMouseDown) {
              dispatch(() => ({
                currentSideLineIndex: [rowIndex, -1],
              }));
            }
            dispatch(() => ({
              sideLineMode: "row",
            }));
            _setCursor("row-resize");
            return;
          }
          _setCursor("default");
          return;
        }
      }
      if (formatBrushStyles.length) {
        _setCursor(`url(${PaintCursorURL}), auto`);
      } else {
        _setCursor(`cell`);
      }
    }
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
    formatBrushStyles,
    getLeft,
    getTop,
    dispatch,
    _setCursor,
  ]);
  const clearState = useCallback(() => {
    dispatch(() => ({
      isMouseDown: false,
      cursor: "default",
      currentSideLinePosition: [-1, -1],
      currentSideLineIndex: [-1, -1],
    }));
  }, [dispatch]);
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
        setHeaderColsWidth(
          produce((headerColsWidth) => {
            headerColsWidth[currentColSideLineIndex] = width;
          }),
        );
        dispatch((state) => ({
          currentSideLineIndex: [state.currentSideLineIndex[0], -1],
          currentSideLinePosition: [state.currentSideLinePosition[0], -1],
        }));
      }
      if (sideLineMode === "row") {
        const currentRowSideLineIndex = currentSideLineIndex[0];
        const currentRowSideLinePosition = currentSideLinePosition[1];
        const top = getTop(currentRowSideLineIndex);
        let height = currentRowSideLinePosition - top;
        if (height <= 0) {
          height = 0;
        }
        setHeaderRowsHeight(
          produce((headerRowsHeight) => {
            headerRowsHeight[currentRowSideLineIndex] = height;
          }),
        );
        dispatch((state) => ({
          currentSideLineIndex: [-1, state.currentSideLineIndex[1]],
          currentSideLinePosition: [-1, state.currentSideLinePosition[1]],
        }));
      }
      if (selectedCell) {
        cellInputActions?.updateInputSize(selectedCell);
      }
    }
  }, [
    clearState,
    getLeft,
    getTop,
    selectedCell,
    cellInputActions,
    currentSideLineIndex,
    currentSideLinePosition,
    isMouseDown,
    dispatch,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    sideLineMode,
  ]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        if (stableTimeoutRef.current) {
          clearTimeout(stableTimeoutRef.current);
        }
        if (
          lastValidPosition.current &&
          lastValidPosition.current[0] !== x &&
          lastValidPosition.current[1] !== y
        ) {
          setCurrentPosition(() => [x, y]);
        }
        lastValidPosition.current = [x, y];
        if (isMouseDown) {
          if (sideLineMode === "col") {
            const left = getLeft(currentSideLineIndex[1]);
            // x 最小只能大于 left + 30
            if (x < left + 30) {
              x = left + 30;
            }
          }
          if (sideLineMode === "row") {
            const top = getTop(currentSideLineIndex[0]);
            // y 最小只能大于 top + 20
            if (y < top + 20) {
              y = top + 20;
            }
          }
          dispatch({
            currentSideLinePosition: [x, y],
          });
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    canvasRef,
    currentSideLineIndex,
    sideLineMode,
    isMouseDown,
    getLeft,
    getTop,
    handleMouseUp,
    dispatch,
  ]);

  return {
    setCurrentPosition,
    handleMouseUp,
    currentPosition,
  };
};
