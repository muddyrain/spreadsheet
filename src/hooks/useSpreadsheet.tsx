import { EditingCell, SpreadsheetConfig, SpreadsheetType, TableData } from "@/types/sheet";
import { createInitialData } from "@/utils/sheet";
import { useMemo, useState } from "react";

export const useSpreadsheet = (
  _config?: SpreadsheetConfig
): SpreadsheetType => {
  const config: Required<SpreadsheetConfig> = useMemo(() => ({
    rows: 200,
    cols: 26,
    fontSize: 14,
    fixedColWidth: 50,
    width: 100,
    height: 30,
    selectionBorderColor: '#3C70FF',
    selectionBackgroundColor: '#EBF0FF',
    readOnlyBackgroundColor: '#F2F2F2',
    readOnlyBorderColor: '#CCCCCC',
    readOnlyColor: '#000000',
    borderColor: '#DFDFDF',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    ..._config
  }), [_config]);
  const [data, setData] = useState<TableData>(createInitialData(config, config.rows, config.cols));
  const [selectedCell, setSelectedCell] = useState<EditingCell>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [updater, setUpdater] = useState(+ new Date());

  const clearSelection = () => {
    setSelectedCell(null);
    setEditingCell(null);
  };

  const currentCell = useMemo(() => {
    if (!data?.length) return null;
    const cell =
      data[editingCell?.row ?? selectedCell?.row ?? 0][
      editingCell?.col ?? selectedCell?.col ?? 0
      ];
    if (cell?.readOnly) return null;
    return cell
  }, [data, editingCell, selectedCell]);

  return {
    data,
    setData,
    config,
    selectedCell,
    setSelectedCell,
    editingCell,
    setEditingCell,
    updater,
    forceUpdate: () => setUpdater(+ new Date()),
    clearSelection,
    currentCell
  };
}