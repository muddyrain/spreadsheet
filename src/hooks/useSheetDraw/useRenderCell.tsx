import { CellData, SelectionSheetType } from "@/types/sheet";
import { useStore } from "../useStore";
import { getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "../useComputed";
import { useCallback } from "react";
import { useTools } from "./useTools";
import { useDynamicRenderBorder } from "./useDynamicRenderBorder";

export interface RenderOptions {
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
  const { selection, zoomSize, config, headerColsWidth, headerRowsHeight } =
    useStore();
  const { getMergeCellSize } = useComputed();
  const { getFontStyle } = useTools();
  const { drawMap } = useDynamicRenderBorder();
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

  // 绘制文本
  const renderText = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      ctx.save();
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
      // 大于最小宽度时才 设置裁剪
      if (cell.mergeSpan && cellWidth > minWidth) {
        // 设置剪裁区域
        ctx.beginPath();
        // + 2 是为了防止文本被裁剪
        ctx.rect(x - 8 * zoomSize, y, cellWidth, cellHeight);
        ctx.clip();
      }
      // 计算文本位置
      const textX = (() => {
        if (textAlign === "left" && cellWidth <= minWidth) return x;
        if (textAlign === "center") return x + cellWidth / 2;
        if (textAlign === "right") return x + cellWidth - 5.5 * zoomSize;
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
            (config.height / 2 - 1.5) * zoomSize +
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
      ctx.restore();
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
        const current = drawMap[rowIndex][colIndex];
        if (current?.isDraw) {
          // 绘制右边框
          ctx.beginPath();
          ctx.moveTo(x + cellWidth, y);
          ctx.lineTo(x + cellWidth, y + cellHeight);
          ctx.stroke();
        }
      }
    },
    [
      config.borderColor,
      drawMap,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
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
