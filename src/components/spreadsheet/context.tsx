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
  headerColsWidth: number[];
  headerRowsHeight: number[];
  scrollPosition: PositionType;
  selectedCell: CellData | null;
  cutSelection: SelectionSheetType | null;
  editingCell: EditingCell;
  selection: SelectionSheetType | null;
  data: TableData;
};
export type SheetStoreActionType = {
  setZoomSize: (zoomSize: number) => void;
  setHeaderColsWidth: React.Dispatch<React.SetStateAction<number[]>>;
  setHeaderRowsHeight: React.Dispatch<React.SetStateAction<number[]>>;
  setScrollPosition: React.Dispatch<React.SetStateAction<PositionType>>;
  setSelectedCell: React.Dispatch<React.SetStateAction<CellData | null>>;
  setCutSelection: React.Dispatch<
    React.SetStateAction<SelectionSheetType | null>
  >;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
  setSelection: React.Dispatch<React.SetStateAction<SelectionSheetType | null>>;
  setData: React.Dispatch<React.SetStateAction<TableData>>;
  addDelta: (data: TableData) => void;
};
export const SpreadsheetContext = React.createContext<
  | ({
      sheets: Sheet[];
      activeSheetId: string;
      isFocused: React.RefObject<boolean>;
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
      deltaIndex: number;
      setDeltaIndex: React.Dispatch<React.SetStateAction<number>>;
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
      SheetStoreType &
      SheetStoreActionType)
  | undefined
>(undefined);
