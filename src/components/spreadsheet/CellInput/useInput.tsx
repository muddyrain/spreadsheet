import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useStore } from "@/hooks/useStore";
import { CellData, PositionType } from "@/types/sheet";
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

  const { config, containerWidth, containerHeight, selectedCell } = useStore();

  const { getFontSize, getTextAlign, getVerticalAlign, setFontStyle } =
    useTools();
  const [cursorStyle, setCursorStyle] = useState({
    left: 0,
    top: 0,
    height: 20,
  });
  const { getLeft, getTop, getCellWidthHeight, getValue } = useComputed();
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
    (
      selectedCell: CellData | null,
      lines: LineType[],
      cursorIndex: number,
      width: number,
    ) => {
      if (!canvasRef.current || !selectedCell) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const fontSize = getFontSize(selectedCell);
      const textAlign = getTextAlign(selectedCell);
      const canvasWidth = width;
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
  const getInputStyle = useCallback(
    (
      currentCell: CellData | null,
      options: CellInputUpdateInputOptions = {},
    ) => {
      if (!currentCell)
        return {
          maxHeight: 0,
          maxWidth: 0,
          cellWidth: 0,
          cellHeight: 0,
          x: 0,
          y: 0,
          verticalAlign: config.verticalAlign,
          textAlign: config.textAlign,
        };
      const { cellWidth, cellHeight } = getCellWidthHeight(currentCell);
      let x = getLeft(currentCell.col, options.scrollPosition);
      let y = getTop(currentCell.row, options.scrollPosition);
      if (currentCell.mergeParent) {
        const { mergeParent } = currentCell;
        const { row, col } = mergeParent;
        x = getLeft(col, options.scrollPosition);
        y = getTop(row, options.scrollPosition);
      }
      const textAlign = getTextAlign(currentCell);
      const maxHeight = containerHeight - y - 2;
      let maxWidth = 0;
      if (textAlign === "left") {
        maxWidth = containerWidth - x - 2;
      } else if (textAlign === "center") {
        maxWidth = containerWidth - x - 2;
      } else if (textAlign === "right") {
        maxWidth = containerWidth - (containerWidth - x - cellWidth) - 50;
      }
      return {
        maxHeight,
        maxWidth,
        cellWidth,
        cellHeight,
        verticalAlign: getVerticalAlign(currentCell),
        textAlign,
        x,
        y,
      };
    },
    [
      config.textAlign,
      config.verticalAlign,
      containerHeight,
      containerWidth,
      getCellWidthHeight,
      getLeft,
      getTextAlign,
      getTop,
      getVerticalAlign,
    ],
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
        const {
          maxHeight,
          maxWidth,
          verticalAlign,
          cellWidth,
          cellHeight,
          textAlign,
          x,
          y,
        } = getInputStyle(currentCell, options);
        const { width, height, maxLineWidth } = updateInputSize(
          currentCell,
          lines,
        );
        let left = 0;
        const top = y - 2;
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
        const updates = {
          width: width + config.inputPadding,
          height: height + config.inputPadding,
          transform: `translate(${left}px, ${top}px)`,
          minWidth: cellWidth + config.inputPadding,
          minHeight: cellHeight + config.inputPadding,
          maxHeight: maxHeight + config.inputPadding,
          maxWidth: maxWidth + config.inputPadding,
          alignItems: verticalAlign,
        };
        updateCursorPosition(currentCell, lines, cursorIndex, width);
        setInputStyleState({
          ...updates,
          width: height > maxHeight ? updates.width + 15 : updates.width,
          minWidth:
            height > maxHeight ? updates.minWidth + 15 : updates.minWidth,
        });
        setTimeout(() => {
          containerRef.current?.focus();
        }, 0);
        return {
          width,
          height,
          maxHeight,
          maxWidth,
        };
      }
    },
    [
      currentFocusCell,
      canvasRef,
      containerRef,
      getInputStyle,
      updateInputSize,
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

  const getLines = useCallback(
    (
      selectedCell: CellData,
      _options?: {
        wrap?: boolean;
        cellWidth?: number;
        scrollPosition?: PositionType;
        isCheckOverflow?: boolean;
      },
    ): {
      lines: LineType[];
    } => {
      const options = {
        isCheckOverflow: true,
        ..._options,
      };
      const checkInputOverflow = (allLines: LineType[]) => {
        if (!options?.wrap) {
          const { maxWidth } = getInputStyle(selectedCell, options);
          const maxLineWidth =
            Math.max(...allLines.map((item) => item.width)) +
            config.inputPadding * 2;
          if (maxLineWidth > maxWidth) {
            const { lines } = getLines(selectedCell, {
              wrap: true,
              cellWidth: maxWidth,
            });
            return {
              lines: lines,
            };
          } else {
            return {
              lines: allLines,
            };
          }
        } else {
          return {
            lines: allLines,
          };
        }
      };
      const ctx = canvasRef.current?.getContext("2d");
      const value = getValue(selectedCell);
      if (!ctx)
        return {
          lines: [],
        };
      let { cellWidth } = getCellWidthHeight(selectedCell);
      if (options?.wrap) {
        cellWidth = options.cellWidth || 0;
      }
      const wrap = !!options?.wrap || !!selectedCell?.style.wrap;
      const maxWidth = cellWidth - config.inputPadding * 2;
      // 创建辅助函数，减少重复代码
      const createLine = (
        content: string,
        startIndex: number,
        lineIndex: number,
        hardLineIndex: number,
      ): LineType => ({
        content,
        startIndex,
        lineIndex,
        hardLineIndex,
        endIndex: startIndex + content.length,
        width: ctx.measureText(content).width,
      });
      if (!wrap) {
        // 不启用自动换行，只按硬换行分割
        const hardLines = value.split("\n");
        let startIndex = 0;
        const allLines = hardLines.map((line, index) => {
          const result = createLine(line, startIndex, index, index);
          startIndex += line.length + 1; // +1 是为了计算换行符
          return result;
        });
        return options?.isCheckOverflow
          ? checkInputOverflow(allLines)
          : { lines: allLines };
      }
      // 启用自动换行，需要同时考虑硬换行和软换行
      const allLines: LineType[] = [];
      const hardLines = value.split("\n");
      let currentStartIndex = 0;
      let lineIndex = 0;
      hardLines.forEach((hardLine, hardLineIndex) => {
        // 如果是空行，直接添加
        if (hardLine.length === 0) {
          allLines.push(
            createLine("", currentStartIndex, lineIndex++, hardLineIndex),
          );
          currentStartIndex++; // 空行只包含一个换行符
          return;
        }
        // 处理当前硬行的软换行
        let currentLineStartIndex = currentStartIndex;
        let remainingText = hardLine;
        while (remainingText.length > 0) {
          // 使用二分查找找到适合当前行宽度的最大文本长度
          let low = 0,
            high = remainingText.length;
          let bestLength = 0;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testText = remainingText.substring(0, mid);
            const width = ctx.measureText(testText).width;
            if (width <= maxWidth) {
              bestLength = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          // 确保至少放置一个字符
          bestLength = Math.max(bestLength, 1);
          // 添加当前行
          const lineText = remainingText.substring(0, bestLength);
          allLines.push(
            createLine(
              lineText,
              currentLineStartIndex,
              lineIndex++,
              hardLineIndex,
            ),
          );
          // 更新剩余文本和起始索引
          remainingText = remainingText.substring(bestLength);
          currentLineStartIndex += bestLength;
        }
        // 更新总起始索引（包括换行符）
        currentStartIndex += hardLine.length + 1;
      });
      return options?.isCheckOverflow
        ? checkInputOverflow(allLines)
        : {
            lines: allLines,
          };
    },
    [
      canvasRef,
      getValue,
      getCellWidthHeight,
      config.inputPadding,
      getInputStyle,
    ],
  );
  const getCurrentLineIndex = useCallback(
    (selectedCell: CellData, cursorIndex: number) => {
      const { lines } = getLines({
        ...selectedCell,
      });
      return lines.findIndex((line) => {
        // 如果当前行包含光标位置，则返回该行的索引
        return cursorIndex >= line.startIndex && cursorIndex <= line.endIndex;
      });
    },
    [getLines],
  );
  return {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorLine,
    minSize,
    inputStyle,
    getInputStyle,
    setInputStyle,
    getCursorPosByXY,
    updateCursorPosition,
    updateInputSize,
    getCellWidthHeight,
    getInputHeight,
    getCurrentLineIndex,
    getLines,
  };
};
