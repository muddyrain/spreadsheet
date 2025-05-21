import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import { CellData } from "@/types/sheet";
import { ptToPx } from "@/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
  const [cursorIndex, setCursorIndex] = useState(0);
  const { config, isFocused, scrollPosition, getCurrentCell } = useStore();
  const { getFontStyle, getFontSize, getWrapContent } = useTools();
  const [cursorStyle, setCursorStyle] = useState({
    left: 0,
    top: 0,
    height: 20,
  });
  const { getCellPosition } = useComputed();
  // 计算光标位置
  const updateCursorPosition = useCallback(
    (selectedCell: CellData | null) => {
      if (!canvasRef.current || !selectedCell) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const { fontSize, textAlign } = getFontStyle(ctx, {
        rowIndex: selectedCell.row,
        colIndex: selectedCell.col,
        x: 0,
        y: 0,
        cell: selectedCell,
      });
      const canvasWidth = canvasRef.current.width;
      let contents = value.split("\n");
      if (selectedCell.style.wrap) {
        contents = getWrapContent(ctx, {
          cell: selectedCell,
          cellWidth: canvasWidth,
        });
      }
      // 重新计算光标所在的行数
      let cursorLine = 0;
      let charCount = 0;
      for (let i = 0; i < contents.length; i++) {
        charCount += contents[i].length + 1; // +1 for the newline character
        if (charCount > cursorIndex) {
          cursorLine = i;
          break;
        }
      }
      let cursorColText = "";
      let charCount2 = 0;
      for (let i = 0; i < contents.length; i++) {
        for (let j = 0; j <= contents[i].length; j++) {
          if (charCount2 === cursorIndex) {
            cursorColText = contents[i].slice(0, j);
          }
          charCount2++;
        }
      }
      const beforeTextWidth = ctx.measureText(cursorColText).width;
      const currentLineStart = cursorColText.lastIndexOf("\n") + 1;
      const currentLineEnd = value.indexOf("\n", cursorIndex);
      const currentLineContent = value.slice(
        currentLineStart,
        currentLineEnd === -1 ? value.length : currentLineEnd,
      );
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
      const totalTextHeight = contents.length * lineHeightPX;
      // 起始位置 画布高度一半 - 文本总高度一半 + 行高 * 行号
      const top =
        lastHeight.current / 2 -
        totalTextHeight / 2 +
        cursorLine * lineHeightPX;
      setCursorStyle({ left, top: top, height: lineHeightPX });
    },
    [
      canvasRef,
      getFontStyle,
      value,
      cursorIndex,
      getWrapContent,
      config.inputPadding,
    ],
  );
  // 更新输入框大小
  const updateInputSize = useCallback(
    (value: string, selectedCell: CellData | null) => {
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
      const width = Math.max(
        maxLineWidth + config.inputPadding * 2,
        minSize.width,
      );
      lastWidth.current = Math.ceil(width);
      const fontSize = getFontSize(selectedCell);
      const height = Math.ceil(fontSize * 1.3333 + fontSize / 2) * lines.length;
      lastHeight.current = Math.ceil(height);
      return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        maxLineWidth,
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
      config.inputPadding,
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
        const { verticalAlign, textAlign } = getFontStyle(ctx, {
          rowIndex: currentCell.row,
          colIndex: currentCell.col,
          x,
          y,
          cell: currentCell,
        });
        containerRef.current.style.display = "flex";
        containerRef.current.style.alignItems = verticalAlign;
        containerRef.current.style.minWidth = `${cellWidth + config.inputPadding}px`;
        containerRef.current.style.minHeight = `${cellHeight + config.inputPadding}px`;
        const { width, height, maxLineWidth } = updateInputSize(
          value,
          currentCell,
        );
        updateCursorPosition(currentCell);
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
      getCurrentCell,
      currentFocusCell,
      canvasRef,
      containerRef,
      getCellPosition,
      getFontStyle,
      cellWidth,
      config.inputPadding,
      cellHeight,
      updateInputSize,
      value,
      updateCursorPosition,
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
    (x: number, y: number, canvasWidth: number, selectedCell: CellData) => {
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
      const lineHeight = ptToPx(fontSize);
      let line = 0;
      let lines = value.split("\n");
      if (selectedCell.style.wrap) {
        lines = getWrapContent(ctx, {
          cell: selectedCell,
          cellWidth: canvasWidth,
        });
      }
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
      const textAlign = selectedCell.style?.textAlign || config.textAlign;
      const lineWidth = ctx.measureText(lines[line]).width;
      let offsetX = 0;
      if (textAlign === "left") {
        offsetX = config.inputPadding;
      } else if (textAlign === "center") {
        offsetX = (canvasWidth - lineWidth) / 2;
      } else if (textAlign === "right") {
        offsetX = canvasWidth - lineWidth - config.inputPadding;
      }
      for (let i = 0; i <= lines[line].length; i++) {
        const textWidth = ctx.measureText(lines[line].slice(0, i)).width;
        const nextCharWidth = ctx.measureText(lines[line].charAt(i)).width;
        const halfCharWidth = nextCharWidth / 2;
        if (x < textWidth + offsetX + halfCharWidth) {
          idx = i;
          break;
        }
      }
      // 如果点击位置在文本宽度之外，将光标设置为行末
      if (x > lineWidth + offsetX) {
        idx = lines[line].length;
      }
      let cursorPos = 0;
      for (let l = 0; l < line; l++) {
        cursorPos += lines[l].length + 1;
      }
      cursorPos += idx;
      return cursorPos;
    },
    [
      canvasRef,
      getFontStyle,
      value,
      config.textAlign,
      config.inputPadding,
      getWrapContent,
    ],
  );
  return {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorIndex,
    setInputStyle,
    getCursorPosByXY,
    updateInputSize,
    setCursorIndex,
  };
};
