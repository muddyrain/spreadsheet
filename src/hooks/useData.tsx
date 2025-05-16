import { useCallback } from "react";
import { useStore } from "./useStore";
import { CellData } from "@/types/sheet";

export const useData = () => {
  const { setData } = useStore();

  // 遍历选区并批量更新单元格
  const updateCellsBySelection = useCallback(
    (
      selection: {
        start: { col: number; row: number };
        end: { col: number; row: number };
      },
      callback: (cell: CellData, row: number, col: number) => CellData,
    ) => {
      setData((data) => {
        const newData = [...data];
        for (let row = selection.start.row; row <= selection.end.row; row++) {
          for (let col = selection.start.col; col <= selection.end.col; col++) {
            newData[row] = newData[row] || [];
            newData[row][col] = callback(newData[row][col], row, col);
          }
        }
        return newData;
      });
    },
    [setData],
  );

  return { updateCellsBySelection };
};
