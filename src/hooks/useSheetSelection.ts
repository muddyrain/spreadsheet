import { useState, useCallback, useRef } from 'react';
import { SelectionSheetType, TableData } from '../types/sheet';

export function useSheetSelection(data: TableData, config: { width: number; height: number }) {
  const [selection, setSelection] = useState<SelectionSheetType>({ start: null, end: null });
  const [isSelection, setIsSelection] = useState(false);
  const movedRef = useRef(false);


  const handleCellMouseDown = useCallback((rowIndex: number, colIndex: number, wrapperRef: React.RefObject<HTMLDivElement | null>, scrollPosition: { x: number, y: number }) => {
    setSelection({ start: { row: rowIndex, col: colIndex }, end: { row: rowIndex, col: colIndex } });
    setIsSelection(false);
    movedRef.current = false;
    let lastRow = rowIndex;
    let lastCol = colIndex;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollPosition.x;
      const y = e.clientY - rect.top + scrollPosition.y;
      const col = Math.max(0, Math.min(Math.floor(x / config.width), data[0].length - 1));
      const row = Math.max(0, Math.min(Math.floor(y / config.height), data.length - 1));
      if (row !== lastRow || col !== lastCol) {
        setSelection(sel => ({
          start: sel.start,
          end: { row, col }
        }));
        setIsSelection(true);
        movedRef.current = true;
        lastRow = row;
        lastCol = col;
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsSelection(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [data, config.width, config.height]);

  return { selection, isSelection, movedRef, setSelection, handleCellMouseDown };
}