import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, SpreadsheetType, CellData, } from '../../types/sheet';
import { Canvas } from './Canvas';
import { filterData } from '../../utils/filterData';
import _ from 'lodash';
import { Header } from './Header';
import { CellInput, CellInputRef } from './CellInput';
import { useKeyDown } from '@/hooks/useKeyDown';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import { Current } from './Current';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: Required<SpreadsheetConfig>;
  currentCell: CellData | null;
  updater: number;
  setUpdater: () => void;
  isFocused: boolean,
  setIsFocused: (isFocused: boolean) => void;
} | undefined>(undefined)
const Spreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const { config, selectedCell, setSelectedCell, setEditingCell, data, setData, editingCell, currentCell,
    updater,
    forceUpdate } = props.spreadsheet ?? useSpreadsheet(_config);
  const cellInputRef = useRef<CellInputRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const cellWidth = config.width;
  const cellHeight = config.height;
  const onCellClick = (rowIndex: number, colIndex: number) => {
    if (rowIndex < 0 || colIndex < 0) {
      setSelectedCell(null);
      setEditingCell(null);
      return;
    }
    const currentCell = data[rowIndex][colIndex];
    if (currentCell.readOnly) {
      return;
    }
    setSelectedCell({ row: rowIndex, col: colIndex }); // 只选中
    setEditingCell(null); // 单击时不进入编辑
  };
  const onCellDoubleClick = (rowIndex: number, colIndex: number) => {
    const currentCell = data[rowIndex][colIndex];
    if (currentCell.readOnly) {
      return;
    }
    setEditingCell({ row: rowIndex, col: colIndex }); // 双击才进入编辑
    cellInputRef.current?.setInputStyle(rowIndex, colIndex);
  };
  const { onKeyDown } = useKeyDown({
    selectedCell,
    data,
    setData
  }, {
    onCellInputKey() {
      if (selectedCell) {
        setEditingCell({ row: selectedCell.row, col: selectedCell.col });
        cellInputRef.current?.setInputStyle(selectedCell.row, selectedCell.col);
      }
    }
  })
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
  const clearSelection = () => {
    setSelectedCell(null);
    setEditingCell(null);
  };
  const isShowInput = useMemo(() => {
    if (editingCell) {
      return 'block'
    } else {
      return 'none'
    }
  }, [editingCell])
  // 监听热更新，重置状态
  useEffect(() => {
    if ((import.meta)?.hot) {
      import.meta.hot.dispose(() => {
        clearSelection();
        cellInputRef.current?.blur();
        setIsFocused(false)
      });
    }
  }, []);
  return (
    <SpreadsheetContext.Provider value={{
      data,
      config,
      currentCell,
      updater,
      setUpdater: forceUpdate,
      isFocused,
      setIsFocused
    }}>
      <div className='flex flex-col w-full h-full overflow-hidden'>
        <Header onClick={type => {
          if (!['eraser'].includes(type)) {
            cellInputRef.current?.focus()
          } else {
            clearSelection()
            cellInputRef.current?.blur()
          }
        }} />
        <Current />
        <div className="relative overflow-hidden flex-1 flex flex-col" ref={wrapperRef}>
          <div className="flex-1 overflow-hidden">
            <Canvas
              data={data}
              wrapperRef={wrapperRef}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              onCellClick={onCellClick}
              onCellDoubleClick={onCellDoubleClick}
              onKeyDown={onKeyDown}
              onScroll={handleScroll}
            />
          </div>
          <CellInput
            scrollPosition={scrollPosition}
            ref={cellInputRef}
            onChange={handleInputChange}
            value={currentCell?.value || ''}
            style={{
              display: isShowInput,
              fontSize: `${config.fontSize || currentCell?.style.fontSize || 14}px`,
              fontWeight: `${currentCell?.style.fontWeight || 'normal'}`,
              fontStyle: `${currentCell?.style.fontStyle || 'normal'}`,
              textDecoration: `${currentCell?.style.textDecoration || 'none'}`,
            }}
          />
        </div>
      </div>
    </SpreadsheetContext.Provider>
  );
};

export default Spreadsheet;
