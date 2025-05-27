import {
  CellStyle,
  DeltaItem,
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
import { CellInputActionsType } from "./CellInput";

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
  cellInputActions: CellInputActionsType | null;
};
export type SheetStoreType = {
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
  cutSelection: SelectionSheetType | null;
  setCutSelection: React.Dispatch<
    React.SetStateAction<SelectionSheetType | null>
  >;
  editingCell: EditingCell;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
  selection: SelectionSheetType | null;
  setSelection: React.Dispatch<React.SetStateAction<SelectionSheetType | null>>;
  data: TableData;
  setData: React.Dispatch<React.SetStateAction<TableData>>;
};
export const SpreadsheetContext = React.createContext<
  | ({
      sheets: Sheet[];
      activeSheetId: string;
      setActiveSheetId: (activeSheetId: string) => void;
      currentSheet: Sheet | null;
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
      deltas: DeltaItem[];
      setDeltas: React.Dispatch<React.SetStateAction<DeltaItem[]>>;
      getCurrentCell: (row: number, col: number) => CellData | null;
      sheetCellSettingsConfig: SheetCellSettingsConfig;
      setSheetCellSettingsConfig: React.Dispatch<
        React.SetStateAction<SheetCellSettingsConfig>
      >;
      dispatch: (
        newState:
          | Partial<LocalStoreType>
          | ((state: LocalStoreType) => Partial<LocalStoreType>),
      ) => void;
    } & LocalStoreType &
      SheetStoreType)
  | undefined
>(undefined);
