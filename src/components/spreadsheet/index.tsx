import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableData, SpreadsheetConfig, SpreadsheetType, CellData, SelectionSheetType, } from '../../types/sheet';
import { Canvas } from './Canvas';
import { filterData } from '../../utils/filterData';
import _ from 'lodash';
import { Header } from './Header';
import { CellInput, CellInputRef } from './CellInput';
import { useKeyDown } from '@/hooks/useKeyDown';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import { Current } from './Current';
import { getAbsoluteSelection } from '@/utils/sheet';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: Required<SpreadsheetConfig>;
  currentCell: CellData | null;
  updater: number;
  setUpdater: () => void;
  isFocused: boolean,
  setIsFocused: (isFocused: boolean) => void;
  selection: SelectionSheetType;
  setSelection: React.Dispatch<React.SetStateAction<SelectionSheetType>>;
} | undefined>(undefined)
const Spreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const { config, setEditingCell, selectedCell, setSelectedCell, data, setData, editingCell, currentCell,
    updater,
    forceUpdate } = props.spreadsheet ?? useSpreadsheet(_config);
  const [selection, setSelection] = useState<SelectionSheetType>({ start: null, end: null });
  const cellInputRef = useRef<CellInputRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const cellWidth = config.width;
  const cellHeight = config.height;
  const handleSelectAll = () => {
    setSelection({
      start: { row: 1, col: 1 },
      end: { row: data.length - 1, col: data[0].length - 1 }
    })
    setSelectedCell({ row: 1, col: 1 })
    setEditingCell(null)
  }
  const onCellClick = (rowIndex: number, colIndex: number) => {
    if (rowIndex === 0 && colIndex === 0) {
      handleSelectAll()
      return;
    }
    // 点击固定列时
    if (rowIndex === 0) {
      setSelection({
        start: { row: 1, col: colIndex },
        end: { row: data.length - 1, col: colIndex }
      })
      setSelectedCell({ row: 1, col: colIndex })
      setEditingCell(null)
      return
    }
    // 点击固定行时
    if (colIndex === 0) {
      setSelection({
        start: { row: rowIndex, col: 1 },
        end: { row: rowIndex, col: data.length - 1 }
      })
      setSelectedCell({ row: rowIndex, col: 1 })
      setEditingCell(null)
      return
    }
    const currentCell = data[rowIndex][colIndex];
    if (currentCell.readOnly) {
      return;
    }
    setSelection({
      start: { row: rowIndex, col: colIndex },
      end: { row: rowIndex, col: colIndex }
    })
    setSelectedCell({ row: rowIndex, col: colIndex })
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
  const onTabKeyDown = () => {
    if (!selectedCell) return
    // 单选格
    if (selection.start?.row === selection.end?.row && selection.start?.col === selection.end?.col) {
      if (selectedCell.col + 1 <= data[0].length - 1) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 })
        setEditingCell({ row: selectedCell.row, col: selectedCell.col + 1 })
        setSelection({
          start: { row: selectedCell.row, col: selectedCell.col + 1 },
          end: { row: selectedCell.row, col: selectedCell.col + 1 }
        })
      } else {
        setSelectedCell({ row: selectedCell.row + 1, col: 1 })
        setEditingCell({ row: selectedCell.row + 1, col: 1 })
        setSelection({
          start: { row: selectedCell.row + 1, col: 1 },
          end: { row: selectedCell.row + 1, col: 1 }
        })
      }
    } else {
      // 多选格
      const { r1, r2, c1, c2 } = getAbsoluteSelection(selection)
      if (selectedCell.col + 1 <= c2) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 })
        setEditingCell({ row: selectedCell.row, col: selectedCell.col + 1 })
      } else {
        if (selectedCell.row + 1 <= r2) {
          setSelectedCell({ row: selectedCell.row + 1, col: c1 })
          setEditingCell({ row: selectedCell.row + 1, col: c1 })
        } else {
          setSelectedCell({ row: r1, col: c1 })
          setEditingCell({ row: r1, col: c1 })
        }
      }
    }
  }
  const { onKeyDown } = useKeyDown({
    data,
    setData,
  }, {
    onCellInputKey(content) {
      if (selectedCell) {
        setEditingCell({ row: selectedCell.row, col: selectedCell.col });
        cellInputRef.current?.setInputStyle(selectedCell.row, selectedCell.col,);
        if (currentCell) {
          currentCell.value += content
        }
      }
    },
    onSelectAll() {
      handleSelectAll()
    },
    onTabKey: onTabKeyDown
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
      setIsFocused,
      selection,
      setSelection
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
              selectedCell={selectedCell}
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
            onTabKeyDown={onTabKeyDown}
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
