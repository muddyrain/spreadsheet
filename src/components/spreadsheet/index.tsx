import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  TableData,
  SpreadsheetConfig,
  SpreadsheetType,
  SheetCellSettingsConfig,
  DeltaItem,
} from "../../types/sheet";
import _ from "lodash";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import {
  LocalStoreType,
  SheetStoreActionType,
  SheetStoreType,
  SpreadsheetContext,
} from "./context";
import Spreadsheet from "./Spreadsheet";
import { getSystemInfo } from "@/utils";
import { Toaster } from "sonner";
import { InfoIcon } from "lucide-react";
import { TooltipProvider } from "../ui/tooltip/tooltip";
import { useSetState } from "@/hooks/useSetState";
import { getTableDiffs } from "@/utils/sheet";

const RootSpreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType;
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const [deltas, setDeltas] = useState<DeltaItem[]>([]);
  const [deltaIndex, setDeltaIndex] = useState(-1);
  const isFocused = useRef(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sheet = props.spreadsheet ?? useSpreadsheet(_config);
  const [sheetCellSettingsConfig, setSheetCellSettingsConfig] =
    useState<SheetCellSettingsConfig>({
      isAnchorMergePoint: false,
    });
  const localState = useLocalState();
  const { state: sheetState, actions: sheetActions } = useSheetStore(sheet);
  const { isMac, isWindows } = getSystemInfo();
  const { currentSheet } = sheet;
  const addDelta: SheetStoreActionType["addDelta"] = useCallback(
    (_originData) => {
      // 深拷贝后再比较，避免引用复用导致 isEqual 失效
      const oldData = _.cloneDeep(_originData);
      const newData = _.cloneDeep(currentSheet?.data || []);
      // 数据全量对比，完全一致则不更新
      if (_.isEqual(newData, oldData)) {
        return;
      }
      const { originData, currentData } = getTableDiffs(oldData, newData);
      const delta: DeltaItem = {
        timestamp: Date.now(),
        sheetId: currentSheet?.id || "",
        originData,
        currentData,
      };
      let index = Math.min(deltaIndex + 1, deltas.length);
      // 把 deltaIndex 后的数据全部移除
      const newDeltas = deltas.slice(0, index);
      if (newDeltas.length >= 5) {
        newDeltas.shift();
        index -= 1;
      }
      newDeltas.push(delta);
      setDeltaIndex(index);
      setDeltas(newDeltas);
    },
    [currentSheet, deltas, deltaIndex, setDeltaIndex],
  );
  const contextValue = useMemo(() => {
    return {
      ...localState,
      ...sheet,
      ...sheetState,
      ...sheetActions,
      deltas,
      setDeltas,
      deltaIndex,
      setDeltaIndex,
      addDelta,
      currentCtrlKey: isMac ? "⌘" : isWindows ? "Ctrl" : "Ctrl",
      setUpdater: sheet.forceUpdate,
      sheetCellSettingsConfig,
      setSheetCellSettingsConfig,
      getCurrentCell: sheet.getCurrentCell,
      isFocused,
    };
  }, [
    addDelta,
    deltaIndex,
    deltas,
    isMac,
    isWindows,
    localState,
    sheet,
    sheetActions,
    sheetCellSettingsConfig,
    sheetState,
  ]);
  return (
    <SpreadsheetContext.Provider value={contextValue}>
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
const useSheetStore = (sheet: SpreadsheetType) => {
  const { currentSheet, setCurrentSheet } = sheet;
  const setZoomSize = useCallback(
    (_size: number) => {
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
    [setCurrentSheet],
  );
  const setData: SheetStoreActionType["setData"] = useCallback(
    (data) => {
      if (typeof data === "function") {
        data = data(currentSheet?.data || []);
      }
      // 深拷贝后再比较，避免引用复用导致 isEqual 失效
      const oldData = _.cloneDeep(currentSheet?.data);
      const newData = _.cloneDeep(data);
      // 数据全量对比，完全一致则不更新
      if (_.isEqual(newData, oldData)) {
        return;
      }
      setCurrentSheet("cutSelection", null);
      setCurrentSheet("data", data);
    },
    [currentSheet, setCurrentSheet],
  );
  const setSelection: SheetStoreActionType["setSelection"] = useCallback(
    (selection) => {
      if (typeof selection === "function") {
        selection = selection(currentSheet?.selection || null);
      }
      setCurrentSheet("selection", selection);
    },
    [currentSheet, setCurrentSheet],
  );
  const setCutSelection: SheetStoreActionType["setCutSelection"] = useCallback(
    (cutSelection) => {
      if (typeof cutSelection === "function") {
        cutSelection = cutSelection(currentSheet?.cutSelection || null);
      }
      setCurrentSheet("cutSelection", cutSelection);
    },
    [currentSheet, setCurrentSheet],
  );
  const setHeaderColsWidth: SheetStoreActionType["setHeaderColsWidth"] =
    useCallback(
      (headerColsWidth) => {
        if (typeof headerColsWidth === "function") {
          headerColsWidth = headerColsWidth(
            currentSheet?.headerColsWidth || [],
          );
        }
        setCurrentSheet("headerColsWidth", headerColsWidth);
      },
      [currentSheet, setCurrentSheet],
    );
  const setHeaderRowsHeight: SheetStoreActionType["setHeaderRowsHeight"] =
    useCallback(
      (headerRowsHeight) => {
        if (typeof headerRowsHeight === "function") {
          headerRowsHeight = headerRowsHeight(
            currentSheet?.headerRowsHeight || [],
          );
        }
        setCurrentSheet("headerRowsHeight", headerRowsHeight);
      },
      [currentSheet, setCurrentSheet],
    );
  const setScrollPosition: SheetStoreActionType["setScrollPosition"] =
    useCallback(
      (scrollPosition) => {
        if (typeof scrollPosition === "function") {
          scrollPosition = scrollPosition(
            currentSheet?.scrollPosition || { x: 0, y: 0 },
          );
        }
        if (!_.isEqual(scrollPosition, currentSheet?.scrollPosition))
          setCurrentSheet("scrollPosition", scrollPosition);
      },
      [currentSheet, setCurrentSheet],
    );
  const setSelectedCell: SheetStoreActionType["setSelectedCell"] = useCallback(
    (selectedCell) => {
      if (typeof selectedCell === "function") {
        selectedCell = selectedCell(currentSheet?.selectedCell || null);
      }
      setCurrentSheet("selectedCell", selectedCell);
    },
    [currentSheet, setCurrentSheet],
  );
  const setEditingCell: SheetStoreActionType["setEditingCell"] = useCallback(
    (editingCell) => {
      if (typeof editingCell === "function") {
        editingCell = editingCell(currentSheet?.editingCell || null);
      }
      setCurrentSheet("editingCell", editingCell);
    },
    [currentSheet, setCurrentSheet],
  );
  const state: SheetStoreType = useMemo(() => {
    return {
      zoomSize: currentSheet?.zoomSize || 1,
      data: currentSheet?.data || [],
      selection: currentSheet?.selection || null,
      cutSelection: currentSheet?.cutSelection || null,
      headerColsWidth: currentSheet?.headerColsWidth || [],
      headerRowsHeight: currentSheet?.headerRowsHeight || [],
      scrollPosition: currentSheet?.scrollPosition || {
        x: 0,
        y: 0,
      },
      selectedCell: currentSheet?.selectedCell || null,
      editingCell: currentSheet?.editingCell || null,
    };
  }, [currentSheet]);
  const actions = useMemo(() => {
    return {
      setZoomSize,
      setData,
      setSelection,
      setCutSelection,
      setHeaderColsWidth,
      setHeaderRowsHeight,
      setScrollPosition,
      setSelectedCell,
      setEditingCell,
    };
  }, [
    setCutSelection,
    setData,
    setEditingCell,
    setHeaderColsWidth,
    setHeaderRowsHeight,
    setScrollPosition,
    setSelectedCell,
    setSelection,
    setZoomSize,
  ]);
  return { state, actions };
};
const useLocalState = () => {
  const initialState: LocalStoreType = {
    currentSideLineIndex: [-1, -1],
    containerWidth: 0,
    containerHeight: 0,
    formatBrushStyles: [],
    cursor: "default",
    isMouseDown: false,
    sideLineMode: null,
    currentSideLinePosition: [-1, -1],
    cellInputActions: null,
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
