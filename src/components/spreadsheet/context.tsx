import { EditingCell, PositionType } from "@/types/sheet";
import React from "react";
import {
  TableData,
  SpreadsheetConfig,
  SelectionSheetType,
  CellData,
} from "../../types/sheet";

export const SpreadsheetContext = React.createContext<
  | {
      data: TableData;
      setData: React.Dispatch<React.SetStateAction<TableData>>;
      config: Required<SpreadsheetConfig>;
      currentCell: CellData | null;
      updater: number;
      setUpdater: () => void;
      isFocused: boolean;
      setIsFocused: (isFocused: boolean) => void;
      isMouseDown: boolean;
      setIsMouseDown: (isFocused: boolean) => void;
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
      currentSideLineIndex: number[];
      setCurrentSideLineIndex: React.Dispatch<React.SetStateAction<number[]>>;
      currentSideLinePosition: number[];
      setCurrentSideLinePosition: React.Dispatch<
        React.SetStateAction<number[]>
      >;
      sideLineMode: "row" | "col" | null;
      setSideLineMode: React.Dispatch<
        React.SetStateAction<"row" | "col" | null>
      >;
      getCurrentCell: (row: number, col: number) => CellData | null;
    }
  | undefined
>(undefined);
