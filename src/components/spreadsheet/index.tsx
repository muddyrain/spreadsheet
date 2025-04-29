import React, { useState } from "react";
import {
  TableData,
  SpreadsheetConfig,
  SpreadsheetType,
  SelectionSheetType,
} from "../../types/sheet";
import _ from "lodash";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { SpreadsheetContext } from "./context";
import Spreadsheet from "./Spreadsheet";
import { getSystemInfo } from "@/utils";

const RootSpreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType;
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const {
    config,
    setEditingCell,
    selectedCell,
    setSelectedCell,
    data,
    setData,
    editingCell,
    currentCell,
    updater,
    forceUpdate,
    getCurrentCell,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = props.spreadsheet ?? useSpreadsheet(_config);
  const [zoomSize, setZoomSize] = useState<number>(1);
  const [headerColsWidth, setHeaderColsWidth] = useState<number[]>([]);
  const [headerRowsHeight, setHeaderRowsHeight] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState<SelectionSheetType>({
    start: null,
    end: null,
  });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [currentSideLineIndex, setCurrentSideLineIndex] = useState([-1, -1]);
  const [currentSideLinePosition, setCurrentSideLinePosition] = useState([
    -1, -1,
  ]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [sideLineMode, setSideLineMode] = useState<"row" | "col" | null>(null);
  const { isMac, isWindows } = getSystemInfo();

  return (
    <SpreadsheetContext.Provider
      value={{
        data,
        setData,
        config,
        currentCell,
        updater,
        currentCtrlKey: isMac ? "⌘" : isWindows ? "Ctrl" : "Ctrl",
        setUpdater: forceUpdate,
        zoomSize,
        setZoomSize: (_size) => {
          const size = Number(parseFloat(_size.toString()).toFixed(1));
          if (size >= 2) {
            setZoomSize(2);
            return;
          }
          if (size <= 0.5) {
            setZoomSize(0.5);
            return;
          }
          setZoomSize(size);
        },
        isFocused,
        setIsFocused,
        isMouseDown,
        setIsMouseDown,
        selection,
        setSelection,
        headerColsWidth,
        setHeaderColsWidth,
        headerRowsHeight,
        setHeaderRowsHeight,
        scrollPosition,
        setScrollPosition,
        selectedCell,
        setSelectedCell,
        editingCell,
        setEditingCell,
        currentSideLineIndex,
        setCurrentSideLineIndex,
        currentSideLinePosition,
        setCurrentSideLinePosition,
        sideLineMode,
        setSideLineMode,
        getCurrentCell,
      }}
    >
      <Spreadsheet onChange={onChange} />
    </SpreadsheetContext.Provider>
  );
};

export default RootSpreadsheet;
