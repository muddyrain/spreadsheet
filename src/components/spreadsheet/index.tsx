import React, { useMemo, useState } from "react";
import {
  TableData,
  SpreadsheetConfig,
  SpreadsheetType,
  SheetCellSettingsConfig,
} from "../../types/sheet";
import _ from "lodash";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { LocalStoreType, SpreadsheetContext } from "./context";
import Spreadsheet from "./Spreadsheet";
import { getSystemInfo } from "@/utils";
import { Toaster } from "sonner";
import { InfoIcon } from "lucide-react";
import { TooltipProvider } from "../ui/tooltip/tooltip";
import { useSetState } from "@/hooks/useSetState";

const RootSpreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType;
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const {
    config,
    currentSheet,
    updater,
    currentCell,
    sheets,
    activeSheetId,
    forceUpdate,
    setActiveSheetId,
    getCurrentCell,
    setCurrentSheet,
    createNewSheet,
    createCopySheet,
    deleteSheet,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = props.spreadsheet ?? useSpreadsheet(_config);
  const [sheetCellSettingsConfig, setSheetCellSettingsConfig] =
    useState<SheetCellSettingsConfig>({
      isAnchorMergePoint: false,
    });
  const localState = useLocalState();
  const { isMac, isWindows } = getSystemInfo();
  return (
    <SpreadsheetContext.Provider
      value={{
        ...localState,
        sheets,
        activeSheetId,
        setActiveSheetId,
        currentSheet,
        config,
        currentCell,
        updater,
        createNewSheet,
        createCopySheet,
        deleteSheet,
        currentCtrlKey: isMac ? "⌘" : isWindows ? "Ctrl" : "Ctrl",
        setUpdater: forceUpdate,
        zoomSize: currentSheet?.zoomSize || 1,
        setZoomSize: (_size) => {
          const size = Number(parseFloat(_size.toString()).toFixed(1));
          if (size >= 2) {
            setCurrentSheet("zoomSize", 2);
            return;
          }
          if (size <= 0.5) {
            setCurrentSheet("zoomSize", 0.5);
            return;
          }
          setCurrentSheet("zoomSize", size);
        },
        data: currentSheet?.data || [],
        setData: (data) => {
          if (typeof data === "function") {
            data = data(currentSheet?.data || []);
          }
          setCurrentSheet("cutSelection", null);
          setCurrentSheet("data", data);
        },
        selection: currentSheet?.selection || null,
        setSelection(selection) {
          if (typeof selection === "function") {
            selection = selection(currentSheet?.selection || null);
          }
          setCurrentSheet("selection", selection);
        },
        cutSelection: currentSheet?.cutSelection || null,
        setCutSelection(cutSelection) {
          if (typeof cutSelection === "function") {
            cutSelection = cutSelection(currentSheet?.cutSelection || null);
          }
          setCurrentSheet("cutSelection", cutSelection);
        },
        headerColsWidth: currentSheet?.headerColsWidth || [],
        setHeaderColsWidth(headerColsWidth) {
          if (typeof headerColsWidth === "function") {
            headerColsWidth = headerColsWidth(
              currentSheet?.headerColsWidth || [],
            );
          }
          setCurrentSheet("headerColsWidth", headerColsWidth);
        },
        headerRowsHeight: currentSheet?.headerRowsHeight || [],
        setHeaderRowsHeight(headerRowsHeight) {
          if (typeof headerRowsHeight === "function") {
            headerRowsHeight = headerRowsHeight(
              currentSheet?.headerRowsHeight || [],
            );
          }
          setCurrentSheet("headerRowsHeight", headerRowsHeight);
        },
        scrollPosition: currentSheet?.scrollPosition || {
          x: 0,
          y: 0,
        },
        setScrollPosition(scrollPosition) {
          if (typeof scrollPosition === "function") {
            scrollPosition = scrollPosition(
              currentSheet?.scrollPosition || { x: 0, y: 0 },
            );
          }
          if (!_.isEqual(scrollPosition, currentSheet?.scrollPosition))
            setCurrentSheet("scrollPosition", scrollPosition);
        },
        selectedCell: currentSheet?.selectedCell || null,
        setSelectedCell(selectedCell) {
          if (typeof selectedCell === "function") {
            selectedCell = selectedCell(currentSheet?.selectedCell || null);
          }
          setCurrentSheet("selectedCell", selectedCell);
        },
        editingCell: currentSheet?.editingCell || null,
        setEditingCell(editingCell) {
          if (typeof editingCell === "function") {
            editingCell = editingCell(currentSheet?.editingCell || null);
          }
          setCurrentSheet("editingCell", editingCell);
        },
        sheetCellSettingsConfig,
        setSheetCellSettingsConfig,
        getCurrentCell,
      }}
    >
      <Toaster
        position="top-center"
        icons={{
          info: <InfoIcon size={18} />,
        }}
      />
      <TooltipProvider>
        <Spreadsheet onChange={onChange} />
      </TooltipProvider>
    </SpreadsheetContext.Provider>
  );
};

const useLocalState = () => {
  const initialState: LocalStoreType = {
    isFocused: false,
    currentSideLineIndex: [-1, -1],
    containerWidth: 0,
    containerHeight: 0,
    formatBrushStyles: [],
    cursor: "default",
    isMouseDown: false,
    sideLineMode: null,
    currentSideLinePosition: [-1, -1],
  };
  const [state, dispatch] = useSetState(initialState);
  const localState = useMemo(() => {
    return {
      ...state,
      dispatch,
    };
  }, [state, dispatch]);

  return localState;
};
export default RootSpreadsheet;
