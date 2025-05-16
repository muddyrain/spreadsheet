import { useCallback, useMemo, useState } from "react";
import { useExportExcel } from "./useExportExcel";
import { useStore } from "./useStore";
import { CellData, SelectionSheetType } from "@/types/sheet";
import { getAbsoluteSelection } from "@/utils/sheet";
import { useComputed } from "./useComputed";
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
    updater,
    selection,
    selectedCell,
    currentCell,
    data,
    sheetCellSettingsConfig,
    setData,
    getCurrentCell,
    formatBrushStyles,
    setFormatBrushStyles,
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
    };
    // 通过updater来判断是否需要更新isStyle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionCells, currentCell, updater]);
  const handleUpdater = useCallback(() => {
    setData((data) => {
      selectionCells.map((cell) => {
        data[cell.row][cell.col] = cell;
      });
      return [...data];
    });
  }, [selectionCells, setData]);
  const updateStyle = (type: ClickType) => {
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
        setFormatBrushStyles(_formatBrushStyles);
        break;
      }
      case "eraser": {
        selectionCells.forEach((cell) => {
          cell.style = {};
        });
        break;
      }
      case "bold": {
        const isAll = selectionCells.every(
          (cell) => cell.style.fontWeight === "bold",
        );
        selectionCells.forEach((cell) => {
          if (isAll) {
            cell.style.fontWeight = "normal";
          } else {
            cell.style.fontWeight = "bold";
          }
        });
        break;
      }
      case "italic": {
        const isAll = selectionCells.every(
          (cell) => cell.style.fontStyle === "italic",
        );
        selectionCells.forEach((cell) => {
          if (isAll) {
            cell.style.fontStyle = "normal";
          } else {
            cell.style.fontStyle = "italic";
          }
        });
        break;
      }
      case "strikethrough": {
        const isAll = selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("line-through"),
        );
        selectionCells.forEach((cell) => {
          const textDecoration = cell.style.textDecoration?.replace("none", "");
          if (isAll) {
            cell.style.textDecoration = cell.style.textDecoration?.replace(
              "line-through",
              "",
            );
          } else {
            cell.style.textDecoration = `line-through ${textDecoration || ""}`;
          }
        });
        break;
      }
      case "underline": {
        const isAll = selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("underline"),
        );
        selectionCells.forEach((cell) => {
          const textDecoration = cell.style.textDecoration?.replace("none", "");
          if (isAll) {
            cell.style.textDecoration = cell.style.textDecoration?.replace(
              "underline",
              "",
            );
          } else {
            cell.style.textDecoration = `underline ${textDecoration || ""}`;
          }
        });
        break;
      }
      case "wrap": {
        const isAll = selectionCells.every((cell) => cell.style.wrap);
        selectionCells.forEach((cell) => {
          if (isAll) {
            cell.style.wrap = false;
          } else {
            cell.style.wrap = true;
          }
        });
        break;
      }
      case "alignLeft": {
        selectionCells.forEach((cell) => {
          cell.style.textAlign = "left";
        });
        break;
      }
      case "alignCenter": {
        selectionCells.forEach((cell) => {
          cell.style.textAlign = "center";
        });
        break;
      }
      case "alignRight": {
        selectionCells.forEach((cell) => {
          cell.style.textAlign = "right";
        });
        break;
      }
      case "verticalAlignStart": {
        selectionCells.forEach((cell) => {
          cell.style.verticalAlign = "start";
        });
        break;
      }
      case "verticalAlignCenter": {
        selectionCells.forEach((cell) => {
          cell.style.verticalAlign = "center";
        });
        break;
      }
      case "verticalAlignEnd": {
        selectionCells.forEach((cell) => {
          cell.style.verticalAlign = "end";
        });
        break;
      }
      case "merge": {
        if (!selection) return;
        if (isStyle.isMergeCell) {
          // 取消合并
          const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
          for (let i = r1; i <= r2; i++) {
            for (let j = c1; j <= c2; j++) {
              data[i][j].mergeSpan = null;
              data[i][j].mergeParent = null;
            }
          }
        } else {
          const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
          if (r1 === r2 && c1 === c2) return;
          const cell = data[selectedCell?.row || 0][selectedCell?.col || 0];
          const isAnchorMergePoint = sheetCellSettingsConfig.isAnchorMergePoint;
          if (isAnchorMergePoint) {
            cell.mergeSpan = {
              r1,
              r2,
              c1,
              c2,
            };
          } else {
            const currentCell = getCurrentCell(r1, c1);
            if (currentCell) {
              currentCell.mergeSpan = {
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
        }
        break;
      }
      case "export": {
        exportExcel();
        break;
      }
    }
    handleUpdater();
    return type;
  };
  const handleUpdaterBrush = useCallback(
    (currentSelection: SelectionSheetType | null) => {
      if (!formatBrushStyles.length) return;
      if (!currentSelection) return;
      setFormatBrushStyles([]);
      setData((data) => {
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
        return [...data];
      });
    },
    [formatBrushStyles, setData, setFormatBrushStyles],
  );
  return {
    isStyle,
    selectionCells,
    updateStyle,
    handleUpdaterBrush,
  };
};
