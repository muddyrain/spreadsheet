import { EditingCell, PositionType } from '@/types/sheet';
import React from "react";
import { TableData, SpreadsheetConfig, SelectionSheetType, CellData, } from '../../types/sheet';

export const SpreadsheetContext = React.createContext<{
  data: TableData;
  setData: React.Dispatch<React.SetStateAction<TableData>>;
  config: Required<SpreadsheetConfig>;
  currentCell: CellData | null;
  updater: number;
  setUpdater: () => void;
  isFocused: boolean,
  setIsFocused: (isFocused: boolean) => void;
  selection: SelectionSheetType;
  setSelection: React.Dispatch<React.SetStateAction<SelectionSheetType>>;
  headerColsWidth: number[];
  setHeaderColsWidth: React.Dispatch<React.SetStateAction<number[]>>;
  headerRowsHeight: number[];
  setHeaderRowsHeight: React.Dispatch<React.SetStateAction<number[]>>;
  scrollPosition: PositionType;
  setScrollPosition: React.Dispatch<React.SetStateAction<PositionType>>;
  selectedCell: EditingCell;
  setSelectedCell: React.Dispatch<React.SetStateAction<EditingCell>>;
  editingCell: EditingCell;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell>>;
} | undefined>(undefined)