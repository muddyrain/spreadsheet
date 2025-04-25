import { useCallback, useEffect, useState } from "react";
import { useStore } from "./useStore";
import { PositionType } from "@/types/sheet";
import { getLeft, getTop } from "@/utils/sheet";

export const useSideLine = (options: {
  currentHoverCell: [number, number] | null;
  scrollPosition: PositionType;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef, scrollPosition } = options
  const { data, headerColsWidth, headerRowsHeight, sideLineMode, currentSideLineIndex, currentSideLinePosition, isMouseDown, setIsMouseDown, setHeaderColsWidth, setHeaderRowsHeight, setSideLineMode, setCurrentSideLinePosition, setCurrentSideLineIndex } = useStore()
  const [cursor, setCursor] = useState('cell')
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  useEffect(() => {
    if (currentHoverCell) {
      const [rowIndex, colIndex] = currentHoverCell;
      const currentCell = data[rowIndex][colIndex];
      if (currentCell?.readOnly) {
        if (rowIndex === 0 && colIndex === 0) {
          setCursor('se-resize')
          return
        }
        const [x, y] = currentPosition || [0, 0]
        if (rowIndex === 0) {
          const cellWidth = headerColsWidth[colIndex]
          const left = getLeft(colIndex, headerColsWidth, scrollPosition)
          const offset = x - left
          if (offset <= 5 && colIndex > 1) {
            if (!isMouseDown) {
              setCurrentSideLineIndex(() => [-1, colIndex - 1])
            }
            setSideLineMode('col')
            setCursor('col-resize')
            return
          }
          if (offset >= cellWidth - 5) {
            if (!isMouseDown) {
              setCurrentSideLineIndex(() => [-1, colIndex])
            }
            setSideLineMode('col')
            setCursor('col-resize')
            return
          }
          setCursor('e-resize')
          return
        }
        if (colIndex === 0) {
          const cellHeight = headerRowsHeight[rowIndex]
          const top = getTop(rowIndex, headerRowsHeight, scrollPosition)
          const offset = y - top
          if (offset <= 5 && rowIndex > 1) {
            if (!isMouseDown) {
              setCurrentSideLineIndex(() => [rowIndex - 1, -1])
            }
            setSideLineMode('row')
            setCursor('row-resize')
            return
          }
          if (offset >= cellHeight - 5) {
            if (!isMouseDown) {
              setCurrentSideLineIndex(() => [rowIndex, -1])
            }
            setSideLineMode('row')
            setCursor('row-resize')
            return
          }
          setCursor('s-resize')
          return
        }
      }
    }
    setCursor('cell')
  }, [currentHoverCell, currentPosition, isMouseDown, headerColsWidth, headerRowsHeight, data, scrollPosition, setCurrentSideLineIndex, setSideLineMode])
  const clearState = useCallback(() => {
    setCurrentSideLinePosition([-1, -1])
    setCurrentSideLineIndex([-1, -1])
    setIsMouseDown(false);
    setCursor('cell')
  }, [setCurrentSideLineIndex, setCurrentSideLinePosition, setIsMouseDown])
  const handleMouseUp = useCallback(() => {
    clearState()
    if (isMouseDown) {
      if (sideLineMode === 'col') {
        const currentColSideLineIndex = currentSideLineIndex[1]
        const currentColSideLinePosition = currentSideLinePosition[0]
        const left = getLeft(currentColSideLineIndex, headerColsWidth, scrollPosition)
        let width = currentColSideLinePosition - left
        if (width <= 0) {
          width = 0
        }
        headerColsWidth[currentColSideLineIndex] = width
        setHeaderColsWidth([...headerColsWidth])
        setCurrentSideLineIndex(p => [p[0], -1])
        setCurrentSideLinePosition(p => [p[0], -1])
      }
      if (sideLineMode === 'row') {
        const currentRowSideLineIndex = currentSideLineIndex[0]
        const currentRowSideLinePosition = currentSideLinePosition[1]
        const top = getTop(currentRowSideLineIndex, headerRowsHeight, scrollPosition)
        let height = currentRowSideLinePosition - top
        if (height <= 0) {
          height = 0
        }
        headerRowsHeight[currentRowSideLineIndex] = height
        setHeaderRowsHeight([...headerRowsHeight])
        setCurrentSideLineIndex(p => [-1, p[1]])
        setCurrentSideLinePosition(p => [-1, p[1]])
      }
    }
  }, [clearState, currentSideLineIndex, currentSideLinePosition, headerColsWidth, headerRowsHeight, isMouseDown, scrollPosition, setCurrentSideLineIndex, setCurrentSideLinePosition, setHeaderColsWidth, setHeaderRowsHeight, sideLineMode])
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (currentPosition && currentPosition[0] === x && currentPosition[1] === y) {
          return
        }
        setCurrentPosition([x, y])
        if (isMouseDown) {
          setCurrentSideLinePosition([x, y])
        }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [canvasRef, currentPosition, handleMouseUp, isMouseDown, setCurrentSideLinePosition])

  return {
    currentPosition,
    setCurrentPosition,
    setIsMouseDown,
    handleMouseUp,
    cursor
  }
}