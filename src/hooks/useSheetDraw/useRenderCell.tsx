import { CellData, SelectionSheetType } from "@/types/sheet";
import { useStore } from "../useStore";
import { getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "../useComputed";
import { useCallback, useMemo } from "react";

interface RenderOptions {
  rowIndex: number;
  colIndex: number;
  x: number;
  y: number;
  cell: CellData;
  isHeader?: boolean;
  isRow?: boolean;
  selection?: SelectionSheetType | null;
}

export const useRenderCell = () => {
  const {
    data,
    selection,
    zoomSize,
    config,
    headerColsWidth,
    headerRowsHeight,
  } = useStore();
  const { getMergeCellSize, getLeftAndTargetIndex } = useComputed();
  // 缓存字体样式
  const fontFamily = useMemo(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-family")
      .trim();
  }, []);
  const isCellSelected = useCallback(
    (cell: CellData) => {
      if (!selection?.start || !selection?.end) return false;
      const { row, col } = cell;
      const absoluteRowCol = getAbsoluteSelection(selection);
      const { r1, r2, c1, c2 } = absoluteRowCol;
      return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    },
    [selection],
  );
  const getFontStyle = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { cell } = options;
      // 最低宽度尺寸
      const minWidth = 25 * zoomSize;
      const textAlign = cell.style.textAlign || config.textAlign;
      const color = cell.style.color || config.color || "#000000";
      // 设置字体样式
      const fontWeight = cell.style.fontWeight || "normal";
      const fontStyle = cell.style.fontStyle || "normal";
      const fontSize =
        (cell.style.fontSize || config.fontSize || 14) * zoomSize;
      // 获取 CSS 变量定义的字体
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      // 设置文本对齐
      ctx.textAlign = (cell.style.textAlign as CanvasTextAlign) || "left";
      ctx.textBaseline = "middle";
      return {
        minWidth,
        textAlign,
        color,
        fontWeight,
        fontStyle,
        fontSize,
      };
    },
    [config.color, config.fontSize, config.textAlign, fontFamily, zoomSize],
  );
  // 1. 计算 MeasureMap
  const getMeasureMap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const cells = data;
      const measureMap: ({
        textWidth: number;
        value: string;
        readOnly: boolean;
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
              value: cell.value,
              readOnly: cell.readOnly || false,
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
            value: cell.value,
            readOnly: cell.readOnly || false,
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
  // 绘制文本
  const renderText = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { rowIndex, colIndex, x, y, cell } = options;
      const { width, height } = getMergeCellSize(
        cell,
        headerColsWidth[colIndex],
        headerRowsHeight[rowIndex],
      );
      const cellWidth = width;
      const cellHeight = height;

      if (cell.value && !cell.readOnly) {
        const backgroundColor =
          cell.style.backgroundColor || config.backgroundColor;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
      }
      const { minWidth, color, textAlign, fontSize } = getFontStyle(
        ctx,
        options,
      );
      ctx.fillStyle = color;
      // 计算文本位置
      const textX = (() => {
        if (textAlign === "left" && cellWidth <= minWidth) return x;
        if (textAlign === "center") return x + cellWidth / 2;
        if (textAlign === "right") return x + cellWidth;
        return x + 5.5 * zoomSize;
      })();

      if (cell.readOnly) {
        const textY = y + cellHeight / 2;
        ctx.fillText(cell.value, textX, textY);
      } else {
        const contents = cell.value.split("\n");
        for (let i = 0; i < contents.length; i++) {
          const text = contents[i];
          const textMetrics = ctx.measureText(text);
          // 计算文本位置 + 起始单元格高度一半 - 边框高度  + 字体大小 + (行间距) 是为了防止文本被裁剪
          const textY =
            y +
            (config.height / 2 - 2) * zoomSize +
            (i * fontSize + i * 7 * zoomSize);
          ctx.fillText(text, textX, textY);

          const textDecoration = cell.style.textDecoration || "none";
          // 计算文本装饰线的位置
          const calculateLinePosition = (
            align: CanvasTextAlign | undefined,
            baseX: number,
            width: number,
          ) => {
            if (align === "center") {
              return [baseX - width / 2, baseX + width / 2];
            }
            if (align === "right") {
              return [baseX - width, baseX];
            }
            return [baseX, baseX + width];
          };

          // 绘制装饰线
          const drawLine = (startX: number, endX: number, y: number) => {
            ctx.strokeStyle = cell.style.color || "#000";
            ctx.lineWidth = 1 * zoomSize;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
          };

          // 处理文本装饰
          if (textDecoration !== "none") {
            const [lineStartX, lineEndX] = calculateLinePosition(
              ctx.textAlign,
              textX,
              textMetrics.width,
            );

            if (textDecoration.includes("line-through")) {
              drawLine(lineStartX, lineEndX, textY);
            }

            if (textDecoration.includes("underline")) {
              drawLine(lineStartX, lineEndX, textY + fontSize / (2 * zoomSize));
            }
          }
        }
      }
    },
    [
      config.backgroundColor,
      config.height,
      getFontStyle,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      zoomSize,
    ],
  );
  // 单元格绘制函数
  const renderCell = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { rowIndex, colIndex, x, y, cell, isHeader, isRow } = options;
      const { width, height } = getMergeCellSize(
        cell,
        headerColsWidth[colIndex],
        headerRowsHeight[rowIndex],
      );
      const cellWidth = width;
      const cellHeight = height;

      // 合并状态保存，减少 save/restore 调用
      ctx.save();
      // 如果是非合并单元格
      const backgroundColor =
        cell.style.backgroundColor || config.backgroundColor;
      // 校验当前
      if (!cell.mergeParent) {
        // 设置背景颜色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x - 0.5, y - 0.5, cellWidth + 1, cellHeight + 1);
      }
      // 如果是表头，并且当前列在选中范围内
      if ((isHeader || isRow) && selection?.start && selection?.end) {
        const { c1, c2, r1, r2 } = getAbsoluteSelection(selection);
        if (
          (c1 <= colIndex && colIndex <= c2) ||
          (r1 <= rowIndex && rowIndex <= r2)
        ) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = config.selectionBackgroundColor;
          ctx.fillRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
          ctx.globalAlpha = 1;
        }
      }
    },
    [
      config.backgroundColor,
      config.selectionBackgroundColor,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      selection,
    ],
  );

  const renderSelectedCell = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      options: {
        cell: CellData;
        x: number;
        y: number;
      },
    ) => {
      const { cell, x, y } = options;
      const { width, height } = getMergeCellSize(
        cell,
        headerColsWidth[cell.col],
        headerRowsHeight[cell.row],
      );
      const cellWidth = width;
      const cellHeight = height;
      // 判断是否选中，绘制高亮背景
      if (isCellSelected && isCellSelected(cell) && !cell.mergeParent) {
        ctx.fillStyle = config.selectionBackgroundColor;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    },
    [
      config.selectionBackgroundColor,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      isCellSelected,
    ],
  );
  const renderBorder = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { rowIndex, colIndex, x, y, cell } = options;
      const { width, height } = getMergeCellSize(
        cell,
        headerColsWidth[cell.col],
        headerRowsHeight[cell.row],
      );
      const cellWidth = width;
      const cellHeight = height;
      const { textAlign } = getFontStyle(ctx, options);
      // 绘制边框
      const borderColor = cell.style.borderColor || config.borderColor;
      ctx.lineWidth = 1 * zoomSize;
      ctx.strokeStyle = borderColor;
      if (!cell.mergeParent) {
        // 绘制上边框
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellWidth, y);
        ctx.stroke();
        // 绘制下边框
        ctx.beginPath();
        ctx.moveTo(x, y + cellHeight);
        ctx.lineTo(x + cellWidth, y + cellHeight);
        ctx.stroke();
        if (cell.readOnly) {
          // 绘制右边框
          ctx.beginPath();
          ctx.moveTo(x + cellWidth, y);
          ctx.lineTo(x + cellWidth, y + cellHeight);
          ctx.stroke();
        }
        if (textAlign === "left") {
          const textWidth = measureMap[rowIndex]?.[colIndex]?.textWidth || 0;
          let isDraw = true;
          // 如果当前 cell 的文本宽度小于 cell 的宽度 不绘制
          if (textWidth > cellWidth - 5.5 * zoomSize) {
            isDraw = false;
          }
          // 如果当前的单元格的前一个单元格的文本宽度大于 cell 的宽度
          // 这里做一个遍历
          let prev = measureMap[rowIndex]?.[colIndex - 1];
          // 如果前一个 单元格 是有内容
          if (!prev?.value) {
            while (prev) {
              if (prev.readOnly) break;
              if (prev.value) break;
              prev = measureMap[rowIndex][prev?.col - 1];
            }
          }
          // 上一个单元格的内容超出当前单元格自身则隐藏边框
          if (prev && !prev.readOnly) {
            const space = getLeftAndTargetIndex(prev.col, colIndex);
            if (prev.textWidth > space + cellWidth - 5.5 * zoomSize) {
              isDraw = false;
            }
          }
          const next = measureMap[rowIndex][colIndex + 1];
          // 下一个单元格有内容则自动绘制单元格
          if (next && next.value) {
            isDraw = true;
          }
          if (isDraw) {
            // 绘制右边框
            ctx.beginPath();
            ctx.moveTo(x + cellWidth, y);
            ctx.lineTo(x + cellWidth, y + cellHeight);
            ctx.stroke();
          }
        }
        // TODO: center
        // TODO: right
      }
    },
    [
      config.borderColor,
      getFontStyle,
      getLeftAndTargetIndex,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      measureMap,
      zoomSize,
    ],
  );
  return {
    renderCell,
    renderText,
    renderSelectedCell,
    renderBorder,
  };
};
