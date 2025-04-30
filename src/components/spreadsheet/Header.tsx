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
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "../ui/tooltip";
import { getAbsoluteSelection } from "@/utils/sheet";
import { CellData } from "@/types/sheet";
import { Settings } from "./Settings";
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
  | "merge";
export const Header: FC<{
  onClick?: (type: ClickType) => void;
}> = ({ onClick }) => {
  const {
    selection,
    selectedCell,
    data,
    sheetCellSettingsConfig,
    setUpdater,
    getCurrentCell,
  } = useStore();
  const selectionCells = useMemo(() => {
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
      isBold: selectionCells.every((cell) => cell.style.fontWeight === "bold"),
      isItalic: selectionCells.every(
        (cell) => cell.style.fontStyle === "italic",
      ),
      isLineThrough: selectionCells.every((cell) =>
        cell.style.textDecoration?.includes("line-through"),
      ),
      isUnderline: selectionCells.every((cell) =>
        cell.style.textDecoration?.includes("underline"),
      ),
    };
  }, [selectionCells]);
  const handleClick = (type: ClickType) => {
    if (!selectionCells?.length) return;
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
              if (i === selectedCell?.row && j === selectedCell?.col) continue;
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
        break;
      }
    }
    setUpdater();
    onClick?.(type);
  };
  return (
    <div className="flex items-center gap-x-1 bg-zinc-50 px-4 py-1 h-10 z-[1]">
      <Tooltip content="保存">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("save");
          }}
        >
          <Save />
        </Toggle>
      </Tooltip>
      <Tooltip content="撤销">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("undo");
          }}
        >
          <Undo />
        </Toggle>
      </Tooltip>
      <Tooltip content="重做">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("redo");
          }}
        >
          <Redo />
        </Toggle>
      </Tooltip>
      <Tooltip content="格式刷">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("paint");
          }}
        >
          <PaintRoller />
        </Toggle>
      </Tooltip>
      <Tooltip content="清除格式">
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
      <Tooltip content="合并单元格">
        <Toggle
          disabled={!selectionCells?.length || selectionCells.length === 1}
          className="text-lg"
          onClick={() => {
            handleClick("merge");
          }}
        >
          <Merge />
        </Toggle>
      </Tooltip>
      <div className="ml-auto">
        <Settings />
      </div>
    </div>
  );
};
