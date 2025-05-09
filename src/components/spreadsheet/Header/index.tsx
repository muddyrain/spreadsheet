import { FC, useMemo } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Eraser,
  Italic,
  Merge,
  PaintRoller,
  Redo,
  Save,
  Share,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "@/components/ui/tooltip";
import { getAbsoluteSelection } from "@/utils/sheet";
import { CellData } from "@/types/sheet";
import { Settings } from "./Settings";
import { ColorPicker } from "./ColorPicker";
import { useExportExcel } from "@/hooks/useExportExcel";
import { Import } from "./import";
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
  | "merge"
  | "export";
export const Header: FC<{
  onClick?: (type: ClickType) => void;
}> = ({ onClick }) => {
  const {
    updater,
    selection,
    selectedCell,
    currentCell,
    data,
    sheetCellSettingsConfig,
    setUpdater,
    getCurrentCell,
  } = useStore();
  const exportExcel = useExportExcel();
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
    };
    // 通过updater来判断是否需要更新isStyle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionCells, currentCell, updater]);
  const handleClick = (type: ClickType) => {
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
          if (isAll) {
            cell.style.textDecoration?.replace("line-through", "");
          } else {
            cell.style.textDecoration = `line-through ${cell.style.textDecoration || ""}`;
          }
        });
        break;
      }
      case "underline": {
        const isAll = selectionCells.every((cell) =>
          cell.style.textDecoration?.includes("underline"),
        );
        selectionCells.forEach((cell) => {
          if (isAll) {
            cell.style.textDecoration?.replace("underline", "");
          } else {
            cell.style.textDecoration = `underline ${cell.style.textDecoration || ""}`;
          }
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
    setUpdater();
    onClick?.(type);
  };
  return (
    <div
      className="flex items-center gap-x-1 bg-zinc-50 px-4 py-1 h-10 z-[1]"
      onKeyDown={(e) => {
        e.preventDefault();
      }}
    >
      <Tooltip content="保存（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("save");
          }}
        >
          <Save />
        </Toggle>
      </Tooltip>
      <Tooltip content="撤销（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("undo");
          }}
        >
          <Undo />
        </Toggle>
      </Tooltip>
      <Tooltip content="重做（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("redo");
          }}
        >
          <Redo />
        </Toggle>
      </Tooltip>
      <Tooltip content="格式刷（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("paint");
          }}
        >
          <PaintRoller />
        </Toggle>
      </Tooltip>
      <Tooltip content="清除格式（未开发）">
        <Toggle
          pressed={false}
          className="text-lg"
          onClick={() => {
            handleClick("eraser");
          }}
        >
          <Eraser />
        </Toggle>
      </Tooltip>
      <Tooltip content="加粗">
        <Toggle
          pressed={isStyle.isBold}
          className={`text-lg`}
          onClick={() => {
            handleClick("bold");
          }}
        >
          <Bold />
        </Toggle>
      </Tooltip>
      <Tooltip content="斜体">
        <Toggle
          pressed={isStyle.isItalic}
          className="text-lg"
          onClick={() => {
            handleClick("italic");
          }}
        >
          <Italic />
        </Toggle>
      </Tooltip>
      <Tooltip content="删除线">
        <Toggle
          pressed={isStyle.isLineThrough}
          className="text-lg"
          onClick={() => {
            handleClick("strikethrough");
          }}
        >
          <Strikethrough />
        </Toggle>
      </Tooltip>
      <Tooltip content="下划线">
        <Toggle
          pressed={isStyle.isUnderline}
          className="text-lg"
          onClick={() => {
            handleClick("underline");
          }}
        >
          <Underline />
        </Toggle>
      </Tooltip>
      <Separator orientation="vertical" />
      <ColorPicker type="text" selectionCells={selectionCells || []} />
      <ColorPicker type="background" selectionCells={selectionCells || []} />
      <Separator orientation="vertical" />
      <Tooltip content={(isStyle.isMergeCell ? "拆分" : "合并") + "单元格"}>
        <Toggle
          pressed={isStyle.isMergeCell}
          className="text-lg outline-0"
          onClick={() => {
            handleClick("merge");
          }}
        >
          <Merge />
          <span className="text-xs">
            {(isStyle.isMergeCell ? "拆分" : "合并") + "单元格"}
          </span>
        </Toggle>
      </Tooltip>
      <Tooltip content={"导出表格"}>
        <Toggle
          pressed={false}
          className="text-lg outline-0"
          onClick={() => {
            handleClick("export");
          }}
        >
          <Share />
          <span className="text-xs">导出表格</span>
        </Toggle>
      </Tooltip>
      <Import />
      <div className="ml-auto">
        <Settings />
      </div>
    </div>
  );
};
