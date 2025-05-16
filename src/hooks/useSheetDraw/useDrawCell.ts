import { getAbsoluteSelection } from "@/utils/sheet";
import { useStore } from "../useStore";
import { CellData, DrawConfig } from "@/types/sheet";
import { useRenderCell } from "./useRenderCell";
import { useComputed } from "../useComputed";
import { useCallback, useMemo } from "react";
import { useDynamicRender } from "./useDynamicRender";

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
    cutSelection,
  } = useStore();
  const { measureMap } = useDynamicRender();
  const { renderCell, renderText, renderBorder, renderSelectedCell } =
    useRenderCell();
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
  const selectionCells: CellData[] = useMemo(() => {
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
  }, [selection, data]);
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
        const cells: Array<{
          cell: CellData;
          x: number;
          y: number;
          rowIndex: number;
          colIndex: number;
        }> = [];
        for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
          for (let colIndex = startCol; colIndex < endCol; colIndex++) {
            if (colIndex === 0 || rowIndex === 0) continue;
            const cell = data[rowIndex]?.[colIndex];
            if (!cell) continue;
            // console.log(measureMap[rowIndex][colIndex]);
            // 处理合并单元格的情况
            if (cell.mergeParent) {
              const parentCell =
                data[cell.mergeParent.row]?.[cell.mergeParent.col];
              if (parentCell) {
                const { x, y } = getCellPosition(parentCell);
                // 确保主单元格只被添加一次
                if (
                  !cells.some(
                    (item) =>
                      item.rowIndex === cell.mergeParent?.row &&
                      item.colIndex === cell.mergeParent?.col,
                  )
                ) {
                  cells.push({
                    cell: parentCell,
                    x,
                    y,
                    rowIndex: cell.mergeParent.row,
                    colIndex: cell.mergeParent.col,
                  });
                }
                continue;
              }
            }
            const { x, y } = getCellPosition(cell);
            cells.push({ cell, x, y, rowIndex, colIndex });
          }
        }
        cache.set(key, { cells });
      }
      return cache.get(key)!;
    };
  }, [data, measureMap, getCellPosition]);

  // 优化后的 drawCell 函数
  const drawCell = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { cells } = getRenderArea(startRow, endRow, startCol, endCol);
      // 批量渲染单元格
      for (const { cell, x, y, rowIndex, colIndex } of cells) {
        renderCell(ctx, { rowIndex, colIndex, x, y, cell });
      }
      for (const cell of cells) {
        renderText(ctx, cell);
      }
      // 绘制边框
      for (const { cell, x, y, rowIndex, colIndex } of cells) {
        renderBorder(ctx, {
          x,
          y,
          cell,
          rowIndex,
          colIndex,
        });
      }
      // 渲染选中单元格
      for (const cell of selectionCells) {
        const { x, y } = getCellPosition(cell);
        renderSelectedCell(ctx, { x, y, cell });
      }
    },
    [
      getRenderArea,
      startRow,
      endRow,
      startCol,
      endCol,
      renderCell,
      renderText,
      renderBorder,
      selectionCells,
      getCellPosition,
      renderSelectedCell,
    ],
  );
  // 绘制所有合并单元格边框
  const drawMergeCellBorder = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { cells } = getRenderArea(startRow, endRow, startCol, endCol);
      for (const { cell } of cells) {
        if (cell.mergeSpan) {
          const borderColor = cell.style.borderColor || config.borderColor;
          const { c1, r1, c2, r2 } = cell.mergeSpan;
          const x = getLeft(c1);
          const y = getTop(r1);
          ctx.strokeStyle = borderColor;
          let mergeWidth = 0;
          let mergeHeight = 0;
          for (let i = c1; i <= c2; i++) {
            mergeWidth += headerColsWidth[i];
          }
          for (let i = r1; i <= r2; i++) {
            mergeHeight += headerRowsHeight[i];
          }
          ctx.strokeRect(x, y, mergeWidth, mergeHeight);
        }
      }
    },
    [
      config.borderColor,
      endCol,
      endRow,
      getLeft,
      getRenderArea,
      getTop,
      headerColsWidth,
      headerRowsHeight,
      startCol,
      startRow,
    ],
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
          renderBorder(ctx, { rowIndex, colIndex, x, y, cell });
          renderText(ctx, { rowIndex, colIndex, x, y, cell });
        }
      }
    },
    [
      data,
      endRow,
      getCellPosition,
      renderBorder,
      renderCell,
      renderText,
      startRow,
    ],
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
        for (let rowIndex = 0; rowIndex < FROZEN_ROW_COUNT; rowIndex++) {
          for (let colIndex = startCol; colIndex < endCol; colIndex++) {
            const cell = data[rowIndex]?.[colIndex];
            if (!cell) continue;
            const { x } = getCellPosition(cell);
            const y = 0;
            renderBorder(ctx, { rowIndex, colIndex, x, y, cell });
            renderText(ctx, { rowIndex, colIndex, x, y, cell });
          }
        }
      }
    },
    [
      data,
      endCol,
      getCellPosition,
      renderBorder,
      renderCell,
      renderText,
      selection,
      startCol,
    ],
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
          ctx.moveTo(
            (x + colWidth / 2 - 5 + 0.5) * zoomSize,
            (y + colHeight / 2 + 5 + 0.5) * zoomSize,
          );
          ctx.lineTo(
            (x + colWidth / 2 + 5 + 0.5) * zoomSize,
            (y + colHeight / 2 + 5 + 0.5) * zoomSize,
          );
          ctx.lineTo(
            (x + colWidth / 2 + 5 + 0.5) * zoomSize,
            (y + colHeight / 2 - 5 + 0.5) * zoomSize,
          );
          ctx.closePath();
          ctx.fill();
          renderBorder(ctx, { rowIndex, colIndex, x, y, cell });
        }
      }
    },
    [
      config.selectionBorderColor,
      data,
      zoomSize,
      getCellPosition,
      headerColsWidth,
      headerRowsHeight,
      renderBorder,
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
        ctx.strokeStyle = config.selectionBorderColor;
        ctx.lineWidth = 1.5;
        // 防止边框被其他元素遮挡
        ctx.strokeRect(x - 0.5, y - 0.5, cellWidth + 1, cellHeight + 1);
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
  // 绘制头部选中区域线
  const drawHeaderSelectedAreaLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (selection?.start && selection?.end) {
        const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
        // 列头高亮
        for (let colIndex = c1; colIndex <= c2; colIndex++) {
          const cell = data[r1]?.[colIndex];
          if (!cell) continue;
          const colWidth = headerColsWidth[colIndex] * zoomSize;
          const cellHeight = headerRowsHeight[0] * zoomSize;
          const { x } = getCellPosition(cell);
          const y = 0;
          ctx.beginPath();
          ctx.lineWidth = 1.5;
          ctx.moveTo(x, y + cellHeight - 0.5);
          ctx.lineTo(x + colWidth, y + cellHeight - 0.5);
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.stroke();
        }
        // 行头高亮
        for (let rowIndex = r1; rowIndex <= r2; rowIndex++) {
          const cell = data[rowIndex]?.[c1];
          if (!cell) continue;
          const colWidth = headerColsWidth[0] * zoomSize;
          const cellHeight = headerRowsHeight[rowIndex] * zoomSize;
          const { y } = getCellPosition(cell);
          const x = 0;
          ctx.beginPath();
          ctx.lineWidth = 1.5;
          ctx.moveTo(x + colWidth - 0.5, y);
          ctx.lineTo(x + colWidth - 0.5, y + cellHeight);
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.stroke();
        }
      }
    },
    [
      config.selectionBorderColor,
      data,
      getCellPosition,
      headerColsWidth,
      headerRowsHeight,
      selection,
      zoomSize,
    ],
  );
  // 绘制当前选中单元格的边框
  const drawSelectionBorder = useCallback(
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

          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.stroke(path);
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
  // 绘制剪切选中单元格的边框
  const drawCtSelectionBorder = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (cutSelection?.start && cutSelection?.end) {
        const { r1, r2, c1, c2 } = getAbsoluteSelection(cutSelection);
        // 只绘制在当前可视区域内的部分
        if (r2 >= startRow && r1 < endRow && c2 >= startCol && c1 < endCol) {
          const { x, y } = getCellPosition(data[r1][c1]);
          const width = getAccumulatedSize.getWidth(c1, c2);
          const height = getAccumulatedSize.getHeight(r1, r2);

          // 使用 Path2D 优化绘制
          const path = new Path2D();
          path.rect(x + 0.5, y + 0.5, width - 1, height - 1);
          ctx.setLineDash([5, 5]);
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
      cutSelection,
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
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(currentColSideLinePosition, 0);
          ctx.lineTo(currentColSideLinePosition, drawConfig.wrapperHeight);
          ctx.stroke();
        }
        if (colFixedSideLinePosition) {
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(colFixedSideLinePosition, 0);
          ctx.lineTo(colFixedSideLinePosition, drawConfig.wrapperHeight);
          ctx.stroke();
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
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, currentRowSideLinePosition);
          ctx.lineTo(drawConfig.wrapperWidth, currentRowSideLinePosition);
          ctx.stroke();
        }
        if (rowFixedSideLinePosition) {
          ctx.strokeStyle = config.selectionBorderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, rowFixedSideLinePosition);
          ctx.lineTo(drawConfig.wrapperWidth, rowFixedSideLinePosition);
          ctx.stroke();
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
    drawSelectionBorder,
    drawCtSelectionBorder,
    drawSelectedCell,
    drawDragLine,
    drawMergeCellBorder,
    drawHeaderSelectedAreaLine,
  };
};
