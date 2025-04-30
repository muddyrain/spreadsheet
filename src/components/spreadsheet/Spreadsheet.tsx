import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowDirectionType, TableData } from "../../types/sheet";
import { Canvas } from "./Canvas";
import { filterData } from "../../utils/filterData";
import _ from "lodash";
import { Header } from "./Header";
import { CellInput, CellInputRef } from "./CellInput";
import { useKeyDown } from "@/hooks/useKeyDown";
import { Current } from "./Current";
import { useStore } from "@/hooks/useStore";
import { useComputed } from "@/hooks/useComputed";
import { Footer } from "./Footer";

const Spreadsheet: React.FC<{
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { onChange } = props;
  const {
    config,
    data,
    isFocused,
    selection,
    selectedCell,
    currentCell,
    editingCell,
    setData,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    setSelection,
    setEditingCell,
    setSelectedCell,
    setIsFocused,
    getCurrentCell,
  } = useStore();
  const { getNextPosition, fitCellViewPort } = useComputed();
  const cellInputRef = useRef<CellInputRef>(null);
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
  const onCellClick = (rowIndex: number, colIndex: number) => {
    if (rowIndex === 0 && colIndex === 0) {
      handleSelectAll();
      return;
    }
    // 点击固定列时
    if (rowIndex === 0) {
      setSelection({
        start: { row: 1, col: colIndex },
        end: { row: data.length - 1, col: colIndex },
      });
      setSelectedCell(data[1][colIndex]);
      setEditingCell(null);
      return;
    }
    // 点击固定行时
    if (colIndex === 0) {
      setSelection({
        start: { row: rowIndex, col: 1 },
        end: { row: rowIndex, col: data[0].length - 1 },
      });
      setSelectedCell(data[rowIndex][1]);
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
    fitCellViewPort(rowIndex, colIndex);
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
    cellInputRef.current?.setValue(currentCell.value);
    cellInputRef.current?.setInputStyle(rowIndex, colIndex);
  };
  const onTabKeyDown = () => {
    if (!selectedCell) return;
    if (
      selection?.start?.row === selection?.end?.row &&
      selection?.start?.col === selection?.end?.col
    ) {
      const position = getNextPosition();
      if (position) {
        const row = position.nextRow;
        const col = position.nextCol;
        const cell = getCurrentCell(row, col);
        if (cell?.mergeSpan) {
          // 如果是合并单元格，选中整个合并区域
          const { r1, r2, c1, c2 } = cell.mergeSpan;
          setSelection({
            start: { row: r1, col: c1 },
            end: { row: r2, col: c2 },
          });
        } else {
          // 普通单元格只选中当前格
          setSelection({
            start: { row, col },
            end: { row, col },
          });
        }
        if (cell) {
          fitCellViewPort(cell.row, cell.col);
        }
        setSelectedCell(cell);
        setEditingCell(null);
        if (isFocused) {
          cellInputRef.current?.blur();
          setEditingCell(null);
          // setEditingCell({ row, col });
          // if (cell) cellInputRef.current?.setValue(cell.value);
        }
      }
    } else {
      let { row, col } = selectedCell;
      const { start, end } = selection;
      if (start && end && col + 1 > end.col) {
        if (row < end.row) {
          row++;
        } else {
          row = start.row;
        }
        col = start.col;
      } else {
        col++;
      }
      setSelectedCell(data[row][col]);
      if (isFocused) {
        setEditingCell({ row, col });
        if (cellInputRef.current)
          cellInputRef.current.setValue(data[row][col].value);
      }
    }
  };
  const onDirectionKeyDown = (key: ArrowDirectionType) => {
    if (selectedCell) {
      const newSelection = {
        start: {
          row: selection.start?.row ?? selectedCell.row,
          col: selection.start?.col ?? selectedCell.col,
        },
        end: {
          row: selection.end?.row ?? selectedCell.row,
          col: selection.end?.col ?? selectedCell.col,
        },
      };
      if (key === "ArrowUp") {
        if (newSelection.start.row === 1) {
          return;
        }
        newSelection.start.row--;
        newSelection.end.row--;
      } else if (key === "ArrowDown") {
        if (newSelection.start.row === data.length - 1) {
          return;
        }
        newSelection.start.row++;
        newSelection.end.row++;
      } else if (key === "ArrowLeft") {
        if (newSelection.start.col === 1) {
          return;
        }
        newSelection.start.col--;
        newSelection.end.col--;
      } else if (key === "ArrowRight") {
        if (newSelection.start.col === data[0].length - 1) {
          return;
        }
        newSelection.start.col++;
        newSelection.end.col++;
      }
      const row = newSelection.start.row;
      const col = newSelection.start.col;
      const cell = getCurrentCell(row, col);
      if (cell) {
        fitCellViewPort(cell.row, cell.col);
      }
      setSelection(newSelection);
      setSelectedCell(data[row][col]);
    }
  };
  // 初始化 列宽度 行高度
  useEffect(() => {
    setHeaderColsWidth(() => {
      return [
        config.fixedColWidth,
        ...Array.from({ length: config.cols }).map((_) => {
          return config.width;
        }),
      ];
    });
    setHeaderRowsHeight(() => {
      return [
        config.height,
        ...Array.from({ length: config.rows }).map((_) => {
          return config.height;
        }),
      ];
    });
  }, [config, setHeaderColsWidth, setHeaderRowsHeight]);
  // 键盘 hooks
  useKeyDown(
    {
      data,
      setData,
    },
    {
      onCellInputKey(content) {
        if (selectedCell) {
          setEditingCell({ row: selectedCell.row, col: selectedCell.col });
          if (currentCell) {
            cellInputRef.current?.setValue(currentCell.value + content);
            currentCell.value += content;
          }
          cellInputRef.current?.setInputStyle(
            selectedCell.row,
            selectedCell.col,
          );
        }
      },
      onSelectAll: handleSelectAll,
      onTabKey: onTabKeyDown,
      onDirectionKey: onDirectionKeyDown,
      onEnterKey: () => {
        onDirectionKeyDown("ArrowDown");
        clearSelection();
        cellInputRef.current?.blur();
        setIsFocused(false);
      },
    },
  );
  // 监听输入更新事件
  const handleInputChange = (value: string) => {
    if (editingCell) {
      const newData = [...data];
      const targetCell = newData[editingCell.row][editingCell.col];
      if (targetCell) {
        targetCell.value = value;
      }
      setData(newData);
      debouncedChange(newData);
    }
  };
  // 防抖更新
  const debouncedChange = useMemo(() => {
    const handleChange = (data: TableData) => {
      onChange?.(filterData(data));
    };
    return _.debounce(handleChange, 500);
  }, [onChange]);
  // 清除选中
  const clearSelection = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);
  const isShowInput = useMemo(() => {
    if (editingCell) {
      return "block";
    } else {
      return "none";
    }
  }, [editingCell]);
  // 监听热更新，重置状态
  useEffect(() => {
    if (import.meta?.hot) {
      import.meta.hot.dispose(() => {
        clearSelection();
        cellInputRef.current?.blur();
        setIsFocused(false);
      });
    }
  }, [clearSelection, setIsFocused]);
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Header
        onClick={(type) => {
          if (!["eraser"].includes(type)) {
            cellInputRef.current?.focus();
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
        <div className="flex-1 overflow-hidden">
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
            setIsFocused(false);
          }}
          style={{
            display: isShowInput,
            fontSize: `${config.fontSize || currentCell?.style.fontSize || 14}px`,
            fontWeight: `${currentCell?.style.fontWeight || "normal"}`,
            fontStyle: `${currentCell?.style.fontStyle || "normal"}`,
            textDecoration: `${currentCell?.style.textDecoration || "none"}`,
          }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Spreadsheet;
