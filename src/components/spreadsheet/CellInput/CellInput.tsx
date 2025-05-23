import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CellData } from "@/types/sheet";
import { useStore } from "@/hooks/useStore";
import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useInput } from "./useInput";

export type CellInputActionsType = {
  focus: (rowIndex: number, colIndex: number) => void;
  blur: () => void;
  setValue: (value: string) => void;
  updateInputSize: (currentCell: CellData) => void;
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
  const {
    config,
    headerRowsHeight,
    isFocused,
    editingCell,
    data,
    selectedCell,
    getCurrentCell,
    setHeaderRowsHeight,
    dispatch,
  } = useStore();

  const { getCellPosition } = useComputed();
  const { getFontStyle, isOverflowMaxWidth } = useTools();

  const {
    lastWidth,
    lastHeight,
    cursorStyle,
    cursorLine,
    minSize,
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
  // 监听鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !selectedCell) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const canvasWidth = canvasRef.current.width;
      const lines = getLines(selectedCell);
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
    [
      selectedCell,
      getCursorPosByXY,
      updateCursorPosition,
      setCursorIndex,
      getLines,
    ],
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
      if ((e.ctrlKey || e.metaKey) && key === "x") {
        copy();
        if (selectionText) {
          const content =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          setValue(content);
          const newCursor = selectionText.start;
          setCursorIndex(newCursor);
          setSelectionText(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && key === "c") {
        copy();
      } else if ((e.ctrlKey || e.metaKey) && key === "v") {
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
          setValue(newValue);
          setCursorIndex(newCursor);
        });
        return;
      } else if (e.key === "Enter" && e.altKey) {
        // 换行
        e.preventDefault();
        e.stopPropagation();
        const newValue =
          value.slice(0, cursorIndex) + "\n" + value.slice(cursorIndex);
        setValue(newValue);
        setCursorIndex(cursorIndex + 1);
        cursorLine.current += 1;
        selectedCell.value = newValue;
        const lines = getLines(selectedCell);
        setLines(lines);
        setInputStyle(selectedCell, lines, cursorIndex + 1);
        onChange(newValue, selectedCell);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLocaleUpperCase() === "A"
      ) {
        e.preventDefault();
        e.stopPropagation();
        setSelectionText({
          start: 0,
          end: value.length,
        });
      } else if (
        key.length === 1 &&
        (/[a-zA-Z0-9]/.test(key) || // 字母数字
          /[~!@#$%^&*()_+\-=[\]{};':"|,.<>\\/?`]/.test(key)) // 常见符号
      ) {
        e.preventDefault();
        e.stopPropagation();
        // 普通字符输入
        let newValue = "";
        newValue =
          value.slice(0, cursorIndex) + e.key + value.slice(cursorIndex);
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
        const lines = getLines({
          ...selectedCell,
          value: newValue,
        });

        setValue(newValue);
        const newCursor = cursorIndex + 1;
        setCursorIndex(newCursor);
        setLines(lines);
        setInputStyle(selectedCell, lines, newCursor);
        onChange(newValue, selectedCell);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        if (selectionText) {
          const newValue =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          setValue(newValue);
          setCursorIndex(selectionText.start);
          setSelectionText(null);
        } else if (cursorIndex > 0) {
          const newValue =
            value.slice(0, cursorIndex - 1) + value.slice(cursorIndex);
          setValue(newValue);
          setCursorIndex(cursorIndex - 1);
        }
      } else if (e.key === "Delete") {
        e.preventDefault();
        e.stopPropagation();
        if (selectionText) {
          const newValue =
            value.slice(0, selectionText.start) +
            value.slice(selectionText.end);
          setValue(newValue);
          setCursorIndex(selectionText.start);
          setSelectionText(null);
        } else if (cursorIndex < value.length) {
          const newValue =
            value.slice(0, cursorIndex) + value.slice(cursorIndex + 1);
          setValue(newValue);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setCursorIndex(Math.max(0, cursorIndex - 1));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setCursorIndex(Math.min(value.length, cursorIndex + 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        // 上箭头：移动到上一行对应列
        const lines = value.split("\n");
        const beforeCursor = value.slice(0, cursorIndex);
        const currentLine = beforeCursor.split("\n").length - 1;
        const currentCol =
          beforeCursor.length - beforeCursor.lastIndexOf("\n") - 1;
        if (currentLine > 0) {
          const prevLineLen = lines[currentLine - 1].length;
          const newCol = Math.min(prevLineLen, currentCol);
          let newCursor = 0;
          for (let i = 0; i < currentLine - 1; i++) {
            newCursor += lines[i].length + 1;
          }
          newCursor += newCol;
          setCursorIndex(newCursor);
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        // 下箭头：移动到下一行对应列
        const lines = value.split("\n");
        const beforeCursor = value.slice(0, cursorIndex);
        const currentLine = beforeCursor.split("\n").length - 1;
        const currentCol =
          beforeCursor.length - beforeCursor.lastIndexOf("\n") - 1;
        if (currentLine < lines.length - 1) {
          const nextLineLen = lines[currentLine + 1].length;
          const newCol = Math.min(nextLineLen, currentCol);
          let newCursor = 0;
          for (let i = 0; i <= currentLine; i++) {
            newCursor += lines[i].length + 1;
          }
          newCursor += newCol;
          setCursorIndex(newCursor);
        }
        e.preventDefault();
      } else if (e.key === "Home") {
        e.preventDefault();
        e.stopPropagation();
        setCursorIndex(0);
        e.preventDefault();
      } else if (e.key === "End") {
        e.preventDefault();
        e.stopPropagation();
        setCursorIndex(value.length);
        e.preventDefault();
      }
    },
    [
      selectedCell,
      getCellWidthHeight,
      selectionText,
      value,
      cursorIndex,
      getLines,
      setInputStyle,
      onChange,
      cursorLine,
      isOverflowMaxWidth,
    ],
  );
  const handleBlur = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.display = "none";
      containerRef.current.blur();
      dispatch({ isFocused: false });
      onChange?.(value);
    }
  }, [dispatch, onChange, value]);
  const handleCellInputActions: CellInputActionsType = useMemo(() => {
    return {
      focus(rowIndex: number, colIndex: number) {
        const currentCell = getCurrentCell(rowIndex, colIndex);
        if (!currentCell) return;
        currentFocusCell.current = currentCell;
        setSelectionText(null);
        dispatch({ isFocused: true });
        const lines = getLines(currentCell);
        setLines(lines);
        cursorLine.current = lines.length - 1;
        setCursorIndex(currentCell.value.length);
        setInputStyle(currentCell, lines, currentCell.value.length);
      },
      blur() {
        handleBlur();
        if (currentFocusCell?.current) {
          const row = currentFocusCell.current?.row;
          const lines = getLines(currentFocusCell.current);
          const height = getInputHeight(currentFocusCell.current, lines);
          if (row && height > headerRowsHeight[row]) {
            headerRowsHeight[row] = height;
            setHeaderRowsHeight([...headerRowsHeight]);
          }
        }
      },
      setValue(content) {
        setValue(content);
      },
      updateInputSize(currentCell) {
        const lines = getLines(currentCell);
        setLines(lines);
        setInputStyle(currentCell, lines, currentCell.value.length);
        handleBlur();
      },
    };
  }, [
    getCurrentCell,
    dispatch,
    getLines,
    cursorLine,
    setInputStyle,
    handleBlur,
    getInputHeight,
    headerRowsHeight,
    setHeaderRowsHeight,
  ]);
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
    if (!isFocused) return;
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

    let globalStart = 0;

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
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const texts = lines[lineIndex].content;
      // 起始位置 画布高度一半 - 文本总高度一半 + 行高 * 行号
      const startY =
        canvasRef.current.height / 2 -
        totalTextHeight / 2 +
        lineIndex * lineHeightPX;
      let startX = config.inputPadding;
      if (textAlign === "center") {
        startX = canvasWidth / 2 - ctx.measureText(texts).width / 2;
      } else if (textAlign === "right") {
        startX =
          canvasWidth - config.inputPadding - ctx.measureText(texts).width;
      }
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const metrics = ctx.measureText(text);
        const width = metrics.width;
        const globalCharIndex = globalStart + i;
        if (
          selectionText &&
          globalCharIndex >= selectionText.start &&
          globalCharIndex < selectionText.end
        ) {
          // 绘制选中的文本样式
          ctx.fillStyle = config.inputSelectionColor;
          const x = startX;
          const y = startY;
          ctx.fillRect(x, y, width + 0.5, lineHeightPX + 0.5);
        }
        startX += width;
      }
      globalStart += texts.length + 1; // +1 是因为换行符
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
    }
  }, [
    selectedCell,
    isFocused,
    lastWidth,
    lastHeight,
    getCellPosition,
    getFontStyle,
    lines,
    minSize.width,
    config.inputPadding,
    config.inputSelectionColor,
    selectionText,
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
  }, [value, selectedCell, getCellPosition, getFontStyle, drawInput, data]);
  useEffect(() => {
    if (currentFocusCell.current && editingCell) {
      const { row, col } = currentFocusCell.current;
      if (row !== editingCell.row && col !== editingCell.col) {
        handleBlur();
      }
    }
  }, [editingCell, handleBlur]);
  return (
    <div className="w-full h-full absolute top-0 left-0 pointer-events-none">
      <div
        ref={containerRef}
        tabIndex={0}
        className="bg-white z-50 pointer-events-auto outline-0"
        style={{
          display: "none",
          position: "relative",
          border: `2px solid ${config.selectionBorderColor}`,
          fontFamily: "PingFangSC sans-serif",
          cursor: "text",
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
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
              display: selectionText ? "none" : "block",
            }}
          />
        </div>
      </div>
    </div>
  );
});
