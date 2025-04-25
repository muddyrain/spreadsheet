import React, { useMemo, useRef, useEffect, useState } from 'react';
import { EditingCell, SelectionSheetType, TableData } from '@/types/sheet';
import { useSheetScroll } from '@/hooks/useSheetScroll';
import { useSheetDraw } from '@/hooks/useSheetDraw';
import { ScrollBar } from './ScrollBar';
import { useSheetSelection } from '@/hooks/useSheetSelection';
import { useStore } from '@/hooks/useStore';
import { useSideLine } from '@/hooks/useSideLine';
import { findIndexByAccumulate } from '@/utils/sheet';


export type CanvasOnKeyDown = (e: React.KeyboardEvent, options: {
    selection: SelectionSheetType;
    setSelection: (selection: SelectionSheetType) => void;
}) => void
interface CanvasProps {
    data: TableData;
    cellWidth: number;
    cellHeight: number;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    selectedCell: EditingCell;
    onCellClick?: (row: number, col: number) => void;
    onCellDoubleClick?: (row: number, col: number) => void;
    onKeyDown?: CanvasOnKeyDown;
}

export const Canvas: React.FC<CanvasProps> = ({
    data,
    cellWidth,
    cellHeight,
    wrapperRef,
    selectedCell,
    onCellClick,
    onCellDoubleClick,
    onKeyDown
}) => {
    const { config, headerColsWidth, headerRowsHeight, setCurrentSideLinePosition } = useStore()
    const rafId = useRef<number | null>(null)
    const [currentHoverCell, setCurrentHoverCell] = useState<[number, number] | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const totalWidth = useMemo(() => {
        return headerColsWidth.reduce((sum, prev) => sum += prev, 0) + 50
    }, [headerColsWidth])
    const totalHeight = useMemo(() => {
        return headerRowsHeight.reduce((sum, prev) => sum += prev, 0) + 50
    }, [headerRowsHeight])
    const scrollConfig = useMemo(() => ({
        totalWidth,
        totalHeight,
        viewportWidth: containerWidth,
        viewportHeight: containerHeight,
    }), [containerWidth, containerHeight, totalWidth, totalHeight]);
    const { selection, movedRef, handleCellMouseDown, setSelection } = useSheetSelection();
    // 滚动 hooks
    const {
        scrollPosition,
        handleScrollbarDragStart,
        handleWheel,
    } = useSheetScroll(scrollConfig);
    // 单元格侧边栏 hooks - 拖拽侧边    
    const { cursor, currentPosition, setIsMouseDown, handleMouseUp } = useSideLine({
        currentHoverCell,
        canvasRef,
        scrollPosition
    })
    // 绘制 hooks
    const { drawTable } = useSheetDraw({
        cellWidth,
        cellHeight,
        wrapperWidth: containerWidth,
        wrapperHeight: containerHeight,
        selection,
        selectedCell
    });
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // 适配高分屏
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (containerWidth) * dpr;
        canvas.height = (containerHeight) * dpr;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            rafId.current = requestAnimationFrame(() => {
                drawTable(ctx);
            });
        }
        return () => {
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        }
    }, [containerHeight, containerWidth, drawTable])
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
                setContainerHeight(containerRef.current.clientHeight);
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [containerRef])
    useEffect(() => {
        const currentWrapper = wrapperRef.current;
        if (currentWrapper) {
            currentWrapper.addEventListener("wheel", handleWheel)
        }
        return () => {
            if (currentWrapper) {
                currentWrapper.removeEventListener("wheel", handleWheel)
            }
        }
    }, [wrapperRef, handleWheel])

    function handleGetClient<T extends React.MouseEvent<HTMLCanvasElement, MouseEvent>>(e: T, callback: (
        rowIndex: number, colIndex: number, x: number, y: number) => void) {
        const canvas = canvasRef.current;
        const fixedColWidth = config.fixedColWidth;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

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
                rowIndex = findIndexByAccumulate(headerRowsHeight, y + scrollPosition.y)
            } else if (inFixedRow) {
                // 固定行
                colIndex = findIndexByAccumulate(headerColsWidth, x + scrollPosition.x)
                rowIndex = 0;
            } else {
                colIndex = findIndexByAccumulate(headerColsWidth, x + scrollPosition.x)
                rowIndex = findIndexByAccumulate(headerRowsHeight, y + scrollPosition.y)
            }
            // 判断是否越界
            if (
                rowIndex != null && colIndex != null &&
                rowIndex >= 0 && rowIndex < data.length &&
                colIndex >= 0 && colIndex < data[0].length
            ) {
                callback(rowIndex, colIndex, x + scrollPosition.x, y + scrollPosition.y);
            }
        }
    }
    return (
        <>
            <div
                ref={containerRef}
                style={{
                    width: 'calc(100% - 10px)',
                    height: 'calc(100% - 10px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <canvas
                    className='outline-0'
                    style={{
                        cursor,
                    }}
                    tabIndex={0}
                    ref={canvasRef}
                    onMouseMove={e => {
                        handleGetClient(e, (rowIndex, colIndex) => {
                            setCurrentHoverCell([rowIndex, colIndex])
                        })
                    }}
                    onKeyDown={e => {
                        onKeyDown?.(e, {
                            selection,
                            setSelection
                        })
                    }}
                    onDoubleClick={(e) => {
                        if (!movedRef.current && onCellDoubleClick) { // 只在没有拖动时才触发
                            handleGetClient(e, onCellDoubleClick)
                        }
                        movedRef.current = false; // 重置
                    }}
                    onMouseUp={() => {
                        handleMouseUp()
                    }}
                    onMouseDown={(e) => {
                        if (['col-resize', 'row-resize'].includes(cursor)) {
                            setIsMouseDown(true);
                            if (currentPosition) {
                                setCurrentSideLinePosition(currentPosition)
                            }
                            return;
                        }
                        handleGetClient(e, (rowIndex, colIndex) => {
                            onCellClick?.(rowIndex, colIndex)
                            const currentCell = data[rowIndex][colIndex];
                            if (currentCell?.readOnly) return;
                            handleCellMouseDown(rowIndex, colIndex, wrapperRef, scrollPosition)
                        })
                    }}
                />
            </div>
            {
                scrollConfig?.totalWidth > containerWidth &&
                <ScrollBar
                    type="horizontal"
                    viewportSize={containerWidth}
                    contentSize={totalWidth}
                    scrollPosition={scrollPosition.x}
                    onDragStart={handleScrollbarDragStart}
                />
            }
            {
                scrollConfig?.totalHeight > containerHeight &&
                <ScrollBar
                    type="vertical"
                    viewportSize={containerHeight}
                    contentSize={totalHeight}
                    scrollPosition={scrollPosition.y}
                    onDragStart={handleScrollbarDragStart}
                />
            }
        </>
    );
};