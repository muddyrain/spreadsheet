import {
  ArrowDirectionType,
  CellData,
  PositionType,
  SelectionSheetType,
} from "@/types/sheet";
import { useStore } from "./useStore";
import { useCallback } from "react";
import { getAbsoluteSelection } from "@/utils/sheet";

export const useComputed = () => {
  const {
    config,
    data,
    zoomSize,
    selectedCell,
    headerColsWidth,
    headerRowsHeight,
    scrollPosition,
    containerWidth,
    containerHeight,
    getCurrentCell,
    setSelection,
    setSelectedCell,
    setEditingCell,
    setScrollPosition,
  } = useStore();
  const getSelectionCells = useCallback(
    (selection: SelectionSheetType | null) => {
      if (!selection) {
        return [];
      }
      const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
      if (r1 === r2 && c1 === c2) {
        if (data[r1][c1]) {
          return [data[r1][c1]];
        } else {
          return [];
        }
      }
      const cells: CellData[] = [];
      for (let i = r1; i <= r2; i++) {
        for (let j = c1; j <= c2; j++) {
          if (!data[i][j]) continue;
          cells.push(data[i][j]);
        }
      }
      return cells;
    },
    [data],
  );
  // 获取默认样式
  const getDefaultCellStyle = useCallback(() => {
    return {
      color: config.color,
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
      fontSize: config.fontSize,
      textAlign: config.textAlign,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
    };
  }, [config]);
  // 更新选择和单元格状态
  const updateSelectionAndCell = useCallback(
    (row: number, col: number) => {
      const cell = getCurrentCell(row, col);
      if (!cell) return;

      if (cell.mergeSpan) {
        const { r1, r2, c1, c2 } = cell.mergeSpan;
        setSelection({
          start: { row: r1, col: c1 },
          end: { row: r2, col: c2 },
        });
      } else if (cell.mergeParent) {
        const parentCell = getCurrentCell(
          cell.mergeParent.row,
          cell.mergeParent.col,
        );
        if (parentCell?.mergeSpan) {
          const { r1, r2, c1, c2 } = parentCell.mergeSpan;
          setSelection({
            start: { row: r1, col: c1 },
            end: { row: r2, col: c2 },
          });
        }
      } else {
        setSelection({ start: { row, col }, end: { row, col } });
      }

      setSelectedCell(data[row][col]);
      setEditingCell(null);
    },
    [data, getCurrentCell, setSelection, setSelectedCell, setEditingCell],
  );
  const getCellWidth = useCallback(
    (col: number) => {
      const cellWidth = headerColsWidth[col] * zoomSize;
      return cellWidth;
    },
    [headerColsWidth, zoomSize],
  );
  const getCellHeight = useCallback(
    (row: number) => {
      const cellHeight = headerRowsHeight[row] * zoomSize;
      return cellHeight;
    },
    [headerRowsHeight, zoomSize],
  );

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
  //   获取 startRow 和 endRow
  const getStartEndRow = useCallback(
    (wrapperHeight: number, _scrollPosition?: PositionType) => {
      // 计算 startRow
      let acc = 0;
      let startRow = -1;
      let endRow = -1;
      const viewTop = (_scrollPosition || scrollPosition).y;
      const viewBottom = (_scrollPosition || scrollPosition).y + wrapperHeight;
      for (let i = 1; i < headerRowsHeight.length; i++) {
        const rowTop = acc;
        const rowBottom = acc + headerRowsHeight[i] * zoomSize;
        if (rowBottom > viewTop && rowTop < viewBottom) {
          if (startRow === -1) startRow = i;
          endRow = i;
        }
        acc = rowBottom;
      }
      // 多加一行预加载
      if (endRow !== -1) endRow = Math.min(endRow + 2, headerRowsHeight.length);
      if (startRow === -1 || endRow === -1) {
        startRow = 0;
        endRow = 1;
      }
      return {
        startRow,
        endRow,
      };
    },
    [zoomSize, scrollPosition, headerRowsHeight],
  );
  // 获取 startCol 和 endCol
  const getStartEndCol = useCallback(
    (wrapperWidth: number, _scrollPosition?: PositionType) => {
      let acc = 0;
      let startCol = -1;
      let endCol = -1;
      const viewLeft = (_scrollPosition || scrollPosition).x;
      const viewRight = (_scrollPosition || scrollPosition).x + wrapperWidth;
      for (let i = 1; i < headerColsWidth.length; i++) {
        const colLeft = acc;
        const colRight = acc + headerColsWidth[i] * zoomSize;
        if (colRight > viewLeft && colLeft < viewRight) {
          if (startCol === -1) startCol = i;
          endCol = i;
        }
        acc = colRight;
      }
      // 多加一列预加载
      if (endCol !== -1) endCol = Math.min(endCol + 2, headerColsWidth.length);
      if (startCol === -1 || endCol === -1) {
        startCol = 0;
        endCol = 1;
      }
      return {
        startCol,
        endCol,
      };
    },
    [zoomSize, scrollPosition, headerColsWidth],
  );
  // 获取真实 X
  const getRealLeft = useCallback(
    (col: number) => {
      const beforeAllWidth =
        col === 0
          ? 0
          : headerColsWidth.slice(0, col).reduce((a, b) => a + b, 0) * zoomSize;
      return col === 0 ? 0 : beforeAllWidth;
    },
    [zoomSize, headerColsWidth],
  );
  // 获取 x - left
  const getLeft = useCallback(
    (col: number, _scrollPosition?: PositionType) => {
      return col === 0
        ? 0
        : getRealLeft(col) - (_scrollPosition || scrollPosition).x;
    },
    [scrollPosition, getRealLeft],
  );
  // 获取 x - right
  const getRight = useCallback(
    (col: number) => {
      const cellWidth = getCellWidth(col);
      return containerWidth - getLeft(col) - cellWidth;
    },
    [containerWidth, getLeft, getCellWidth],
  );
  // 任意两列之间的像素距离
  const getLeftAndTargetIndex = useCallback(
    (col: number, targetIndex: number) => {
      const left1 = getRealLeft(col);
      const left2 = getRealLeft(targetIndex);
      // 返回两者的差值
      return left2 - left1;
    },
    [getRealLeft],
  );
  // 获取真实 Y
  const getRealTop = useCallback(
    (row: number) => {
      const beforeAllHeight =
        row === 0
          ? 0
          : headerRowsHeight.slice(0, row).reduce((a, b) => a + b, 0) *
            zoomSize;
      return row === 0 ? 0 : beforeAllHeight;
    },
    [zoomSize, headerRowsHeight],
  );
  const getTop = useCallback(
    (row: number, _scrollPosition?: PositionType) => {
      return row === 0
        ? 0
        : getRealTop(row) - (_scrollPosition || scrollPosition).y;
    },
    [scrollPosition, getRealTop],
  );

  // 获取下一个位置 - 纯单元格
  const getNextPosition = useCallback(
    (direction: ArrowDirectionType) => {
      if (!selectedCell) return;
      let nextCol = selectedCell.col;
      let nextRow = selectedCell.row;
      if (
        selectedCell &&
        (selectedCell.mergeParent || selectedCell.mergeSpan)
      ) {
        if (selectedCell.mergeParent) {
          const parentCell = getCurrentCell(
            selectedCell.mergeParent.row,
            selectedCell.mergeParent.col,
          );
          if (parentCell?.mergeSpan) {
            if (direction === "ArrowRight") {
              nextCol = parentCell.mergeSpan.c2 + 1;
            } else if (direction === "ArrowLeft") {
              nextCol = parentCell.mergeSpan.c1 - 1;
            } else if (direction === "ArrowDown") {
              nextRow = parentCell.mergeSpan.r2 + 1;
            } else if (direction === "ArrowUp") {
              nextRow = parentCell.mergeSpan.r1 - 1;
            }
          }
        } else if (selectedCell.mergeSpan) {
          if (direction === "ArrowRight") {
            nextCol = selectedCell.mergeSpan.c2 + 1;
          } else if (direction === "ArrowLeft") {
            nextCol = selectedCell.mergeSpan.c1 - 1;
          } else if (direction === "ArrowDown") {
            nextRow = selectedCell.mergeSpan.r2 + 1;
          } else if (direction === "ArrowUp") {
            nextRow = selectedCell.mergeSpan.r1 - 1;
          }
        }
      } else {
        if (direction === "ArrowRight") {
          nextCol = nextCol + 1;
        } else if (direction === "ArrowLeft") {
          nextCol = nextCol - 1;
        } else if (direction === "ArrowDown") {
          nextRow = nextRow + 1;
        } else if (direction === "ArrowUp") {
          nextRow = nextRow - 1;
        }
        // 如果当前是合并单元格，从合并区域的右边界开始
        if (selectedCell?.mergeSpan) {
          if (direction === "ArrowRight") {
            nextCol = selectedCell.mergeSpan.c2 + 1;
          } else if (direction === "ArrowLeft") {
            nextCol = selectedCell.mergeSpan.c1 - 1;
          } else if (direction === "ArrowDown") {
            nextRow = selectedCell.mergeSpan.r2 + 1;
          } else if (direction === "ArrowUp") {
            nextRow = selectedCell.mergeSpan.r1 - 1;
          }
        }
      }
      // 检查是否超出表格范围 回归原点
      if (nextCol < 1) {
        nextCol = 1;
      }
      if (nextCol > data[0].length - 1) {
        nextCol = data[0].length - 1;
      }
      if (nextRow < 1) {
        nextRow = 1;
      }
      if (nextRow > data.length - 1) {
        nextRow = data.length - 1;
      }
      return { nextRow, nextCol };
    },
    [selectedCell, data, getCurrentCell],
  );

  // 获取单元格位置
  const getCellPosition = useCallback(
    (cell: CellData, _scrollPosition?: PositionType) => {
      let col = cell.col;
      let row = cell.row;
      // 如果单元格是主单元格，则计算其位置
      if (cell.mergeSpan) {
        row = cell.mergeSpan.r1;
        col = cell.mergeSpan.c1;
      }
      const x = getLeft(col, _scrollPosition);
      const y = getTop(row, _scrollPosition);
      const right = getRight(col);
      return { x, y, right };
    },
    [getLeft, getTop, getRight],
  );

  // 获取合并单元格大小
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

  // 选中单元格适配视口
  const fitCellViewPort = useCallback(
    (row: number, col: number) => {
      const selectedCell = data?.[row]?.[col];
      if (!selectedCell) return;
      const viewPortWidth = containerWidth;
      const viewPortHeight = containerHeight - 10;
      const x = getLeft(col);
      const y = getTop(row);
      const { width: cellWidth, height: cellHeight } = getMergeCellSize(
        selectedCell,
        headerColsWidth[col],
        headerRowsHeight[row],
      );
      const fixedCellWidth = getCellHeight(0);
      const fixedCellHeight = getCellHeight(0);
      // X轴处理
      if (x + cellWidth - fixedCellWidth < cellWidth) {
        const _x = x + scrollPosition.x - cellWidth;
        setScrollPosition((scrollPosition) => ({
          x: _x > 0 ? _x : 0,
          y: scrollPosition.y,
        }));
      } else if (x + cellWidth > viewPortWidth) {
        const diff = x + cellWidth - viewPortWidth;
        setScrollPosition((scrollPosition) => ({
          x: scrollPosition.x + diff + fixedCellWidth,
          y: scrollPosition.y,
        }));
      }
      // Y轴处理
      if (y + cellHeight - fixedCellHeight < cellHeight) {
        const _y = y + scrollPosition.y - cellHeight;
        setScrollPosition((scrollPosition) => ({
          x: scrollPosition.x,
          y: _y > 0 ? _y : 0,
        }));
      } else if (y + cellHeight > viewPortHeight) {
        const diff = y + cellHeight - viewPortHeight;
        setScrollPosition((scrollPosition) => ({
          x: scrollPosition.x,
          y: scrollPosition.y + diff + fixedCellHeight / 2,
        }));
      }
    },
    [
      containerHeight,
      containerWidth,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      data,
      getCellHeight,
      getLeft,
      getTop,
      scrollPosition.x,
      scrollPosition.y,
      setScrollPosition,
    ],
  );
  const getCellWidthHeight = useCallback(
    (selectedCell?: CellData | null) => {
      if (selectedCell) {
        const cellWidth = headerColsWidth[selectedCell.col];
        const cellHeight = headerRowsHeight[selectedCell.row];
        const { width: computedWidth, height: computedHeight } =
          getMergeCellSize(selectedCell, cellWidth, cellHeight);
        return {
          cellWidth: computedWidth,
          cellHeight: computedHeight,
        };
      } else {
        return {
          cellWidth: 0,
          cellHeight: 0,
        };
      }
    },
    [getMergeCellSize, headerColsWidth, headerRowsHeight],
  );
  return {
    findIndexByAccumulate,
    getMergeCellSize,
    getCellPosition,
    getCurrentCell,
    getNextPosition,
    getStartEndRow,
    getStartEndCol,
    getCellWidth,
    getCellHeight,
    fitCellViewPort,
    updateSelectionAndCell,
    getDefaultCellStyle,
    getLeftAndTargetIndex,
    getSelectionCells,
    getLeft,
    getTop,
    getRight,
    getCellWidthHeight,
  };
};
