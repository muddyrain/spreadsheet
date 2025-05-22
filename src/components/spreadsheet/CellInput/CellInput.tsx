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

export type CellInputRef = {
  focus: (rowIndex: number, colIndex: number) => void;
  blur: () => void;
  setValue: (value: string) => void;
};
export const CellInput = forwardRef<
  CellInputRef,
  {
    onChange: (value: string, editingCell?: CellData | null) => void;
    onTabKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnterKeyDown?: () => void;
  }
>(({ onChange }, ref) => {
  const rafId = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<{ startIndex: number; content: string }[]>(
    [],
  );
  const isSelecting = useRef(false);
  const selectionAnchor = useRef<number | null>(null);
  const [selectionText, setSelectionText] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isFirstFocus = useRef(true);
  const currentFocusCell = useRef<CellData | null>(null);
  const {
    config,
    headerColsWidth,
    headerRowsHeight,
    isFocused,
    editingCell,
    data,
    zoomSize,
    getCurrentCell,
    setHeaderRowsHeight,
    dispatch,
  } = useStore();
  const minSize = useMemo(() => {
    return {
      width: config.width * zoomSize,
      height: config.height * zoomSize,
    };
  }, [config, zoomSize]);
  const selectedCell = useMemo(() => {
    if (!editingCell) return null;
    return getCurrentCell(editingCell.row, editingCell.col);
  }, [editingCell, getCurrentCell]);
  const { getMergeCellSize, getCellPosition } = useComputed();
  const { getFontStyle, getWrapContent } = useTools();
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
  const { cellWidth, cellHeight } = useMemo(() => {
    return getCellWidthHeight(selectedCell);
  }, [getCellWidthHeight, selectedCell]);
  const {
    lastWidth,
    lastHeight,
    cursorIndex,
    cursorStyle,
    getCursorPosByXY,
    setCursorIndex,
  } = useInput({
    currentFocusCell,
    canvasRef,
    containerRef,
    value,
    lines,
    minSize,
    cellWidth,
    cellHeight,
  });
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    let contents = value.split("\n");
    if (ctx && selectedCell?.style.wrap) {
      selectedCell.value = value;
      // 获取换行后的内容，但不添加实际的换行符
      const wrappedContents = getWrapContent(ctx, {
        cell: selectedCell,
        cellWidth: cellWidth,
      });
      contents = wrappedContents;
    }
    setLines(
      contents.map((content, index) => ({
        startIndex: contents
          .slice(0, index)
          .reduce((acc, cur) => acc + cur.length + 1, 0),
        content,
      })),
    );
  }, [selectedCell, cellWidth, getWrapContent, value, setCursorIndex]);
  // 监听鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !selectedCell) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const canvasWidth = canvasRef.current.width;
      const cursorPos = getCursorPosByXY(x, y, canvasWidth, selectedCell);
      setCursorIndex(cursorPos);
      setSelectionText(null);
      isSelecting.current = true;
      selectionAnchor.current = cursorPos;
      // 监听 mousemove 和 mouseup
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isSelecting.current) return;
        const moveX = moveEvent.clientX - rect.left;
        const moveY = moveEvent.clientY - rect.top;
        const moveCursor = getCursorPosByXY(
          moveX,
          moveY,
          canvasWidth,
          selectedCell,
        );
        if (
          selectionAnchor.current !== null &&
          moveCursor !== selectionAnchor.current
        ) {
          const start = Math.min(selectionAnchor.current, moveCursor);
          const end = Math.max(selectionAnchor.current, moveCursor);
          setSelectionText({ start, end });
          setCursorIndex(moveCursor);
        } else {
          setSelectionText(null);
          setCursorIndex(moveCursor);
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
    [selectedCell, getCursorPosByXY, setCursorIndex],
  );
  // 处理键盘输入
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key;
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
        let newCursor = 0;
        if (selectionText) {
          // 有选区，替换选中内容
          newValue =
            value.slice(0, selectionText.start) +
            e.key +
            value.slice(selectionText.end);
          newCursor = selectionText.start + 1;
          setSelectionText(null);
        } else {
          newValue =
            value.slice(0, cursorIndex) + e.key + value.slice(cursorIndex);
          newCursor = cursorIndex + 1;
        }
        setValue(newValue);
        setCursorIndex(newCursor);
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
    [selectionText, value, setCursorIndex, cursorIndex],
  );
  const handleBlur = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.display = "none";
      containerRef.current.blur();
      dispatch({ isFocused: false });
      onChange?.(value);
      const row = currentFocusCell?.current?.row;
      if (row && lastHeight.current > headerRowsHeight[row]) {
        headerRowsHeight[row] = lastHeight.current;
        setHeaderRowsHeight([...headerRowsHeight]);
      }
    }
  }, [
    dispatch,
    onChange,
    value,
    lastHeight,
    setHeaderRowsHeight,
    headerRowsHeight,
  ]);
  useImperativeHandle(ref, () => ({
    focus(rowIndex: number, colIndex: number) {
      const currentCell = getCurrentCell(rowIndex, colIndex);
      if (!currentCell) return;
      currentFocusCell.current = currentCell;
      setSelectionText(null);
      dispatch({ isFocused: true });
      isFirstFocus.current = true;
    },
    blur() {
      handleBlur();
    },
    setValue(content) {
      setValue(content);
    },
  }));
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
        startX = canvasWidth / 2 - ctx.measureText(texts).width / 2 - 1;
      } else if (textAlign === "right") {
        startX =
          canvasWidth - config.inputPadding - ctx.measureText(texts).width - 1;
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
  }, [
    value,
    cellHeight,
    selectedCell,
    getCellPosition,
    getFontStyle,
    drawInput,
    data,
  ]);
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
