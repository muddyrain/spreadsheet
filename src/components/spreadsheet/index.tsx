import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, EditingCell, } from '../../types/sheet';
import { createInitialData } from '../../utils/sheet';
import { Canvas, CanvasOnKeyDown } from './Canvas';
import { filterData } from '../../utils/filterData';
import _ from 'lodash';
import { Header } from './Header';
import { CellInput, CellInputRef } from './CellInput';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: Required<SpreadsheetConfig>;
  currentCell: TableData[0][0] | null;
  updater: number;
  setUpdater: (updater: number) => void;
  isFocused: boolean,
  setIsFocused: (isFocused: boolean) => void;
} | undefined>(undefined)
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
    selectionBorderColor: '#3C70FF',
    selectionBackgroundColor: '#EBF0FF',
    ..._config
  }
  const cellInputRef = useRef<CellInputRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [updater, setUpdater] = useState(+ new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TableData>(() => createInitialData(config.rows, config.cols));
  const [selectedCell, setSelectedCell] = useState<EditingCell>(null); // 新增
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
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
    setEditingCell({ row: rowIndex, col: colIndex }); // 双击才进入编辑
    cellInputRef.current?.setInputStyle(rowIndex, colIndex);
  };
  const onKeyDown: CanvasOnKeyDown = (e, { selection }) => {
    if (currentCell && selectedCell) {
      const key = e.key;
      if (
        (key.length === 1 && (
          /[a-zA-Z0-9]/.test(key) || // 字母数字
          /[~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`]/.test(key) // 常见符号
        ))
      ) {
        setEditingCell({ row: selectedCell.row, col: selectedCell.col });
        cellInputRef.current?.setInputStyle(selectedCell.row, selectedCell.col);
      }
      if (key === 'Delete') {
        setData(data => {
          if (selection.start && selection.end) {
            const startRow = Math.min(selection.start.row, selection.end.row);
            const endRow = Math.max(selection.start.row, selection.end.row);
            const startCol = Math.min(selection.start.col, selection.end.col);
            const endCol = Math.max(selection.start.col, selection.end.col);
            for (let i = startRow;i <= endRow;i++) {
              for (let j = startCol;j <= endCol;j++) {
                data[i][j].value = '';
              }
            }
          }
          return [...data];
        })
      }
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
  const currentCell = useMemo(() => {
    const cell = data[editingCell?.row ?? selectedCell?.row ?? 0][editingCell?.col ?? selectedCell?.col ?? 0];
    if (cell.readOnly) {
      return null;
    }
    return cell;
  }, [data, editingCell, selectedCell]);
  useEffect(() => {
    return () => {
      clearSelection()
    }
  }, [])
  const clearSelection = () => {
    setSelectedCell(null);
    setEditingCell(null);
  };
  return (
    <SpreadsheetContext.Provider value={{
      data,
      config,
      currentCell,
      updater,
      setUpdater,
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
            ref={cellInputRef}
            onChange={handleInputChange}
            value={currentCell?.value || ''}
            style={{
              display: editingCell ? 'block' : 'none', // 只有编辑时才显示
              transform: `translate(${-scrollPosition.x}px, ${-scrollPosition.y}px)`,
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
