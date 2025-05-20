import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import React, { useCallback, useRef } from "react";

export const useInput = ({
  canvasRef,
  value,
  minSize,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  value: string;
  minSize: { width: number; height: number };
}) => {
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const { zoomSize, selectedCell } = useStore();
  const { getFontStyle, getFontSize } = useTools();
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
      const lines = value.split("\n");
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line).width),
      );
      const width = Math.max(maxLineWidth + 8, minSize.width);
      if (width > lastWidth.current) {
        lastWidth.current = Math.ceil(width);
      }
      const fontSize = getFontSize(selectedCell);
      const height =
        Math.ceil((fontSize * 1.3333 + fontSize / 2) * zoomSize) *
        value.split("\n").length;
      lastHeight.current = Math.ceil(height);
      return {
        width: lastWidth.current,
        height: lastHeight.current,
      };
    },
    [
      canvasRef,
      getFontSize,
      getFontStyle,
      minSize.height,
      minSize.width,
      selectedCell,
      zoomSize,
    ],
  );
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
        const lineTop = (2 + i * lineHeight + (i * fontSize) / 2) * zoomSize;
        const lineBottom =
          (2 + (i + 1) * lineHeight + ((i + 1) * fontSize) / 2) * zoomSize;
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
    [canvasRef, selectedCell, getFontStyle, value, zoomSize],
  );
  return { lastWidth, lastHeight, getCursorPosByXY, updateInputSize };
};
