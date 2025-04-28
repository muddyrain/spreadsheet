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
  const [zoomSize, setZoomSize] = useState<number>(100);
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
  return (
    <SpreadsheetContext.Provider
      value={{
        data,
        setData,
        config,
        currentCell,
        updater,
        setUpdater: forceUpdate,
        zoomSize,
        setZoomSize,
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
