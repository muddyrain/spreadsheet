import { useState, useCallback, useRef } from "react";
import { useStore } from "./useStore";
import { findIndexByAccumulate, getAbsoluteSelection } from "@/utils/sheet";

export function useSheetSelection() {
  const { data, selection, setSelection, headerColsWidth, headerRowsHeight } =
    useStore();
  const [isSelection, setIsSelection] = useState(false);
  const movedRef = useRef(false);

  const handleCellMouseDown = useCallback(
    (
      rowIndex: number,
      colIndex: number,
      wrapperRef: React.RefObject<HTMLDivElement | null>,
      scrollPosition: { x: number; y: number },
    ) => {
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
          setSelection((sel) => {
            let endRow = row;
            let endCol = col;
            let startRow = sel.start?.row ?? 0;
            let startCol = sel.start?.col ?? 0;
            const { r1, c1, r2, c2 } = getAbsoluteSelection({
              start: { row: startRow, col: startCol },
              end: { row: endRow, col: endCol },
            });
            for (let i = r1; i <= r2; i++) {
              for (let j = c1; j <= c2; j++) {
                const cell = data[i]?.[j];
                if (!cell) continue;
                let parentCell = null;
                if (cell.mergeParent) {
                  const { row: parentRow, col: parentCol } = cell.mergeParent;
                  parentCell = data[parentRow]?.[parentCol];
                }
                if (cell.mergeSpan) {
                  parentCell = cell;
                }
                // 先找到谁是父级单元格，然后再判断是否在父级单元格的范围内
                // 然后再判断是否在父级单元格的范围内
                if (parentCell && parentCell.mergeSpan) {
                  const {
                    r1: parentR1,
                    c1: parentC1,
                    r2: parentR2,
                    c2: parentC2,
                  } = parentCell.mergeSpan;

                  // 判断选区的方向
                  const isSelectingDown = endRow >= startRow;
                  const isSelectingRight = endCol >= startCol;
                  const isInSameColumn = startCol === endCol;
                  const isInSameRow = startRow === endRow;

                  // 根据选区方向调整结束位置
                  if (isInSameRow) {
                    // 如果在同一行上，需要考虑合并单元格的上下边界
                    if (endRow >= parentR1 && endRow <= parentR2) {
                      endRow = parentR2;
                      startRow = parentR1;
                      // 同时处理水平方向
                      if (isSelectingRight) {
                        endCol = Math.max(endCol, parentC2);
                      } else {
                        endCol = Math.min(endCol, parentC1);
                      }
                    }
                  } else if (isInSameColumn) {
                    // 如果在同一列上，需要考虑合并单元格的左右边界
                    if (endCol >= parentC1 && endCol <= parentC2) {
                      endCol = parentC2;
                      startCol = parentC1;
                      // 同时处理垂直方向
                      if (isSelectingDown) {
                        endRow = Math.max(endRow, parentR2);
                      } else {
                        endRow = Math.min(endRow, parentR1);
                      }
                    }
                  } else {
                    // 跨行跨列的选择
                    if (isSelectingDown) {
                      endRow = Math.max(endRow, parentR2);
                    } else {
                      endRow = Math.min(endRow, parentR1);
                    }
                    if (isSelectingRight) {
                      endCol = Math.max(endCol, parentC2);
                    } else {
                      endCol = Math.min(endCol, parentC1);
                    }
                  }
                }
              }
            }
            return {
              start: { row: startRow, col: startCol },
              end: { row: endRow, col: endCol },
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

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [setSelection, headerColsWidth, headerRowsHeight, data],
  );

  return {
    selection,
    isSelection,
    movedRef,
    setSelection,
    handleCellMouseDown,
  };
}
