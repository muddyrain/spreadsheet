import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";
import { getLeft, getTop } from "@/utils/sheet";

export const useComputed = () => {
  const {
    data,
    selectedCell,
    headerColsWidth,
    headerRowsHeight,
    scrollPosition,
    getCurrentCell,
  } = useStore();

  // 获取下一个位置
  const getNextPosition = () => {
    if (!selectedCell) return;
    const currentCell = getCurrentCell(selectedCell.row, selectedCell.col);
    let nextCol = selectedCell.col + 1;
    let nextRow = selectedCell.row;

    // 如果当前是合并单元格，从合并区域的右边界开始
    if (currentCell?.mergeSpan) {
      nextCol = currentCell.mergeSpan.c2 + 1;
    }

    // 如果到达行尾，转到下一行开头
    if (nextCol > data[0].length - 1) {
      nextCol = 1;
      nextRow = selectedCell.row + 1;
    }

    // 检查是否超出表格范围
    if (nextRow > data.length - 1) {
      nextRow = 1;
      nextCol = 1;
    }

    return { nextRow, nextCol };
  };

  const getCellPosition = (cell: CellData) => {
    let col = cell.col;
    let row = cell.row;
    // 如果单元格是主单元格，则计算其位置
    if (cell.mergeSpan) {
      row = cell.mergeSpan.r1;
      col = cell.mergeSpan.c1;
    }
    const x = getLeft(col, headerColsWidth, scrollPosition);
    const y = getTop(row, headerRowsHeight, scrollPosition);
    return { x, y };
  };

  const getMergeCellSize = (
    cell: CellData,
    cellWidth: number,
    cellHeight: number,
  ) => {
    let width = 0;
    let height = 0;
    if (cell.mergeSpan) {
      const { r1, r2, c1, c2 } = cell.mergeSpan;
      for (let j = c1; j <= c2; j++) {
        width += headerColsWidth[j];
      }
      for (let i = r1; i <= r2; i++) {
        height += headerRowsHeight[i];
      }
      return { width, height };
    } else if (cell.mergeParent) {
      const parentCell = data[cell.mergeParent.row][cell.mergeParent.col];
      if (parentCell && parentCell.mergeSpan) {
        const { r1, r2, c1, c2 } = parentCell.mergeSpan;
        for (let j = c1; j <= c2; j++) {
          width += headerColsWidth[j];
        }
        for (let i = r1; i <= r2; i++) {
          height += headerRowsHeight[i];
        }
      }
      return { width, height };
    }
    return { width: cellWidth, height: cellHeight };
  };
  return {
    getMergeCellSize,
    getCellPosition,
    getCurrentCell,
    getNextPosition,
  };
};
