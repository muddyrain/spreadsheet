import { useCallback } from "react";
import ExcelJS from "exceljs";
import { AlignType, CellData, Sheet } from "@/types/sheet";
import { useStore } from "./useStore";
import { addressToPosition, generateColName } from "@/utils/sheet";
import { applyTint, getSmartBorderColor } from "@/utils/color";
import { getAppName } from "@/utils";
import { WPS_THEME_COLOR_CONFIG } from "@/constant/colors/wps_colors";
import { MICRO_THEME_COLOR_CONFIG } from "@/constant/colors/micro_colors";
import { useComputed } from "./useComputed";

export function useImportExcel() {
  const { config, createNewSheet } = useStore();
  const { getDefaultCellStyle } = useComputed();
  const getColor = useCallback(
    (
      colorType: "background" | "text",
      appName: string | null,
      cell: ExcelJS.Cell,
    ): string => {
      let color_config = [] as { theme: number; color: string }[];
      if (appName?.includes("WPS")) {
        color_config = WPS_THEME_COLOR_CONFIG;
      } else if (appName?.includes("Excel")) {
        color_config = MICRO_THEME_COLOR_CONFIG;
      }

      let returnColor = "";
      if (cell.fill?.type === "pattern" && colorType === "background") {
        returnColor = cell.fill.fgColor?.argb || "";
      }
      if (cell.font?.color?.argb && colorType === "text") {
        returnColor = cell.font?.color?.argb || "";
      }
      let theme = -1;
      let tint = 1;
      if (colorType === "background" && cell.fill?.type === "pattern") {
        theme = cell.fill.fgColor?.theme as number;
        tint = (cell.fill.fgColor as { tint: number })?.tint;
      }
      if (colorType === "text") {
        theme = cell.font?.color?.theme as number;
        tint = (cell.font?.color as { tint: number })?.tint;
      }
      if (theme >= 0) {
        const color = color_config.find((item) => item.theme === theme);
        if (color) {
          if (tint) {
            returnColor = applyTint(color.color, tint);
          } else {
            returnColor = color.color;
          }
        }
      }
      if (!returnColor)
        returnColor =
          colorType === "background" ? config.backgroundColor : config.color;
      return returnColor;
    },
    [config],
  );
  const importExcel = useCallback(
    (file: File, options?: { onProgress?: (progress: number) => void }) => {
      return new Promise<Sheet[]>((resolve, reject) => {
        const handler = async () => {
          try {
            options?.onProgress?.(0.05); // 文件读取开始
            const buffer = await file.arrayBuffer();
            options?.onProgress?.(0.15); // 文件读取完成
            const workbook = new ExcelJS.Workbook();
            const appName = await getAppName(buffer);
            await workbook.xlsx.load(buffer);
            options?.onProgress?.(0.3); // workbook 加载完成
            const totalSheets = workbook.worksheets.length;
            const sheets: Sheet[] = [];
            for (let i = 0; i < totalSheets; i++) {
              const worksheet = workbook.worksheets[i];
              const data: CellData[][] = [];
              const rowsTotal = Math.max(config.rows, worksheet.rowCount);
              const colsTotal = Math.max(config.cols, worksheet.columnCount);
              const headerRowsHeight = [config.height];
              const headerColsWidth = [config.fixedColWidth];
              const rows = (worksheet as unknown as { _rows: ExcelJS.Row[] })
                ._rows;
              const cols = (
                worksheet as unknown as { _columns: ExcelJS.Column[] }
              )._columns;
              for (let c = 0; c < colsTotal; c++) {
                const col = cols[c];
                const excelWidth = col?.width || config.width;
                const pixelWidth = Math.floor(excelWidth * 7 + 5);
                headerColsWidth.push(col?.width ? pixelWidth : config.width);
              }
              for (let i = 0; i < rowsTotal; i++) {
                const row = rows[i];
                const rowIndex = i;
                headerRowsHeight.push(row?.height || config.height);
                if (!row) {
                  const emptyRow: CellData[] = [];
                  for (let c = 1; c <= colsTotal; c++) {
                    const address = generateColName(c) + (rowIndex + 1);
                    emptyRow.push({
                      value: "",
                      style: {
                        ...getDefaultCellStyle(),
                      },
                      mergeParent: null,
                      mergeSpan: null,
                      row: rowIndex + 1,
                      col: c,
                      address,
                    });
                  }
                  data.push(emptyRow);
                } else {
                  const rowData: CellData[] = [];
                  let indexNumber = 0;
                  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const master = cell.model?.master;
                    const address = generateColName(colNumber) + (rowIndex + 1);
                    const backgroundColor = getColor(
                      "background",
                      appName,
                      cell,
                    );
                    const textColor = getColor("text", appName, cell);
                    rowData.push({
                      value: master ? "" : (cell.value?.toString() ?? ""),
                      style: {
                        ...getDefaultCellStyle(),
                        fontSize: cell.font?.size || config.fontSize,
                        fontWeight: cell.font?.bold ? "bold" : undefined,
                        fontStyle: cell.font?.italic ? "italic" : undefined,
                        textDecoration: cell.font?.underline
                          ? "underline"
                          : "normal",
                        textAlign: cell.alignment?.horizontal
                          ? (cell.alignment.horizontal as AlignType)
                          : undefined,
                        color: textColor,
                        backgroundColor,
                        borderColor: getSmartBorderColor(
                          backgroundColor,
                          config.borderColor,
                        ),
                        wrap: !!cell.alignment?.wrapText,
                      },
                      mergeParent: master ? addressToPosition(master) : null,
                      mergeSpan: null,
                      row: rowIndex + 1,
                      col: colNumber,
                      address,
                    });
                    indexNumber += 1;
                  });
                  // 后列 补充空白单元格
                  while (indexNumber < colsTotal) {
                    const address =
                      generateColName(indexNumber) + (rowIndex + 1);
                    rowData.push({
                      value: "",
                      style: {
                        ...getDefaultCellStyle(),
                      },
                      mergeParent: null,
                      mergeSpan: null,
                      row: rowIndex + 1,
                      col: indexNumber + 1,
                      address,
                    });
                    indexNumber += 1;
                  }
                  data.push(rowData);
                  if (rowsTotal > 0) {
                    // 多 sheet 进度分配
                    const sheetBase = 0.3 + 0.6 * (i / totalSheets);
                    const sheetStep = 0.6 / totalSheets;
                    options?.onProgress?.(
                      sheetBase + sheetStep * (rowIndex / rowsTotal),
                    );
                  }
                }
              }
              // 统计并设置 mergeSpan
              const mergeMap = new Map<
                string,
                { r1: number; r2: number; c1: number; c2: number }
              >();
              for (let r = 0; r < data.length; r++) {
                for (let c = 0; c < data[r].length; c++) {
                  const cell = data[r][c];
                  if (cell?.mergeParent) {
                    const key = `${cell.mergeParent.row},${cell.mergeParent.col}`;
                    if (!mergeMap.has(key)) {
                      mergeMap.set(key, {
                        r1: r + 1,
                        r2: r + 1,
                        c1: c + 1,
                        c2: c + 1,
                      });
                    } else {
                      const span = mergeMap.get(key)!;
                      span.r1 = Math.min(span.r1, r + 1);
                      span.r2 = Math.max(span.r2, r + 1);
                      span.c1 = Math.min(span.c1, c + 1);
                      span.c2 = Math.max(span.c2, c + 1);
                    }
                  }
                }
              }
              for (const [key, span] of mergeMap.entries()) {
                const [row, col] = key.split(",").map(Number);
                const cell = data[row - 1][col - 1];
                cell.mergeSpan = {
                  r1: span.r1,
                  r2: span.r2,
                  c1: span.c1,
                  c2: span.c2,
                };
              }
              const sheet = createNewSheet(data, {
                headerColsWidth,
                headerRowsHeight,
              });
              sheets.push({
                ...sheet,
                name: worksheet.name,
              });
            }
            options?.onProgress?.(1); // 完成
            resolve(sheets);
          } catch (e) {
            reject(e);
          }
        };
        return handler();
      });
    },
    [config, createNewSheet, getColor, getDefaultCellStyle],
  );
  return importExcel;
}
