import { useCallback, useMemo } from "react";
import { useExportExcel } from "./useExportExcel";
import { useStore } from "./useStore";
import { CellData } from "@/types/sheet";
import { getAbsoluteSelection } from "@/utils/sheet";
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
  } = useStore();
  const selectionCells: CellData[] = useMemo(() => {
    if (!selection) {
      return [];
    }
    const { r1, r2, c1, c2 } = getAbsoluteSelection(selection);
    if (r1 === r2 && c1 === c2) {
      if (data[r1][c1]) {
        return [data[r1][c1]];
      } else {
        return [];
      }
    }
    const cells: CellData[] = [];
    for (let i = r1; i <= r2; i++) {
      for (let j = c1; j <= c2; j++) {
        if (!data[i][j]) continue;
        cells.push(data[i][j]);
      }
    }
    return cells;
  }, [selection, data]);
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
  const updaterWrap = useCallback(
    (bool: boolean) => {
      selectionCells.forEach((cell) => {
        cell.style.wrap = bool;
      });
      handleUpdater();
    },
    [selectionCells, handleUpdater],
  );
  const updateStyle = (type: ClickType) => {
    switch (type) {
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
  return {
    isStyle,
    selectionCells,
    updateStyle,
    updaterWrap,
  };
};
