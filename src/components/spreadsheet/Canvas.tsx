import React, { useMemo, useRef, useEffect, useState } from "react";
import { CellData, SelectionSheetType, TableData } from "@/types/sheet";
import { useSheetScroll } from "@/hooks/useSheetScroll";
import { useSheetDraw } from "@/hooks/useSheetDraw";
import { ScrollBar } from "./ScrollBar";
import { useSheetSelection } from "@/hooks/useSheetSelection";
import { useStore } from "@/hooks/useStore";
import { useSideLine } from "@/hooks/useSideLine";
import { findIndexByAccumulate } from "@/utils/sheet";

export type CanvasOnKeyDown = (
  e: React.KeyboardEvent,
  options: {
    selection: SelectionSheetType;
    setSelection: (selection: SelectionSheetType) => void;
  },
) => void;
interface CanvasProps {
  data: TableData;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  selectedCell: CellData | null;
  onCellClick?: (row: number, col: number) => void;
  onCellDoubleClick?: (row: number, col: number) => void;
  onKeyDown?: CanvasOnKeyDown;
}

export const Canvas: React.FC<CanvasProps> = ({
  data,
  wrapperRef,
  selectedCell,
  onCellClick,
  onCellDoubleClick,
  onKeyDown,
}) => {
  const {
    config,
    zoomSize,
    headerColsWidth,
    headerRowsHeight,
    setCurrentSideLinePosition,
  } = useStore();
  const rafId = useRef<number | null>(null);
  const [currentHoverCell, setCurrentHoverCell] = useState<
    [number, number] | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const totalWidth = useMemo(() => {
    return headerColsWidth.reduce((sum, prev) => sum + prev, 0);
  }, [headerColsWidth]);
  const totalHeight = useMemo(() => {
    return headerRowsHeight.reduce((sum, prev) => sum + prev, 0);
  }, [headerRowsHeight]);
  const scrollConfig = useMemo(
    () => ({
      totalWidth: totalWidth,
      totalHeight: totalHeight,
      viewportWidth: containerWidth,
      viewportHeight: containerHeight,
    }),
    [containerWidth, containerHeight, totalWidth, totalHeight],
  );
  // 选中 hooks
  const { selection, movedRef, handleCellMouseDown, setSelection } =
    useSheetSelection();
  // 滚动 hooks
  const { scrollPosition, handleScrollbarDragStart, handleWheel } =
    useSheetScroll(scrollConfig);

  // 单元格侧边栏 hooks - 拖拽侧边
  const { cursor, currentPosition, setIsMouseDown, handleMouseUp } =
    useSideLine({
      currentHoverCell,
      canvasRef,
      scrollPosition,
    });
  // 绘制 hooks
  const { drawTable } = useSheetDraw({
    wrapperWidth: containerWidth,
    wrapperHeight: containerHeight,
    selection,
    selectedCell,
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    // 缩放后实际渲染尺寸
    const width = containerWidth * dpr;
    const height = containerHeight * dpr;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      rafId.current = requestAnimationFrame(() => {
        drawTable(ctx);
      });
      ctx.restore();
    }
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [containerHeight, containerWidth, drawTable, zoomSize]);
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef]);
  useEffect(() => {
    const currentWrapper = wrapperRef.current;
    if (currentWrapper) {
      currentWrapper.addEventListener("wheel", handleWheel);
    }
    return () => {
      if (currentWrapper) {
        currentWrapper.removeEventListener("wheel", handleWheel);
      }
    };
  }, [wrapperRef, handleWheel]);

  function handleGetClient<
    T extends React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  >(
    e: T,
    _: "click" | "doubleClick" | "move",
    callback: (
      rowIndex: number,
      colIndex: number,
      x: number,
      y: number,
    ) => void,
  ) {
    const canvas = canvasRef.current;
    const fixedColWidth = config.fixedColWidth * zoomSize;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      // 关键：坐标除以 zoomSize
      const x = (e.clientX - rect.left) / zoomSize;
      const y = (e.clientY - rect.top) / zoomSize;

      let colIndex: number | null = null;
      let rowIndex: number | null = null;

      // 判断是否在固定列和/或固定行
      const inFixedCol = x < fixedColWidth;
      const inFixedRow = y < config.height;
      if (inFixedCol && inFixedRow) {
        // 左上角交叉区
        colIndex = 0;
        rowIndex = 0;
      } else if (inFixedCol) {
        // 固定列
        colIndex = 0;
        rowIndex = findIndexByAccumulate(
          headerRowsHeight,
          y + scrollPosition.y,
        );
      } else if (inFixedRow) {
        // 固定行
        colIndex = findIndexByAccumulate(headerColsWidth, x + scrollPosition.x);
        rowIndex = 0;
      } else {
        colIndex = findIndexByAccumulate(headerColsWidth, x + scrollPosition.x);
        rowIndex = findIndexByAccumulate(
          headerRowsHeight,
          y + scrollPosition.y,
        );
      }
      // 判断是否越界
      if (
        rowIndex != null &&
        colIndex != null &&
        rowIndex >= 0 &&
        rowIndex < data.length &&
        colIndex >= 0 &&
        colIndex < data[0].length
      ) {
        callback(
          rowIndex,
          colIndex,
          x + scrollPosition.x,
          y + scrollPosition.y,
        );
      }
    }
  }
  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "calc(100% - 10px)",
          height: "calc(100% - 10px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <canvas
          className="outline-0"
          style={{
            cursor,
          }}
          tabIndex={0}
          ref={canvasRef}
          onMouseMove={(e) => {
            handleGetClient(e, "move", (rowIndex, colIndex) => {
              setCurrentHoverCell((currentHoverCell) => {
                if (
                  currentHoverCell &&
                  currentHoverCell[0] === rowIndex &&
                  currentHoverCell[1] === colIndex
                )
                  return currentHoverCell;
                return [rowIndex, colIndex];
              });
            });
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e, {
              selection,
              setSelection,
            });
          }}
          onDoubleClick={(e) => {
            if (!movedRef.current && onCellDoubleClick) {
              // 只在没有拖动时才触发
              handleGetClient(e, "doubleClick", onCellDoubleClick);
            }
            movedRef.current = false; // 重置
          }}
          onMouseUp={() => {
            handleMouseUp();
          }}
          onMouseDown={(e) => {
            if (["col-resize", "row-resize"].includes(cursor)) {
              setIsMouseDown(true);
              if (currentPosition) {
                setCurrentSideLinePosition(currentPosition);
              }
              return;
            }
            handleGetClient(e, "click", (rowIndex, colIndex) => {
              onCellClick?.(rowIndex, colIndex);
              const currentCell = data[rowIndex][colIndex];
              if (currentCell?.readOnly) return;
              handleCellMouseDown(
                rowIndex,
                colIndex,
                wrapperRef,
                scrollPosition,
              );
            });
          }}
        />
      </div>
      {scrollConfig && scrollConfig.totalWidth > scrollConfig.viewportWidth && (
        <ScrollBar
          type="horizontal"
          viewportSize={scrollConfig.viewportWidth}
          contentSize={scrollConfig?.totalWidth}
          scrollPosition={scrollPosition.x}
          onDragStart={handleScrollbarDragStart}
        />
      )}
      {scrollConfig &&
        scrollConfig.totalHeight > scrollConfig.viewportHeight && (
          <ScrollBar
            type="vertical"
            viewportSize={scrollConfig.viewportHeight}
            contentSize={scrollConfig?.totalHeight}
            scrollPosition={scrollPosition.y}
            onDragStart={handleScrollbarDragStart}
          />
        )}
    </>
  );
};
