import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../useStore";
import { useTools } from "./useTools";

export const useDynamicRenderBorder = () => {
  const { updater, data, config, headerColsWidth, zoomSize } = useStore();
  const [tempMap, setTempMap] = useState<
    ({
      row: number;
      col: number;
      isDraw: boolean;
    } | null)[][]
  >([]);
  const { getFontStyle } = useTools();
  // 1. 计算 MeasureMap
  const getMeasureMap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const cells = data;
      const measureMap: ({
        textWidth: number;
        row: number;
        col: number;
      } | null)[][] = [];
      for (let row = 0; row < cells.length; row++) {
        measureMap[row] = [];
        for (let col = 0; col < cells[row].length; col++) {
          const cell = cells[row][col];
          if (!cell.value) {
            measureMap[row][col] = {
              textWidth: 0,
              row: cell.row,
              col: cell.col,
            };
            continue;
          }
          getFontStyle(ctx, {
            cell,
            rowIndex: row,
            colIndex: col,
            x: 0,
            y: 0,
          });
          const textWidth = ctx.measureText(cell.value).width;
          measureMap[row][col] = {
            textWidth,
            row: cell.row,
            col: cell.col,
          };
        }
      }
      return measureMap;
    },
    [data, getFontStyle],
  );

  const measureMap = useMemo(() => {
    // 这里假设你有一个 ref 或 ctx 实例
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    return getMeasureMap(ctx);
  }, [getMeasureMap]);
  useEffect(() => {
    const renderMap: ({
      row: number;
      col: number;
      isDraw: boolean;
    } | null)[][] = [];
    for (let row = 0; row < data.length; row++) {
      renderMap[row] = [];
      for (let col = 0; col < data[row].length; col++) {
        const cell = data[row][col];
        renderMap[row].push({
          row: cell.row,
          col: cell.col,
          isDraw: true,
        });
      }
    }
    setTempMap([...renderMap]);
  }, [data]);
  const updateTargetIsDraw = useCallback(
    (row: number, col: number, isDraw: boolean) => {
      const temp = tempMap[row][col];
      if (temp && temp?.isDraw !== isDraw) {
        temp.isDraw = isDraw;
        setTempMap([...tempMap]);
      }
    },
    [tempMap],
  );
  useEffect(() => {
    if (tempMap?.length !== data.length) {
      return;
    }
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const cell = data[row][col];
        const temp = tempMap[row][col];
        if (temp) {
          updateTargetIsDraw(row, col, true);
          const textAlign = cell.style.textAlign || config.textAlign;
          const textWidth = measureMap[row][col]?.textWidth || 0;
          if (cell.value) {
            const cellWidth = headerColsWidth[col];
            if (textAlign === "left") {
              let remainWidth = textWidth - (cellWidth - 5.5 * zoomSize);
              let nextCol = col + 1;
              while (remainWidth > 0 && nextCol < data[row].length) {
                const nextCell = data[row][nextCol];
                if (nextCell.value) break;
                updateTargetIsDraw(row, nextCol - 1, false);
                remainWidth -= headerColsWidth[nextCol];
                nextCol++;
              }
            } else if (textAlign === "right") {
              let remainWidth = textWidth - (cellWidth - 5.5 * zoomSize);
              let preCol = col - 1;
              while (remainWidth > 0 && preCol >= 0) {
                const preCell = data[row][preCol];
                if (preCell.value) break;
                updateTargetIsDraw(row, preCol, false);
                remainWidth -= headerColsWidth[preCol];
                preCol--;
              }
            } else if (textAlign === "center") {
              const remainWidth = textWidth - (cellWidth - 5.5 * zoomSize);
              let leftCol = col - 1;
              let rightCol = col + 1;
              let leftRemain = remainWidth / 2;
              let rightRemain = remainWidth / 2;
              // 向右扩展
              while (rightRemain > 0 && rightCol < data[row].length) {
                const rightCell = data[row][rightCol];
                if (rightCell.value) break;
                updateTargetIsDraw(row, rightCol - 1, false);
                rightRemain -= headerColsWidth[rightCol];
                rightCol++;
              }
              // 向左扩展
              while (leftRemain > 0 && leftCol >= 0) {
                const leftCell = data[row][leftCol];
                if (leftCell.value) break;
                updateTargetIsDraw(row, leftCol, false);
                leftRemain -= headerColsWidth[leftCol];
                leftCol--;
              }
            }
          }
        }
      }
    }
  }, [
    updater,
    config.textAlign,
    data,
    headerColsWidth,
    measureMap,
    tempMap,
    updateTargetIsDraw,
    zoomSize,
  ]);
  return { drawMap: tempMap };
};
