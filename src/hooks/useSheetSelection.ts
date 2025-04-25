import { useState, useCallback, useRef } from 'react';
import { useStore } from './useStore';
import { findIndexByAccumulate } from '@/utils/sheet';

export function useSheetSelection() {
  const { selection, setSelection, headerColsWidth, headerRowsHeight } = useStore()
  const [isSelection, setIsSelection] = useState(false);
  const movedRef = useRef(false);


  const handleCellMouseDown = useCallback((rowIndex: number, colIndex: number, wrapperRef: React.RefObject<HTMLDivElement | null>, scrollPosition: { x: number, y: number }) => {
    setIsSelection(false);
    movedRef.current = false;
    let lastRow = rowIndex;
    let lastCol = colIndex;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollPosition.x;
      const y = e.clientY - rect.top + scrollPosition.y;
      // 列索引
      const col = findIndexByAccumulate(headerColsWidth, x);
      // 行索引
      const row = findIndexByAccumulate(headerRowsHeight, y);
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
  }, [setSelection, headerColsWidth, headerRowsHeight]);

  return { selection, isSelection, movedRef, setSelection, handleCellMouseDown };
}