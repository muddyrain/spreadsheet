import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";
import { getLeft, getTop } from "@/utils/sheet";

export const useComputed = () => {
  const { data, headerColsWidth, headerRowsHeight, scrollPosition } =
    useStore();

  const getCellPosition = (cell: CellData) => {
    let col = cell.col;
    let row = cell.row;
    // 如果单元格是主单元格，则计算其位置
    if (cell.mergeSpan) {
      col = cell.mergeSpan.c1;
      row = cell.mergeSpan.r1;
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
  return { getMergeCellSize, getCellPosition };
};
