import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import { CellData } from "@/types/sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { CellInputUpdateInputOptions, LineType } from "./CellInput";
import _ from "lodash";

export const useInput = ({
  currentFocusCell,
  containerRef,
  canvasRef,
  value,
}: {
  currentFocusCell: React.RefObject<CellData | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  value: string;
  lines: LineType[];
}) => {
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const cursorLine = useRef(0);
  const { getStartEndRow, getStartEndCol } = useComputed();

  const {
    config,
    containerWidth,
    containerHeight,
    headerColsWidth,
    headerRowsHeight,
    selectedCell,
  } = useStore();

  const { getFontSize, getTextAlign, getVerticalAlign, setFontStyle } =
    useTools();
  const [cursorStyle, setCursorStyle] = useState({
    left: 0,
    top: 0,
    height: 20,
  });
  const { getLeft, getTop, getCellWidthHeight } = useComputed();
  const minSize = useMemo(() => {
    const { cellWidth } = getCellWidthHeight(selectedCell);
    return {
      width: cellWidth,
      height: config.height,
    };
  }, [selectedCell, config, getCellWidthHeight]);
  const [inputStyle, setInputStyleState] = useState<React.CSSProperties>({
    width: minSize.width,
    height: minSize.height,
    minWidth: minSize.width,
    minHeight: minSize.height,
    alignItems: config.verticalAlign,
    transform: `translate(0px, 0px)`,
  });
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
      setFontStyle(ctx, selectedCell);
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line.content).width),
      );
      const width = Math.ceil(
        Math.max(maxLineWidth + config.inputPadding * 2, minSize.width),
      );
      lastWidth.current = width;
      const fontSize = getFontSize(selectedCell);
      const lineHeightPT = fontSize + 4;
      const lineHeightPX = (lineHeightPT * 4) / 3;
      const height = Math.ceil(
        Math.max(lineHeightPX * lines.length, minSize.height),
      );
      lastHeight.current = height;
      return {
        width: width,
        height: height,
        maxLineWidth,
      };
    },
    [
      canvasRef,
      minSize.width,
      minSize.height,
      setFontStyle,
      config.inputPadding,
      getFontSize,
    ],
  );
  // 获取输入框高度 - 真实高度 不包含缩放
  const getInputHeight = useCallback(
    (selectedCell: CellData | null, lines: LineType[]) => {
      if (selectedCell) {
        const fontSize = getFontSize(selectedCell, false);
        const lineHeightPT = fontSize + 4;
        const lineHeightPX = (lineHeightPT * 4) / 3;
        const height = Math.max(lineHeightPX * lines.length, minSize.height);
        return height;
      } else {
        return minSize.height;
      }
    },
    [getFontSize, minSize.height],
  );
  // 设置 input 样式
  const setInputStyle = useCallback(
    (
      currentCell: CellData | null,
      lines: LineType[],
      cursorIndex: number,
      options: CellInputUpdateInputOptions = {},
    ) => {
      if (!currentCell) return;
      currentFocusCell.current = _.cloneDeep(currentCell);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (containerRef.current) {
        const { cellWidth, cellHeight } = getCellWidthHeight(currentCell);
        let x = getLeft(currentCell.col, options.scrollPosition);
        let y = getTop(currentCell.row, options.scrollPosition);
        if (currentCell.mergeParent) {
          const { mergeParent } = currentCell;
          const { row, col } = mergeParent;
          x = getLeft(col, options.scrollPosition);
          y = getTop(row, options.scrollPosition);
        }
        const verticalAlign = getVerticalAlign(currentCell);
        const textAlign = getTextAlign(currentCell);
        const { width, height, maxLineWidth } = updateInputSize(
          currentCell,
          lines,
        );
        let left = 0;
        let top = y - 2;
        if (textAlign === "right") {
          // 减的是左右的 padding
          if (maxLineWidth >= cellWidth - config.inputPadding * 2) {
            left = x + cellWidth - width - 2;
          } else {
            left = x - 2;
          }
        } else {
          left = x - 2;
        }
        const { startCol, endCol } = getStartEndCol(
          containerWidth,
          options.scrollPosition,
        );
        const { startRow, endRow } = getStartEndRow(
          containerHeight,
          options.scrollPosition,
        );
        // 如果当前单元格还在视口内
        const fixedWidth = headerColsWidth[0];
        const fixedHeight = headerRowsHeight[0];
        if (endCol >= currentCell.col) {
          if (left + width >= containerWidth - config.inputPadding * 2) {
            left = containerWidth - width - config.inputPadding * 2;
          }
        }
        if (startCol <= currentCell.col) {
          if (left <= fixedWidth) {
            left = fixedWidth;
          }
        } else {
          left = -1e9;
        }
        if (endRow >= currentCell.row) {
          if (top + height >= containerHeight - config.inputPadding * 2) {
            top = containerHeight - height - config.inputPadding * 2;
          }
        }
        if (startRow <= currentCell.row) {
          if (top <= fixedHeight) {
            top = fixedHeight;
          }
        } else {
          top = -1e9;
        }

        const updates = {
          width: width + config.inputPadding,
          height: height + config.inputPadding,
          transform: `translate(${left}px, ${top}px)`,
          minWidth: cellWidth + config.inputPadding,
          minHeight: cellHeight + config.inputPadding,
          alignItems: verticalAlign,
        };
        updateCursorPosition(currentCell, lines, cursorIndex);
        setInputStyleState(updates);
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
      getLeft,
      getTop,
      getVerticalAlign,
      getTextAlign,
      updateInputSize,
      getStartEndCol,
      containerWidth,
      getStartEndRow,
      containerHeight,
      headerColsWidth,
      headerRowsHeight,
      config.inputPadding,
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
      const fontSize = getFontSize(selectedCell);
      const lineHeightPT = fontSize + 4;
      const lineHeightPX = (lineHeightPT * 4) / 3;
      // 调整坐标，考虑内边距和滚动
      const adjustedX = x;
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
      const textAlign = getTextAlign(selectedCell);
      const lineWidth = ctx.measureText(line.content).width;
      let adjustedTextX = adjustedX - config.inputPadding;
      // 根据文本对齐方式调整点击位置
      if (textAlign === "center") {
        const lineStartX =
          canvasWidth / 2 - lineWidth / 2 - config.inputPadding;
        adjustedTextX = adjustedX - lineStartX;
      } else if (textAlign === "right") {
        const lineStartX = canvasWidth - lineWidth - config.inputPadding;
        adjustedTextX = adjustedX - lineStartX;
      }
      // 找到最接近的字符位置
      let bestIndex = startIndex;
      let minDistance = Infinity;
      for (let i = startIndex; i <= endIndex; i++) {
        const textBefore = value.substring(startIndex, i);
        const textWidth = ctx.measureText(textBefore).width;
        const distance = Math.abs(textWidth - adjustedTextX);
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
    [canvasRef, getFontSize, value, config.inputPadding, getTextAlign],
  );
  return {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorLine,
    minSize,
    inputStyle,
    setInputStyle,
    getCursorPosByXY,
    updateCursorPosition,
    updateInputSize,
    getCellWidthHeight,
    getInputHeight,
  };
};
