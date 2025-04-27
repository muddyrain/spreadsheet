import {
  getAbsoluteSelection,
  getLeft,
  getStartEndCol,
  getStartEndRow,
  getTop,
} from "@/utils/sheet";
import { useStore } from "../useStore";
import { DrawConfig } from "@/types/sheet";
import { useRenderCell } from "./useRenderCell";
import { useComputed } from "../useComputed";
import { useMemo } from "react";

// 冻结行数和列数（可根据需要调整）
const FROZEN_ROW_COUNT = 1;
const FROZEN_COL_COUNT = 1;

export const useDrawCell = (drawConfig: DrawConfig) => {
  const {
    config,
    data,
    selectedCell,
    isMouseDown,
    sideLineMode,
    currentSideLineIndex,
    currentSideLinePosition,
    isFocused,
    headerRowsHeight,
    headerColsWidth,
    scrollPosition,
    selection,
  } = useStore();
  const { startRow, endRow } = getStartEndRow(
    headerRowsHeight,
    drawConfig.wrapperHeight,
    scrollPosition,
  );
  const { startCol, endCol } = getStartEndCol(
    headerColsWidth,
    drawConfig.wrapperWidth,
    scrollPosition,
  );
  const { renderCell } = useRenderCell();
  const { getMergeCellSize, getCellPosition } = useComputed();
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
  // 绘制内容区（非冻结区）单元格
  const drawCell = (ctx: CanvasRenderingContext2D) => {
    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      for (let colIndex = startCol; colIndex < endCol; colIndex++) {
        if (colIndex === 0 || rowIndex === 0) continue;
        const cell = data[rowIndex]?.[colIndex];
        if (!cell) continue;
        const { x, y } = getCellPosition(cell);
        renderCell(ctx, { rowIndex, colIndex, x, y, cell });
      }
    }
  };
  // 绘制冻结首列（除左上角交叉单元格）
  const drawFrozenCols = (ctx: CanvasRenderingContext2D) => {
    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      for (let colIndex = 0; colIndex < FROZEN_COL_COUNT; colIndex++) {
        const cell = data[rowIndex]?.[colIndex];
        if (!cell) continue;
        const { y } = getCellPosition(cell);
        const x = 0;
        renderCell(ctx, { rowIndex, colIndex, x, y, cell, isRow: true });
      }
    }
  };
  // 绘制冻结首行（除左上角交叉单元格）
  const drawFrozenRows = (ctx: CanvasRenderingContext2D) => {
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
  };
  // 绘制左上角交叉单元格
  const drawFrozenCrossCell = (ctx: CanvasRenderingContext2D) => {
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
  };
  // 绘制选中单元格
  const drawSelectedCell = (ctx: CanvasRenderingContext2D) => {
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
  };
  // 绘制选中区域边框
  const drawSelectedAreaBorder = (ctx: CanvasRenderingContext2D) => {
    if (selection?.start && selection?.end) {
      const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
      // 只绘制在当前可视区域内的部分
      if (r2 >= startRow && r1 < endRow && c2 >= startCol && c1 < endCol) {
        // 列头高亮
        for (let colIndex = c1; colIndex <= c2; colIndex++) {
          const cell = data[r1]?.[colIndex];
          if (!cell) continue;
          const colWidth = headerColsWidth[colIndex];
          const cellHeight = headerRowsHeight[0];
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
          const colWidth = headerColsWidth[0];
          const cellHeight = headerRowsHeight[rowIndex];
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
  };
  // 绘制高亮选区
  const drawHighLightCell = (ctx: CanvasRenderingContext2D) => {
    if (selection?.start && selection?.end) {
      // 如果当前是单选 且 焦点在当前单元格上 不绘制高亮选区
      if (isOneSelection && isFocused) return;
      const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
      // 只绘制在当前可视区域内的部分
      if (r2 >= startRow && r1 < endRow && c2 >= startCol && c1 < endCol) {
        const { x, y } = getCellPosition(data[r1][c1]);
        const width = headerColsWidth
          .slice(c1, c2 + 1)
          .reduce((a, b) => a + b, 0);
        const height = headerRowsHeight
          .slice(r1, r2 + 1)
          .reduce((a, b) => a + b, 0);
        ctx.save();
        ctx.strokeStyle = config.selectionBorderColor;
        ctx.lineWidth = 1;
        // 防止边框被其他元素遮挡
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
      }
    }
  };
  // 绘制拖拽标准线
  const drawDragLine = (ctx: CanvasRenderingContext2D) => {
    if (isMouseDown && sideLineMode === "col") {
      const currentColSideLineIndex = currentSideLineIndex[1];
      const currentColSideLinePosition = currentSideLinePosition[0];
      const colFixedSideLinePosition = getLeft(
        currentColSideLineIndex,
        headerColsWidth,
        scrollPosition,
      );
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
      const rowFixedSideLinePosition = getTop(
        currentRowSideLineIndex,
        headerRowsHeight,
        scrollPosition,
      );
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
  };
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
