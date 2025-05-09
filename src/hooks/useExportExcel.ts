import { useCallback } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useStore } from "./useStore";
import { Sheet } from "@/types/sheet";

export function useExportExcel() {
  const { config, sheets } = useStore();
  const px2width = (px: number) => px / 7;
  const px2pt = (px: number) => px * 0.75;
  const createSheet = useCallback(
    (workbook: ExcelJS.Workbook, sheet: Sheet) => {
      const { data, headerColsWidth, headerRowsHeight } = sheet;
      const worksheet = workbook.addWorksheet(sheet.name);
      // 移除fixed列和行
      const newData = data.slice(1).map((row) => row.slice(1));
      // 设置列宽
      worksheet.columns = headerColsWidth.slice(1).map((width, index) => ({
        width: px2width(width),
        key: index.toString(),
      }));
      // 填充数据和样式
      newData.forEach((row, rowIndex) => {
        const excelRow = worksheet.getRow(rowIndex + 1);
        excelRow.height = px2pt(headerRowsHeight[rowIndex + 1]);
        row.forEach((cell, colIndex) => {
          const excelCell = excelRow.getCell(colIndex + 1);
          excelCell.value = cell.value;
          if (cell.style) {
            // 设置粗体
            if (cell.style.fontWeight === "bold")
              excelCell.font = { ...(excelCell.font || {}), bold: true };
            // 设置斜体
            if (cell.style.fontStyle === "italic")
              excelCell.font = { ...(excelCell.font || {}), italic: true };
            // 设置下划线
            if (cell.style.textDecoration?.includes("underline"))
              excelCell.font = { ...(excelCell.font || {}), underline: true };
            // 设置删除线
            if (cell.style.textDecoration?.includes("line-through"))
              excelCell.font = { ...(excelCell.font || {}), strike: true };
            // 设置字体颜色
            if (cell.style.color)
              excelCell.font = {
                ...(excelCell.font || {}),
                color: { argb: cell.style.color.replace("#", "FF") },
              };
            // 设置字体大小
            if (cell.style.fontSize)
              excelCell.font = {
                ...(excelCell.font || {}),
                size: cell.style.fontSize,
              };
            // 填充背景色
            if (cell.style.backgroundColor)
              excelCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: cell.style.backgroundColor.replace("#", "FF"),
                },
              };
            // 设置单元格边框
            const borderColor = (
              cell.style.borderColor || config.borderColor
            ).replace("#", "FF");
            excelCell.border = {
              top: { style: "thin", color: { argb: borderColor } },
              left: { style: "thin", color: { argb: borderColor } },
              bottom: { style: "thin", color: { argb: borderColor } },
              right: { style: "thin", color: { argb: borderColor } },
            };
          }
        });
      });
      // 合并单元格示例
      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell.mergeSpan) {
            worksheet.mergeCells(
              rowIndex,
              colIndex,
              cell.mergeSpan.r2,
              cell.mergeSpan.c2,
            );
          }
        });
      });
    },
    [config],
  );
  const exportExcel = useCallback(
    async (fileName = "表格.xlsx") => {
      const workbook = new ExcelJS.Workbook();
      sheets.forEach((sheet) => {
        createSheet(workbook, sheet);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), fileName);
    },
    [sheets, createSheet],
  );
  return exportExcel;
}
