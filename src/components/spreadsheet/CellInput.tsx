import { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { SpreadsheetContext } from '.';

export type CellInputRef = {
  setInputStyle: (rowIndex: number, colIndex: number) => void;
}
export const CellInput = forwardRef<CellInputRef, {
  value: string;
  style?: React.CSSProperties;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}>(({ style, value, onChange }, ref) => {
  const { data, config } = useContext(SpreadsheetContext)
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
      const mirrorRect = mirrorRef.current.getBoundingClientRect();
      // 设置 input 大小和位置
      inputRef.current.style.width = `${mirrorRect.width}px`;
      inputRef.current.style.height = `${mirrorRect.height}px`;
    }
  };
  const setInputStyle = (rowIndex: number, colIndex: number) => {
    if (inputRef.current && mirrorRef.current) {
      const currentCell = data[rowIndex][colIndex];
      inputRef.current.value = currentCell.value;
      inputRef.current.style.left = `${colIndex * (cellWidth || 0)}px`;
      inputRef.current.style.top = `${rowIndex * (cellHeight || 0)}px`;
      inputRef.current.style.width = `${cellWidth}px`;
      inputRef.current.style.height = `${cellHeight}px`;
      inputRef.current.style.minWidth = `${cellWidth}px`;
      inputRef.current.style.minHeight = `${cellHeight}px`;
      inputRef.current.style.display = 'block';
      inputRef.current.style.padding = '3px 10px';
      mirrorRef.current.style.padding = '3px 10px';
      // 预先设置字体大小和粗细 防止计算不准确
      inputRef.current.style.fontSize = `${currentCell.style.fontSize || 14}px`
      inputRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      inputRef.current.style.fontStyle = `${currentCell.style.fontStyle || 'normal'}`
      inputRef.current.style.textDecoration = `${currentCell.style.textDecoration || 'none'}`

      mirrorRef.current.style.fontSize = `${currentCell.style.fontSize || 14}px`
      mirrorRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      mirrorRef.current.style.fontStyle = `${currentCell.style.fontStyle || 'normal'}`
      mirrorRef.current.style.textDecoration = `${currentCell.style.textDecoration || 'none'}`

      inputRef.current.focus();
      updateInputSize();
    }
  };
  useImperativeHandle(ref, () => ({
    setInputStyle,
  }));
  return <>
    <textarea
      ref={inputRef}
      value={value || ''}
      className="absolute hidden border border-blue-500 bg-white text-black outline-none box-border resize-none whitespace-normal break-words m-0 overflow-hidden pointer-events-none"
      onChange={e => {
        onChange(e);
        updateInputSize();
      }}

      style={
        style
      }
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
  </>;
})