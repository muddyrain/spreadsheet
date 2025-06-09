import { useCallback, useMemo } from "react";
import { useStore } from "../useStore";
import { useTools } from "./useTools";
import { useComputed } from "../useComputed";

export const useDynamicRender = () => {
  const { data, config, containerHeight, containerWidth } = useStore();
  const {
    getCellWidthHeight,
    getStartEndRow,
    getStartEndCol,
    getRenderAreaCells,
  } = useComputed();
  const { getFontStyle } = useTools();
  const { startRow, endRow } = useMemo(
    () => getStartEndRow(containerHeight),
    [containerHeight, getStartEndRow],
  );
  const { startCol, endCol } = useMemo(
    () => getStartEndCol(containerWidth),
    [containerWidth, getStartEndCol],
  );
  // 1. 计算 MeasureMap
  const getMeasureMap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { cells } = getRenderAreaCells(startRow, endRow, startCol, endCol);
      const measureMap: Map<string, number> = new Map();
      for (let i = 0; i < cells.length; i++) {
        const { cell } = cells[i];
        const key = `${cell.row}:${cell.col}`;
        measureMap.set(key, 0);
        if (!cell.value) {
          measureMap.set(key, 0);
          continue;
        }
        getFontStyle(ctx, {
          cell,
          rowIndex: cell.row,
          colIndex: cell.col,
          x: 0,
          y: 0,
        });
        const contents = cell.value.split("\n");
        const maxLengthContent = contents.reduce(
          (a, b) => (a.length > b.length ? a : b),
          "",
        );
        const textWidth = ctx.measureText(maxLengthContent).width;
        measureMap.set(key, textWidth);
      }
      return measureMap;
    },
    [endCol, endRow, getFontStyle, getRenderAreaCells, startCol, startRow],
  );

  const measureMap = useMemo(() => {
    // 这里假设你有一个 ref 或 ctx 实例
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return new Map() as Map<string, number>;
    return getMeasureMap(ctx);
  }, [getMeasureMap]);
  const drawBorderMap = useMemo(() => {
    const { cells } = getRenderAreaCells(startRow, endRow, startCol, endCol);
    // 1. 初始化所有单元格边框为显示
    const tempMap: Map<string, boolean> = new Map();
    for (let i = 0; i < cells.length; i++) {
      const { cell } = cells[i];
      const key = `${cell.row}:${cell.col}`;
      tempMap.set(key, true);
    }
    for (let i = 0; i < cells.length; i++) {
      const { cell } = cells[i];
      const row = cell.row;
      const col = cell.col;
      const key = `${row}:${col}`;
      const temp = tempMap.get(key);
      if (temp && cell) {
        const textAlign = cell.style.textAlign || config.textAlign;
        const textWidth = measureMap.get(key) || 0;
        if (!cell.readOnly && cell.value) {
          const { cellWidth } = getCellWidthHeight(cell);
          if (textAlign === "left") {
            let remainWidth = textWidth - (cellWidth - config.inputPadding * 2);
            let nextCol = col + 1;
            while (remainWidth > 0 && nextCol < data[row].length) {
              const nextCell = data[row][nextCol];
              if (nextCell.value) break;
              const targetKey = `${row}:${nextCol - 1}`;
              const target = tempMap.get(targetKey);
              if (target && !cell.style.wrap && !cell.mergeSpan) {
                tempMap.set(targetKey, false);
              }
              const { cellWidth } = getCellWidthHeight(nextCell);
              remainWidth -= cellWidth;
              nextCol++;
            }
          } else if (textAlign === "right") {
            let remainWidth = textWidth - (cellWidth - config.inputPadding * 2);
            let preCol = col - 1;
            while (remainWidth > 0 && preCol >= 0) {
              const preCell = data[row][preCol];
              if (preCell.value) break;
              const targetKey = `${row}:${preCol}`;
              const target = tempMap.get(targetKey);
              if (target && !cell.style.wrap && !cell.mergeSpan) {
                tempMap.set(targetKey, false);
              }
              const { cellWidth } = getCellWidthHeight(preCell);
              remainWidth -= cellWidth;
              preCol--;
            }
          } else if (textAlign === "center") {
            const remainWidth =
              textWidth - (cellWidth - config.inputPadding * 2);
            let leftCol = col - 1;
            let rightCol = col + 1;
            let leftRemain = remainWidth / 2;
            let rightRemain = remainWidth / 2;
            // 向右扩展
            while (rightRemain > 0 && rightCol < data[row].length) {
              const rightCell = data[row][rightCol];
              if (rightCell.value) break;
              const targetKey = `${row}:${rightCol - 1}`;
              const target = tempMap.get(targetKey);
              if (target && !cell.style.wrap && !cell.mergeSpan) {
                tempMap.set(targetKey, false);
              }
              const { cellWidth } = getCellWidthHeight(rightCell);
              rightRemain -= cellWidth;
              rightCol++;
            }
            // 向左扩展
            while (leftRemain > 0 && leftCol >= 0) {
              const leftCell = data[row][leftCol];
              if (leftCell.value) break;
              const targetKey = `${row}:${leftCol}`;
              const target = tempMap.get(targetKey);
              if (target && !cell.style.wrap && !cell.mergeSpan) {
                tempMap.set(targetKey, false);
              }
              const { cellWidth } = getCellWidthHeight(leftCell);
              leftRemain -= cellWidth;
              leftCol--;
            }
          }
        }
        if (cell.readOnly) {
          const key = `${row}:${col}`;
          const target = tempMap.get(key);
          if (target) {
            tempMap.set(key, false);
          }
        }
      }
    }
    return tempMap;
  }, [
    data,
    config.textAlign,
    config.inputPadding,
    measureMap,
    getCellWidthHeight,
    endCol,
    endRow,
    getRenderAreaCells,
    startCol,
    startRow,
  ]);

  return { measureMap, drawBorderMap };
};
