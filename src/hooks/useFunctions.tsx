import { useCallback, useMemo, useRef } from "react";
import { useStore } from "./useStore";
import { useComputed } from "./useComputed";
import { getSmartBorderColor } from "@/utils/color";
import { ptToPx } from "@/utils";
import { useDom } from "./useDom";
import { createDefaultCell, generateColName } from "@/utils/sheet";
import { getAttrFromHtml } from "@/utils/dom";
import {
  DATA_ID,
  DATA_OPERATION_TYPE,
  DATA_SELECTION_RANGE,
} from "@/constant/dom";
import { AlignType } from "@/types/sheet";
import { produce } from "immer";

export const useFunctions = () => {
  const {
    config,
    data,
    selection,
    cutSelection,
    selectedCell,
    headerRowsHeight,
    currentSheet,
    setSelection,
    setData,
    setCutSelection,
    setHeaderRowsHeight,
  } = useStore();
  const { getDefaultCellStyle } = useComputed();
  const { toHtmlTable, parseHtmlTable, parseSelectionRange } = useDom();
  const lastPasteHTMLString = useRef<string>("");
  const startRow = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.min(selection.start.row, selection.end.row);
  }, [selection]);
  const endRow = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.max(selection.start.row, selection.end.row);
  }, [selection]);
  const startCol = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.min(selection.start.col, selection.end.col);
  }, [selection]);
  const endCol = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.max(selection.start.col, selection.end.col);
  }, [selection]);
  const handleCopyText = useCallback(() => {
    if (!selection) return "";
    if (selection.start && selection.end) {
      let text = "";
      for (let i = startRow; i <= endRow; i++) {
        const row = [];
        for (let j = startCol; j <= endCol; j++) {
          if (!data[i][j]) continue;
          row.push(data[i][j].value ?? "");
        }
        text += row.join("\t") + (i < endRow ? "\n" : "");
      }
      return text;
    }
    return "";
  }, [data, endCol, endRow, selection, startCol, startRow]);
  const handleCopy = useCallback(() => {
    if (!selection) return;
    if (selection.start && selection.end) {
      const tableString = toHtmlTable(data, startRow, endRow, startCol, endCol);
      const text = handleCopyText();
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([tableString], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      navigator.clipboard.write([clipboardItem]);
    }
  }, [
    data,
    endCol,
    endRow,
    selection,
    startCol,
    startRow,
    toHtmlTable,
    handleCopyText,
  ]);
  const handlePasteText = useCallback(
    (text?: string) => {
      if (!selection || !selectedCell) return;
      const handlePaseText = (text: string) => {
        const rows = text.split("\n");
        const cols = rows[0].split("\t");
        const startRow = selection.start?.row ?? selectedCell.row;
        const startCol = selection.start?.col ?? selectedCell.col;
        const endRow = Math.min(startRow + rows.length - 1, data.length - 1);
        const endCol = Math.min(startCol + cols.length - 1, data[0].length - 1);
        setData((data) => {
          for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
              if (!data[i][j]) continue;
              data[i][j].value =
                rows[i - startRow]?.split("\t")[j - startCol] ?? "";
            }
          }
          return [...data];
        });
      };
      if (text) {
        handlePaseText(text);
        return;
      }
      navigator.clipboard.readText().then((text) => {
        handlePaseText(text);
      });
    },
    [data, selectedCell, selection, setData],
  );
  const handlePaste = useCallback(
    (isPasteContent: boolean = true) => {
      if (!selection || !selectedCell) return;
      navigator.clipboard.read().then(async (items) => {
        let htmlHandled = false;
        for (const item of items) {
          if (item.types.includes("text/html")) {
            const blob = await item.getType("text/html");
            const html = await blob.text();
            if (html === lastPasteHTMLString.current) return;
            // 选区范围
            const selectionRangeString = getAttrFromHtml(
              html,
              DATA_SELECTION_RANGE,
            );
            const operationType = getAttrFromHtml(html, DATA_OPERATION_TYPE);

            const tableData = parseHtmlTable(html);
            if (tableData?.length) {
              const startRow = selection.start?.row ?? selectedCell.row;
              const startCol = selection.start?.col ?? selectedCell.col;
              const endRow = startRow + tableData.length - 1;
              const endCol = startCol + tableData[0].length - 1;
              setData(
                produce((data) => {
                  // 代表是剪切数据
                  if (operationType === "cut" && cutSelection) {
                    const range = parseSelectionRange(selectionRangeString);
                    for (
                      let row = range.start.row;
                      row <= range.end.row;
                      row++
                    ) {
                      for (
                        let col = range.start.col;
                        col <= range.end.col;
                        col++
                      ) {
                        data[row][col] = createDefaultCell(config, row, col);
                      }
                    }
                    // 如果是剪切数据，需要将剪切数据的范围设置到剪切板中
                    lastPasteHTMLString.current = html;
                  }
                  for (let i = 0; i < tableData.length; i++) {
                    for (let j = 0; j < tableData[i].length; j++) {
                      if (
                        !data[startRow + i] ||
                        !data[startRow + i][startCol + j]
                      )
                        continue;
                      const tableCell = tableData[i][j];
                      const target = data[startRow + i][startCol + j];
                      if (isPasteContent) {
                        target.value = tableCell.value;
                      }
                      const style = tableCell.style;
                      target.style = {
                        ...getDefaultCellStyle(),
                        fontSize: +style.fontSize || config.fontSize,
                        fontWeight: style.fontWeight || "normal",
                        fontStyle: style.fontStyle,
                        textDecoration: style.textDecoration || "normal",
                        textAlign: (style.textAlign ||
                          config.textAlign) as AlignType,
                        color: style.color || config.color,
                        backgroundColor:
                          style.background ||
                          style.backgroundColor ||
                          config.backgroundColor,
                        borderColor: getSmartBorderColor(
                          style.background ||
                            style.backgroundColor ||
                            config.backgroundColor,
                          config.borderColor,
                        ),
                        wrap: style.whiteSpace === "normal",
                      };
                      if (style.height) {
                        const height = ptToPx(style.height);
                        const rowHeight = headerRowsHeight[startRow + i];
                        if (height > rowHeight) {
                          headerRowsHeight[startRow + i] = height;
                          setHeaderRowsHeight([...headerRowsHeight]);
                        }
                      }
                    }
                  }
                }),
              );
              setSelection({
                start: { row: startRow, col: startCol },
                end: { row: endRow, col: endCol },
              });
              htmlHandled = true;
            }
            break;
          }
        }
        if (!htmlHandled) {
          for (const item of items) {
            if (item.types.includes("text/plain")) {
              const blob = await item.getType("text/plain");
              const text = await blob.text();
              handlePasteText(text);
              break;
            }
          }
        }
      });
    },
    [
      selection,
      cutSelection,
      selectedCell,
      parseHtmlTable,
      parseSelectionRange,
      config,
      setData,
      setSelection,
      getDefaultCellStyle,
      headerRowsHeight,
      setHeaderRowsHeight,
      handlePasteText,
    ],
  );
  const handleClearContent = useCallback(() => {
    if (!selection) return;
    setData((data) => {
      if (selection.start && selection.end) {
        for (let i = startRow; i <= endRow; i++) {
          for (let j = startCol; j <= endCol; j++) {
            data[i][j].value = "";
          }
        }
      }
      return [...data];
    });
  }, [selection, startCol, startRow, endCol, endRow, setData]);
  const handleCut = useCallback(() => {
    if (!selection) return;
    if (selection.start && selection.end) {
      setCutSelection({
        ...selection,
      });
      const startCellAddress =
        generateColName(selection.start.col) + selection.start.row;
      const endCellAddress =
        generateColName(selection.end.col) + selection.end.row;
      const tag = `${DATA_ID}="${currentSheet?.id}" ${DATA_OPERATION_TYPE}="cut" ${DATA_SELECTION_RANGE}="${currentSheet?.name}!${startCellAddress}:${endCellAddress}"`;
      const tableString = toHtmlTable(
        data,
        startRow,
        endRow,
        startCol,
        endCol,
        tag,
      );
      const text = handleCopyText();
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([tableString], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      navigator.clipboard.write([clipboardItem]);
    }
  }, [
    selection,
    setCutSelection,
    currentSheet,
    toHtmlTable,
    data,
    startRow,
    endRow,
    startCol,
    endCol,
    handleCopyText,
  ]);
  return {
    handleCopy,
    handleCopyText,
    handleCut,
    handlePaste,
    handlePasteText,
    handleClearContent,
  };
};
