import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useStore } from '@/hooks/useStore';

export type CellInputRef = {
  setInputStyle: (rowIndex: number, colIndex: number) => void;
  updateInputSize: () => void;
  focus: () => void;
  blur: () => void;
}
export const CellInput = forwardRef<CellInputRef, {
  value: string;
  style?: React.CSSProperties;
  scrollPosition: {
    x: number;
    y: number;
  };
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTabKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}>(({ style, value, scrollPosition, onChange, onTabKeyDown }, ref) => {
  const { data, config, currentCell, setIsFocused } = useStore()
  const cellWidth = config.width;
  const cellHeight = config.height;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const updateInputSize = () => {
    if (inputRef.current && mirrorRef.current) {
      // 处理换行，保证最后一行也能被测量
      let value = inputRef.current.value || '';
      if (value.endsWith('\n')) {
        value += '\u200b'; // 补零宽空格，保证最后一行高度
      }
      mirrorRef.current.textContent = value;
      // 用 requestAnimationFrame 等待 DOM 更新
      window.requestAnimationFrame(() => {
        const mirrorRect = mirrorRef.current!.getBoundingClientRect();
        inputRef.current!.style.width = `${mirrorRect.width}px`;
        inputRef.current!.style.height = `${mirrorRect.height}px`;
      });
    }
  };
  const setInputStyle = (rowIndex: number, colIndex: number) => {
    if (inputRef.current && mirrorRef.current) {
      const currentCell = data[rowIndex][colIndex];
      inputRef.current.value = currentCell.value;
      inputRef.current.style.minWidth = `${cellWidth + 2}px`;
      inputRef.current.style.minHeight = `${cellHeight + 2}px`;
      inputRef.current.style.display = 'block';
      inputRef.current.style.padding = '3px 10px';
      mirrorRef.current.style.padding = '3px 10px';
      // 预先设置字体大小和粗细 防止计算不准确
      inputRef.current.style.fontSize = `${currentCell.style.fontSize || config.fontSize || 14}px`
      inputRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      inputRef.current.style.fontStyle = `${currentCell.style.fontStyle || 'normal'}`
      inputRef.current.style.textDecoration = `${currentCell.style.textDecoration || 'none'}`
      inputRef.current.style.color = `${currentCell.style.color || config.color || '#000000'}`

      mirrorRef.current.style.fontSize = `${currentCell.style.fontSize || config.fontSize || 14}px`
      mirrorRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      mirrorRef.current.style.fontStyle = `${currentCell.style.fontStyle || 'normal'}`
      mirrorRef.current.style.textDecoration = `${currentCell.style.textDecoration || 'none'}`

      updateInputSize();
      inputRef.current.focus();
      setIsFocused(true)
    }
  };
  useImperativeHandle(ref, () => ({
    setInputStyle,
    updateInputSize,
    focus() {
      updateInputSize();
      inputRef.current?.focus();
      setIsFocused(true)
    },
    blur() {
      updateInputSize();
      inputRef.current?.blur()
      setIsFocused(false)
    }
  }));
  useEffect(() => {
    if (style?.display === 'none') {
      setIsFocused(false)
    }
  }, [style, setIsFocused])
  useEffect(() => {
    if (inputRef.current) {
      const fixedColWidth = config.fixedColWidth
      const rowIndex = currentCell?.row || 0;
      const colIndex = currentCell?.col || 0;
      let top = rowIndex * (cellHeight || 0) - scrollPosition.y
      // 固定列宽度 + 其余列宽度 + 滚动条 x 位置
      let left = fixedColWidth + (colIndex - 1) * (cellWidth || 0) - scrollPosition.x
      if (top < config.height) {
        top = config.height
      }
      if (left < config.width) {
        left = fixedColWidth
      }
      inputRef.current.style.left = `${left - 1}px`;
      inputRef.current.style.top = `${top - 1}px`;
      updateInputSize();
    }
  }, [scrollPosition, currentCell, cellHeight, cellWidth, config]);
  return (
    <>
      <textarea
        ref={inputRef}
        value={value || ''}
        className="absolute hidden bg-white text-black outline-none box-border resize-none whitespace-normal break-words m-0 overflow-hidden"
        onChange={e => {
          onChange(e);
          updateInputSize();
        }}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            onTabKeyDown?.(e);
          }
        }}
        style={{
          ...style,
          border: `2px solid ${config.selectionBorderColor}`,
        }}
      />
      {/* 隐藏的 mirror div 用于测量内容尺寸 */}
      <div
        ref={mirrorRef}
        className='absolute border bg-red-200 whitespace-pre-wrap break-all'
        style={{
          ...style,
          visibility: 'hidden',
        }}
      />
    </>
  );
})