import { useEffect, useMemo, useState } from "react";
import { useStore } from "./useStore";

export const useSideLine = (options: {
  currentHoverCell: [number, number] | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const { currentHoverCell, canvasRef } = options
  const { data, config } = useStore()
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
          // 判断是否悬浮在固定列右边界
          const offset = Math.abs((x - config.fixedColWidth) % config.width);
          if (offset <= 5) {
            setCurrentColSideLineIndex(colIndex - 1)
            return 'col-resize'
          }
          if (offset >= config.width - 5) {
            setCurrentColSideLineIndex(colIndex)
            return 'col-resize'
          }
          setCurrentColSideLineIndex(-1)
          return 's-resize'
        }
        if (colIndex === 0) {
          return 'e-resize'
        }
      }
    }
    return 'cell';
  }, [currentHoverCell, currentPosition, config, data])

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setCurrentColSideLineIndex(-1)
    setCurrentColSideLinePosition(-1)
  }
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
  }, [canvasRef, isMouseDown])

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