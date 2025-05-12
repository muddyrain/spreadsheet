import { useCallback } from "react";
import ExcelJS from "exceljs";
import { CellData, Sheet } from "@/types/sheet";
import { useStore } from "./useStore";
import { addressToPosition, generateColName } from "@/utils/sheet";
import { getSmartBorderColor } from "@/utils/color";

export function useImportExcel() {
  const { config, createNewSheet } = useStore();
  const importExcel = useCallback(
    (file: File, options?: { onProgress?: (progress: number) => void }) => {
      return new Promise<Sheet[]>((resolve, reject) => {
        const handler = async () => {
          try {
            options?.onProgress?.(0.05); // 文件读取开始
            const buffer = await file.arrayBuffer();
            options?.onProgress?.(0.15); // 文件读取完成
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            options?.onProgress?.(0.3); // workbook 加载完成
            const totalSheets = workbook.worksheets.length;
            const sheets: Sheet[] = [];
            for (let i = 0; i < totalSheets; i++) {
              const worksheet = workbook.worksheets[i];
              const data: CellData[][] = [];
              const rowsTotal = Math.max(config.rows, worksheet.rowCount);
              const colsTotal = Math.max(config.cols, worksheet.columnCount);
              const rows = (worksheet as unknown as { _rows: ExcelJS.Row[] })
                ._rows;
              for (let i = 0; i < rowsTotal; i++) {
                const row = rows[i];
                const rowIndex = i;
                if (!row) {
                  const emptyRow: CellData[] = [];
                  for (let c = 1; c <= colsTotal; c++) {
                    const address = generateColName(c - 1) + (rowIndex + 1);
                    emptyRow.push({
                      value: "",
                      style: {
                        color: config.color,
                        backgroundColor: config.backgroundColor,
                        borderColor: config.borderColor,
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
                    const address = generateColName(colNumber - 1) + rowIndex;
                    const backgroundColor =
                      cell.fill?.type === "pattern" && cell.fill.fgColor?.argb
                        ? `#${cell.fill.fgColor.argb.slice(2)}`
                        : config.backgroundColor;
                    rowData.push({
                      value: master ? "" : (cell.value?.toString() ?? ""),
                      style: {
                        fontWeight: cell.font?.bold ? "bold" : undefined,
                        fontStyle: cell.font?.italic ? "italic" : undefined,
                        textDecoration: cell.font?.underline
                          ? "underline"
                          : "normal",
                        color: cell.font?.color?.argb
                          ? `#${cell.font.color.argb.slice(2)}`
                          : config.color,
                        backgroundColor,
                        borderColor: getSmartBorderColor(
                          backgroundColor,
                          config.borderColor,
                        ),
                      },
                      mergeParent: master ? addressToPosition(master) : null,
                      mergeSpan: null,
                      row: row.number,
                      col: colNumber,
                      address,
                    });
                    indexNumber += 1;
                  });
                  // 后列 补充空白单元格
                  while (indexNumber < colsTotal) {
                    const address = generateColName(indexNumber) + rowIndex;
                    rowData.push({
                      value: "",
                      style: {
                        color: config.color,
                        backgroundColor: config.backgroundColor,
                        borderColor: config.borderColor,
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
              const sheet = createNewSheet(data);
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
    [config, createNewSheet],
  );
  return importExcel;
}
