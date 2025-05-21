import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CellData } from "@/types/sheet";
import { useStore } from "@/hooks/useStore";
import { useComputed } from "@/hooks/useComputed";
import { useTools } from "@/hooks/useSheetDraw/useTools";
import { useInput } from "./useInput";
import { ptToPx } from "@/utils";

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
  const [cursorIndex, setCursorIndex] = useState(0);
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
  const [cursorStyle, setCursorStyle] = useState({
    left: 8,
    top: 0,
    height: 20,
  });
  const {
    config,
    headerColsWidth,
    headerRowsHeight,
    isFocused,
    editingCell,
    data,
    getCurrentCell,
    setHeaderRowsHeight,
    dispatch,
  } = useStore();
  const minSize = useMemo(() => {
    return {
      width: config.width,
      height: config.height,
    };
  }, [config]);
  const selectedCell = useMemo(() => {
    if (!editingCell) return null;
    return getCurrentCell(editingCell.row, editingCell.col);
  }, [editingCell, getCurrentCell]);
  const { getMergeCellSize, getCellPosition } = useComputed();
  const { getFontStyle, getWrapContent } = useTools();
  const { cellWidth, cellHeight } = useMemo(() => {
    if (selectedCell) {
      const cellWidth = headerColsWidth[selectedCell.col];
      const cellHeight = headerRowsHeight[selectedCell.row];
      const { width: computedWidth, height: computedHeight } = getMergeCellSize(
        selectedCell,
        cellWidth,
        cellHeight,
      );
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
  }, [getMergeCellSize, headerColsWidth, headerRowsHeight, selectedCell]);
  const { lastWidth, lastHeight, getCursorPosByXY, setInputStyle } = useInput({
    currentFocusCell,
    canvasRef,
    containerRef,
    value,
    minSize,
    cellWidth,
    cellHeight,
  });

  // 监听鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !selectedCell) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cursorPos = getCursorPosByXY(x, y);
      setCursorIndex(cursorPos);
      setSelectionText(null);
      isSelecting.current = true;
      selectionAnchor.current = cursorPos;
      // 监听 mousemove 和 mouseup
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isSelecting.current) return;
        const moveX = moveEvent.clientX - rect.left;
        const moveY = moveEvent.clientY - rect.top;
        const moveCursor = getCursorPosByXY(moveX, moveY);
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
    [canvasRef, selectedCell, getCursorPosByXY],
  );
  // 处理键盘输入
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key;
      e.preventDefault();
      e.stopPropagation();
      // 换行
      if (e.key === "Enter" && e.altKey) {
        const newValue =
          value.slice(0, cursorIndex) + "\n" + value.slice(cursorIndex);
        setValue(newValue);
        setCursorIndex(cursorIndex + 1);
        onChange?.(newValue);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLocaleUpperCase() === "A"
      ) {
        setSelectionText({
          start: 0,
          end: value.length,
        });
      } else if (
        key.length === 1 &&
        (/[a-zA-Z0-9]/.test(key) || // 字母数字
          /[~!@#$%^&*()_+\-=[\]{};':"|,.<>\\/?`]/.test(key)) // 常见符号
      ) {
        // 普通字符输入
        let newValue;
        let newCursor: number;
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
        onChange?.(newValue);
      } else if (e.key === "Backspace") {
        if (cursorIndex > 0) {
          const newValue =
            value.slice(0, cursorIndex - 1) + value.slice(cursorIndex);
          setValue(newValue);
          setCursorIndex(cursorIndex - 1);
          onChange?.(newValue);
        }
        e.preventDefault();
      } else if (e.key === "Delete") {
        if (cursorIndex < value.length) {
          const newValue =
            value.slice(0, cursorIndex) + value.slice(cursorIndex + 1);
          setValue(newValue);
          onChange?.(newValue);
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setCursorIndex(Math.max(0, cursorIndex - 1));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setCursorIndex(Math.min(value.length, cursorIndex + 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
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
      }
      if (e.key === "Home") {
        setCursorIndex(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setCursorIndex(value.length);
        e.preventDefault();
      }
    },
    [cursorIndex, onChange, value, selectionText],
  );
  // 计算光标位置
  const updateCursorPosition = useCallback(() => {
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
    const beforeCursor = value.slice(0, cursorIndex);
    const lines = beforeCursor.split("\n");
    const cursorLine = lines.length - 1;
    const cursorColText = lines[lines.length - 1];
    const beforeTextWidth = ctx.measureText(cursorColText).width;
    const currentLineStart = beforeCursor.lastIndexOf("\n") + 1;
    const currentLineEnd = value.indexOf("\n", cursorIndex);
    const currentLineContent = value.slice(
      currentLineStart,
      currentLineEnd === -1 ? value.length : currentLineEnd,
    );
    const currentLineWidth = ctx.measureText(currentLineContent).width;
    let left = 0;
    if (textAlign === "left") {
      left = beforeTextWidth + fontSize / 2;
    } else if (textAlign === "center") {
      left = cellWidth / 2 - currentLineWidth / 2 + beforeTextWidth;
    } else if (textAlign === "right") {
      left =
        cellWidth -
        currentLineWidth -
        fontSize / 2 +
        beforeTextWidth +
        fontSize / 2;
    }
    const lineHeight = ptToPx(fontSize);
    const top =
      cursorLine * lineHeight + fontSize / 2 + (cursorLine * fontSize) / 2 - 2;
    setCursorStyle({ left, top: top, height: lineHeight });
  }, [selectedCell, getFontStyle, value, cursorIndex, cellWidth]);

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
      setInputStyle(currentFocusCell.current.row, currentFocusCell.current.col);
    },
    blur() {
      handleBlur();
    },
    setValue(content) {
      setValue(content);
      setCursorIndex(content.length);
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
    let contents = value.split("\n");
    let globalStart = 0;

    ctx.textBaseline = "middle";
    const lineHeightPT = fontSize + 4;
    const lineHeightPX = (lineHeightPT * 4) / 3;
    // 绘制选中
    for (let lineIndex = 0; lineIndex < contents.length; lineIndex++) {
      const texts = contents[lineIndex];
      const startY =
        1 + (lineIndex * fontSize * 4) / 3 + (lineIndex * fontSize) / 2;
      let startX = 5;
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const metrics = ctx.measureText(text);
        const width = Math.round(metrics.width);
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
          ctx.fillRect(
            x,
            y,
            width,
            (fontSize * 4) / 3 + Math.ceil(fontSize / 2),
          );
        }
        startX += width;
      }
      globalStart += texts.length + 1; // +1 是因为换行符
    }
    // 计算文本总高度
    const totalTextHeight = contents.length * lineHeightPX;
    // 计算文本位置
    const textX = (() => {
      if (textAlign === "left" && cellWidth <= minWidth) return 0;
      if (textAlign === "center") return cellWidth / 2;
      if (textAlign === "right") return cellWidth;
      return fontSize / 2;
    })();
    if (selectedCell.style.wrap) {
      contents = getWrapContent(ctx, {
        cell: selectedCell,
        cellWidth,
      });
    }
    ctx.fillStyle = color;
    // 起始位置 画布高度一半 - 文本总高度一半 + 每行高度的一半
    const startY =
      canvasRef.current.height / 2 - totalTextHeight / 2 + lineHeightPX / 2;
    // 绘制文本
    for (let i = 0; i < contents.length; i++) {
      const text = contents[i];
      const textY = startY + i * lineHeightPX;
      ctx.fillText(text, textX, textY);
    }
  }, [
    selectedCell,
    isFocused,
    lastWidth,
    minSize.width,
    lastHeight,
    cellWidth,
    getCellPosition,
    getFontStyle,
    value,
    selectionText,
    config.inputSelectionColor,
    getWrapContent,
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
  useLayoutEffect(() => {
    updateCursorPosition();
  }, [value, cursorIndex, updateCursorPosition]);
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
        <div className="relative" ref={innerRef}>
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
