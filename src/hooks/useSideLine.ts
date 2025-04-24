import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "./useStore";
import { PositionType } from "@/types/sheet";
import { getLeft, getTop } from "@/utils/sheet";

export const useSideLine = (options: {
  currentHoverCell: [number, number] | null;
  scrollPosition: PositionType;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef, scrollPosition } = options
  const { data, headerColsWidth, setHeaderColsWidth, headerRowsHeight, setHeaderRowsHeight } = useStore()
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [currentColSideLinePosition, setCurrentColSideLinePosition] = useState<number>(-1);
  const [currentColSideLineIndex, setCurrentColSideLineIndex] = useState(-1);
  const [sideLineMode, setSideLineMode] = useState<'row' | 'col' | null>(null)
  const [currentRowSideLinePosition, setCurrentRowSideLinePosition] = useState<number>(-1);
  const [currentRowSideLineIndex, setCurrentRowSideLineIndex] = useState(-1);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const cursor = useMemo(() => {
    if (currentHoverCell) {
      const [rowIndex, colIndex] = currentHoverCell;
      const currentCell = data[rowIndex][colIndex];
      if (currentCell?.readOnly) {
        if (rowIndex === 0 && colIndex === 0) {
          return 'se-resize'
        }
        if (rowIndex === 0) {
          setSideLineMode('col')
          const [x] = currentPosition || [0, 0]
          setCurrentColSideLinePosition(x)
          const cellWidth = headerColsWidth[colIndex]
          const left = getLeft(colIndex, headerColsWidth, scrollPosition)
          const offset = x - left
          if (offset <= 5 && colIndex > 1) {
            if (!isMouseDown) {
              setCurrentColSideLineIndex(colIndex - 1)
            }
            return 'col-resize'
          }
          if (offset >= cellWidth - 5) {
            if (!isMouseDown) {
              setCurrentColSideLineIndex(colIndex)
            }
            return 'col-resize'
          }
          return 's-resize'
        }
        if (colIndex === 0) {
          setSideLineMode('row')
          const [_, y] = currentPosition || [0, 0]
          setCurrentRowSideLinePosition(y)
          const cellHeight = headerRowsHeight[rowIndex]
          const top = getTop(rowIndex, headerRowsHeight, scrollPosition)
          const offset = y - top
          if (offset <= 5 && rowIndex > 1) {
            if (!isMouseDown) {
              setCurrentRowSideLineIndex(rowIndex - 1)
            }
            return 'row-resize'
          }
          if (offset >= cellHeight - 5) {
            if (!isMouseDown) {
              setCurrentRowSideLineIndex(rowIndex)
            }
            return 'row-resize'
          }
          return 'e-resize'
        }
      }
    }
    return 'cell';
  }, [currentHoverCell, currentPosition, isMouseDown, headerColsWidth, headerRowsHeight, data, scrollPosition])

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    if (isMouseDown) {
      if (sideLineMode === 'col') {
        const left = getLeft(currentColSideLineIndex, headerColsWidth, scrollPosition)
        let width = currentColSideLinePosition - left
        if (width <= 0) {
          width = 0
        }
        headerColsWidth[currentColSideLineIndex] = width
        setHeaderColsWidth([...headerColsWidth])
        setCurrentColSideLineIndex(-1)
        setCurrentColSideLinePosition(-1)
      }
      if (sideLineMode === 'row') {
        const top = getTop(currentRowSideLineIndex, headerRowsHeight, scrollPosition)
        let height = currentRowSideLinePosition - top
        if (height <= 0) {
          height = 0
        }
        headerRowsHeight[currentRowSideLineIndex] = height
        setHeaderRowsHeight([...headerRowsHeight])
        setCurrentRowSideLineIndex(-1)
        setCurrentRowSideLinePosition(-1)
      }
    }
  }, [isMouseDown, sideLineMode, currentColSideLineIndex, currentRowSideLineIndex, currentColSideLinePosition, currentRowSideLinePosition, headerColsWidth, headerRowsHeight, scrollPosition, setHeaderColsWidth, setHeaderRowsHeight])
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPosition([x, y])
        if (isMouseDown) {
          setCurrentColSideLinePosition(x)
        }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseup', handleMouseMove)
    }
  }, [canvasRef, isMouseDown, scrollPosition, headerColsWidth, handleMouseUp])
  return {
    isMouseDown,
    sideLineMode,
    currentPosition,
    currentColSideLineIndex,
    currentColSideLinePosition,
    currentRowSideLinePosition,
    setCurrentColSideLineIndex,
    setCurrentColSideLinePosition,
    setCurrentPosition,
    setIsMouseDown,
    handleMouseUp,
    cursor
  }
}