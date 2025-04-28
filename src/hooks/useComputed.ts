import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";
import { useCallback } from "react";

export const useComputed = () => {
  const {
    data,
    zoomSize,
    selectedCell,
    headerColsWidth,
    headerRowsHeight,
    scrollPosition,
    getCurrentCell,
  } = useStore();

  // 通用的累加查找函数
  const findIndexByAccumulate = useCallback(
    (headerSizes: number[], position: number) => {
      let acc = 0;
      for (let i = 0; i < headerSizes.length; i++) {
        acc += headerSizes[i] * zoomSize;
        if (acc > position) {
          return i;
        }
      }
      return headerSizes.length - 1;
    },
    [zoomSize],
  );

  const getStartEndRow = useCallback(
    (wrapperHeight: number) => {
      // 计算 startRow
      let acc = 0;
      let startRow = 0;
      for (let i = 0; i < headerRowsHeight.length; i++) {
        acc += headerRowsHeight[i] * zoomSize;
        if (acc > scrollPosition.y) {
          startRow = i;
          break;
        }
      }
      // 计算 endRow
      let endRow = startRow;
      let visibleHeight = 0;
      for (let i = startRow; i < headerRowsHeight.length; i++) {
        visibleHeight += headerRowsHeight[i] * zoomSize;
        if (visibleHeight > wrapperHeight) {
          endRow = i + 1;
          break;
        }
      }
      endRow = Math.max(endRow, headerRowsHeight.length);

      return {
        startRow,
        endRow,
      };
    },
    [zoomSize, scrollPosition, headerRowsHeight],
  );
  const getStartEndCol = useCallback(
    (wrapperWidth: number) => {
      // 计算 startCol
      let acc = 0;
      let startCol = 0;
      for (let i = 0; i < headerColsWidth.length; i++) {
        acc += headerColsWidth[i] * zoomSize;
        if (acc > scrollPosition.x) {
          startCol = i;
          break;
        }
      }
      // 计算 endCol
      let endCol = startCol;
      let visibleWidth = 0;
      for (let i = startCol; i < headerColsWidth.length; i++) {
        visibleWidth += headerColsWidth[i] * zoomSize;
        if (visibleWidth > wrapperWidth) {
          endCol = i + 1;
          break;
        }
      }
      endCol = Math.max(endCol, headerColsWidth.length);

      return {
        startCol,
        endCol,
      };
    },
    [zoomSize, scrollPosition, headerColsWidth],
  );
  // 获取 x - left
  const getLeft = useCallback(
    (col: number) => {
      const beforeAllWidth =
        col === 0
          ? 0
          : headerColsWidth.slice(0, col).reduce((a, b) => a + b, 0) * zoomSize;
      return col === 0 ? 0 : beforeAllWidth - scrollPosition.x;
    },
    [zoomSize, scrollPosition, headerColsWidth],
  );
  const getTop = useCallback(
    (row: number) => {
      const beforeAllHeight =
        row === 0
          ? 0
          : headerRowsHeight.slice(0, row).reduce((a, b) => a + b, 0) *
            zoomSize;
      return row === 0 ? 0 : beforeAllHeight - scrollPosition.y;
    },
    [zoomSize, scrollPosition, headerRowsHeight],
  );

  // 获取下一个位置
  const getNextPosition = useCallback(() => {
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
  }, [selectedCell, data, getCurrentCell]);

  const getCellPosition = useCallback(
    (cell: CellData) => {
      let col = cell.col;
      let row = cell.row;
      // 如果单元格是主单元格，则计算其位置
      if (cell.mergeSpan) {
        row = cell.mergeSpan.r1;
        col = cell.mergeSpan.c1;
      }
      const x = getLeft(col);
      const y = getTop(row);
      return { x, y };
    },
    [getLeft, getTop],
  );

  const getMergeCellSize = useCallback(
    (cell: CellData, cellWidth: number, cellHeight: number) => {
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
        return { width: width * zoomSize, height: height * zoomSize };
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
        return { width: width * zoomSize, height: height * zoomSize };
      }
      return { width: cellWidth * zoomSize, height: cellHeight * zoomSize };
    },
    [data, zoomSize, headerColsWidth, headerRowsHeight],
  );
  return {
    findIndexByAccumulate,
    getMergeCellSize,
    getCellPosition,
    getCurrentCell,
    getNextPosition,
    getStartEndRow,
    getStartEndCol,
    getLeft,
    getTop,
  };
};
