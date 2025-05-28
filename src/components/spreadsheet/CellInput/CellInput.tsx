import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CellData, PositionType, TableData } from "@/types/sheet";
import { useStore } from "@/hooks/useStore";
import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useInput } from "./useInput";
import { useRenderCell } from "@/hooks/useSheetDraw/useRenderCell";
import _ from "lodash";
import { produce } from "immer";

export type CellInputUpdateInputOptions = {
  scrollPosition?: PositionType;
};
export type CellInputActionsType = {
  focus: (cell: CellData | null, originData: TableData) => void;
  blur: () => void;
  setValue: (value: string) => void;
  updateInputSize: (
    currentCell: CellData,
    options?: CellInputUpdateInputOptions,
  ) => void;
};
export type LineType = {
  startIndex: number;
  endIndex: number;
  hardLineIndex: number;
  content: string;
  lineIndex: number;
};
export const CellInput = forwardRef<
  CellInputActionsType,
  {
    onChange: (value: string, editingCell?: CellData | null) => void;
    onTabKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnterKeyDown?: () => void;
  }
>(({ onChange }, ref) => {
  const rafId = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [cursorIndex, setCursorIndex] = useState(0);
  const [lines, setLines] = useState<LineType[]>([]);
  const isSelecting = useRef(false);
  const selectionAnchor = useRef<number | null>(null);
  const [selectionText, setSelectionText] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const currentFocusCell = useRef<CellData | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]); // 撤销栈
  const [redoStack, setRedoStack] = useState<string[]>([]); // 重做栈
  const [originData, setOriginData] = useState<TableData>([]);
  const {
    config,
    headerRowsHeight,
    isFocused,
    editingCell,
    selectedCell,
    addDelta,
    setHeaderRowsHeight,
    dispatch,
  } = useStore();
  const { renderTextDecoration } = useRenderCell();
  const { getCellPosition } = useComputed();
  const { getFontStyle, isOverflowMaxWidth } = useTools();
  const {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorLine,
    minSize,
    inputStyle,
    getInputHeight,
    setInputStyle,
    getCursorPosByXY,
    getCellWidthHeight,
    updateCursorPosition,
  } = useInput({
    currentFocusCell,
    canvasRef,
    containerRef,
    value,
    lines,
  });

  const getLines = useCallback(
    (selectedCell: CellData): LineType[] => {
      const ctx = canvasRef.current?.getContext("2d");
      const value = selectedCell.value;
      if (!ctx) return [];
      if (!selectedCell?.style.wrap) {
        // 不启用自动换行，只按硬换行分割
        const hardLines = value.split("\n");
        let startIndex = 0;
        return hardLines.map((line, index) => {
          const result = {
            content: line,
            startIndex: startIndex,
            lineIndex: index,
            hardLineIndex: index,
            endIndex: startIndex + line.length,
          };
          startIndex += line.length + 1; // +1 是为了计算换行符
          return result;
        });
      }

      // 启用自动换行，需要同时考虑硬换行和软换行
      const allLines: LineType[] = [];
      const hardLines = value.split("\n");
      let currentStartIndex = 0;

      hardLines.forEach((hardLine, hardLineIndex) => {
        // 如果是空行，直接添加
        if (hardLine.length === 0) {
          allLines.push({
            content: "",
            startIndex: currentStartIndex,
            lineIndex: hardLineIndex,
            hardLineIndex: hardLineIndex,
            endIndex: currentStartIndex + hardLine.length,
          });
          currentStartIndex++; // 空行只包含一个换行符
          return;
        }

        // 处理当前硬行的软换行
        let currentLineStartIndex = currentStartIndex;
        let remainingText = hardLine;

        while (remainingText.length > 0) {
          // 找到可以在当前行放置的最长文本
          let bestLength = 0;

          for (let i = remainingText.length; i >= 0; i--) {
            const testText = remainingText.substring(0, i);
            const width = ctx.measureText(testText).width;
            const { cellWidth } = getCellWidthHeight(selectedCell);
            // 否则，更新最佳长度和宽度
            bestLength = i;
            if (width <= cellWidth - config.inputPadding * 2) {
              bestLength = i;
              break;
            }
          }

          // 如果找不到合适的长度，强制放置至少一个字符
          if (bestLength === 0 && remainingText.length > 0) {
            bestLength = 1;
          }

          // 添加当前行
          const lineText = remainingText.substring(0, bestLength);
          allLines.push({
            content: lineText,
            startIndex: currentLineStartIndex,
            hardLineIndex: hardLineIndex,
            lineIndex: allLines.length,
            endIndex: currentLineStartIndex + lineText.length,
          });

          // 更新剩余文本和起始索引
          remainingText = remainingText.substring(bestLength);
          currentLineStartIndex += bestLength;
        }

        // 更新总起始索引（包括换行符）
        currentStartIndex += hardLine.length + 1;
      });

      return allLines;
    },
    [config.inputPadding, getCellWidthHeight],
  );
  const updateCell = useCallback(
    (
      selectedCell: CellData,
      content: string,
      newCursor: number,
      options: CellInputUpdateInputOptions = {},
    ) => {
      // 保存当前状态到撤销栈
      setUndoStack((prev) => [...prev, content]);
      setValue(() => content);
      setCursorIndex(() => newCursor);
      const lines = getLines({
        ...selectedCell,
        value: content,
      });
      setLines(() => [...lines]);
      onChange(content, selectedCell);
      setInputStyle(selectedCell, lines, newCursor, options);
    },
    [getLines, onChange, setInputStyle],
  );
  // 监听鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !selectedCell) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const canvasWidth = canvasRef.current.width;
      const lines = getLines({
        ...selectedCell,
        value: value,
      });
      const { cursorIndex } = getCursorPosByXY(
        x,
        y,
        canvasWidth,
        selectedCell,
        lines,
      );
      setCursorIndex(cursorIndex);
      updateCursorPosition(selectedCell, lines, cursorIndex);
      setSelectionText(null);
      isSelecting.current = true;
      selectionAnchor.current = cursorIndex;
      // 监听 mousemove 和 mouseup
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isSelecting.current) return;
        const moveX = moveEvent.clientX - rect.left;
        const moveY = moveEvent.clientY - rect.top;
        const { cursorIndex } = getCursorPosByXY(
          moveX,
          moveY,
          canvasWidth,
          selectedCell,
          lines,
        );
        if (
          selectionAnchor.current !== null &&
          cursorIndex !== selectionAnchor.current
        ) {
          const start = Math.min(selectionAnchor.current, cursorIndex);
          const end = Math.max(selectionAnchor.current, cursorIndex);
          setSelectionText({ start, end });
          setCursorIndex(cursorIndex);
        } else {
          setSelectionText(null);
          setCursorIndex(cursorIndex);
        }
      };
      const handleMouseUp = () => {
        isSelecting.current = false;
        selectionAnchor.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [selectedCell, getLines, value, getCursorPosByXY, updateCursorPosition],
  );
  // 处理键盘输入
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key;
      if (!selectedCell) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { cellWidth } = getCellWidthHeight(selectedCell);
      const wrap = selectedCell.style.wrap;
      // 刷新操作
      if ((e.ctrlKey || e.metaKey) && key === "r") return;
      const copy = () => {
        e.preventDefault();
        e.stopPropagation();
        const selectedText =
          selectionText && value.slice(selectionText.start, selectionText.end);
        if (selectedText) {
          navigator.clipboard.writeText(selectedText);
        }
      };
      // 处理 ctrl/cmd + z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (currentFocusCell.current) {
          if (undoStack.length === 0) return; // 没有可撤销的操作
          const newUndoStack = undoStack.slice(0, -1);
          // 取出最近的历史状态
          const prevState = newUndoStack[newUndoStack.length - 1] || "";
          // 将当前状态推入重做栈
          setRedoStack((prev) => [...prev, value]);
          // 恢复到历史状态
          updateCell(selectedCell, prevState, cursorIndex);
          setUndoStack(newUndoStack);
        }
        return;
      }
      // 处理 ctrl/cmd + y 重做
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        e.stopPropagation();
        if (redoStack.length === 0) return; // 没有可重做的操作
        // 取出最近被撤销的状态
        const nextState = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);
        // 将当前状态推入撤销栈
        setUndoStack((prev) => [...prev, value]);
        // 恢复到被撤销的状态
        updateCell(selectedCell, nextState, cursorIndex);
        setRedoStack(newRedoStack);
        return;
      }
      // 使用事件冒泡 向上冒泡
      // 处理 ctrl/cmd + b 加粗
      // 处理 ctrl/cmd + \ 清除格式
      // 处理 ctrl/cmd + i 斜体
      // 处理 ctrl/cmd + i 下划线
      // 处理 ctrl/cmd + shift + x 删除线
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "\\") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x" && e.shiftKey)
      ) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "x") {
        copy();
        if (selectionText) {
          const content =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          const newCursor = selectionText.start;
          setSelectionText(null);
          updateCell(selectedCell, content, newCursor);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "c") {
        copy();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "v") {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.readText().then((clipboardText) => {
          let newValue =
            value.slice(0, cursorIndex) +
            clipboardText +
            value.slice(cursorIndex);
          let newCursor = cursorIndex + clipboardText.length;
          if (selectionText) {
            // 有选区，替换选中内容
            newValue =
              value.slice(0, selectionText.start) +
              clipboardText +
              value.slice(selectionText.end);
            newCursor = selectionText.start + clipboardText.length;
            setSelectionText(null);
          }
          updateCell(selectedCell, newValue, newCursor);
        });
        return;
      }
      if (e.key === "Enter" && e.altKey) {
        // 换行
        e.preventDefault();
        e.stopPropagation();
        const newValue =
          value.slice(0, cursorIndex) + "\n" + value.slice(cursorIndex);
        cursorLine.current += 1;
        updateCell(selectedCell, newValue, cursorIndex + 1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLocaleUpperCase() === "A") {
        e.preventDefault();
        e.stopPropagation();
        setSelectionText({
          start: 0,
          end: value.length,
        });
        return;
      }
      // 按 ctrl 或 meta 键时，不处理其他按键
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (
        key.length === 1 &&
        (/[a-zA-Z0-9]/.test(key) || // 字母数字
          /[~!@#$%^&*()_+\-=[\]{};':"|,.<>\\/?`]/.test(key)) // 常见符号
      ) {
        e.preventDefault();
        e.stopPropagation();
        // 普通字符输入
        let newValue = "";
        let newCursor = cursorIndex;
        newValue =
          value.slice(0, cursorIndex) + e.key + value.slice(cursorIndex);
        newCursor = cursorIndex + 1;
        if (selectionText) {
          newValue =
            value.slice(0, selectionText.start) +
            e.key +
            value.slice(selectionText.end);
          setSelectionText(null);
          newCursor = selectionText.start + 1;
        }
        const originLines = getLines(selectedCell);
        const currentLine = originLines[cursorLine.current];
        // 当前光标是当前行的最后一个字符 且 输入的字符会导致当前行溢出
        if (cursorIndex === currentLine?.endIndex && wrap) {
          const isOverflow = isOverflowMaxWidth(
            ctx,
            currentLine.content + e.key,
            cellWidth,
          );
          if (isOverflow) {
            cursorLine.current += 1;
          }
        }
        // 若更新内容则清空重做栈
        setRedoStack([]);
        updateCell(selectedCell, newValue, newCursor);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        if (selectionText) {
          const newValue =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          updateCell(selectedCell, newValue, selectionText.start);
          setSelectionText(null);
        } else if (cursorIndex > 0) {
          const newValue =
            value.slice(0, cursorIndex - 1) + value.slice(cursorIndex);
          updateCell(selectedCell, newValue, cursorIndex - 1);
        }
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        e.stopPropagation();
        if (selectionText) {
          const newValue =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          updateCell(selectedCell, newValue, selectionText.start);
          setSelectionText(null);
        } else if (cursorIndex < value.length) {
          const newValue =
            value.slice(0, cursorIndex) + value.slice(cursorIndex + 1);
          updateCell(selectedCell, newValue, cursorIndex);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        updateCell(selectedCell, value, Math.max(0, cursorIndex - 1));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        updateCell(
          selectedCell,
          value,
          Math.min(value.length, cursorIndex + 1),
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (cursorLine.current > 0) {
          // 获取当前行的信息
          const currentLineInfo = lines[cursorLine.current];
          // 获取上一行的信息
          const prevLineInfo = lines[cursorLine.current - 1];
          // 计算当前光标在当前行的相对位置
          const currentLineOffset = cursorIndex - currentLineInfo.startIndex;
          if (prevLineInfo) {
            // 计算在上一行对应的光标位置
            const newCursorIndex = Math.min(
              prevLineInfo.startIndex + currentLineOffset, // 保持相同的水平偏移
              prevLineInfo.endIndex, // 不超过上一行的结束位置
            );
            cursorLine.current -= 1;
            updateCell(selectedCell, value, newCursorIndex);
          }
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (cursorLine.current < lines.length - 1) {
          // 获取当前行的信息
          const currentLineInfo = lines[cursorLine.current];
          // 获取下一行的信息
          const nextLineInfo = lines[cursorLine.current + 1];
          // 计算当前光标在当前行的相对位置
          const currentLineOffset = cursorIndex - currentLineInfo.startIndex;
          if (nextLineInfo) {
            // 计算在下一行对应的光标位置
            const newCursorIndex = Math.min(
              nextLineInfo.startIndex + currentLineOffset, // 保持相同的水平偏移
              nextLineInfo.endIndex, // 不超过下一行的结束位置
            );
            cursorLine.current += 1;
            updateCell(selectedCell, value, newCursorIndex);
          }
        }
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        e.stopPropagation();
        const currentLine = lines[cursorLine.current];
        updateCell(selectedCell, value, currentLine.startIndex);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        e.stopPropagation();
        const currentLine = lines[cursorLine.current];
        updateCell(selectedCell, value, currentLine.endIndex);
        return;
      }
    },
    [
      selectedCell,
      getCellWidthHeight,
      selectionText,
      value,
      updateCell,
      cursorIndex,
      undoStack,
      redoStack,
      cursorLine,
      getLines,
      isOverflowMaxWidth,
      lines,
    ],
  );
  const handleBlur = useCallback(() => {
    if (containerRef.current) {
      if (currentFocusCell.current) {
        addDelta(originData);
        const row = currentFocusCell.current.row;
        const lines = getLines({
          ...currentFocusCell.current,
          value,
        });
        const height = getInputHeight(currentFocusCell.current, lines);
        if (row && height > headerRowsHeight[row]) {
          setHeaderRowsHeight(
            produce((headerRowsHeight) => {
              headerRowsHeight[row] = height;
            }),
          );
        }
        containerRef.current.style.display = "none";
        containerRef.current.blur();
        setValue("");
        setLines([]);
        setSelectionText(null);
        cursorLine.current = 0;
        setCursorIndex(0);
        setOriginData(originData);
        setUndoStack([]);
        setRedoStack([]);
        onChange?.(value, currentFocusCell?.current);
        currentFocusCell.current = null;
        isFocused.current = false;
      }
    }
  }, [
    isFocused,
    value,
    originData,
    headerRowsHeight,
    getLines,
    addDelta,
    getInputHeight,
    onChange,
    setHeaderRowsHeight,
    cursorLine,
  ]);
  const handleCellInputActions: CellInputActionsType = useMemo(() => {
    return {
      focus(cell, originData) {
        const currentCell = cell;
        if (!currentCell) return;
        currentFocusCell.current = _.cloneDeep(cell);
        setSelectionText(null);
        const lines = getLines(currentCell);
        setLines(lines);
        cursorLine.current = lines.length - 1;
        setCursorIndex(currentCell.value.length);
        setInputStyle(currentCell, lines, currentCell.value.length);
        setOriginData(originData);
        isFocused.current = true;
      },
      blur() {
        handleBlur();
      },
      setValue(content) {
        setValue(content);
      },
      updateInputSize(currentCell, options = {}) {
        updateCell(
          currentCell,
          currentCell.value,
          currentCell.value.length,
          options,
        );
      },
    };
  }, [isFocused, getLines, cursorLine, setInputStyle, handleBlur, updateCell]);
  useEffect(() => {
    if (handleCellInputActions) {
      dispatch({ cellInputActions: handleCellInputActions });
    } else {
      dispatch({ cellInputActions: null });
    }
  }, [handleCellInputActions, dispatch]);
  useImperativeHandle(ref, () => handleCellInputActions);
  // 绘制输入框
  const drawInput = useCallback(() => {
    if (!canvasRef.current || !selectedCell) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (lastWidth.current !== canvasRef.current.width) {
      canvasRef.current.width = Math.max(lastWidth.current, minSize.width);
      canvasRef.current.style.width = `${Math.max(lastWidth.current, minSize.width)}px`;
    }
    if (lastHeight.current !== canvasRef.current.height) {
      canvasRef.current.height = lastHeight.current;
      canvasRef.current.style.height = `${lastHeight.current}px`;
    }
    const { row, col } = selectedCell || { row: 0, col: 0 };
    const { x, y } = getCellPosition(selectedCell);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // 设置字体样式
    const { minWidth, color, fontSize, textAlign } = getFontStyle(ctx, {
      rowIndex: row,
      colIndex: col,
      x,
      y,
      cell: selectedCell,
    });
    ctx.textBaseline = "middle";
    // 行高间距 4pt
    const lineHeightPT = fontSize + 4;
    const lineHeightPX = (lineHeightPT * 4) / 3;
    const canvasWidth = canvasRef.current.width;
    // 计算文本总高度
    const totalTextHeight = lines.length * lineHeightPX;
    // 计算文本位置
    const textX = (() => {
      if (textAlign === "left" && canvasWidth <= minWidth) return 0;
      if (textAlign === "center") return canvasWidth / 2;
      if (textAlign === "right") return canvasWidth - config.inputPadding;
      return config.inputPadding;
    })();
    // 绘制选中
    if (selectionText) {
      // 找到选中区域的起始行和结束行
      let startLineIndex = 0;
      let endLineIndex = lines.length - 1;
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].startIndex <= selectionText.start &&
          (i === lines.length - 1 ||
            lines[i + 1].startIndex > selectionText.start)
        ) {
          startLineIndex = i;
        }

        if (lines[i].endIndex >= selectionText.end) {
          endLineIndex = i;
          break;
        }
      }
      // 绘制选中区域
      for (let i = startLineIndex; i <= endLineIndex; i++) {
        const line = lines[i];
        let endX = ctx.measureText(line.content).width;
        // 文本的对齐起始位置
        let x = config.inputPadding;
        if (textAlign === "center") {
          x = canvasWidth / 2 - ctx.measureText(line.content).width / 2;
        } else if (textAlign === "right") {
          x =
            canvasWidth -
            config.inputPadding -
            ctx.measureText(line.content).width;
        }
        // 起始位置 画布高度一半 - 文本总高度一半 + 行高 * 行号
        const startY =
          canvasRef.current.height / 2 - totalTextHeight / 2 + i * lineHeightPX;
        let startX = 0;
        if (i === startLineIndex) {
          // 起始行
          const textBeforeStart = value.substring(
            line.startIndex,
            selectionText.start,
          );
          startX += ctx.measureText(textBeforeStart).width;
        }

        if (i === endLineIndex) {
          // 结束行
          const textBeforeEnd = value.substring(
            line.startIndex,
            selectionText.end,
          );
          endX = ctx.measureText(textBeforeEnd).width;
        }
        // 绘制选中的文本样式
        ctx.fillStyle = config.inputSelectionColor;
        ctx.fillRect(x + startX, startY, endX - startX, lineHeightPX);
      }
    }
    ctx.fillStyle = color;
    // 起始位置 画布高度一半 - 文本总高度一半 + 每行高度的一半
    const startY =
      canvasRef.current.height / 2 - totalTextHeight / 2 + lineHeightPX / 2;
    // 绘制文本
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].content;
      const textY = startY + i * lineHeightPX;
      ctx.fillText(text, textX, textY);
      renderTextDecoration(ctx, {
        cell: selectedCell,
        text,
        textX,
        textY,
        fontSize,
      });
    }
  }, [
    selectedCell,
    lastWidth,
    lastHeight,
    getCellPosition,
    getFontStyle,
    lines,
    selectionText,
    minSize.width,
    config.inputPadding,
    config.inputSelectionColor,
    value,
    renderTextDecoration,
  ]);
  useEffect(() => {
    if (!canvasRef.current || !selectedCell) return;
    rafId.current = requestAnimationFrame(() => {
      drawInput();
    });
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [value, drawInput, selectedCell]);
  const inputDisplay = useMemo(() => {
    if (editingCell) {
      return "flex";
    } else {
      return "none";
    }
  }, [editingCell]);
  return (
    <div className="w-full h-full absolute top-0 left-0 pointer-events-none">
      <div
        ref={containerRef}
        tabIndex={0}
        className="bg-white z-50 pointer-events-auto outline-0"
        style={{
          display: inputDisplay,
          position: "relative",
          border: `2px solid ${config.selectionBorderColor}`,
          fontFamily: "PingFangSC sans-serif",
          cursor: "text",
          ...inputStyle,
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onBlur={() => {
          handleCellInputActions.blur();
          // Promise.resolve().then(() => {
          //   isFocused.current = false;
          // });
        }}
        onFocus={() => {
          Promise.resolve().then(() => {
            isFocused.current = true;
          });
        }}
      >
        <div className="relative overflow-hidden" ref={innerRef}>
          <canvas ref={canvasRef} style={{ pointerEvents: "none" }} />
          <div
            key={cursorIndex}
            className="selection-cursor absolute bg-zinc-600 animate-blink"
            style={{
              left: cursorStyle.left,
              top: cursorStyle.top,
              width: 1,
              height: cursorStyle.height,
              display: selectionText
                ? "none"
                : isFocused.current
                  ? "block"
                  : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
});
