import { CanvasOnKeyDown } from "@/components/spreadsheet/Canvas";
import { EditingCell, TableData } from "@/types/sheet";

interface useKeyDownCallback {
  onCellInputKey?: () => void;
  onCellCopyKey?: () => void;
  onCellDeleteKey?: () => void;
}
export const useKeyDown = (config: {
  selectedCell: EditingCell;
  data: TableData;
  setData: React.Dispatch<React.SetStateAction<TableData>>;
}, callback: useKeyDownCallback = {}) => {
  const { data, selectedCell, setData } = config;
  const onKeyDown: CanvasOnKeyDown = (e, { selection }) => {
    if (selectedCell) {
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selection.start && selection.end) {
          const startRow = Math.min(selection.start.row, selection.end.row);
          const endRow = Math.max(selection.start.row, selection.end.row);
          const startCol = Math.min(selection.start.col, selection.end.col);
          const endCol = Math.max(selection.start.col, selection.end.col);
          let text = '';
          for (let i = startRow;i <= endRow;i++) {
            let row = [];
            for (let j = startCol;j <= endCol;j++) {
              row.push(data[i][j].value ?? '');
            }
            text += row.join('\t') + (i < endRow ? '\n' : '');
          }
          navigator.clipboard.writeText(text);
          callback?.onCellCopyKey?.();
        }
        e.preventDefault();
        return;
      }

      if (key === 'Delete') {
        setData(data => {
          if (selection.start && selection.end) {
            const startRow = Math.min(selection.start.row, selection.end.row);
            const endRow = Math.max(selection.start.row, selection.end.row);
            const startCol = Math.min(selection.start.col, selection.end.col);
            const endCol = Math.max(selection.start.col, selection.end.col);
            for (let i = startRow;i <= endRow;i++) {
              for (let j = startCol;j <= endCol;j++) {
                data[i][j].value = '';
              }
            }
          }
          return [...data];
        })
        callback?.onCellDeleteKey?.();
        return
      }
      if (
        (key.length === 1 && (
          /[a-zA-Z0-9]/.test(key) || // 字母数字
          /[~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`]/.test(key) // 常见符号
        ))
      ) {
        // 处理输入的字母数字和常见符号
        callback?.onCellInputKey?.();
      }
    }
  };
  return {
    onKeyDown
  }
}