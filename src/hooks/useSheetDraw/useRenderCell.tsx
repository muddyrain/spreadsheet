import { CellData, SelectionSheetType } from "@/types/sheet";
import { useStore } from "../useStore";
import { getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "../useComputed";
import { useCallback } from "react";
import { useTools } from "./useTools";
import { useDynamicRender } from "./useDynamicRender";

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
  const {
    data,
    selection,
    zoomSize,
    config,
    headerColsWidth,
    headerRowsHeight,
  } = useStore();
  const { getMergeCellSize } = useComputed();
  const { getFontStyle, getWrapContent } = useTools();
  const { drawBorderMap } = useDynamicRender();
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

      // 设置字体样式
      const { minWidth, color, textAlign, verticalAlign, fontSize } =
        getFontStyle(ctx, options);
      ctx.fillStyle = color;
      function hasCellValue(cell: CellData | undefined) {
        return !!(cell && (cell.value || cell.mergeSpan || cell.mergeParent));
      }
      if (!cell.readOnly && textAlign === "left") {
        const clipX = x;
        let clipWidth = cellWidth;
        let col = colIndex + 1;
        // 向右累计宽度，直到遇到有内容的单元格
        while (
          col < data[rowIndex].length &&
          !hasCellValue(data[rowIndex][col])
        ) {
          clipWidth += headerColsWidth[col];
          col++;
        }
        ctx.beginPath();
        ctx.rect(clipX, y, clipWidth, cellHeight);
        ctx.clip();
      }
      if (!cell.readOnly && textAlign === "center") {
        let leftCol = colIndex - 1;
        let rightCol = colIndex + 1;
        let leftWidth = 0;
        let rightWidth = 0;
        // 向左累计宽度，直到遇到有内容或合并单元格
        while (leftCol >= 0 && !hasCellValue(data[rowIndex][leftCol])) {
          leftWidth += headerColsWidth[leftCol];
          leftCol--;
        }
        // 向右累计宽度，直到遇到有内容或合并单元格
        while (
          rightCol < data[rowIndex].length &&
          !hasCellValue(data[rowIndex][rightCol])
        ) {
          rightWidth += headerColsWidth[rightCol];
          rightCol++;
        }
        const clipX = x - leftWidth;
        const clipWidth = cellWidth + leftWidth + rightWidth;
        ctx.beginPath();
        ctx.rect(clipX, y, clipWidth, cellHeight);
        ctx.clip();
      }
      if (!cell.readOnly && textAlign === "right") {
        let leftCol = colIndex - 1;
        let leftWidth = 0;
        while (leftCol >= 0 && !hasCellValue(data[rowIndex][leftCol])) {
          leftWidth += headerColsWidth[leftCol];
          leftCol--;
        }
        const clipX = x - leftWidth;
        const clipWidth = cellWidth + leftWidth;
        ctx.beginPath();
        ctx.rect(clipX, y, clipWidth, cellHeight);
        ctx.clip();
      }

      // 大于最小宽度时才 设置裁剪
      if (cell.mergeSpan && cellWidth > minWidth) {
        // 设置剪裁区域
        ctx.beginPath();
        ctx.rect(x + 6.5 * zoomSize, y, cellWidth - 13 * zoomSize, cellHeight);
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
        let contents = cell.value.split("\n");
        if (cell.style.wrap) {
          const wrappedContents = getWrapContent(ctx, {
            cell,
            cellWidth,
          });
          contents = wrappedContents;
        }
        const lineHeightPT = fontSize + 4;
        const lineHeightPX = (lineHeightPT * 4) / 3;
        // 计算文本总高度
        const totalTextHeight = contents.length * lineHeightPX;
        let baseY = 0;
        if (verticalAlign === "start") {
          baseY = y + lineHeightPX / 2;
        } else if (verticalAlign === "center") {
          baseY = y + cellHeight / 2 - totalTextHeight / 2 + lineHeightPX / 2;
        } else if (verticalAlign === "end") {
          baseY = y + cellHeight - totalTextHeight + lineHeightPX / 2 - 2;
        }
        for (let i = 0; i < contents.length; i++) {
          const text = contents[i];
          const textMetrics = ctx.measureText(text);
          const textY = baseY + i * lineHeightPX;
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
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      getFontStyle,
      zoomSize,
      data,
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
        const current = drawBorderMap[rowIndex][colIndex];
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
      drawBorderMap,
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
