import {
  CellData,
  Sheet,
  SpreadsheetConfig,
  SpreadsheetType,
  TableData,
} from "@/types/sheet";
import { generateUUID, limitSheetSize } from "@/utils";
import { createInitialData } from "@/utils/sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useSpreadsheet = (
  _config?: SpreadsheetConfig,
): SpreadsheetType => {
  const isInitialized = useRef(false);
  const config: Required<SpreadsheetConfig> = useMemo(() => {
    const { rows, cols } = limitSheetSize(
      _config?.rows || 200,
      _config?.cols || 26,
    );
    return {
      fontSize: 11,
      fixedColWidth: 50,
      scrollAreaPadding: 50,
      width: 100,
      height: 30,
      textAlign: "left",
      selectionBorderColor: "rgba(60, 112, 255, 1)",
      selectionBackgroundColor: "rgba(60, 112, 255, 0.15)",
      readOnlyBackgroundColor: "#F2F2F2",
      readOnlyBorderColor: "#CCCCCC",
      readOnlyColor: "#000000",
      borderColor: "#DFDFDF",
      backgroundColor: "#FFFFFF",
      color: "#000000",
      ..._config,
      rows,
      cols,
    };
  }, [_config]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [updater, setUpdater] = useState(+new Date());
  const [activeSheetId, setActiveSheetId] = useState("");
  const createNewSheet = useCallback(
    (data?: TableData, options: Partial<Exclude<Sheet, "data">> = {}) => {
      const colsTotal = Math.max(config.cols, data?.[0]?.length ?? 0);
      const rowsTotal = Math.max(config.rows, data?.length ?? 0);
      const newSheet: Sheet = {
        data: createInitialData(config, rowsTotal, colsTotal, data),
        id: generateUUID(),
        name: `Sheet` + (sheets.length + 1),
        selection: null,
        currentCell: null,
        selectedCell: null,
        editingCell: null,
        zoomSize: 1,
        scrollPosition: { x: 0, y: 0 },
        headerColsWidth: [
          config.fixedColWidth,
          ...Array.from({ length: colsTotal }).map((_) => {
            return config.width;
          }),
        ],
        headerRowsHeight: [
          config.height,
          ...Array.from({ length: rowsTotal }).map((_) => {
            return config.height;
          }),
        ],
        ...options,
      };
      setSheets((_sheets) => {
        if (_sheets.length === 0) {
          return [newSheet];
        } else {
          return [..._sheets, newSheet];
        }
      });
      return newSheet;
    },
    [config, sheets.length],
  );
  const deleteSheet = useCallback(
    (sheetId: string) => {
      const targetIndex = sheets.findIndex((sheet) => sheet.id === sheetId);
      if (targetIndex === 0) {
        setActiveSheetId(sheets[sheets.length - 1].id);
      } else {
        if (sheets[targetIndex + 1]?.id) {
          setActiveSheetId(sheets[targetIndex + 1].id);
        } else {
          setActiveSheetId(sheets[targetIndex - 1].id);
        }
      }
      setSheets((_sheets) => {
        return _sheets.filter((sheet) => sheet.id !== sheetId);
      });
    },
    [sheets],
  );
  const createCopySheet = useCallback(
    (sheetId: string) => {
      const targetSheet = sheets.find((sheet) => sheet.id === sheetId);
      if (!targetSheet) return;
      const newSheet: Sheet = {
        ...JSON.parse(JSON.stringify(targetSheet)),
        id: generateUUID(),
        name: targetSheet.name + "副本",
        editingCell: null,
      };
      setSheets((_sheets) => {
        return [..._sheets, newSheet];
      });
      setActiveSheetId(newSheet.id);
    },
    [sheets],
  );
  const clearSelection = () => {
    const targetSheet = sheets.find((sheet) => sheet.id === activeSheetId);
    if (targetSheet) {
      targetSheet.selectedCell = null;
      targetSheet.editingCell = null;
    }
    setSheets((_sheets) => [..._sheets]);
  };
  useEffect(() => {
    if (isInitialized.current) return;
    if (!sheets?.length) {
      const sheet = createNewSheet([]);
      setActiveSheetId(sheet.id);
      isInitialized.current = true;
    }
  }, [config, createNewSheet, sheets]);
  // 获取当前单元格
  const getCurrentCell = useCallback(
    (row: number, col: number) => {
      if (!sheets?.length) return null;
      const data = sheets.find((sheet) => sheet.id === activeSheetId)?.data;
      if (!data?.length) return null;
      if (row < 0 || row >= data.length) return null;
      return data[row][col];
    },
    [sheets, activeSheetId],
  );
  const currentSheet = useMemo(() => {
    if (!sheets?.length) return null;
    const sheet = sheets.find((sheet) => sheet.id === activeSheetId);
    return sheet || null;
  }, [sheets, activeSheetId]);
  const currentCell: CellData | null = useMemo(() => {
    if (!sheets?.length) return null;
    const targetSheet = currentSheet;
    const data = targetSheet?.data;
    if (!data?.length) return null;
    const selectedCell = targetSheet?.selectedCell;
    if (!selectedCell) return null;
    const editingCell = targetSheet?.editingCell;
    const cell = getCurrentCell(
      editingCell?.row ?? selectedCell?.row ?? 0,
      editingCell?.col ?? selectedCell?.col ?? 0,
    );
    if (cell?.readOnly) return null;
    return cell;
  }, [sheets, currentSheet, getCurrentCell]);
  const setCurrentSheet = useCallback(
    <T extends keyof Sheet>(key: T, value: Sheet[T]) => {
      if (!currentSheet) return;
      const targetSheet = sheets.find((sheet) => sheet.id === activeSheetId);
      if (targetSheet) {
        targetSheet[key] = value;
      }
      setSheets((_sheets) => [..._sheets]);
    },
    [sheets, activeSheetId, currentSheet],
  );
  const $sheet = {
    currentSheet,
    sheets,
    activeSheetId,
    config,
    updater,
    currentCell,
    forceUpdate: () => setUpdater(+new Date()),
    clearSelection,
    getCurrentCell,
    setSheets,
    setActiveSheetId,
    createNewSheet,
    deleteSheet,
    createCopySheet,
    setCurrentSheet,
  };
  window.$sheet = $sheet;
  return $sheet;
};
