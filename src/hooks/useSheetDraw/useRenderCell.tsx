import { CellData, SelectionSheetType } from "@/types/sheet";
import { useStore } from "../useStore";
import { getAbsoluteSelection, getLeft, getTop } from "@/utils/sheet";
import { useComputed } from "../useComputed";

export const useRenderCell = () => {
  const {
    selection,
    config,
    headerColsWidth,
    headerRowsHeight,
    scrollPosition,
  } = useStore();
  const { getMergeCellSize } = useComputed();
  const isCellSelected = (cell: CellData) => {
    if (!selection?.start || !selection?.end) return false;
    const { row, col } = cell;
    const absoluteRowCol = getAbsoluteSelection(selection);
    const { r1, r2, c1, c2 } = absoluteRowCol;
    return row >= r1 && row <= r2 && col >= c1 && col <= c2;
  };
  // 单元格绘制函数
  const renderCell = (
    ctx: CanvasRenderingContext2D,
    options: {
      rowIndex: number;
      colIndex: number;
      x: number;
      y: number;
      cell: CellData;
      isHeader?: boolean;
      isRow?: boolean;
      selection?: SelectionSheetType;
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
    // 如果是非合并单元格
    if (!cell.mergeParent) {
      // 设置背景颜色
      ctx.fillStyle = cell.style.backgroundColor || config.backgroundColor;
      ctx.fillRect(x + 1, y + 1, cellWidth - 1, cellHeight - 1);
    }

    // 如果是表头，并且当前列在选中范围内
    if ((isHeader || isRow) && selection && selection.start && selection.end) {
      const { c1, c2, r1, r2 } = getAbsoluteSelection(selection);
      if (
        (c1 <= colIndex && colIndex <= c2) ||
        (r1 <= rowIndex && rowIndex <= r2)
      ) {
        // 设置选中高亮颜色
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = config.selectionBackgroundColor;
        ctx.fillRect(x + 1, y + 1, cellWidth - 1, cellHeight - 1);
        ctx.globalAlpha = 1;
      }
    }

    // 判断是否选中，绘制高亮背景
    if (isCellSelected && isCellSelected(cell) && !cell.mergeParent) {
      // console.log(cell.row, cell.col, cellWidth, cellHeight, x, y);
      ctx.save();
      ctx.fillStyle = config.selectionBackgroundColor;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.restore();
    }

    if (cell.mergeSpan) {
      const { c1, r1 } = cell.mergeSpan;
      const x = getLeft(c1, headerColsWidth, scrollPosition);
      const y = getTop(r1, headerRowsHeight, scrollPosition);
      ctx.strokeStyle = cell.style.borderColor || config.borderColor;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
    }
    // 只有没有合并单元格时才绘制网格
    if (!(cell.mergeSpan || cell.mergeParent)) {
      // 绘制网格
      ctx.strokeStyle = cell.style.borderColor || config.borderColor;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
    }
    // 如果是被动合并单元格，不绘制文本
    if (cell.mergeParent) {
      return;
    }
    // 设置字体样式
    const fontWeight = cell.style.fontWeight || "normal";
    const fontStyle = cell.style.fontStyle || "normal";
    const fontSize = cell.style.fontSize || config.fontSize || 14;
    let color = cell.style.color || config.color || "#000000";
    if (cell.readOnly)
      color =
        config.readOnlyColor || cell.style.color || config.color || "#000000";
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    ctx.fillStyle = color;
    if (cellWidth > 30) {
      // 设置剪裁区域
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 8, y, cellWidth, cellHeight);
      ctx.clip();
    }
    // 设置文本对齐
    ctx.textAlign = (cell.style.textAlign as CanvasTextAlign) || "left";
    ctx.textBaseline = "middle";
    // 计算文本位置
    let textX = cellWidth > 30 ? x + 6 : x;
    if (ctx.textAlign === "center") textX = x + cellWidth / 2;
    if (ctx.textAlign === "right") textX = x + cellWidth - 5;
    if (cell.readOnly) {
      const textY = y + cellHeight / 2;
      ctx.fillText(cell.value, textX, textY);
    } else {
      const contents = cell.value.split("\n");
      for (let i = 0; i < contents.length; i++) {
        const text = contents[i];
        const textMetrics = ctx.measureText(text);
        const textY = i * 7 + y + 15 + i * fontSize;
        ctx.fillText(text, textX, textY);
        const textDecoration = cell.style.textDecoration || "none";
        // 绘制删除线
        if (textDecoration.includes("line-through")) {
          const lineY = textY - 1;
          let lineStartX = textX;
          let lineEndX = textX;
          if (ctx.textAlign === "left" || !ctx.textAlign) {
            lineStartX = textX;
            lineEndX = textX + textMetrics.width;
          } else if (ctx.textAlign === "center") {
            lineStartX = textX - textMetrics.width / 2;
            lineEndX = textX + textMetrics.width / 2;
          } else if (ctx.textAlign === "right") {
            lineStartX = textX - textMetrics.width;
            lineEndX = textX;
          }
          ctx.save();
          ctx.strokeStyle = cell.style.color || "#000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineY);
          ctx.lineTo(lineEndX, lineY);
          ctx.stroke();
          ctx.restore();
        }
        // 绘制下划线
        if (textDecoration.includes("underline")) {
          const lineY = textY + fontSize / 2 - 2;
          let lineStartX = textX;
          let lineEndX = textX;
          if (ctx.textAlign === "left" || !ctx.textAlign) {
            lineStartX = textX;
            lineEndX = textX + textMetrics.width;
          } else if (ctx.textAlign === "center") {
            lineStartX = textX - textMetrics.width / 2;
            lineEndX = textX + textMetrics.width / 2;
          } else if (ctx.textAlign === "right") {
            lineStartX = textX - textMetrics.width;
            lineEndX = textX;
          }
          ctx.save();
          ctx.strokeStyle = cell.style.color || "#000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineY);
          ctx.lineTo(lineEndX, lineY);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    ctx.restore();
  };
  return {
    renderCell,
  };
};
