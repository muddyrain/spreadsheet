import { useCallback } from "react";
import { DrawConfig, EditingCell, SelectionSheetType } from "@/types/sheet";
import { useDrawCell } from "./useDrawCell";
import { useStore } from "../useStore";

export const useSheetDraw = (
  drawConfig: DrawConfig & {
    selection?: SelectionSheetType;
    selectedCell: EditingCell;
  },
) => {
  const drawFunctions = useDrawCell(drawConfig);
  const { config } = useStore();
  const drawTable = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const {
        drawCell,
        drawFrozenCols,
        drawFrozenRows,
        drawFrozenCrossCell,
        drawHighLightCell,
        drawSelectedCell,
        drawDragLine,
        drawSelectedAreaBorder,
      } = drawFunctions;
      ctx.clearRect(0, 0, drawConfig.wrapperWidth, drawConfig.wrapperHeight);
      ctx.translate(0.5, 0.5);

      // 绘制内容区（非冻结区）单元格
      drawCell(ctx);
      // 绘制当前选中单元格 且 没有输入框焦点
      drawHighLightCell(ctx);
      // 绘制 当前选中区域列头行头高亮
      drawSelectedCell(ctx);
      // 绘制冻结首列（除左上角交叉单元格）
      drawFrozenCols(ctx);
      // 绘制冻结首行（除左上角交叉单元格）
      drawFrozenRows(ctx);
      // 绘制选区边框（只绘制在当前可视区域内的部分）
      drawSelectedAreaBorder(ctx);
      // 绘制左上角交叉单元格（冻结区的左上角）
      drawFrozenCrossCell(ctx);
      // 绘制拖拽标准线
      drawDragLine(ctx);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, drawConfig, drawFunctions],
  );
  return { drawTable };
};
