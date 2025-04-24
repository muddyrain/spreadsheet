import React, { useMemo, useRef, useEffect, useState, } from 'react';
import { EditingCell, SelectionSheetType, TableData } from '../../types/sheet';
import { useSheetScroll } from '../../hooks/useSheetScroll';
import { useSheetDraw } from '../../hooks/useSheetDraw';
import { ScrollBar } from './ScrollBar';
import { useSheetSelection } from '@/hooks/useSheetSelection';
import { useStore } from '@/hooks/useStore';
import { useSideLine } from '@/hooks/useSideLine';

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
    onScroll: (position: { x: number; y: number }) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
    data,
    cellWidth,
    cellHeight,
    wrapperRef,
    selectedCell,
    onCellClick,
    onCellDoubleClick,
    onScroll,
    onKeyDown
}) => {
    const { config, headerColumnsWidth } = useStore()
    const [currentHoverCell, setCurrentHoverCell] = useState<[number, number] | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const totalWidth = useMemo(() => {
        return headerColumnsWidth.reduce((sum, prev) => sum += prev, 0) + config.fixedColWidth + 5
    }, [headerColumnsWidth, config.fixedColWidth])
    const scrollConfig = useMemo(() => ({
        totalWidth,
        totalHeight: data.length * cellHeight + 5,
        viewportWidth: containerWidth,
        viewportHeight: containerHeight,
        onScroll
    }), [data, cellHeight, containerWidth, containerHeight, onScroll, totalWidth]);
    const { selection, movedRef, handleCellMouseDown, setSelection } = useSheetSelection(data);
    const {
        scrollPosition,
        handleScrollbarDragStart,
        handleWheel,
    } = useSheetScroll(scrollConfig);
    const { isMouseDown, currentColSideLineIndex, currentColSideLinePosition, cursor, setIsMouseDown, handleMouseUp } = useSideLine({
        currentHoverCell,
        canvasRef
    })
    const { drawTable } = useSheetDraw(data, {
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
        let rafId: number | null = null;
        if (ctx) {
            rafId = requestAnimationFrame(() => {
                drawTable(ctx, scrollPosition);
            });
        }
        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        }
    }, [drawTable, scrollPosition, containerWidth, containerHeight]);
    useEffect(() => {
        onScroll?.(scrollPosition);
    }, [scrollPosition, onScroll]);
    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.clientWidth);
            setContainerHeight(containerRef.current.clientHeight);
        }
    }, [])
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
                rowIndex = Math.floor((y + scrollPosition.y - config.height) / cellHeight) + 1;
            } else if (inFixedRow) {
                // 固定行
                // 动态列宽下，计算 colIndex
                let accWidth = 0;
                let found = false;
                for (let i = 1;i < headerColumnsWidth.length;i++) {
                    accWidth += headerColumnsWidth[i];
                    if (x + scrollPosition.x - fixedColWidth < accWidth) {
                        colIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) colIndex = headerColumnsWidth.length - 1;
                rowIndex = 0;
            } else {
                // 普通区域
                let accWidth = 0;
                let found = false;
                for (let i = 1;i < headerColumnsWidth.length;i++) {
                    accWidth += headerColumnsWidth[i];
                    if (x + scrollPosition.x - fixedColWidth < accWidth) {
                        colIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) colIndex = headerColumnsWidth.length - 1;
                rowIndex = Math.floor((y + scrollPosition.y - config.height) / cellHeight) + 1;
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
                            if (currentHoverCell && rowIndex === currentHoverCell[0] && colIndex === currentHoverCell[1]) return;
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
                    onMouseDown={(e) => {
                        if (currentColSideLineIndex !== -1) {
                            setIsMouseDown(true);
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
                    contentSize={data.length * cellHeight + 5}
                    scrollPosition={scrollPosition.y}
                    onDragStart={handleScrollbarDragStart}
                />
            }
            {
                // 当前列侧线
                isMouseDown &&
                <div className="h-full bg-red-400" style={{
                    width: 1,
                    position: 'absolute',
                    left: currentColSideLinePosition,
                    top: 0,
                }} onMouseUp={handleMouseUp} />
            }
        </>
    );
};