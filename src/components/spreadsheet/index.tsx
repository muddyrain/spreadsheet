import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, EditingCell, } from '../../types/sheet';
import { createInitialData } from '../../utils/sheet';
import { Canvas } from './Canvas';
import { filterData } from '../../utils/filterData';
import _ from 'lodash';
import { Header } from './Header';
import { CellInput, CellInputRef } from './CellInput';

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
  const cellInputRef = useRef<CellInputRef>(null);
  const [updater, setUpdater] = useState(+ new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TableData>(() => createInitialData(config.rows, config.cols));
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const cellWidth = config.width;
  const cellHeight = config.height;
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const currentCell = data[rowIndex][colIndex];
    if (currentCell.readOnly) {
      return
    }
    setEditingCell({ row: rowIndex, col: colIndex });
    cellInputRef.current?.setInputStyle(rowIndex, colIndex);
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
  const currentCell = useMemo(() => {
    const _currentCell = data[editingCell?.row || 0][editingCell?.col || 0]
    if (_currentCell.readOnly) {
      return null
    }
    return _currentCell
  }, [data, editingCell])
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
          <CellInput
            ref={cellInputRef}
            onChange={handleInputChange}
            value={
              currentCell?.value || ''
            } style={
              {
                transform: `translate(${scrollPosition.x}px, ${scrollPosition.y}px)`,
                fontSize: `${currentCell?.style.fontSize || 14}px`,
                fontWeight: `${currentCell?.style.fontWeight || 'normal'}`,
                fontStyle: `${currentCell?.style.fontStyle || 'normal'}`,
                textDecoration: `${currentCell?.style.textDecoration || 'none'}`,
              }
            } />
        </div>
      </div>
    </SpreadsheetContext.Provider>
  );
};

export default Spreadsheet;
