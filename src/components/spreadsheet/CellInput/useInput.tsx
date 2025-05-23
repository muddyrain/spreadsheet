import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import { CellData } from "@/types/sheet";
import React, { useCallback, useRef, useState } from "react";
import { LineType } from "./CellInput";

export const useInput = ({
  currentFocusCell,
  containerRef,
  canvasRef,
  minSize,
}: {
  currentFocusCell: React.RefObject<CellData | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  value: string;
  lines: LineType[];
  minSize: { width: number; height: number };
}) => {
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const cursorLine = useRef(0);
  const { config, headerColsWidth, headerRowsHeight } = useStore();
  const { getFontSize, getTextAlign, getVerticalAlign } = useTools();
  const [cursorStyle, setCursorStyle] = useState({
    left: 0,
    top: 0,
    height: 20,
  });
  const { getCellPosition, getMergeCellSize } = useComputed();
  const getCellWidthHeight = useCallback(
    (selectedCell?: CellData | null) => {
      if (selectedCell) {
        const cellWidth = headerColsWidth[selectedCell.col];
        const cellHeight = headerRowsHeight[selectedCell.row];
        const { width: computedWidth, height: computedHeight } =
          getMergeCellSize(selectedCell, cellWidth, cellHeight);
        return {
          cellWidth: computedWidth,
          cellHeight: computedHeight,
        };
      } else {
        return {
          cellWidth: 0,
          cellHeight: 0,
        };
      }
    },
    [getMergeCellSize, headerColsWidth, headerRowsHeight],
  );
  // 计算光标位置
  const updateCursorPosition = useCallback(
    (selectedCell: CellData | null, lines: LineType[], cursorIndex: number) => {
      if (!canvasRef.current || !selectedCell) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const fontSize = getFontSize(selectedCell);
      const textAlign = getTextAlign(selectedCell);
      const canvasWidth = canvasRef.current.width;
      // 重新计算光标所在的行数和列数
      const _cursorLine = cursorLine.current;
      const currentLine = lines[_cursorLine];
      const currentLineContent = currentLine?.content || "";
      const cursorCol = Math.max(0, cursorIndex - currentLine?.startIndex || 0);
      const cursorColText = currentLineContent?.slice(0, cursorCol);
      const beforeTextWidth = ctx.measureText(cursorColText).width;
      const currentLineWidth = ctx.measureText(currentLineContent).width;
      let left = 0;
      if (textAlign === "left") {
        left = beforeTextWidth + config.inputPadding;
      } else if (textAlign === "center") {
        left = canvasWidth / 2 - currentLineWidth / 2 + beforeTextWidth;
      } else if (textAlign === "right") {
        left =
          canvasWidth -
          currentLineWidth -
          config.inputPadding +
          beforeTextWidth;
      }
      const lineHeightPT = fontSize + 4;
      const lineHeightPX = (lineHeightPT * 4) / 3;
      const totalTextHeight = Math.max(lines.length, 1) * lineHeightPX;
      // // 起始位置 画布高度一半 - 文本总高度一半 + 行高 * 行号
      const top =
        lastHeight.current / 2 -
        totalTextHeight / 2 +
        _cursorLine * lineHeightPX;
      setCursorStyle({ left, top, height: lineHeightPX });
    },
    [canvasRef, getFontSize, getTextAlign, config.inputPadding],
  );
  // 更新输入框大小
  const updateInputSize = useCallback(
    (selectedCell: CellData | null, lines: LineType[]) => {
      if (!canvasRef.current)
        return {
          width: minSize.width,
          height: minSize.height,
          maxLineWidth: 0,
        };
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx || !selectedCell)
        return {
          width: minSize.width,
          height: minSize.height,
          maxLineWidth: 0,
        };
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line.content).width),
      );
      const width = Math.max(
        maxLineWidth + config.inputPadding * 2,
        minSize.width,
      );
      lastWidth.current = Math.ceil(width);
      const fontSize = getFontSize(selectedCell);
      const height = Math.max(
        Math.ceil(fontSize * 1.3333 + fontSize / 2) * lines.length,
        minSize.height,
      );
      lastHeight.current = Math.ceil(height);
      return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        maxLineWidth,
      };
    },
    [
      canvasRef,
      getFontSize,
      minSize.height,
      minSize.width,
      config.inputPadding,
    ],
  );
  // 设置 input 样式
  const setInputStyle = useCallback(
    (currentCell: CellData | null, lines: LineType[], cursorIndex: number) => {
      if (!currentCell) return;
      currentFocusCell.current = currentCell;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (containerRef.current) {
        const { cellWidth, cellHeight } = getCellWidthHeight(currentCell);
        const { x, y } = getCellPosition(currentCell);
        const verticalAlign = getVerticalAlign(currentCell);
        const textAlign = getTextAlign(currentCell);
        containerRef.current.style.display = "flex";
        containerRef.current.style.alignItems = verticalAlign;
        containerRef.current.style.minWidth = `${cellWidth + config.inputPadding}px`;
        containerRef.current.style.minHeight = `${cellHeight + config.inputPadding}px`;
        const { width, height, maxLineWidth } = updateInputSize(
          currentCell,
          lines,
        );
        updateCursorPosition(currentCell, lines, cursorIndex);
        if (textAlign === "right") {
          // 减的是左右的 padding
          if (maxLineWidth >= cellWidth - config.inputPadding * 2) {
            const left = x + cellWidth - width - 2;
            containerRef.current.style.left = `${left}px`;
          } else {
            containerRef.current.style.left = `${x - 2}px`;
          }
        } else {
          containerRef.current.style.left = `${x - 2}px`;
        }
        containerRef.current.style.top = `${y - 2}px`;
        containerRef.current.style.width = `${width + config.inputPadding}px`;
        containerRef.current.style.height = `${height + config.inputPadding}px`;
        setTimeout(() => {
          containerRef.current?.focus();
        }, 0);
        return {
          width,
          height,
        };
      }
    },
    [
      currentFocusCell,
      canvasRef,
      containerRef,
      getCellWidthHeight,
      getCellPosition,
      getVerticalAlign,
      getTextAlign,
      config.inputPadding,
      updateInputSize,
      updateCursorPosition,
    ],
  );
  const getCursorPosByXY = useCallback(
    (
      x: number,
      y: number,
      canvasWidth: number,
      selectedCell: CellData,
      lines: LineType[],
    ) => {
      if (!canvasRef.current || !selectedCell)
        return {
          cursorIndex: 0,
          cursorLine: 0,
        };
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx || lines.length === 0)
        return {
          cursorIndex: 0,
          cursorLine: 0,
        };
      const value = selectedCell.value;
      const fontSize = getFontSize(selectedCell);
      const lineHeightPT = fontSize + 4;
      const lineHeightPX = (lineHeightPT * 4) / 3;
      // 调整坐标，考虑内边距和滚动
      const adjustedX = x - config.inputPadding;
      const adjustedY = y - config.inputPadding;
      // 计算点击的行号
      const lineIndex = Math.floor(adjustedY / lineHeightPX);
      // 确保行号在有效范围内
      if (lineIndex < 0)
        return {
          cursorIndex: 0,
          cursorLine: 0,
        };
      if (lineIndex >= lines.length)
        return {
          cursorIndex: value.length,
          cursorLine: lines.length - 1,
        };
      // 获取当前行的文本和信息
      const line = lines[lineIndex];
      const startIndex = line.startIndex;
      const endIndex = Math.min(startIndex + line.content.length, value.length);
      // 找到最接近的字符位置
      let bestIndex = startIndex;
      let minDistance = Infinity;
      for (let i = startIndex; i <= endIndex; i++) {
        const textBefore = value.substring(startIndex, i);
        const textWidth = ctx.measureText(textBefore).width;
        const distance = Math.abs(textWidth - adjustedX);
        if (distance < minDistance) {
          minDistance = distance;
          bestIndex = i;
        }
      }
      cursorLine.current = lineIndex;
      return {
        cursorIndex: bestIndex,
        cursorLine: lineIndex,
      };
    },
    [canvasRef, getFontSize, config.textAlign, config.inputPadding],
  );
  return {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorLine,
    setInputStyle,
    getCursorPosByXY,
    updateCursorPosition,
    updateInputSize,
    getCellWidthHeight,
  };
};
