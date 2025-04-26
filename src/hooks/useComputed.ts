import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";

export const useComputed = () => {
  const { data, headerColsWidth, headerRowsHeight } = useStore();

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
  return { getMergeCellSize };
};
