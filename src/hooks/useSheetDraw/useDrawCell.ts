import { getAbsoluteSelection } from "@/utils/sheet";
import { useStore } from "../useStore";
import { CellData, DrawConfig } from "@/types/sheet";
import { useRenderCell } from "./useRenderCell";
import { useComputed } from "../useComputed";
import { useCallback, useMemo } from "react";

// 冻结行数和列数（可根据需要调整）
const FROZEN_ROW_COUNT = 1;
const FROZEN_COL_COUNT = 1;

export const useDrawCell = (drawConfig: DrawConfig) => {
  const {
    config,
    data,
    zoomSize,
    selectedCell,
    isMouseDown,
    sideLineMode,
    currentSideLineIndex,
    currentSideLinePosition,
    isFocused,
    headerRowsHeight,
    headerColsWidth,
    selection,
  } = useStore();

  const { renderCell } = useRenderCell();
  const {
    getMergeCellSize,
    getCellPosition,
    getLeft,
    getTop,
    getStartEndRow,
    getStartEndCol,
  } = useComputed();
  const { startRow, endRow } = getStartEndRow(drawConfig.wrapperHeight);
  const { startCol, endCol } = getStartEndCol(drawConfig.wrapperWidth);
  // 当前是否为单个单元格的选区
  const isOneSelection = useMemo(() => {
    if (selectedCell) {
      const cell = data[selectedCell.row]?.[selectedCell.col];
      if (cell.mergeSpan) return true;
    }
    if (!selection) return false;
    return (
      selection?.start?.row === selection?.end?.row &&
      selection?.start?.col === selection?.end?.col
    );
  }, [selection, data, selectedCell]);
  // 绘制高亮选区
  // 在 useDrawCell 顶部添加缓存函数
  const getAccumulatedSize = useMemo(() => {
    const colCache = new Map<string, number>();
    const rowCache = new Map<string, number>();

    return {
      getWidth: (start: number, end: number) => {
        const key = `${start}-${end}`;
        if (!colCache.has(key)) {
          let sum = 0;
          for (let i = start; i <= end; i++) {
            sum += headerColsWidth[i];
          }
          colCache.set(key, sum);
        }
        return colCache.get(key)! * zoomSize;
      },
      getHeight: (start: number, end: number) => {
        const key = `${start}-${end}`;
        if (!rowCache.has(key)) {
          let sum = 0;
          for (let i = start; i <= end; i++) {
            sum += headerRowsHeight[i];
          }
          rowCache.set(key, sum);
        }
        return rowCache.get(key)! * zoomSize;
      },
    };
  }, [headerColsWidth, headerRowsHeight, zoomSize]);

  // 绘制内容区（非冻结区）单元格
  // 添加缓存渲染区域的函数
  const getRenderArea = useMemo(() => {
    const cache = new Map<
      string,
      {
        cells: Array<{
          cell: CellData;
          x: number;
          y: number;
          rowIndex: number;
          colIndex: number;
        }>;
      }
    >();
    return (
      startRow: number,
      endRow: number,
      startCol: number,
      endCol: number,
    ) => {
      const key = `${startRow}-${endRow}-${startCol}-${endCol}`;
      if (!cache.has(key)) {
        const cells = [];
        for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
          for (let colIndex = startCol; colIndex < endCol; colIndex++) {
            if (colIndex === 0 || rowIndex === 0) continue;
            const cell = data[rowIndex]?.[colIndex];
            if (!cell) continue;
            const { x, y } = getCellPosition(cell);
            cells.push({ cell, x, y, rowIndex, colIndex });
          }
        }
        cache.set(key, { cells });
      }
      return cache.get(key)!;
    };
  }, [data, getCellPosition]);

  // 优化后的 drawCell 函数
  const drawCell = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // 移除 console.log
      const { cells } = getRenderArea(startRow, endRow, startCol, endCol);
      // 批量渲染单元格
      ctx.save();
      for (const { cell, x, y, rowIndex, colIndex } of cells) {
        renderCell(ctx, { rowIndex, colIndex, x, y, cell });
      }
      ctx.restore();
    },
    [endCol, endRow, getRenderArea, renderCell, startCol, startRow],
  );
  // 绘制冻结首列（除左上角交叉单元格）
  const drawFrozenCols = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
        for (let colIndex = 0; colIndex < FROZEN_COL_COUNT; colIndex++) {
          const cell = data[rowIndex]?.[colIndex];
          if (!cell) continue;
          const { y } = getCellPosition(cell);
          const x = 0;
          renderCell(ctx, { rowIndex, colIndex, x, y, cell, isRow: true });
        }
      }
    },
    [data, endRow, getCellPosition, renderCell, startRow],
  );
  // 绘制冻结首行（除左上角交叉单元格）
  const drawFrozenRows = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (let rowIndex = 0; rowIndex < FROZEN_ROW_COUNT; rowIndex++) {
        for (let colIndex = startCol; colIndex < endCol; colIndex++) {
          const cell = data[rowIndex]?.[colIndex];
          if (!cell) continue;
          const { x } = getCellPosition(cell);
          const y = 0;
          renderCell(ctx, {
            rowIndex,
            colIndex,
            x,
            y,
            cell,
            selection,
            isHeader: true,
          });
        }
      }
    },
    [data, endCol, getCellPosition, renderCell, selection, startCol],
  );
  // 绘制左上角交叉单元格
  const drawFrozenCrossCell = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (let rowIndex = 0; rowIndex < FROZEN_ROW_COUNT; rowIndex++) {
        for (let colIndex = 0; colIndex < FROZEN_COL_COUNT; colIndex++) {
          const cell = data[rowIndex]?.[colIndex];
          if (!cell) continue;
          const colWidth = headerColsWidth[colIndex];
          const colHeight = headerRowsHeight[rowIndex];
          const { x, y } = getCellPosition(cell);
          renderCell(ctx, { rowIndex, colIndex, x, y, cell });
          // 绘制一个倒三角作为左上角交叉单元格的标志
          ctx.fillStyle = config.selectionBorderColor;
          ctx.beginPath();
          ctx.moveTo(x + colWidth / 2 - 5 + 0.5, y + colHeight / 2 + 5 + 0.5);
          ctx.lineTo(x + colWidth / 2 + 5 + 0.5, y + colHeight / 2 + 5 + 0.5);
          ctx.lineTo(x + colWidth / 2 + 5 + 0.5, y + colHeight / 2 - 5 + 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
    [
      config.selectionBorderColor,
      data,
      getCellPosition,
      headerColsWidth,
      headerRowsHeight,
      renderCell,
    ],
  );
  // 绘制选中单元格
  const drawSelectedCell = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (selectedCell && !isFocused) {
        let { row, col } = selectedCell;
        let cell = data[row]?.[col];
        if (!cell) return;
        if (cell.mergeParent) {
          row = cell.mergeParent.row;
          col = cell.mergeParent.col;
          cell = data[row]?.[col];
        }
        const { width, height } = getMergeCellSize(
          cell,
          headerColsWidth[col],
          headerRowsHeight[row],
        );
        const { x, y } = getCellPosition(cell);
        const cellWidth = width;
        const cellHeight = height;
        ctx.save();
        ctx.strokeStyle = config.selectionBorderColor;
        ctx.lineWidth = 1.5;
        // 防止边框被其他元素遮挡
        ctx.strokeRect(x - 0.5, y - 0.5, cellWidth, cellHeight);
        ctx.restore();
      }
    },
    [
      config.selectionBorderColor,
      data,
      getCellPosition,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      isFocused,
      selectedCell,
    ],
  );
  // 绘制选中区域边框
  const drawSelectedAreaBorder = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (selection?.start && selection?.end) {
        const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
        // 只绘制在当前可视区域内的部分
        if (r2 >= startRow && r1 < endRow && c2 >= startCol && c1 < endCol) {
          // 列头高亮
          for (let colIndex = c1; colIndex <= c2; colIndex++) {
            const cell = data[r1]?.[colIndex];
            if (!cell) continue;
            const colWidth = headerColsWidth[colIndex] * zoomSize;
            const cellHeight = headerRowsHeight[0] * zoomSize;
            const { x } = getCellPosition(cell);
            const y = 0;
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            ctx.moveTo(x, y + cellHeight - 0.5);
            ctx.lineTo(x + colWidth, y + cellHeight - 0.5);
            ctx.strokeStyle = config.selectionBorderColor;
            ctx.stroke();
            ctx.restore();
          }
          // 行头高亮
          for (let rowIndex = r1; rowIndex <= r2; rowIndex++) {
            const cell = data[rowIndex]?.[c1];
            if (!cell) continue;
            const colWidth = headerColsWidth[0] * zoomSize;
            const cellHeight = headerRowsHeight[rowIndex] * zoomSize;
            const { y } = getCellPosition(cell);
            const x = 0;
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            ctx.moveTo(x + colWidth - 0.5, y);
            ctx.lineTo(x + colWidth - 0.5, y + cellHeight);
            ctx.strokeStyle = config.selectionBorderColor;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    },
    [
      config.selectionBorderColor,
      data,
      endCol,
      endRow,
      getCellPosition,
      headerColsWidth,
      headerRowsHeight,
      selection,
      startCol,
      startRow,
      zoomSize,
    ],
  );
  // 修改 drawHighLightCell 函数
  const drawHighLightCell = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (selection?.start && selection?.end) {
        if (isOneSelection && isFocused) return;
        const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);

        // 只绘制在当前可视区域内的部分
        if (r2 >= startRow && r1 < endRow && c2 >= startCol && c1 < endCol) {
          const { x, y } = getCellPosition(data[r1][c1]);
          const width = getAccumulatedSize.getWidth(c1, c2);
          const height = getAccumulatedSize.getHeight(r1, r2);

          // 使用 Path2D 优化绘制
          const path = new Path2D();
          path.rect(x, y, width, height);

          ctx.save();
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.stroke(path);
          ctx.restore();
        }
      }
    },
    [
      config.selectionBorderColor,
      data,
      endCol,
      endRow,
      getAccumulatedSize,
      getCellPosition,
      isFocused,
      isOneSelection,
      selection,
      startCol,
      startRow,
    ],
  );
  // 绘制拖拽标准线
  const drawDragLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (isMouseDown && sideLineMode === "col") {
        const currentColSideLineIndex = currentSideLineIndex[1];
        const currentColSideLinePosition = currentSideLinePosition[0];
        const colFixedSideLinePosition = getLeft(currentColSideLineIndex);
        if (
          currentColSideLineIndex !== undefined &&
          currentColSideLinePosition !== undefined
        ) {
          ctx.save();
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(currentColSideLinePosition, 0);
          ctx.lineTo(currentColSideLinePosition, drawConfig.wrapperHeight);
          ctx.stroke();
          ctx.restore();
        }
        if (colFixedSideLinePosition) {
          ctx.save();
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(colFixedSideLinePosition, 0);
          ctx.lineTo(colFixedSideLinePosition, drawConfig.wrapperHeight);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (isMouseDown && sideLineMode === "row") {
        const currentRowSideLineIndex = currentSideLineIndex[0];
        const currentRowSideLinePosition = currentSideLinePosition[1];
        const rowFixedSideLinePosition = getTop(currentRowSideLineIndex);
        if (
          currentRowSideLineIndex !== undefined &&
          currentRowSideLinePosition !== undefined
        ) {
          ctx.save();
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, currentRowSideLinePosition);
          ctx.lineTo(drawConfig.wrapperWidth, currentRowSideLinePosition);
          ctx.stroke();
          ctx.restore();
        }
        if (rowFixedSideLinePosition) {
          ctx.save();
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, rowFixedSideLinePosition);
          ctx.lineTo(drawConfig.wrapperWidth, rowFixedSideLinePosition);
          ctx.stroke();
          ctx.restore();
        }
      }
    },
    [
      config.selectionBorderColor,
      currentSideLineIndex,
      currentSideLinePosition,
      drawConfig.wrapperHeight,
      drawConfig.wrapperWidth,
      getLeft,
      getTop,
      isMouseDown,
      sideLineMode,
    ],
  );
  return {
    drawCell,
    drawFrozenCols,
    drawFrozenRows,
    drawFrozenCrossCell,
    drawHighLightCell,
    drawSelectedCell,
    drawDragLine,
    drawSelectedAreaBorder,
  };
};
