import { CellData, SelectionSheetType } from "@/types/sheet";
import { useStore } from "../useStore";
import { getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "../useComputed";
import { useCallback, useMemo } from "react";

export const useRenderCell = () => {
  const { selection, zoomSize, config, headerColsWidth, headerRowsHeight } =
    useStore();
  const { getMergeCellSize } = useComputed();
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
  // 单元格绘制函数
  const renderCell = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      options: {
        rowIndex: number;
        colIndex: number;
        x: number;
        y: number;
        cell: CellData;
        isHeader?: boolean;
        isRow?: boolean;
        selection?: SelectionSheetType | null;
      },
    ) => {
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
      // 设置字体样式
      const fontWeight = cell.style.fontWeight || "normal";
      const fontStyle = cell.style.fontStyle || "normal";
      const fontSize =
        (cell.style.fontSize || config.fontSize || 14) * zoomSize;
      // 最低宽度尺寸
      const minWidth = 25 * zoomSize;
      let color = cell.style.color || config.color || "#000000";
      // 获取 CSS 变量定义的字体
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      // 设置文本对齐
      ctx.textAlign = (cell.style.textAlign as CanvasTextAlign) || "left";
      ctx.textBaseline = "middle";

      // 如果是非合并单元格
      const backgroundColor =
        cell.style.backgroundColor || config.backgroundColor;
      if (!cell.mergeParent) {
        // 设置背景颜色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x - 0.5, y - 0.5, cellWidth + 0.5, cellHeight + 0.5);
      }
      // 判断是否选中，绘制高亮背景
      if (isCellSelected && isCellSelected(cell) && !cell.mergeParent) {
        ctx.fillStyle = config.selectionBackgroundColor;
        ctx.fillRect(x + 0.5, y + 0.5, cellWidth - 0.5, cellHeight - 0.5);
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
          ctx.fillRect(x, y, cellWidth, cellHeight);
          ctx.globalAlpha = 1;
        }
      }
      // 绘制边框
      const borderColor = cell.style.borderColor || config.borderColor;
      ctx.lineWidth = 1 * zoomSize;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
      // 如果是被动合并单元格，不绘制文本
      if (cell.mergeParent) {
        return;
      }
      if (cell.readOnly)
        color =
          config.readOnlyColor || cell.style.color || config.color || "#000000";
      ctx.fillStyle = color;
      // 大于最小宽度时才 设置裁剪
      if (cellWidth > minWidth) {
        // 设置剪裁区域
        ctx.beginPath();
        // + 2 是为了防止文本被裁剪
        ctx.rect(x - 8 * zoomSize, y, cellWidth, cellHeight);
        ctx.clip();
      }
      // 计算文本位置
      const textX = (() => {
        if (cellWidth <= minWidth) return x;
        if (ctx.textAlign === "center") return x + cellWidth / 2;
        if (ctx.textAlign === "right") return x + cellWidth;
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
      ctx.restore();
    },
    [
      config.backgroundColor,
      config.borderColor,
      config.color,
      config.fontSize,
      config.height,
      config.readOnlyColor,
      config.selectionBackgroundColor,
      getMergeCellSize,
      headerColsWidth,
      headerRowsHeight,
      isCellSelected,
      selection,
      zoomSize,
      fontFamily,
    ],
  );
  return {
    renderCell,
  };
};
