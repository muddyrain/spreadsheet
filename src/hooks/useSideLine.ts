import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "./useStore";
import { PositionType } from "@/types/sheet";
import { getLeft } from "@/utils/sheet";

export const useSideLine = (options: {
  currentHoverCell: [number, number] | null;
  scrollPosition: PositionType;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef, scrollPosition } = options
  const { data, headerColsWidth, setHeaderColsWidth } = useStore()
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [currentColSideLinePosition, setCurrentColSideLinePosition] = useState<number>(-1);
  const [currentColSideLineIndex, setCurrentColSideLineIndex] = useState(-1);
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
          const [x] = currentPosition || [0, 0]
          setCurrentColSideLinePosition(x)
          const cellWidth = headerColsWidth[colIndex]
          const left = getLeft(colIndex, headerColsWidth, scrollPosition)
          const offset = currentColSideLinePosition - left
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
          return 'e-resize'
        }
      }
    }
    return 'cell';
  }, [currentHoverCell, currentColSideLinePosition, currentPosition, isMouseDown, headerColsWidth, data, scrollPosition])

  const handleMouseUp = useCallback(() => {
    if (isMouseDown) {
      const left = getLeft(currentColSideLineIndex, headerColsWidth, scrollPosition)
      let width = currentColSideLinePosition - left
      if (width <= 0) {
        width = 0
      }
      headerColsWidth[currentColSideLineIndex] = width
      setHeaderColsWidth([...headerColsWidth])
      setIsMouseDown(false);
      setCurrentColSideLineIndex(-1)
      setCurrentColSideLinePosition(-1)
    }
  }, [isMouseDown, currentColSideLineIndex, currentColSideLinePosition, headerColsWidth, scrollPosition, setHeaderColsWidth])
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
    currentPosition,
    currentColSideLineIndex,
    currentColSideLinePosition,
    setCurrentColSideLineIndex,
    setCurrentColSideLinePosition,
    setCurrentPosition,
    setIsMouseDown,
    handleMouseUp,
    cursor
  }
}