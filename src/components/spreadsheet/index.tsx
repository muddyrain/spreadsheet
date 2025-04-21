import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, EditingCell } from '../../types/sheet';
import { createInitialData } from '../../utils/sheet';
import { Canvas } from './Canvas';
import { filterData } from '../../utils/filterData';
import _ from 'lodash';
import { Header } from './Header';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: SpreadsheetConfig;
  currentCell: TableData[0][0] | null,
  updater: number,
  setUpdater: (updater: number) => void
}>({
  data: [],
  config: {},
  currentCell: null,
  updater: 0,
  setUpdater: () => { }
})
const Spreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  onChange?: (data: TableData) => void;
}> = ({ config: _config, onChange }) => {
  const config: Required<SpreadsheetConfig> = {
    rows: 200,
    cols: 26,
    fontSize: 14,
    width: 100,    // 默认单元格宽度
    height: 30,    // 默认单元格高度
    ..._config
  }
  const [updater, setUpdater] = useState(+ new Date());
  const mirrorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TableData>(() => createInitialData(config.rows, config.cols));
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const cellWidth = config.width;
  const cellHeight = config.height;
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
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    if (inputRef.current && mirrorRef.current) {
      const currentCell = data[rowIndex][colIndex];
      if (currentCell.readOnly) {
        return
      }
      inputRef.current.value = currentCell.value;
      inputRef.current.style.left = `${colIndex * cellWidth}px`;
      inputRef.current.style.top = `${rowIndex * cellHeight}px`;
      inputRef.current.style.width = `${cellWidth}px`;
      inputRef.current.style.height = `${cellHeight}px`;
      inputRef.current.style.minWidth = `${cellWidth}px`;
      inputRef.current.style.minHeight = `${cellHeight}px`;
      inputRef.current.style.display = 'block';
      inputRef.current.style.padding = '3px 10px';
      // 预先设置字体大小和粗细 防止计算不准确
      inputRef.current.style.fontSize = `${currentCell.style.fontSize || 14}px`
      inputRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      mirrorRef.current.style.fontSize = `${currentCell.style.fontSize || 14}px`
      mirrorRef.current.style.fontWeight = `${currentCell.style.fontWeight || 'normal'}`
      mirrorRef.current.style.padding = '3px 10px';

      inputRef.current.focus();
      updateInputSize();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingCell) {
      const newData = [...data];
      const targetCell = newData[editingCell.row][editingCell.col];
      targetCell.value = e.target.value;
      setData(newData);
      updateInputSize();
      debouncedChange(newData);
    }
  };
  const debouncedChange = useMemo(() => {
    const handleChange = (data: TableData) => {
      onChange?.(filterData(data))
    };
    return _.debounce(handleChange, 500);
  }, [onChange]);
  const handleScroll = (position: { x: number; y: number }) => {
    setScrollPosition(position);
  };
  const currentCell = data[editingCell?.row || 0][editingCell?.col || 0]
  useEffect(() => {
    return () => {
      setEditingCell(null)
    }
  }, [])
  return (
    <SpreadsheetContext.Provider value={{
      data,
      config,
      currentCell,
      updater,
      setUpdater
    }}>
      <div className='flex flex-col w-full h-full overflow-hidden'>
        <Header />
        <div className="relative overflow-hidden flex-1 flex flex-col" ref={wrapperRef}>
          <div className="flex-1 overflow-hidden">
            <Canvas
              data={data}
              wrapperRef={wrapperRef}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              onCellClick={handleCellClick}
              onScroll={handleScroll}
            />
          </div>
          <textarea
            ref={inputRef}
            className="absolute hidden border border-blue-500 bg-white text-black outline-none box-border resize-none whitespace-normal break-words m-0 overflow-hidden"
            onChange={handleInputChange}
            style={
              {
                fontSize: `${currentCell.style.fontSize || 14}px`,
                fontWeight: `${currentCell.style.fontWeight || 'normal'}`,
                transform: `translate(${scrollPosition.x}px, ${scrollPosition.y}px)`,
              }
            }
          />
          {/* 隐藏的 mirror div 用于测量内容尺寸 */}
          <div
            ref={mirrorRef}
            className='absolute border bg-red-200 whitespace-pre-wrap break-all'
            style={{
              visibility: 'hidden',
              fontSize: `${currentCell.style.fontSize || 14}px`,
              fontWeight: `${currentCell.style.fontWeight || 'normal'}`,
              transform: `translate(${scrollPosition.x}px, ${scrollPosition.y}px)`,
            }}
          />
        </div>
      </div>
    </SpreadsheetContext.Provider>
  );
};

export default Spreadsheet;
