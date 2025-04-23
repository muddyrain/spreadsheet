import React from "react";
import { TableData, SpreadsheetConfig, SelectionSheetType, CellData, } from '../../types/sheet';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  config: Required<SpreadsheetConfig>;
  currentCell: CellData | null;
  updater: number;
  setUpdater: () => void;
  isFocused: boolean,
  setIsFocused: (isFocused: boolean) => void;
  selection: SelectionSheetType;
  setSelection: React.Dispatch<React.SetStateAction<SelectionSheetType>>;
} | undefined>(undefined)