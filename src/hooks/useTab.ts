import { useCallback } from "react";
import { useStore } from "./useStore";
import { useComputed } from "./useComputed";
import { CellInputRef } from "@/components/spreadsheet/CellInput";

export const useTab = (cellInputRef: React.RefObject<CellInputRef | null>) => {
  const {
    data,
    isFocused,
    selection,
    selectedCell,
    setEditingCell,
    getCurrentCell,
    setSelectedCell,
  } = useStore();

  const { getNextPosition, fitCellViewPort, updateSelectionAndCell } =
    useComputed();

  // 处理单个选择的情况
  const handleSingleSelection = useCallback(() => {
    const position = getNextPosition("ArrowRight");
    if (!position) return;

    const { nextRow: row, nextCol: col } = position;
    const cell = getCurrentCell(row, col);
    if (!cell) return;

    updateSelectionAndCell(cell.row, cell.col);
    fitCellViewPort(cell.row, cell.col);

    if (isFocused) {
      cellInputRef.current?.blur();
      setEditingCell(null);
    }
  }, [
    getNextPosition,
    getCurrentCell,
    updateSelectionAndCell,
    fitCellViewPort,
    isFocused,
    cellInputRef,
    setEditingCell,
  ]);

  // 处理多选的情况
  const handleMultipleSelection = useCallback(() => {
    if (!selectedCell) return;
    const { start, end } = selection;
    let currentCell = selectedCell;
    let { row, col } = selectedCell;
    if (selectedCell.mergeParent) {
      const cell = getCurrentCell(
        selectedCell.mergeParent.row,
        selectedCell.mergeParent.col,
      );
      if (cell) {
        currentCell = cell;
      }
    }
    const isMergeSpan =
      currentCell.mergeSpan?.r1 === start?.row &&
      currentCell.mergeSpan?.r2 === end?.row &&
      currentCell.mergeSpan?.c1 === start?.col &&
      currentCell.mergeSpan?.c2 === end?.col;
    if (isMergeSpan) {
      if (selectedCell.mergeParent) {
        const parentCell = getCurrentCell(
          selectedCell.mergeParent.row,
          selectedCell.mergeParent.col,
        );
        if (parentCell?.mergeSpan) {
          const nextRow = selectedCell.row;
          const nextCol = parentCell.mergeSpan.c2 + 1;
          updateSelectionAndCell(nextRow, nextCol);
        }
      } else if (selectedCell.mergeSpan) {
        const nextRow = selectedCell.row;
        const nextCol = selectedCell.mergeSpan.c2 + 1;
        updateSelectionAndCell(nextRow, nextCol);
      }
    } else {
      let nextCol = col + 1;
      if (selectedCell.mergeParent) {
        const parentCell = getCurrentCell(
          selectedCell.mergeParent.row,
          selectedCell.mergeParent.col,
        );
        if (parentCell?.mergeSpan) {
          nextCol = parentCell.mergeSpan.c2 + 1;
        }
      } else if (selectedCell.mergeSpan) {
        nextCol = selectedCell.mergeSpan.c2 + 1;
      }
      if (start && end && nextCol > end.col) {
        if (row < end.row) {
          row++;
        } else {
          row = start.row;
        }
        col = start.col;
      } else {
        col = nextCol;
      }
      const cell = getCurrentCell(row, col);
      setSelectedCell(cell);
      if (isFocused) {
        setEditingCell({ row, col });
        cellInputRef.current?.setValue(data[row][col].value);
      }
    }
  }, [
    selectedCell,
    getCurrentCell,
    updateSelectionAndCell,
    selection,
    setSelectedCell,
    isFocused,
    setEditingCell,
    cellInputRef,
    data,
  ]);

  // Tab 键处理主函数
  const onTabKeyDown = useCallback(() => {
    if (!selectedCell) return;

    const isOneSelection =
      selection?.start?.row === selection?.end?.row &&
      selection?.start?.col === selection?.end?.col;

    if (isOneSelection) {
      handleSingleSelection();
    } else {
      handleMultipleSelection();
    }
  }, [selectedCell, selection, handleSingleSelection, handleMultipleSelection]);

  return { onTabKeyDown };
};
