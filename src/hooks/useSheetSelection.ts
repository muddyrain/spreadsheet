import { useState, useCallback, useRef } from 'react';
import { TableData } from '../types/sheet';
import { useStore } from './useStore';

export function useSheetSelection(data: TableData) {
  const { selection, config, setSelection, headerColumnsWidth } = useStore()
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
      // 动态计算列索引
      let col: number;
      if (x < config.fixedColWidth) {
        col = 0;
      } else {
        let accWidth = config.fixedColWidth;
        col = 1;
        for (let i = 1;i < data[0].length;i++) {
          accWidth += headerColumnsWidth[i] || config.width;
          if (x < accWidth) {
            col = i;
            break;
          }
          // 如果遍历到最后都没break，col会是最后一列
          if (i === data[0].length - 1) {
            col = i;
          }
        }
      }
      col = Math.max(0, Math.min(col, data[0].length - 1));
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
  }, [data, config, setSelection, headerColumnsWidth]);

  return { selection, isSelection, movedRef, setSelection, handleCellMouseDown };
}