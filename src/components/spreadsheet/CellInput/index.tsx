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
  const [cursor, setCursor] = useState(0);
  const isSelecting = useRef(false);
  const selectionAnchor = useRef<number | null>(null);
  const [selectionText, setSelectionText] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [minSize, setMinSize] = useState({ width: 0, height: 0 });
  const currentFocusCell = useRef<CellData | null>(null);
  const [cursorStyle, setCursorStyle] = useState({
    left: 8,
    top: 0,
    height: 20,
  });
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const {
    config,
    zoomSize,
    headerColsWidth,
    headerRowsHeight,
    selectedCell,
    isFocused,
    editingCell,
    scrollPosition,
    setIsFocused,
    getCurrentCell,
    setHeaderRowsHeight,
  } = useStore();
  const { getMergeCellSize, getCellPosition } = useComputed();
  const { getFontStyle, getFontSize } = useTools();
  const cellWidth = useMemo(() => {
    if (selectedCell) {
      return headerColsWidth[selectedCell.col];
    } else {
      return 0;
    }
  }, [headerColsWidth, selectedCell]);
  const cellHeight = useMemo(() => {
    if (selectedCell) {
      return headerRowsHeight[selectedCell.row];
    } else {
      return 0;
    }
  }, [headerRowsHeight, selectedCell]);
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
      // line = Math.max(0, Math.min(line, lines.length - 1));
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
    [selectedCell, getFontStyle, value, zoomSize],
  );
  // 监听鼠标按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !selectedCell) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cursorPos = getCursorPosByXY(x, y);
      setCursor(cursorPos);
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
          setCursor(moveCursor);
        } else {
          setSelectionText(null);
          setCursor(moveCursor);
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
  // 更新输入框大小
  const updateInputSize = useCallback(
    (value: string) => {
      if (!canvasRef.current || !containerRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx || !selectedCell) return;
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
      lastWidth.current = Math.ceil(width);
      containerRef.current.style.width = `${Math.ceil(width + 4)}px`;
      const fontSize = getFontSize(selectedCell);
      const height =
        Math.ceil((fontSize * 1.3333 + fontSize / 2) * zoomSize) *
        value.split("\n").length;
      lastHeight.current = Math.ceil(height);
      containerRef.current.style.height = `${Math.ceil(height)}px`;
    },
    [getFontSize, getFontStyle, minSize.width, selectedCell, zoomSize],
  );
  // 处理键盘输入
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key;
      e.preventDefault();
      e.stopPropagation();
      // 换行
      if (e.key === "Enter" && e.altKey) {
        const newValue = value.slice(0, cursor) + "\n" + value.slice(cursor);
        setValue(newValue);
        setCursor(cursor + 1);
        onChange?.(newValue);
        updateInputSize(newValue);
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
          newValue = value.slice(0, cursor) + e.key + value.slice(cursor);
          newCursor = cursor + 1;
        }
        setValue(newValue);
        setCursor(newCursor);
        onChange?.(newValue);
        updateInputSize(newValue);
      } else if (e.key === "Backspace") {
        if (cursor > 0) {
          const newValue = value.slice(0, cursor - 1) + value.slice(cursor);
          setValue(newValue);
          setCursor(cursor - 1);
          onChange?.(newValue);
        }
        e.preventDefault();
      } else if (e.key === "Delete") {
        if (cursor < value.length) {
          const newValue = value.slice(0, cursor) + value.slice(cursor + 1);
          setValue(newValue);
          onChange?.(newValue);
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setCursor(Math.max(0, cursor - 1));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setCursor(Math.min(value.length, cursor + 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        // 上箭头：移动到上一行对应列
        const lines = value.split("\n");
        const beforeCursor = value.slice(0, cursor);
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
          setCursor(newCursor);
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        // 下箭头：移动到下一行对应列
        const lines = value.split("\n");
        const beforeCursor = value.slice(0, cursor);
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
          setCursor(newCursor);
        }
        e.preventDefault();
      }
      if (e.key === "Home") {
        setCursor(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setCursor(value.length);
        e.preventDefault();
      }
    },
    [cursor, onChange, updateInputSize, value, selectionText],
  );
  // 计算光标位置
  const updateCursorPosition = useCallback(() => {
    if (!canvasRef.current || !selectedCell) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { fontSize, verticalAlign } = getFontStyle(ctx, {
      rowIndex: selectedCell.row,
      colIndex: selectedCell.col,
      x: 0,
      y: 0,
      cell: selectedCell,
    });
    const beforeCursor = value.slice(0, cursor);
    const lines = beforeCursor.split("\n");
    const cursorLine = lines.length - 1;
    const cursorColText = lines[lines.length - 1];
    const left =
      ctx.measureText(cursorColText).width + (fontSize / 2) * zoomSize;
    const lineHeight = fontSize * 1.3333;
    let top = 0;
    if (verticalAlign === "center") {
      top =
        cursorLine * lineHeight +
        fontSize / 2 +
        (cursorLine * fontSize) / 2 -
        2;
    }
    setCursorStyle({ left, top: top * zoomSize, height: lineHeight });
  }, [selectedCell, getFontStyle, zoomSize, value, cursor]);

  // 设置 input 样式
  const setInputStyle = useCallback(
    (rowIndex: number, colIndex: number) => {
      const currentCell = getCurrentCell(rowIndex, colIndex);
      if (!currentCell) return;
      currentFocusCell.current = currentCell;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (containerRef.current) {
        const { width, height } = getMergeCellSize(
          currentCell,
          cellWidth,
          cellHeight,
        );
        const { x, y } = getCellPosition(currentCell);
        const { verticalAlign } = getFontStyle(ctx, {
          rowIndex: currentCell.row,
          colIndex: currentCell.col,
          x,
          y,
          cell: currentCell,
        });
        lastHeight.current = height;
        lastWidth.current = width;
        containerRef.current.style.display = "flex";
        containerRef.current.style.alignItems = verticalAlign;
        containerRef.current.style.minWidth = `${width + 4}px`;
        containerRef.current.style.minHeight = `${height + 4}px`;
        containerRef.current.style.width = `${width + 4}px`;
        containerRef.current.style.height = `${height + 4}px`;
        containerRef.current.style.left = `${x - 2}px`;
        containerRef.current.style.top = `${y - 2}px`;
        setMinSize({ width: width, height: height });
        updateInputSize(value);
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
      value,
      cellHeight,
      cellWidth,
      getCellPosition,
      getCurrentCell,
      getFontStyle,
      getMergeCellSize,
      updateInputSize,
    ],
  );
  const handleBlur = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.display = "none";
      containerRef.current.blur();
      setIsFocused(false);
      onChange?.(value);
      if (lastHeight.current > cellHeight) {
        const row = currentFocusCell?.current?.row;
        if (row) {
          headerRowsHeight[row] = lastHeight.current;
        }
        setHeaderRowsHeight([...headerRowsHeight]);
      }
    }
  }, [
    setIsFocused,
    onChange,
    value,
    cellHeight,
    setHeaderRowsHeight,
    headerRowsHeight,
  ]);
  useEffect(() => {
    if (!currentFocusCell.current) return;
    if (isFocused) {
      setInputStyle(currentFocusCell.current.row, currentFocusCell.current.col);
    }
  }, [scrollPosition, isFocused, setInputStyle]);
  useImperativeHandle(ref, () => ({
    focus(rowIndex: number, colIndex: number) {
      const currentCell = getCurrentCell(rowIndex, colIndex);
      if (!currentCell) return;
      currentFocusCell.current = currentCell;
      setSelectionText(null);
      setIsFocused(true);
    },
    blur() {
      handleBlur();
    },
    setValue(content) {
      setValue(content);
      setCursor(content.length);
    },
  }));
  // 绘制输入框
  const drawInput = useCallback(() => {
    if (!canvasRef.current || !selectedCell) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (!isFocused) return;
    if (lastWidth.current !== canvasRef.current.width) {
      canvasRef.current.width = lastWidth.current;
      canvasRef.current.style.width = `${lastWidth.current}px`;
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
    const contents = value.split("\n");
    let globalStart = 0;
    // 绘制选中
    for (let lineIndex = 0; lineIndex < contents.length; lineIndex++) {
      const texts = contents[lineIndex];
      const startY =
        2 + lineIndex * fontSize * 1.3333 + (lineIndex * fontSize) / 2; // 第一行
      let startX = 5;
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const metrics = ctx.measureText(text);
        const width = Math.round(metrics.width); // 字符的宽度
        const globalCharIndex = globalStart + i;
        if (
          selectionText &&
          globalCharIndex >= selectionText.start &&
          globalCharIndex < selectionText.end
        ) {
          // 绘制选中的文本样式
          ctx.fillStyle = config.inputSelectionColor;
          const x = startX * zoomSize;
          const y = startY * zoomSize;
          ctx.fillRect(
            x,
            y,
            width,
            (fontSize * 1.3333 + Math.ceil(fontSize / 2)) * zoomSize,
          );
        }
        startX += width;
      }
      globalStart += texts.length + 1; // +1 是因为换行符
    }

    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    // 计算文本位置
    const textX = (() => {
      if (textAlign === "left" && cellWidth <= minWidth) return 0;
      if (textAlign === "center") return cellWidth / 2;
      if (textAlign === "right") return cellWidth - 5.5 * zoomSize;
      return 5.5 * zoomSize;
    })();
    // 绘制文本
    for (let i = 0; i < contents.length; i++) {
      const text = contents[i];
      const textY =
        (i * fontSize * 1.3333 + fontSize + (i * fontSize) / 2) * zoomSize;
      ctx.fillText(text, textX, textY);
    }
  }, [
    selectedCell,
    isFocused,
    getCellPosition,
    getFontStyle,
    value,
    selectionText,
    config.inputSelectionColor,
    zoomSize,
    cellWidth,
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
  }, [value, cursor, updateCursorPosition]);
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
            key={cursor}
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
