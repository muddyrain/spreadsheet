import {
  CellStyle,
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

export type LocalStoreType = {
  isFocused: boolean;
  currentSideLineIndex: number[];
  containerWidth: number;
  containerHeight: number;
  formatBrushStyles: CellStyle[][];
  cursor: string;
  isMouseDown: boolean;
  sideLineMode: string | null;
  currentSideLinePosition: number[];
};
export const SpreadsheetContext = React.createContext<
  | ({
      sheets: Sheet[];
      activeSheetId: string;
      setActiveSheetId: (activeSheetId: string) => void;
      currentSheet: Sheet | null;
      data: TableData;
      setData: React.Dispatch<React.SetStateAction<TableData>>;
      config: Required<SpreadsheetConfig>;
      currentCell: CellData | null;
      currentCtrlKey: string;
      updater: number;
      createNewSheet: (
        data?: TableData,
        options?: Partial<Exclude<Sheet, "data">>,
      ) => Sheet;
      deleteSheet: (id: string) => void;
      createCopySheet: (id: string) => void;
      setUpdater: () => void;
      selection: SelectionSheetType | null;
      setSelection: React.Dispatch<
        React.SetStateAction<SelectionSheetType | null>
      >;
      cutSelection: SelectionSheetType | null;
      setCutSelection: React.Dispatch<
        React.SetStateAction<SelectionSheetType | null>
      >;
      zoomSize: number;
      setZoomSize: React.Dispatch<React.SetStateAction<number>>;
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
      sheetCellSettingsConfig: SheetCellSettingsConfig;
      setSheetCellSettingsConfig: React.Dispatch<
        React.SetStateAction<SheetCellSettingsConfig>
      >;
      getCurrentCell: (row: number, col: number) => CellData | null;
      dispatch: (
        newState:
          | Partial<LocalStoreType>
          | ((state: LocalStoreType) => Partial<LocalStoreType>),
      ) => void;
    } & LocalStoreType)
  | undefined
>(undefined);
