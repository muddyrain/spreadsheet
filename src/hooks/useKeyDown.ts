import { ArrowDirectionType, EditingCell, TableData } from "@/types/sheet";
import { useCallback, useEffect } from "react";
import { useStore } from "./useStore";

interface useKeyDownCallback {
  onCellInputKey?: (value: string) => void;
  onCellCopyKey?: () => void;
  onCellPasteKey?: () => void;
  onCellDeleteKey?: () => void;
  onSelectAll?: () => void;
  onDirectionKey?: (key: ArrowDirectionType) => void;
  onTabKey?: () => void;
  onEnterKey?: () => void;
}
export const useKeyDown = (
  config: {
    data: TableData;
    setData: React.Dispatch<React.SetStateAction<TableData>>;
  },
  callback: useKeyDownCallback = {},
) => {
  const { data, setData } = config;
  const { selection } = useStore();
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;
      if (e.key === "Enter") {
        e.preventDefault();
        callback?.onEnterKey?.();
        return;
      }
      // 处理 ctrl/cmd + r
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        window.location.reload();
        return;
      }
      // 处理 ctrl/cmd + a
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        callback.onSelectAll?.();
        return;
      }
      // 处理上下左右键
      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        e.preventDefault();
        callback?.onDirectionKey?.(key);
        return;
      }
      // 已经有选中单元格才会处理键盘事件
      if (selection?.start && selection?.end) {
        const selectedCell: EditingCell = {
          row: selection.start.row,
          col: selection.start.col,
        };
        const startRow = Math.min(selection.start.row, selection.end.row);
        const endRow = Math.max(selection.start.row, selection.end.row);
        const startCol = Math.min(selection.start.col, selection.end.col);
        const endCol = Math.max(selection.start.col, selection.end.col);
        // 处理 tab 键
        if (key === "Tab") {
          e.preventDefault();
          callback?.onTabKey?.();
        }
        // 处理粘贴
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            const rows = text.split("\n");
            const cols = rows[0].split("\t");
            const startRow = selection.start?.row ?? selectedCell.row;
            const startCol = selection.start?.col ?? selectedCell.col;
            const endRow = Math.min(
              startRow + rows.length - 1,
              data.length - 1,
            );
            const endCol = Math.min(
              startCol + cols.length - 1,
              data[0].length - 1,
            );
            setData((data) => {
              for (let i = startRow; i <= endRow; i++) {
                for (let j = startCol; j <= endCol; j++) {
                  if (!data[i][j]) continue;
                  data[i][j].value =
                    rows[i - startRow]?.split("\t")[j - startCol] ?? "";
                }
              }
              return [...data];
            });
            callback?.onCellPasteKey?.();
          });
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          e.preventDefault();
          // 处理复制
          if (selection.start && selection.end) {
            let text = "";
            for (let i = startRow; i <= endRow; i++) {
              const row = [];
              for (let j = startCol; j <= endCol; j++) {
                if (!data[i][j]) continue;
                row.push(data[i][j].value ?? "");
              }
              text += row.join("\t") + (i < endRow ? "\n" : "");
            }
            navigator.clipboard.writeText(text);
            callback?.onCellCopyKey?.();
          }
        } else if (key === "Delete") {
          e.preventDefault();
          // 处理删除
          setData((data) => {
            if (selection.start && selection.end) {
              for (let i = startRow; i <= endRow; i++) {
                for (let j = startCol; j <= endCol; j++) {
                  data[i][j].value = "";
                }
              }
            }
            return [...data];
          });
          callback?.onCellDeleteKey?.();
        } else if (
          key.length === 1 &&
          (/[a-zA-Z0-9]/.test(key) || // 字母数字
            /[~!@#$%^&*()_+\-=[\]{};':"|,.<>\\/?`]/.test(key)) // 常见符号
        ) {
          e.preventDefault();
          // 处理输入的字母数字和常见符号
          callback?.onCellInputKey?.(key);
        }
      }
    },
    [callback, selection, data, setData],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);
};
