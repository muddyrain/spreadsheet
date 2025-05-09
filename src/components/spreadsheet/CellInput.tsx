import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "@/hooks/useStore";
import { CellData } from "@/types/sheet";
import { useComputed } from "@/hooks/useComputed";

export type CellInputRef = {
  setInputStyle: (rowIndex: number, colIndex: number, content?: string) => void;
  updateInputSize: () => void;
  focus: () => void;
  blur: () => void;
  setValue: (value: string) => void;
};
export const CellInput = forwardRef<
  CellInputRef,
  {
    style?: React.CSSProperties;
    onChange: (value: string) => void;
    onTabKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnterKeyDown?: () => void;
  }
>(({ style, onChange, onTabKeyDown, onEnterKeyDown }, ref) => {
  const { getMergeCellSize, getCellPosition } = useComputed();
  const [currentEditingCell, setCurrentEditingCell] = useState<CellData | null>(
    null,
  );
  const [inputHeight, setInputHeight] = useState(0);
  const {
    data,
    config,
    zoomSize,
    currentCell,
    selectedCell,
    setIsFocused,
    setEditingCell,
    headerColsWidth,
    headerRowsHeight,
    setHeaderRowsHeight,
  } = useStore();
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const updateInputSize = () => {
    if (inputRef.current && mirrorRef.current) {
      // 处理换行，保证最后一行也能被测量
      let value = inputRef.current.value || "";
      if (value.endsWith("\n")) {
        value += "\u200b"; // 补零宽空格，保证最后一行高度
      }
      mirrorRef.current.textContent = value;
      // 用 requestAnimationFrame 等待 DOM 更新
      window.requestAnimationFrame(() => {
        if (mirrorRef.current) {
          const mirrorRect = mirrorRef.current.getBoundingClientRect();
          inputRef.current!.style.width = `${mirrorRect.width}px`;
          inputRef.current!.style.height = `${mirrorRect.height}px`;
          setInputHeight(mirrorRect.height - 3);
        }
      });
    }
  };
  const applyCellStyles = useCallback(
    (
      inputEl: HTMLTextAreaElement,
      mirrorEl: HTMLDivElement,
      cell: CellData,
      width: number,
      height: number,
    ) => {
      // 设置尺寸
      const baseStyles = {
        minWidth: `${width + 3}px`,
        minHeight: `${height + 3}px`,
        padding: `${3 * zoomSize}px ${5 * zoomSize}px`,
        fontSize: `${(cell.style.fontSize || config.fontSize || 14) * zoomSize}px`,
        fontWeight: cell.style.fontWeight || "normal",
        fontStyle: cell.style.fontStyle || "normal",
        textDecoration: cell.style.textDecoration || "none",
      };
      // 应用到输入框
      Object.assign(inputEl.style, baseStyles, {
        color: cell.style.color || config.color || "#000000",
        backgroundColor:
          cell.style.backgroundColor || config.backgroundColor || "#FFFFFF",
      });
      // 应用到镜像元素
      Object.assign(mirrorEl.style, baseStyles);
    },
    [config.color, config.backgroundColor, config.fontSize, zoomSize],
  );
  const setInputStyle = (rowIndex: number, colIndex: number) => {
    if (inputRef.current && mirrorRef.current) {
      const currentCell = data[rowIndex][colIndex];
      if (!currentCell) return;
      const { width, height } = getMergeCellSize(
        currentCell,
        cellWidth,
        cellHeight,
      );
      inputRef.current.style.display = "block";
      applyCellStyles(
        inputRef.current,
        mirrorRef.current,
        currentCell,
        width,
        height,
      );
      updateInputSize();
      setIsFocused(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 0);
    }
  };
  useImperativeHandle(ref, () => ({
    setInputStyle,
    updateInputSize,
    focus() {
      updateInputSize();
      setIsFocused(true);
      inputRef.current?.focus();
    },
    blur() {
      updateInputSize();
      inputRef.current?.blur();
      setIsFocused(false);
    },
    setValue(value: string) {
      if (inputRef.current) {
        inputRef.current!.value = value;
      }
    },
  }));
  useEffect(() => {
    if (style?.display === "none") {
      setIsFocused(false);
    }
  }, [style, setIsFocused]);
  useEffect(() => {
    if (inputRef.current && mirrorRef.current && currentCell) {
      let cell = currentCell;
      if (cell.mergeParent) {
        const row = cell.mergeParent.row;
        const col = cell.mergeParent.col;
        cell = data[row]?.[col];
      }
      const { x, y } = getCellPosition(cell);
      const { width, height } = getMergeCellSize(cell, cellWidth, cellHeight);
      // 设置位置
      if (y <= 0) {
        inputRef.current.style.top = `${0}px`;
      } else {
        inputRef.current.style.top = `${y - 1}px`;
      }
      if (x <= 0) {
        inputRef.current.style.left = `${0}px`;
      } else {
        inputRef.current.style.left = `${x - 1}px`;
      }
      applyCellStyles(
        inputRef.current,
        mirrorRef.current,
        currentCell,
        width,
        height,
      );
      updateInputSize();
    }
  }, [
    data,
    config,
    zoomSize,
    currentCell,
    cellHeight,
    cellWidth,
    headerColsWidth,
    headerRowsHeight,
    selectedCell,
    getCellPosition,
    getMergeCellSize,
    applyCellStyles,
  ]);
  return (
    <>
      <textarea
        ref={inputRef}
        className="absolute hidden bg-white text-black outline-none box-border resize-none whitespace-normal break-words m-0 overflow-hidden"
        onChange={(e) => {
          onChange(e.target.value);
          updateInputSize();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Tab") {
            // 监听 Tab 键
            e.preventDefault();
            onTabKeyDown?.(e);
          } else if (e.key === "Enter" && e.altKey) {
            // 监听 alt + Enter 键 换行
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            // 在光标位置插入换行符
            textarea.value = value.slice(0, start) + "\n" + value.slice(end);
            // 设置新的光标位置
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            updateInputSize();
            onChange?.(textarea.value);
          } else if (e.key === "Enter") {
            e.preventDefault();
            onEnterKeyDown?.();
          } else if (e.key === "Escape") {
            e.preventDefault();
            // 监听 esc 键
            updateInputSize();
            setEditingCell(null);
            inputRef.current?.blur();
            setIsFocused(false);
          }
        }}
        onFocus={() => {
          setCurrentEditingCell(currentCell);
          setInputHeight(inputRef.current?.clientHeight || 0);
        }}
        onBlur={() => {
          if (
            currentEditingCell &&
            !currentEditingCell.mergeSpan &&
            !currentEditingCell?.mergeParent
          ) {
            const currentRowHeight = headerRowsHeight[currentEditingCell?.row];
            if (inputHeight > currentRowHeight) {
              headerRowsHeight[currentEditingCell?.row] = inputHeight;
              setHeaderRowsHeight([...headerRowsHeight]);
            }
          }
        }}
        style={{
          ...style,
          border: `2px solid ${config.selectionBorderColor}`,
          fontFamily: "PingFangSC sans-serif",
        }}
      />
      {/* 隐藏的 mirror div 用于测量内容尺寸 */}
      <div
        ref={mirrorRef}
        className="absolute whitespace-pre-wrap break-all box-border"
        style={{
          ...style,
          fontFamily: "PingFangSC sans-serif",
          border: `2px solid ${config.selectionBorderColor}`,
          visibility: "hidden",
        }}
      />
    </>
  );
});
