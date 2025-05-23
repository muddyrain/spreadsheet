import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { CellData, TableData } from "../../types/sheet";
import { Canvas } from "./Canvas";
import { filterData } from "../../utils/filterData";
import _ from "lodash";
import { Header } from "./Header/index";
import { CellInput, CellInputActionsType } from "./CellInput";
import { useKeyDown } from "@/hooks/useKeyDown";
import { Current } from "./Current";
import { useStore } from "@/hooks/useStore";
import { Footer } from "./Footer/index";
import { useTab } from "@/hooks/useTab";
import { useDirection } from "@/hooks/useDirection";

const Spreadsheet: React.FC<{
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { onChange } = props;
  const {
    data,
    isFocused,
    selectedCell,
    currentCell,
    editingCell,
    setData,
    setSelection,
    setEditingCell,
    setSelectedCell,
    getCurrentCell,
    dispatch,
  } = useStore();
  const cellInputRef = useRef<CellInputActionsType>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleSelectAll = () => {
    setSelection({
      start: { row: 1, col: 1 },
      end: { row: data.length - 1, col: data[0].length - 1 },
    });
    setSelectedCell(data[1][1]);
    setEditingCell(null);
  };
  // 监听点击事件
  const onCellClick = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    options: { col: number; row: number },
  ) => {
    cellInputRef.current?.blur();
    const { row: rowIndex, col: colIndex } = options;
    if (rowIndex === 0 && colIndex === 0) {
      handleSelectAll();
      return;
    }
    // 点击固定列时
    if (rowIndex === 0) {
      if (e.shiftKey) {
        setSelection((_selection) => {
          setSelectedCell(data[1][_selection?.start?.col || 1]);
          return {
            start: { row: 1, col: _selection?.start?.col || 1 },
            end: { row: data.length - 1, col: colIndex },
          };
        });
      } else {
        setSelection({
          start: { row: 1, col: colIndex },
          end: { row: data.length - 1, col: colIndex },
        });
        setSelectedCell(data[1][colIndex]);
      }
      setEditingCell(null);
      return;
    }
    // 点击固定行时
    if (colIndex === 0) {
      if (e.shiftKey) {
        setSelection((_selection) => {
          setSelectedCell(data[_selection?.start?.row || 1][1]);
          return {
            start: { row: _selection?.start?.row || 1, col: 1 },
            end: { row: rowIndex, col: data[0].length - 1 },
          };
        });
      } else {
        setSelection({
          start: { row: rowIndex, col: 1 },
          end: { row: rowIndex, col: data[0].length - 1 },
        });
        setSelectedCell(data[rowIndex][1]);
      }
      setEditingCell(null);
      return;
    }
    const currentCell = data[rowIndex][colIndex];
    if (currentCell?.readOnly) {
      return;
    }
    const cell = data[rowIndex][colIndex];
    setEditingCell(null); // 单击时不进入编辑
    if (cell?.mergeSpan) {
      setSelection({
        start: {
          row: cell.mergeSpan.r1,
          col: cell.mergeSpan.c1,
        },
        end: {
          row: cell.mergeSpan.r2,
          col: cell.mergeSpan.c2,
        },
      });
      setSelectedCell(data[rowIndex][colIndex]);
      return;
    }
    if (cell?.mergeParent) {
      const { row, col } = cell.mergeParent;
      const parentCell = data[row][col];
      if (parentCell?.mergeSpan) {
        setSelection({
          start: {
            row: parentCell.mergeSpan.r1,
            col: parentCell.mergeSpan.c1,
          },
          end: {
            row: parentCell.mergeSpan.r2,
            col: parentCell.mergeSpan.c2,
          },
        });
        setSelectedCell(data[row][col]);
        return;
      }
    }
    setSelectedCell(data[rowIndex][colIndex]);
    setSelection({
      start: { row: rowIndex, col: colIndex },
      end: { row: rowIndex, col: colIndex },
    });
  };
  // 监听双击事件
  const onCellDoubleClick = (_rowIndex: number, _colIndex: number) => {
    let colIndex = _colIndex;
    let rowIndex = _rowIndex;
    const currentCell = data[rowIndex][colIndex];
    if (currentCell?.readOnly) {
      return;
    }
    if (currentCell?.mergeParent) {
      const { row, col } = currentCell.mergeParent;
      colIndex = col;
      rowIndex = row;
    }
    setEditingCell(() => ({ row: rowIndex, col: colIndex })); // 双击才进入编辑
    const editingCell = getCurrentCell(rowIndex, colIndex);
    if (editingCell) {
      cellInputRef.current?.setValue(editingCell.value);
    }
    cellInputRef.current?.focus(rowIndex, colIndex);
  };
  const { onTabKeyDown } = useTab(cellInputRef);
  const { onDirectionKeyDown } = useDirection();
  // 键盘 hooks
  useKeyDown({
    onCellInputKey(content) {
      if (selectedCell) {
        let rowIndex = selectedCell.row;
        let colIndex = selectedCell.col;
        if (selectedCell?.mergeParent) {
          const { row, col } = selectedCell.mergeParent;
          colIndex = col;
          rowIndex = row;
        }
        if (!isFocused) {
          cellInputRef.current?.setValue(selectedCell.value + content);
          selectedCell.value = selectedCell.value + content;
          cellInputRef.current?.focus(rowIndex, colIndex);
          setEditingCell(() => ({ row: rowIndex, col: colIndex }));
        }
      }
    },
    onSelectAll: handleSelectAll,
    onTabKey: onTabKeyDown,
    onDirectionKey: onDirectionKeyDown,
    onEnterKey: () => {
      onDirectionKeyDown("ArrowDown");
      clearSelection();
      cellInputRef.current?.blur();
      dispatch({ isFocused: false });
    },
  });
  // 防抖更新
  const debouncedChange = useMemo(() => {
    const handleChange = (data: TableData) => {
      onChange?.(filterData(data) as TableData);
    };
    return _.debounce(handleChange, 500);
  }, [onChange]);
  // 监听输入更新事件
  const handleInputChange = useCallback(
    (value: string, _editingCell?: CellData | null) => {
      if ((_editingCell || editingCell) && isFocused) {
        const row = _editingCell?.row || editingCell?.row;
        const col = _editingCell?.col || editingCell?.col;
        if (row && col) {
          const newData = [...data];
          const targetCell = newData[row][col];
          if (targetCell) {
            targetCell.value = value;
          }
          setData(() => newData);
          debouncedChange(newData);
        }
      }
    },
    [isFocused, data, debouncedChange, editingCell, setData],
  );
  // 清除选中
  const clearSelection = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);
  // 监听热更新，重置状态
  useEffect(() => {
    if (import.meta?.hot) {
      import.meta.hot.dispose(() => {
        clearSelection();
        cellInputRef.current?.blur();
      });
    }
  }, [clearSelection, dispatch]);
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Header
        onClick={(type) => {
          if (!["eraser"].includes(type)) {
            if (currentCell) {
              if (type === "wrap") {
                onCellDoubleClick(currentCell.row, currentCell.col);
              }
              cellInputRef.current?.updateInputSize(currentCell);
            }
          } else {
            clearSelection();
            cellInputRef.current?.blur();
          }
        }}
      />
      <Current />
      <div
        className="relative overflow-hidden flex-1 flex flex-col"
        ref={wrapperRef}
      >
        <div className="flex-1 overflow-hidden shrink-0">
          <Canvas
            data={data}
            selectedCell={selectedCell}
            wrapperRef={wrapperRef}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
          />
        </div>
        <CellInput
          ref={cellInputRef}
          onChange={handleInputChange}
          onTabKeyDown={onTabKeyDown}
          onEnterKeyDown={() => {
            onDirectionKeyDown("ArrowDown");
            clearSelection();
            cellInputRef.current?.blur();
            dispatch({ isFocused: false });
          }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Spreadsheet;
