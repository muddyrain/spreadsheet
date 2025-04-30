import {
  CellData,
  EditingCell,
  SpreadsheetConfig,
  SpreadsheetType,
  TableData,
} from "@/types/sheet";
import { createInitialData } from "@/utils/sheet";
import { useCallback, useMemo, useState } from "react";

export const useSpreadsheet = (
  _config?: SpreadsheetConfig,
): SpreadsheetType => {
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
  const [data, setData] = useState<TableData>(
    createInitialData(config, config.rows, config.cols),
  );
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [updater, setUpdater] = useState(+new Date());

  const clearSelection = () => {
    setSelectedCell(null);
    setEditingCell(null);
  };
  // 获取当前单元格
  const getCurrentCell = useCallback(
    (row: number, col: number) => {
      return data[row][col];
    },
    [data],
  );

  const currentCell: CellData | null = useMemo(() => {
    if (!data?.length) return null;
    const cell = getCurrentCell(
      editingCell?.row ?? selectedCell?.row ?? 0,
      editingCell?.col ?? selectedCell?.col ?? 0,
    );
    if (cell?.readOnly) return null;
    return cell;
  }, [data, editingCell, selectedCell, getCurrentCell]);
  const $sheet = {
    data,
    setData,
    config,
    selectedCell,
    setSelectedCell,
    editingCell,
    setEditingCell,
    updater,
    forceUpdate: () => setUpdater(+new Date()),
    clearSelection,
    currentCell,
    getCurrentCell,
  };
  window.$sheet = $sheet;
  return $sheet;
};
