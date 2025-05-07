import {
  EditingCell,
  PositionType,
  Sheet,
  SheetCellSettingsConfig,
} from "@/types/sheet";
import React from "react";
import {
  TableData,
  SpreadsheetConfig,
  SelectionSheetType,
  CellData,
} from "../../types/sheet";

export const SpreadsheetContext = React.createContext<
  | {
      sheets: Sheet[];
      activeSheetId: string;
      setActiveSheetId: (activeSheetId: string) => void;
      data: TableData;
      setData: React.Dispatch<React.SetStateAction<TableData>>;
      config: Required<SpreadsheetConfig>;
      currentCell: CellData | null;
      currentCtrlKey: string;
      updater: number;
      createNewSheet: () => void;
      deleteSheet: (id: string) => void;
      createCopySheet: (id: string) => void;
      setUpdater: () => void;
      zoomSize: number;
      setZoomSize: React.Dispatch<React.SetStateAction<number>>;
      isFocused: boolean;
      setIsFocused: (isFocused: boolean) => void;
      isMouseDown: boolean;
      setIsMouseDown: (isFocused: boolean) => void;
      containerWidth: number;
      setContainerWidth: React.Dispatch<React.SetStateAction<number>>;
      containerHeight: number;
      setContainerHeight: React.Dispatch<React.SetStateAction<number>>;
      selection: SelectionSheetType | null;
      setSelection: React.Dispatch<
        React.SetStateAction<SelectionSheetType | null>
      >;
      headerColsWidth: number[];
      setHeaderColsWidth: React.Dispatch<React.SetStateAction<number[]>>;
      headerRowsHeight: number[];
      setHeaderRowsHeight: React.Dispatch<React.SetStateAction<number[]>>;
      scrollPosition: PositionType;
      setScrollPosition: React.Dispatch<React.SetStateAction<PositionType>>;
      selectedCell: CellData | null;
      setSelectedCell: React.Dispatch<React.SetStateAction<CellData | null>>;
      editingCell: EditingCell;
      setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
      currentSideLineIndex: number[];
      setCurrentSideLineIndex: React.Dispatch<React.SetStateAction<number[]>>;
      currentSideLinePosition: number[];
      setCurrentSideLinePosition: React.Dispatch<
        React.SetStateAction<number[]>
      >;
      sheetCellSettingsConfig: SheetCellSettingsConfig;
      setSheetCellSettingsConfig: React.Dispatch<
        React.SetStateAction<SheetCellSettingsConfig>
      >;
      sideLineMode: "row" | "col" | null;
      setSideLineMode: React.Dispatch<
        React.SetStateAction<"row" | "col" | null>
      >;
      getCurrentCell: (row: number, col: number) => CellData | null;
    }
  | undefined
>(undefined);
