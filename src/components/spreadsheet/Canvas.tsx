import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { CellData, TableData } from "@/types/sheet";
import { useSheetScroll } from "@/hooks/useSheetScroll";
import { useSheetDraw } from "@/hooks/useSheetDraw";
import { ScrollBar } from "./ScrollBar";
import { useSheetSelection } from "@/hooks/useSheetSelection";
import { useStore } from "@/hooks/useStore";
import { useSideLine } from "@/hooks/useSideLine";
import { useComputed } from "@/hooks/useComputed";

interface CanvasProps {
  data: TableData;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  selectedCell: CellData | null;
  onCellClick?: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    options: { row: number; col: number },
  ) => void;
  onCellDoubleClick?: (row: number, col: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  data,
  wrapperRef,
  selectedCell,
  onCellClick,
  onCellDoubleClick,
}) => {
  const {
    config,
    cursor,
    zoomSize,
    headerColsWidth,
    headerRowsHeight,
    containerWidth,
    containerHeight,
    setContainerWidth,
    setContainerHeight,
    setCurrentSideLinePosition,
  } = useStore();
  const rafId = useRef<number | null>(null);
  const lastClickRowCol = useRef<[number, number] | null>(null);
  const [currentHoverCell, setCurrentHoverCell] = useState<
    [number, number] | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { findIndexByAccumulate } = useComputed();
  const scrollConfig = useMemo(
    () => ({
      totalWidth:
        headerColsWidth.reduce((sum, prev) => sum + prev, 0) * zoomSize +
        config.scrollAreaPadding,
      totalHeight:
        headerRowsHeight.reduce((sum, prev) => sum + prev, 0) * zoomSize +
        config.scrollAreaPadding,
      viewportWidth: containerWidth,
      viewportHeight: containerHeight,
    }),
    [
      containerWidth,
      containerHeight,
      headerColsWidth,
      headerRowsHeight,
      config.scrollAreaPadding,
      zoomSize,
    ],
  );
  // 选中 hooks
  const { selection, movedRef, handleCellMouseDown } = useSheetSelection();

  // 滚动 hooks
  const { scrollPosition, handleScrollbarDragStart, handleWheel } =
    useSheetScroll(scrollConfig);

  // 单元格侧边栏 hooks - 拖拽侧边
  const { currentPosition, setIsMouseDown, handleMouseUp } = useSideLine({
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
    if (!ctx) return;
    // 重新渲染 Canvas
    rafId.current = requestAnimationFrame(() => {
      ctx.save(); // 确保在绘制前保存上下文状态
      ctx.scale(dpr, dpr); // 应用设备像素比缩放
      drawTable(ctx);
      ctx.restore(); // 将 restore 移到这里，确保在绘制后恢复上下文状态
    });
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [containerHeight, containerWidth, drawTable]);
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
  }, [setContainerWidth, setContainerHeight]);
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

  const handleGetClient = useCallback(
    <T extends React.MouseEvent<HTMLCanvasElement, MouseEvent>>(
      e: T,
      _: "click" | "doubleClick" | "move",
      callback: (
        rowIndex: number,
        colIndex: number,
        x: number,
        y: number,
      ) => void,
    ) => {
      const canvas = canvasRef.current;
      const fixedColWidth = config.fixedColWidth * zoomSize;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查是否在表格区域内
        const totalWidth =
          headerColsWidth.reduce((sum, prev) => sum + prev, 0) * zoomSize;
        const totalHeight =
          headerRowsHeight.reduce((sum, prev) => sum + prev, 0) * zoomSize;

        if (x > totalWidth || y > totalHeight || x < 0 || y < 0) {
          if (_ === "move") {
            setCurrentHoverCell(null);
          }
          return;
        }

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
          colIndex = findIndexByAccumulate(
            headerColsWidth,
            x + scrollPosition.x,
          );
          rowIndex = 0;
        } else {
          colIndex = findIndexByAccumulate(
            headerColsWidth,
            x + scrollPosition.x,
          );
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
    },
    [
      config.fixedColWidth,
      config.height,
      zoomSize,
      headerRowsHeight,
      headerColsWidth,
      scrollPosition,
      data,
      findIndexByAccumulate,
    ],
  );
  const handleMouseDownResize = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      // 添加最小移动距离判断
      const minDistance = 5;
      const startX = e.clientX;
      const startY = e.clientY;

      const handleInitialMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - startX);
        const deltaY = Math.abs(moveEvent.clientY - startY);

        if (deltaX > minDistance || deltaY > minDistance) {
          setIsMouseDown(true);
          if (currentPosition) {
            setCurrentSideLinePosition(currentPosition);
          }
          window.removeEventListener("mousemove", handleInitialMove);
        }
      };

      window.addEventListener("mousemove", handleInitialMove);
      window.addEventListener(
        "mouseup",
        () => {
          window.removeEventListener("mousemove", handleInitialMove);
        },
        { once: true },
      );
    },
    [currentPosition, setIsMouseDown, setCurrentSideLinePosition],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      handleGetClient(e, "move", (rowIndex, colIndex) => {
        setCurrentHoverCell((currentHoverCell) => {
          if (
            currentHoverCell &&
            currentHoverCell[0] === rowIndex &&
            currentHoverCell[1] === colIndex
          ) {
            return currentHoverCell;
          }
          return [rowIndex, colIndex];
        });
      });
    },
    [handleGetClient],
  );
  // 添加页面可见性监听
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCurrentHoverCell(null);
        setIsMouseDown(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setIsMouseDown]);
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
          onMouseMove={handleMouseMove}
          onMouseUp={() => {
            handleMouseUp();
          }}
          onMouseDown={(e) => {
            if (["col-resize", "row-resize"].includes(cursor)) {
              handleMouseDownResize(e);
              return;
            }
            if (e.detail === 1) {
              handleGetClient(e, "click", (rowIndex, colIndex) => {
                lastClickRowCol.current = [rowIndex, colIndex];
                onCellClick?.(e, { row: rowIndex, col: colIndex });
                handleCellMouseDown(rowIndex, colIndex, wrapperRef);
              });
            }
            // 双击
            if (e.detail === 2) {
              if (lastClickRowCol.current) {
                const [rowIndex, colIndex] = lastClickRowCol.current;
                onCellDoubleClick?.(rowIndex, colIndex);
              }
              movedRef.current = false;
            }
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
