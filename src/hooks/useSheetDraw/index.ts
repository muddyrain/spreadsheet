import { useCallback } from "react";
import { DrawConfig, EditingCell, SelectionSheetType } from "@/types/sheet";
import { useDrawCell } from "./useDrawCell";

export const useSheetDraw = (
  drawConfig: DrawConfig & {
    selection: SelectionSheetType | null;
    selectedCell: EditingCell;
  },
) => {
  const drawFunctions = useDrawCell(drawConfig);
  const drawTable = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const {
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
      } = drawFunctions;
      ctx.clearRect(0, 0, drawConfig.wrapperWidth, drawConfig.wrapperHeight);
      ctx.translate(0.5, 0.5);
      // 绘制内容区（非冻结区）单元格
      drawCell(ctx);
      // 绘制所有合并单元格边框
      drawMergeCellBorder(ctx);
      // 绘制剪切当前选中单元格的边框
      drawCtSelectionBorder(ctx);
      // 绘制当前选中单元格的边框
      drawSelectionBorder(ctx);
      // 绘制 当前选中区域列头行头高亮
      drawSelectedCell(ctx);
      // 绘制冻结首列（除左上角交叉单元格）
      drawFrozenCols(ctx);
      // 绘制冻结首行（除左上角交叉单元格）
      drawFrozenRows(ctx);
      // 绘制头部选中区域线
      drawHeaderSelectedAreaLine(ctx);
      // 绘制左上角交叉单元格（冻结区的左上角）
      drawFrozenCrossCell(ctx);
      // 绘制拖拽标准线
      drawDragLine(ctx);
    },
    [drawConfig, drawFunctions],
  );
  return { drawTable };
};
