import React, { useMemo, useRef, useState } from 'react';
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
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
      inputRef.current.style.left = `${colIndex * cellWidth}px`;
      inputRef.current.style.top = `${rowIndex * cellHeight}px`;
      inputRef.current.style.width = `${cellWidth}px`;
      inputRef.current.style.height = `${cellHeight + 2}px`;
      inputRef.current.style.display = 'block';
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingCell) {
      const newData = [...data];
      const targetCell = newData[editingCell.row][editingCell.col];
      targetCell.value = e.target.value;
      setData(newData);
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
  return (
    <SpreadsheetContext.Provider value={{
      data, config, currentCell,
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
            className="absolute border border-blue-600 bg-white text-black outline-none box-border resize-none"
            style={{
              padding: '5px 10px',
              fontWeight: currentCell.style.fontWeight || 'normal',
              fontFamily: 'Arial',
              fontSize: `${currentCell.style.fontWeight || config.fontSize || 14}px`,
              transform: `translate(${-scrollPosition.x}px, ${-scrollPosition.y}px)`
            }}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </SpreadsheetContext.Provider>
  );
};

export default Spreadsheet;
