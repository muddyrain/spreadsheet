import { useCallback, useMemo } from "react";
import { useStore } from "./useStore";

export const useFunctions = () => {
  const { data, selection, selectedCell, setData } = useStore();
  const startRow = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.min(selection.start.row, selection.end.row);
  }, [selection]);
  const endRow = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.max(selection.start.row, selection.end.row);
  }, [selection]);
  const startCol = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.min(selection.start.col, selection.end.col);
  }, [selection]);
  const endCol = useMemo(() => {
    if (!selection || !selection.start || !selection.end) return 0;
    return Math.max(selection.start.col, selection.end.col);
  }, [selection]);
  const handleCopy = useCallback(() => {
    if (!selection) return;
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
    }
  }, [data, endCol, endRow, selection, startCol, startRow]);
  const handlePaste = useCallback(() => {
    if (!selection || !selectedCell) return;
    navigator.clipboard.readText().then((text) => {
      const rows = text.split("\n");
      const cols = rows[0].split("\t");
      const startRow = selection.start?.row ?? selectedCell.row;
      const startCol = selection.start?.col ?? selectedCell.col;
      const endRow = Math.min(startRow + rows.length - 1, data.length - 1);
      const endCol = Math.min(startCol + cols.length - 1, data[0].length - 1);
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
    });
  }, [data, selectedCell, selection, setData]);
  const handleClearContent = useCallback(() => {
    if (!selection) return;
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
  }, [selection, startCol, startRow, endCol, endRow, setData]);
  return {
    handleCopy,
    handlePaste,
    handleClearContent,
  };
};
