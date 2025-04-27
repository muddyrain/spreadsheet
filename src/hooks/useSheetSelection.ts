import { useState, useCallback, useRef } from "react";
import { useStore } from "./useStore";
import { findIndexByAccumulate } from "@/utils/sheet";

export function useSheetSelection() {
  const { selection, setSelection, headerColsWidth, headerRowsHeight } =
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
            const endRow = row;
            const endCol = col;
            // const startRow = sel.start?.row ?? 0;
            // const startCol = sel.start?.col ?? 0;
            // console.log(
            //   "起始行", startRow,
            //   "起始列", startCol,
            //   "终点行", endRow,
            //   "终点列", endCol,);
            // if (sel.start) {
            //   const { r1, r2, c1, c2 } = getAbsoluteSelection({
            //     start: {
            //       row: startRow,
            //       col: startCol,
            //     },
            //     end: {
            //       row: endRow,
            //       col: endCol
            //     }
            //   })
            //   for (let rowIndex = r1;rowIndex <= r2;rowIndex++) {
            //     for (let colIndex = c1;colIndex <= c2;colIndex++) {
            //       const cell = data[rowIndex][colIndex]
            //       if (cell.mergeParent) {
            //         // 选中父级单元格
            //         const { row: parentRowIndex, col: parentColIndex } = cell.mergeParent
            //         const parentCell = data[parentRowIndex][parentColIndex]
            //         if (parentCell.mergeSpan) {
            //           console.log("选中父级单元格", parentCell, parentRowIndex, parentColIndex);
            //           // const { r1, r1, c1, c2 } = parentCell.mergeSpan
            //           // endCol = c2
            //           // endRow = r2
            //         }
            //         // 如果起始行大于终点行，且父级行索引小于终点行，则终点行等于父级行索引
            //         // if (startRow > endRow) {
            //         //   if (parentRowIndex < endRow) {
            //         //     endRow = parentRowIndex
            //         //   }
            //         //   if (parentRowIndex >= startRow) {
            //         //     endRow = parentRowIndex
            //         //   }
            //         // }
            //         // if (startRow < endRow) {
            //         //   console.log("小于");
            //         //   console.log("选中父级单元格", parentRowIndex, parentColIndex);
            //         //   if (parentRowIndex > endRow) {
            //         //     endRow = parentRowIndex
            //         //   }
            //         // }
            //         // if (startCol > endCol || startCol === endCol) {
            //         //   if (parentColIndex < endCol) {
            //         //     endCol = parentColIndex
            //         //   }
            //         // }
            //       }
            //     }
            //   }
            // }
            // console.log({
            //   start: sel.start,
            //   end: {
            //     row: endRow,
            //     col: endCol,
            //   },
            // });
            return {
              start: sel.start,
              end: {
                row: endRow,
                col: endCol,
              },
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
    [setSelection, headerColsWidth, headerRowsHeight],
  );

  return {
    selection,
    isSelection,
    movedRef,
    setSelection,
    handleCellMouseDown,
  };
}
