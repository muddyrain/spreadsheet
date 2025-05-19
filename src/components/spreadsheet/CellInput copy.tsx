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
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    onChange: (value: string, editingCell?: CellData | null) => void;
    onTabKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnterKeyDown?: () => void;
  }
>(({ style, wrapperRef, onChange, onTabKeyDown, onEnterKeyDown }, ref) => {
  const { getMergeCellSize, getCellPosition } = useComputed();
  const [currentEditingCell, setCurrentEditingCell] = useState<CellData | null>(
    null,
  );
  const [inputHeight, setInputHeight] = useState(0);
  const {
    data,
    config,
    zoomSize,
    updater,
    currentCell,
    selectedCell,
    containerWidth,
    containerHeight,
    isFocused,
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
  const updateInputSize = useCallback(() => {
    if (inputRef.current && mirrorRef.current && isFocused) {
      // 处理换行，保证最后一行也能被测量
      let value = inputRef.current.value || "";
      if (value.endsWith("\n")) {
        value += "\u200b"; // 补零宽空格，保证最后一行高度
      }
      mirrorRef.current.textContent = value;
      // 用 requestAnimationFrame 等待 DOM 更新
      window.requestAnimationFrame(() => {
        if (mirrorRef.current && wrapperRef.current) {
          const mirrorRect = mirrorRef.current.getBoundingClientRect();
          const wrapperRect = wrapperRef.current.getBoundingClientRect();
          inputRef.current!.style.height = `${mirrorRect.height}px`;
          if (inputRef.current) {
            const left = parseInt(inputRef.current.style.left) || 0;
            const top = parseInt(inputRef.current.style.top) || 0;
            // 获取首列的宽度（用于后续宽度补偿）
            const fixedColWidth = headerColsWidth[0];
            // 判断输入框右侧是否超出容器宽度
            if (left - wrapperRect.x + mirrorRect.width > containerWidth) {
              // 计算超出的宽度
              const space = left + mirrorRect.width - containerWidth;
              // 调整输入框的 left，使其不超出容器右侧
              inputRef.current!.style.left = `${left - space - 1 + wrapperRect.x}px`;
            }
            // 判断输入框底部是否超出容器高度
            if (
              top - wrapperRect.y + mirrorRect.height + 1 >=
              containerHeight
            ) {
              // 如果超出，则限制输入框高度和最小高度为剩余空间，并扩展宽度，显示滚动条
              inputRef.current!.style.height = `${containerHeight - (top - wrapperRect.y)}px`;
              inputRef.current!.style.minHeight = `${containerHeight - (top - wrapperRect.y)}px`;
              inputRef.current!.style.width = `${mirrorRect.width + 20 + fixedColWidth}px`;
              inputRef.current!.style.overflowY = "auto";
              // 自动将滚动条滚动到底部
              inputRef.current!.scrollTop = inputRef.current!.scrollHeight;
            } else {
              // 未超出时，宽度与 mirror 一致，隐藏滚动条，高度自适应
              inputRef.current!.style.width = `${mirrorRect.width}px`;
              inputRef.current!.style.overflowY = "hidden";
              inputRef.current!.style.minHeight = `${mirrorRect.height}px`;
            }
          }
          setInputHeight(mirrorRect.height - 4);
        }
      });
    }
  }, [isFocused, containerWidth, containerHeight, headerColsWidth, wrapperRef]);
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
        minWidth: `${Math.min(width + 3, containerWidth)}px`,
        minHeight: `${Math.min(height + 3, containerHeight)}px`,
        maxWidth: `${containerWidth - (headerColsWidth?.[0] || 0)}px`,
        maxHeight: `${containerHeight - (headerRowsHeight?.[0] || 0)}px`,
        paddingLeft: `${5 * zoomSize}px`,
        paddingRight: `${4 * zoomSize}px`,
        fontSize: `${(cell.style.fontSize || config.fontSize) * zoomSize}pt`,
        fontWeight: cell.style.fontWeight || "normal",
        fontStyle: cell.style.fontStyle || "normal",
        textDecoration: cell.style.textDecoration || "none",
        textAlign: cell.style.textAlign || config.textAlign,
      };
      if (cell.style.wrap) {
        baseStyles.maxWidth = `${width + 3}px`;
      }
      // 应用到输入框
      Object.assign(inputEl.style, baseStyles, {
        color: cell.style.color || config.color || "#000000",
        backgroundColor:
          cell.style.backgroundColor || config.backgroundColor || "#FFFFFF",
      });
      // 应用到镜像元素
      Object.assign(mirrorEl.style, baseStyles);
      return baseStyles;
    },
    [
      containerWidth,
      containerHeight,
      headerColsWidth,
      headerRowsHeight,
      zoomSize,
      config.fontSize,
      config.textAlign,
      config.color,
      config.backgroundColor,
    ],
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
          const value = inputRef.current.value;
          inputRef.current.selectionStart = value.length;
          inputRef.current.selectionEnd = value.length;
        }
      }, 0);
    }
  };
  const changeCellHeight = useCallback(
    (currentEditingCell: CellData | null) => {
      if (
        currentEditingCell &&
        !currentEditingCell.mergeSpan &&
        !currentEditingCell?.mergeParent
      ) {
        let _inputHeight = inputHeight;
        if (_inputHeight > containerHeight) {
          _inputHeight = containerHeight;
        }
        const currentRowHeight =
          headerRowsHeight[currentEditingCell?.row] * zoomSize;
        if (_inputHeight > currentRowHeight) {
          headerRowsHeight[currentEditingCell?.row] = parseInt(
            (_inputHeight / zoomSize).toString(),
          );
          setHeaderRowsHeight([...headerRowsHeight]);
        }
      }
    },
    [
      headerRowsHeight,
      inputHeight,
      setHeaderRowsHeight,
      containerHeight,
      zoomSize,
    ],
  );
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
      setEditingCell(null);
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
    if (
      inputRef.current &&
      mirrorRef.current &&
      wrapperRef.current &&
      currentCell
    ) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      let cell = currentCell;
      if (cell.mergeParent) {
        const row = cell.mergeParent.row;
        const col = cell.mergeParent.col;
        cell = data[row]?.[col];
      }
      const { x, y, right } = getCellPosition(cell);
      const { width, height } = getMergeCellSize(cell, cellWidth, cellHeight);
      const fixedHeight = headerRowsHeight[0];
      // 设置位置
      if (y <= fixedHeight - 1) {
        inputRef.current.style.top = `${fixedHeight - 1 + wrapperRect.y}px`;
      } else {
        inputRef.current.style.top = `${y - 1 + wrapperRect.y}px`;
      }
      const textAlign = cell.style.textAlign || config.textAlign || "left";
      if (textAlign === "left" || textAlign === "center") {
        inputRef.current.style.left = `${x - 1 + wrapperRect.x}px`;
      } else if (textAlign === "right") {
        inputRef.current.style.left = "auto";
        inputRef.current.style.right = `${right + 8 + wrapperRect.right}px`;
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
    updater,
    wrapperRef,
    getCellPosition,
    getMergeCellSize,
    applyCellStyles,
    updateInputSize,
  ]);
  return (
    <>
      <textarea
        ref={inputRef}
        className="fixed hidden bg-white box-border text-black outline-none resize-none whitespace-normal break-words m-0"
        onChange={(e) => {
          onChange?.(e.target.value, currentEditingCell);
          updateInputSize();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Tab") {
            // 监听 Tab 键
            e.preventDefault();
            e.currentTarget.blur();
            onTabKeyDown?.(e);
            setTimeout(() => {
              setIsFocused(true);
              inputRef.current?.focus();
            }, 0);
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
        }}
        onBlur={(e) => {
          onChange?.(e.target.value, currentEditingCell);
          setIsFocused(false);
          // setEditingCell(null);
          // 如果当前cell是自动换行的 或者 输入了 换行符的
          if (currentEditingCell?.style.wrap || e.target.value.includes("\n")) {
            changeCellHeight(currentEditingCell);
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
        className="absolute box-border whitespace-pre-wrap break-all"
        style={{
          ...style,
          fontFamily: "PingFangSC sans-serif",
          border: `2px solid ${config.selectionBorderColor}`,
          // visibility: "hidden",
        }}
      />
    </>
  );
});
