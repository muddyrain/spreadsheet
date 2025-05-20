import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import { CellData } from "@/types/sheet";
import React, { useCallback, useEffect, useRef } from "react";

export const useInput = ({
  currentFocusCell,
  containerRef,
  canvasRef,
  value,
  minSize,
  cellWidth,
  cellHeight,
}: {
  currentFocusCell: React.RefObject<CellData | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  value: string;
  minSize: { width: number; height: number };
  cellWidth: number;
  cellHeight: number;
}) => {
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const { isFocused, scrollPosition, selectedCell, getCurrentCell } =
    useStore();
  const { getFontStyle, getFontSize, getWrapContent } = useTools();
  const { getCellPosition } = useComputed();
  // 更新输入框大小
  const updateInputSize = useCallback(
    (value: string) => {
      if (!canvasRef.current)
        return {
          width: minSize.width,
          height: minSize.height,
        };
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx || !selectedCell)
        return {
          width: minSize.width,
          height: minSize.height,
        };
      getFontStyle(ctx, {
        rowIndex: selectedCell?.row || 0,
        colIndex: selectedCell?.col || 0,
        x: 0,
        y: 0,
        cell: selectedCell,
      });
      let lines = value.split("\n");
      if (selectedCell.style.wrap) {
        const wrappedContents = getWrapContent(ctx, {
          cell: selectedCell,
          cellWidth,
        });
        lines = wrappedContents;
      }
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line).width),
      );
      const width = Math.max(maxLineWidth + 8, minSize.width);
      lastWidth.current = Math.ceil(width);
      const fontSize = getFontSize(selectedCell);
      const height = Math.ceil(fontSize * 1.3333 + fontSize / 2) * lines.length;
      lastHeight.current = Math.ceil(height);
      return {
        width: lastWidth.current,
        height: lastHeight.current,
      };
    },
    [
      canvasRef,
      cellWidth,
      getFontSize,
      getFontStyle,
      getWrapContent,
      minSize.height,
      minSize.width,
      selectedCell,
    ],
  );
  // 设置 input 样式
  const setInputStyle = useCallback(
    (rowIndex: number, colIndex: number) => {
      const currentCell = getCurrentCell(rowIndex, colIndex);
      if (!currentCell) return;
      currentFocusCell.current = currentCell;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (containerRef.current) {
        const { x, y } = getCellPosition(currentCell);
        const { verticalAlign } = getFontStyle(ctx, {
          rowIndex: currentCell.row,
          colIndex: currentCell.col,
          x,
          y,
          cell: currentCell,
        });
        containerRef.current.style.display = "flex";
        containerRef.current.style.alignItems = verticalAlign;
        containerRef.current.style.minWidth = `${cellWidth + 4}px`;
        containerRef.current.style.minHeight = `${cellHeight + 4}px`;
        containerRef.current.style.left = `${x - 2}px`;
        containerRef.current.style.top = `${y - 2}px`;
        const { width, height } = updateInputSize(value);
        containerRef.current.style.width = `${width + 4}px`;
        containerRef.current.style.height = `${height + 4}px`;
        setTimeout(() => {
          containerRef.current?.focus();
        }, 0);
        if (canvasRef.current) {
          canvasRef.current.width = cellWidth;
          canvasRef.current.style.width = `${cellWidth}px`;
        }
      }
    },
    [
      getCurrentCell,
      currentFocusCell,
      canvasRef,
      containerRef,
      getCellPosition,
      getFontStyle,
      cellWidth,
      cellHeight,
      updateInputSize,
      value,
    ],
  );
  useEffect(() => {
    if (!currentFocusCell.current) return;
    if (isFocused) {
      setInputStyle(currentFocusCell.current.row, currentFocusCell.current.col);
    }
  }, [
    scrollPosition,
    isFocused,
    cellWidth,
    cellHeight,
    currentFocusCell,
    setInputStyle,
  ]);
  const getCursorPosByXY = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current || !selectedCell) return 0;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return 0;
      const { fontSize } = getFontStyle(ctx, {
        rowIndex: selectedCell.row,
        colIndex: selectedCell.col,
        x: 0,
        y: 0,
        cell: selectedCell,
      });
      const lineHeight = fontSize * 1.3333;
      let line = 0;
      const lines = value.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const lineTop = 2 + i * lineHeight + (i * fontSize) / 2;
        const lineBottom = 2 + (i + 1) * lineHeight + ((i + 1) * fontSize) / 2;
        if (y >= lineTop && y < lineBottom) {
          line = i;
          break;
        }
      }
      line = Math.max(0, Math.min(line, lines.length - 1));
      let idx = 0;
      const accWidth = 8;
      for (let i = 0; i <= lines[line].length; i++) {
        const w = ctx.measureText(lines[line].slice(0, i)).width + accWidth;
        if (x < w) {
          idx = i;
          break;
        }
        idx = i;
      }
      let cursorPos = 0;
      for (let l = 0; l < line; l++) {
        cursorPos += lines[l].length + 1;
      }
      cursorPos += idx;
      return cursorPos;
    },
    [canvasRef, selectedCell, getFontStyle, value],
  );
  return {
    lastWidth,
    lastHeight,
    setInputStyle,
    getCursorPosByXY,
    updateInputSize,
  };
};
