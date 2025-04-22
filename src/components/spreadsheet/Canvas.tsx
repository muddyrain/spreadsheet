import React, { useMemo, useRef, useEffect, useState, } from 'react';
import { SelectionSheetType, TableData } from '../../types/sheet';
import { useSheetScroll } from '../../hooks/useSheetScroll';
import { useSheetDraw } from '../../hooks/useSheetDraw';
import { ScrollBar } from './ScrollBar';
import { useSheetSelection } from '@/hooks/useSheetSelection';

export type CanvasOnKeyDown = (e: React.KeyboardEvent, options: {
    selection: SelectionSheetType
}) => void
interface CanvasProps {
    data: TableData;
    cellWidth: number;
    cellHeight: number;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
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
    onCellClick,
    onCellDoubleClick,
    onScroll,
    onKeyDown
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const scrollConfig = useMemo(() => ({
        totalWidth: data[0].length * cellWidth,
        totalHeight: data.length * cellHeight,
        viewportWidth: containerWidth,
        viewportHeight: containerHeight,
        onScroll
    }), [data, cellWidth, cellHeight, containerWidth, containerHeight, onScroll]);
    const { selection, movedRef, handleCellMouseDown } = useSheetSelection(data, {
        width: cellWidth,
        height: cellHeight,
    });
    const {
        scrollPosition,
        handleScrollbarDragStart,
        handleWheel,
    } = useSheetScroll(scrollConfig);

    const { drawTable } = useSheetDraw(data, {
        cellWidth,
        cellHeight,
        wrapperWidth: containerWidth,
        wrapperHeight: containerHeight,
        selection
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
            drawTable(ctx, scrollPosition);
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
        if (wrapperRef.current) {
            wrapperRef.current.addEventListener("wheel", handleWheel)
        }
        return () => {
            if (wrapperRef.current) {
                wrapperRef.current.removeEventListener("wheel", handleWheel)
            }
        }
    }, [wrapperRef, handleWheel])

    function handleGetClient<T extends React.MouseEvent<HTMLCanvasElement, MouseEvent>>(e: T, callback: (
        rowIndex: number, colIndex: number) => void) {
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left + scrollPosition.x;
            const y = e.clientY - rect.top + scrollPosition.y;
            const colIndex = Math.floor(x / cellWidth);
            const rowIndex = Math.floor(y / cellHeight);
            callback(rowIndex, colIndex)
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
                    tabIndex={0}
                    ref={canvasRef}
                    onKeyDown={e => {
                        onKeyDown?.(e, {
                            selection,
                        })
                    }}
                    onClick={(e) => {
                        if (!movedRef.current && onCellClick) { // 只在没有拖动时才触发
                            handleGetClient(e, onCellClick)
                        }
                        movedRef.current = false; // 重置
                    }}
                    onDoubleClick={(e) => {
                        if (!movedRef.current && onCellDoubleClick) { // 只在没有拖动时才触发
                            handleGetClient(e, onCellDoubleClick)
                        }
                        movedRef.current = false; // 重置
                    }}
                    onMouseDown={(e) => {
                        onCellClick && handleGetClient(e, onCellClick)
                        handleGetClient(e, (rowIndex, colIndex) => {
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
                    contentSize={data[0].length * cellWidth}
                    scrollPosition={scrollPosition.x}
                    onDragStart={handleScrollbarDragStart}
                />
            }
            {
                scrollConfig?.totalHeight > containerHeight &&
                <ScrollBar
                    type="vertical"
                    viewportSize={containerHeight}
                    contentSize={data.length * cellHeight}
                    scrollPosition={scrollPosition.y}
                    onDragStart={handleScrollbarDragStart}
                />
            }

        </>
    );
};