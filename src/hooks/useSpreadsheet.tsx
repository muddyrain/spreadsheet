import {
  CellData,
  Sheet,
  SpreadsheetConfig,
  SpreadsheetType,
} from "@/types/sheet";
import { generateUUID } from "@/utils";
import { createInitialData } from "@/utils/sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useSpreadsheet = (
  _config?: SpreadsheetConfig,
): SpreadsheetType => {
  const isInitialized = useRef(false);
  const config: Required<SpreadsheetConfig> = useMemo(() => {
    return {
      rows: 200,
      cols: 26,
      fontSize: 14,
      fixedColWidth: 50,
      width: 100,
      height: 30,
      selectionBorderColor: "#3C70FF",
      selectionBackgroundColor: "#EBF0FF",
      readOnlyBackgroundColor: "#F2F2F2",
      readOnlyBorderColor: "#CCCCCC",
      readOnlyColor: "#000000",
      borderColor: "#DFDFDF",
      backgroundColor: "#FFFFFF",
      color: "#000000",
      ..._config,
    };
  }, [_config]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const createNewSheet = useCallback(() => {
    const newSheet: Sheet = {
      data: createInitialData(config, config.rows, config.cols),
      id: generateUUID(),
      name: `Sheet`,
      selection: null,
      currentCell: null,
      selectedCell: null,
      editingCell: null,
      scrollPosition: { x: 0, y: 0 },
      headerColsWidth: [
        config.fixedColWidth,
        ...Array.from({ length: config.cols }).map((_) => {
          return config.width;
        }),
      ],
      headerRowsHeight: [
        config.height,
        ...Array.from({ length: config.rows }).map((_) => {
          return config.height;
        }),
      ],
    };
    setSheets((_sheets) => {
      if (_sheets.length === 0) {
        return [newSheet];
      } else {
        return [..._sheets, newSheet];
      }
    });
    setActiveSheetId(newSheet.id);
    return newSheet;
  }, [config]); // 只依赖 config
  const [activeSheetId, setActiveSheetId] = useState("");
  const [updater, setUpdater] = useState(+new Date());
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
      createNewSheet();
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

  const currentCell: CellData | null = useMemo(() => {
    if (!sheets?.length) return null;
    const targetSheet = sheets.find((sheet) => sheet.id === activeSheetId);
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
  }, [sheets, activeSheetId, getCurrentCell]);
  const currentSheet = useMemo(() => {
    if (!sheets?.length) return null;
    const sheet = sheets.find((sheet) => sheet.id === activeSheetId);
    return sheet || null;
  }, [sheets, activeSheetId]);
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
    setCurrentSheet,
  };
  window.$sheet = $sheet;
  return $sheet;
};
