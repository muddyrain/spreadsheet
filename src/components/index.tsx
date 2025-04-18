import React, { useEffect, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, EditingCell } from '../types/sheet';
import { createInitialData } from '../utils/sheet';
import { Canvas } from './Canvas';
import { filterData } from '../utils/filterData';
import { Header } from './Header';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: SpreadsheetConfig;
}>({
  data: [],
  config: {}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [beforeBlurValue, setBeforeBlurValue] = useState('');
  const [data, setData] = useState<TableData>(() => createInitialData(config.rows, config.cols));
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const cellWidth = config.width;
  const cellHeight = config.height;
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    if (inputRef.current) {
      const currentCell = data[rowIndex][colIndex];
      if (currentCell.readOnly) {
        return
      }
      inputRef.current.value = currentCell.value;
      setBeforeBlurValue(currentCell.value);
      inputRef.current.style.left = `${colIndex * cellWidth}px`;
      inputRef.current.style.top = `${rowIndex * cellHeight}px`;
      inputRef.current.style.width = `${cellWidth}px`;
      inputRef.current.style.height = `${cellHeight}px`;
      inputRef.current.style.display = 'block';
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingCell) {
      const newData = [...data];
      const targetCell = newData[editingCell.row][editingCell.col];
      targetCell.value = e.target.value;
      setData(newData);
    }
  };

  const handleInputBlur = () => {
    if (inputRef.current) {
      inputRef.current.style.display = 'none';
    }
    setEditingCell(null);
    const inputValue = inputRef.current?.value;
    if (beforeBlurValue === inputValue) {
      // 如果值没有变化，不更新数据
      return;
    }
    onChange?.(filterData(data))
  };
  const handleScroll = (position: { x: number; y: number }) => {
    setScrollPosition(position);
  };
  return (
    <SpreadsheetContext.Provider value={{ data, config }}>
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
          <input
            ref={inputRef}
            className="absolute border border-blue-600 bg-white text-black px-2 py-1 outline-none"
            style={{
              display: 'none',
              fontSize: `${config.fontSize}px`,
              transform: `translate(${-scrollPosition.x}px, ${-scrollPosition.y}px)`
            }}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
        </div>
      </div>
    </SpreadsheetContext.Provider>
  );
};

export default Spreadsheet;
