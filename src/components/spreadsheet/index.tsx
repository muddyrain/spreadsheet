import React, { useState } from "react";
import {
  TableData,
  SpreadsheetConfig,
  SpreadsheetType,
  SheetCellSettingsConfig,
  CellStyle,
} from "../../types/sheet";
import _ from "lodash";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { SpreadsheetContext } from "./context";
import Spreadsheet from "./Spreadsheet";
import { getSystemInfo } from "@/utils";
import { Toaster } from "sonner";
import { InfoIcon } from "lucide-react";
import { TooltipProvider } from "../ui/tooltip/tooltip";

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
  const [formatBrushStyles, setFormatBrushStyles] = useState<CellStyle[][]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [currentSideLineIndex, setCurrentSideLineIndex] = useState([-1, -1]);
  const [cursor, setCursor] = useState("default");
  const [currentSideLinePosition, setCurrentSideLinePosition] = useState([
    -1, -1,
  ]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [sideLineMode, setSideLineMode] = useState<"row" | "col" | null>(null);
  const { isMac, isWindows } = getSystemInfo();
  return (
    <SpreadsheetContext.Provider
      value={{
        sheets,
        activeSheetId,
        setActiveSheetId,
        config,
        currentCell,
        updater,
        createNewSheet,
        createCopySheet,
        deleteSheet,
        cursor,
        setCursor,
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
        isFocused,
        setIsFocused,
        isMouseDown,
        setIsMouseDown,
        containerWidth,
        setContainerWidth,
        containerHeight,
        setContainerHeight,
        data: currentSheet?.data || [],
        setData: (data) => {
          if (typeof data === "function") {
            data = data(currentSheet?.data || []);
          }
          setCurrentSheet("data", data);
        },
        selection: currentSheet?.selection || null,
        setSelection(selection) {
          if (typeof selection === "function") {
            selection = selection(currentSheet?.selection || null);
          }
          setCurrentSheet("selection", selection);
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
        currentSideLineIndex,
        setCurrentSideLineIndex,
        currentSideLinePosition,
        setCurrentSideLinePosition,
        sheetCellSettingsConfig,
        setSheetCellSettingsConfig,
        formatBrushStyles,
        setFormatBrushStyles,
        sideLineMode,
        setSideLineMode,
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

export default RootSpreadsheet;
