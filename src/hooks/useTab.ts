import { useCallback, useEffect, useState } from "react";
import { useStore } from "./useStore";
import { useComputed } from "./useComputed";
import { CellInputRef } from "@/components/spreadsheet/CellInput";
import { MergeSpanType } from "@/types/sheet";

export const useTab = (cellInputRef: React.RefObject<CellInputRef | null>) => {
  const {
    isFocused,
    selection,
    selectedCell,
    setEditingCell,
    getCurrentCell,
    setSelectedCell,
  } = useStore();
  const [alreadySelectedCell, setAlreadySelectedCell] = useState<
    MergeSpanType[]
  >([]);
  const { getNextPosition, fitCellViewPort, updateSelectionAndCell } =
    useComputed();

  const isFindAlreadySelected = useCallback(
    (mergeSpan: MergeSpanType) => {
      return alreadySelectedCell.some((item) => {
        return (
          item.r1 === mergeSpan.r1 &&
          item.r2 === mergeSpan.r2 &&
          item.c1 === mergeSpan.c1 &&
          item.c2 === mergeSpan.c2
        );
      });
    },
    [alreadySelectedCell],
  );

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
      // 获取当前单元格（如果是子单元格则获取父单元格）
      const currentCell = selectedCell.mergeParent
        ? getCurrentCell(
            selectedCell.mergeParent.row,
            selectedCell.mergeParent.col,
          )
        : selectedCell;

      // 计算下一个列位置
      nextCol = currentCell?.mergeSpan?.c2
        ? currentCell.mergeSpan.c2 + 1
        : nextCol;
      if (start && end) {
        // 处理换行逻辑
        if (nextCol > end.col) {
          row = row < end.row ? row + 1 : start.row;
          col = start.col;
        } else {
          // 获取并处理下一个单元格
          let nextCell = getCurrentCell(row, nextCol);
          // 如果是子单元格，获取父单元格
          if (nextCell?.mergeParent) {
            nextCell = getCurrentCell(
              nextCell.mergeParent.row,
              nextCell.mergeParent.col,
            );
          }
          // 处理合并单元格的跳过逻辑
          while (
            nextCell?.mergeSpan &&
            isFindAlreadySelected(nextCell.mergeSpan)
          ) {
            nextCol = nextCell.mergeSpan.c2 + 1;
            // 检查是否超出选中区域范围
            if (nextCol > end.col) {
              if (row < end.row) {
                row++;
                nextCol = start.col;
                nextCell = getCurrentCell(row, nextCol);
                // 如果新行的第一个单元格是子单元格，获取父单元格
                if (nextCell?.mergeParent) {
                  nextCell = getCurrentCell(
                    nextCell.mergeParent.row,
                    nextCell.mergeParent.col,
                  );
                }
              } else {
                // 如果已经是最后一行，则回到起始位置并清空已选中记录
                row = start.row;
                nextCol = start.col;
                setAlreadySelectedCell([]); // 清空已选中的合并单元格记录
                nextCell = getCurrentCell(row, nextCol);
                if (nextCell?.mergeParent) {
                  nextCell = getCurrentCell(
                    nextCell.mergeParent.row,
                    nextCell.mergeParent.col,
                  );
                }
              }
            } else {
              nextCell = getCurrentCell(row, nextCol);
              if (nextCell?.mergeParent) {
                nextCell = getCurrentCell(
                  nextCell.mergeParent.row,
                  nextCell.mergeParent.col,
                );
              }
            }
          }
          // 记录新的合并单元格
          if (nextCell?.mergeSpan) {
            alreadySelectedCell.push(nextCell.mergeSpan);
            setAlreadySelectedCell((prev) => [...prev]);
          }
          col = nextCol;
        }
      }
      // 更新选中状态
      const cell = getCurrentCell(row, col);
      setSelectedCell(cell);
      // 处理编辑状态
      if (isFocused && cell) {
        setEditingCell({ row, col });
        cellInputRef.current?.setValue(cell.value);
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
    alreadySelectedCell,
    isFindAlreadySelected,
  ]);
  useEffect(() => {
    setAlreadySelectedCell(() => []);
  }, [selection]);
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
