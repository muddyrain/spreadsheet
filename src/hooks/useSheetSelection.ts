import { useState, useCallback, useRef, useEffect } from "react";
import { useStore } from "./useStore";
import { useComputed } from "./useComputed";

export function useSheetSelection() {
  const {
    data,
    selection,
    scrollPosition,
    setSelection,
    headerColsWidth,
    headerRowsHeight,
  } = useStore();
  const [isSelection, setIsSelection] = useState(false);
  const movedRef = useRef(false);
  const scrollPositionRef = useRef(scrollPosition);
  const { findIndexByAccumulate } = useComputed();
  const expandSelection = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const checkMergedCells = (
        r1: number,
        c1: number,
        r2: number,
        c2: number,
      ) => {
        let hasNewMergedCells = false;
        let finalStartRow = r1;
        let finalStartCol = c1;
        let finalEndRow = r2;
        let finalEndCol = c2;

        // 检查区域内的所有单元格
        for (let i = r1; i <= r2; i++) {
          for (let j = c1; j <= c2; j++) {
            const cell = data[i][j];
            if (!cell) continue;
            let changed = false;

            // 检查主合并单元格
            if (cell.mergeSpan) {
              const newStartRow = Math.min(finalStartRow, cell.mergeSpan.r1);
              const newStartCol = Math.min(finalStartCol, cell.mergeSpan.c1);
              const newEndRow = Math.max(finalEndRow, cell.mergeSpan.r2);
              const newEndCol = Math.max(finalEndCol, cell.mergeSpan.c2);

              // 检查是否有新的合并单元格被包含
              if (
                newStartRow < finalStartRow ||
                newStartCol < finalStartCol ||
                newEndRow > finalEndRow ||
                newEndCol > finalEndCol
              ) {
                changed = true;
              }

              finalStartRow = newStartRow;
              finalStartCol = newStartCol;
              finalEndRow = newEndRow;
              finalEndCol = newEndCol;
            }

            // 检查被合并的单元格
            if (cell.mergeParent) {
              const parentCell =
                data[cell.mergeParent.row][cell.mergeParent.col];
              if (!parentCell) continue;
              if (parentCell.mergeSpan) {
                const newStartRow = Math.min(
                  finalStartRow,
                  parentCell.mergeSpan.r1,
                );
                const newStartCol = Math.min(
                  finalStartCol,
                  parentCell.mergeSpan.c1,
                );
                const newEndRow = Math.max(
                  finalEndRow,
                  parentCell.mergeSpan.r2,
                );
                const newEndCol = Math.max(
                  finalEndCol,
                  parentCell.mergeSpan.c2,
                );

                // 检查是否有新的合并单元格被包含
                if (
                  newStartRow < finalStartRow ||
                  newStartCol < finalStartCol ||
                  newEndRow > finalEndRow ||
                  newEndCol > finalEndCol
                ) {
                  changed = true;
                }

                finalStartRow = newStartRow;
                finalStartCol = newStartCol;
                finalEndRow = newEndRow;
                finalEndCol = newEndCol;
              }
            }

            if (changed) {
              hasNewMergedCells = true;
            }
          }
        }

        return {
          hasNewMergedCells,
          finalStartRow,
          finalStartCol,
          finalEndRow,
          finalEndCol,
        };
      };

      let r1 = Math.min(startRow, endRow);
      let r2 = Math.max(startRow, endRow);
      let c1 = Math.min(startCol, endCol);
      let c2 = Math.max(startCol, endCol);

      // 循环检查，直到没有新的合并单元格被包含
      let result;
      do {
        result = checkMergedCells(r1, c1, r2, c2);
        r1 = result.finalStartRow;
        c1 = result.finalStartCol;
        r2 = result.finalEndRow;
        c2 = result.finalEndCol;
      } while (result.hasNewMergedCells);

      return {
        newStartRow: r1,
        newStartCol: c1,
        newEndRow: r2,
        newEndCol: c2,
      };
    },
    [data],
  );
  // 更新 ref
  useEffect(() => {
    scrollPositionRef.current = scrollPosition;
  }, [scrollPosition]);
  const handleCellMouseDown = useCallback(
    (
      rowIndex: number,
      colIndex: number,
      wrapperRef: React.RefObject<HTMLDivElement | null>,
    ) => {
      setIsSelection(false);
      movedRef.current = false;

      let lastRow = rowIndex;
      let lastCol = colIndex;
      const handleMouseMove = (e: MouseEvent) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollPositionRef.current.x;
        const y = e.clientY - rect.top + scrollPositionRef.current.y;
        // 列索引
        const col = findIndexByAccumulate(headerColsWidth, x);
        // 行索引
        const row = findIndexByAccumulate(headerRowsHeight, y);
        if (col <= 0 || row <= 0) return;
        if (row !== lastRow || col !== lastCol) {
          setSelection(() => {
            const { newStartRow, newStartCol, newEndRow, newEndCol } =
              expandSelection(rowIndex, colIndex, row!, col!);
            return {
              start: { row: newStartRow, col: newStartCol },
              end: { row: newEndRow, col: newEndCol },
            };
          });
          setIsSelection(true);
          movedRef.current = true;
          lastRow = row;
          lastCol = col;
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        setIsSelection(false);
      };

      // 添加事件监听
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      // 返回清理函数
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    },
    [
      setSelection,
      headerColsWidth,
      headerRowsHeight,
      expandSelection,
      findIndexByAccumulate,
      scrollPositionRef,
    ],
  );
  return {
    selection,
    isSelection,
    movedRef,
    setSelection,
    handleCellMouseDown,
  };
}
