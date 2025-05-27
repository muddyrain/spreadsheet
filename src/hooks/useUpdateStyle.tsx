import { useCallback, useMemo, useState } from "react";
import { useExportExcel } from "./useExportExcel";
import { useStore } from "./useStore";
import { CellData, SelectionSheetType } from "@/types/sheet";
import { createDefaultStyle, getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "./useComputed";
import { getSmartBorderColor } from "@/utils/color";
import _ from "lodash";
import { produce } from "immer";
export type ClickType =
  | "save"
  | "undo"
  | "redo"
  | "paint"
  | "eraser"
  | "bold"
  | "italic"
  | "strikethrough"
  | "underline"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "verticalAlignStart"
  | "verticalAlignCenter"
  | "verticalAlignEnd"
  | "merge"
  | "wrap"
  | "export";
export const useUpdateStyle = () => {
  const exportExcel = useExportExcel();
  const {
    config,
    selection,
    selectedCell,
    currentCell,
    sheetCellSettingsConfig,
    formatBrushStyles,
    deltas,
    deltaIndex,
    activeSheetId,
    setActiveSheetId,
    setDeltaIndex,
    setDeltas,
    setData,
    dispatch,
  } = useStore();
  const { getSelectionCells } = useComputed();
  const [selectionCells, setSelectionCells] = useState<CellData[]>([]);
  useMemo(() => {
    if (!selection) {
      return [];
    }
    const _selectionCells = getSelectionCells(selection);
    setSelectionCells(_selectionCells);
  }, [selection, getSelectionCells]);
  const isStyle = useMemo(() => {
    return {
      isBold:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.fontWeight === "bold"),
      isItalic:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.fontStyle === "italic"),
      isLineThrough:
        !!selectionCells?.length &&
        selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("line-through"),
        ),
      isUnderline:
        !!selectionCells?.length &&
        selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("underline"),
        ),
      isMergeCell: !!(
        currentCell &&
        (currentCell.mergeSpan || currentCell.mergeParent)
      ),
      isWrap: !!(currentCell && currentCell.style.wrap),
      isAlignLeft:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.textAlign === "left"),
      isALignCenter:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.textAlign === "center"),
      isALignRight:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.textAlign === "right"),
      isVerticalAlignStart:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.verticalAlign === "start"),
      isVerticalAlignCenter:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.verticalAlign === "center"),
      isVerticalAlignEnd:
        !!selectionCells?.length &&
        selectionCells.every((cell) => cell.style.verticalAlign === "end"),
      isPaint: !!formatBrushStyles.length,
      backgroundColor:
        !!selectionCells?.length && selectionCells[0]?.style.backgroundColor,
      color: !!selectionCells?.length && selectionCells[0]?.style.color,
      isUndo: deltaIndex >= 0,
      isRedo: deltaIndex < deltas.length - 1,
    };
  }, [
    selectionCells,
    currentCell,
    formatBrushStyles.length,
    deltaIndex,
    deltas.length,
  ]);
  const handleUpdater = useCallback(
    (selectionCells: CellData[]) => {
      setData(
        produce((draft) => {
          selectionCells.forEach((cell) => {
            draft[cell.row][cell.col] = {
              ...draft[cell.row][cell.col],
              ...cell,
            };
          });
        }),
      );
    },
    [setData],
  );
  const updateStyle = (type?: ClickType) => {
    let newSelectionCells: CellData[] = [];
    switch (type) {
      case "paint": {
        if (!selection) return;
        const { c1, c2, r1, r2 } = getAbsoluteSelection(selection);
        const rows = r2 - r1 + 1;
        const cols = c2 - c1 + 1;
        const _formatBrushStyles: CellData["style"][][] = [];
        for (let i = 0; i < rows; i++) {
          const rowStyles: CellData["style"][] = [];
          for (let j = 0; j < cols; j++) {
            const cell = selectionCells.find(
              (cell) => cell.row === r1 + i && cell.col === c1 + j,
            );
            rowStyles.push(cell ? { ...cell.style } : {});
          }
          _formatBrushStyles.push(rowStyles);
        }
        dispatch({ formatBrushStyles: _formatBrushStyles });
        break;
      }
      case "eraser": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style = createDefaultStyle(config);
          });
        });
        break;
      }
      case "bold": {
        const isAll = selectionCells.every(
          (cell) => cell.style.fontWeight === "bold",
        );
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            if (isAll) {
              cell.style.fontWeight = "normal";
            } else {
              cell.style.fontWeight = "bold";
            }
          });
        });
        break;
      }
      case "italic": {
        const isAll = selectionCells.every(
          (cell) => cell.style.fontStyle === "italic",
        );
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            if (isAll) {
              cell.style.fontStyle = "normal";
            } else {
              cell.style.fontStyle = "italic";
            }
          });
        });
        break;
      }
      case "strikethrough": {
        const isAll = selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("line-through"),
        );
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            const textDecoration = cell.style.textDecoration?.replace(
              "none",
              "",
            );
            if (isAll) {
              cell.style.textDecoration = cell.style.textDecoration?.replace(
                "line-through",
                "",
              );
            } else {
              cell.style.textDecoration = `line-through ${textDecoration || ""}`;
            }
          });
        });
        break;
      }
      case "underline": {
        const isAll = selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("underline"),
        );
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            if (isAll) {
              cell.style.textDecoration = cell.style.textDecoration?.replace(
                "underline",
                "",
              );
            } else {
              cell.style.textDecoration = `underline ${cell.style.textDecoration || ""}`;
            }
          });
        });
        break;
      }
      case "wrap": {
        const isAll = selectionCells.every((cell) => cell.style.wrap);
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            if (isAll) {
              cell.style.wrap = false;
            } else {
              cell.style.wrap = true;
            }
          });
        });
        break;
      }
      case "alignLeft": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.textAlign = "left";
          });
        });
        break;
      }
      case "alignCenter": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.textAlign = "center";
          });
        });
        break;
      }
      case "alignRight": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.textAlign = "right";
          });
        });
        break;
      }
      case "verticalAlignStart": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.verticalAlign = "start";
          });
        });
        break;
      }
      case "verticalAlignCenter": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.verticalAlign = "center";
          });
        });
        break;
      }
      case "verticalAlignEnd": {
        newSelectionCells = produce(selectionCells, (draft) => {
          draft.forEach((cell) => {
            cell.style.verticalAlign = "end";
          });
        });
        break;
      }
      case "merge": {
        if (!selection) return;
        if (isStyle.isMergeCell) {
          // 取消合并
          const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
          setData(
            produce((draft) => {
              for (let i = r1; i <= r2; i++) {
                for (let j = c1; j <= c2; j++) {
                  draft[i][j].mergeSpan = null;
                  draft[i][j].mergeParent = null;
                }
              }
            }),
          );
        } else {
          const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
          if (r1 === r2 && c1 === c2) return;
          const isAnchorMergePoint = sheetCellSettingsConfig.isAnchorMergePoint;

          setData(
            produce((data) => {
              if (isAnchorMergePoint) {
                const target =
                  data[selectedCell?.row || 0][selectedCell?.col || 0];
                target.mergeSpan = {
                  r1,
                  r2,
                  c1,
                  c2,
                };
              } else {
                const target = data[r1][c1];
                if (target) {
                  target.mergeSpan = {
                    r1,
                    r2,
                    c1,
                    c2,
                  };
                }
              }
              for (let i = r1; i <= r2; i++) {
                for (let j = c1; j <= c2; j++) {
                  if (isAnchorMergePoint) {
                    if (i === selectedCell?.row && j === selectedCell?.col)
                      continue;
                    if (data[i][j].mergeSpan) {
                      data[i][j].mergeSpan = null;
                    }
                    data[i][j].mergeParent = {
                      row: selectedCell?.row || 0,
                      col: selectedCell?.col || 0,
                    };
                  } else {
                    if (i === r1 && j === c1) continue;
                    data[i][j].mergeParent = {
                      row: r1 || 0,
                      col: c1 || 0,
                    };
                  }
                }
              }
            }),
          );
        }
        break;
      }
      case "export": {
        exportExcel();
        return;
      }
      case "undo": {
        const delta = deltas[deltaIndex];
        const sheetId = delta?.sheetId;
        const diffData = delta?.data;
        if (activeSheetId !== sheetId) {
          setActiveSheetId(sheetId);
        }
        // setSelection(delta?.selection);
        setDeltaIndex(deltaIndex - 1);
        deltas.pop();
        setDeltas([...deltas]);
        setData((data) => {
          for (let i = 0; i < diffData.length; i++) {
            const cell = diffData[i];
            if (cell) {
              data[cell.row][cell.col] = {
                ...data[cell.row][cell.col],
                ...cell,
              };
            }
          }
          return [...data];
        });
        return;
      }
    }
    handleUpdater(newSelectionCells);
    return type;
  };
  const handleUpdaterBrush = useCallback(
    (currentSelection: SelectionSheetType | null) => {
      if (!formatBrushStyles.length) return;
      if (!currentSelection) return;
      dispatch({ formatBrushStyles: [] });
      setData(
        produce((data) => {
          const { r1, c1, r2, c2 } = getAbsoluteSelection(currentSelection);
          const rows = r2 - r1 + 1;
          const cols = c2 - c1 + 1;
          const srcRows = formatBrushStyles.length;
          const srcCols = formatBrushStyles[0]?.length || 0;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              const style =
                formatBrushStyles[i % srcRows] &&
                formatBrushStyles[i % srcRows][j % srcCols]
                  ? formatBrushStyles[i % srcRows][j % srcCols]
                  : {};
              if (data[r1 + i][c1 + j]) {
                data[r1 + i][c1 + j].style = {
                  ...data[r1 + i][c1 + j].style,
                  ...style,
                };
              }
            }
          }
        }),
      );
    },
    [formatBrushStyles, setData, dispatch],
  );
  const handleUpdaterColor = useCallback(
    (backgroundType: boolean, value: string) => {
      if (!selectionCells) return;
      const newSelectionCells = produce(selectionCells, (draft) => {
        draft.forEach((cItem) => {
          if (backgroundType) {
            cItem.style.backgroundColor = value || "";
            if (value === config.backgroundColor) {
              cItem.style.borderColor = config.borderColor;
            } else {
              cItem.style.borderColor = getSmartBorderColor(
                value || "",
                cItem.style.borderColor || config.borderColor,
              );
            }
          } else {
            cItem.style.color = value;
          }
        });
      });
      handleUpdater(newSelectionCells);
    },
    [config.backgroundColor, config.borderColor, selectionCells, handleUpdater],
  );
  return {
    isStyle,
    selectionCells,
    updateStyle,
    handleUpdaterBrush,
    handleUpdaterColor,
  };
};
