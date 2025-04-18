import React, { useMemo, useRef, useEffect, useState } from 'react';
import { TableData } from '../../types/sheet';
import { useSheetScroll } from '../../hooks/useSheetScroll';
import { useSheetDraw } from '../../hooks/useSheetDraw';
import { ScrollBar } from './ScrollBar';

interface CanvasProps {
    data: TableData;
    cellWidth: number;
    cellHeight: number;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    onCellClick: (row: number, col: number) => void;
    onScroll: (position: { x: number; y: number }) => void;  // 新增
}

export const Canvas: React.FC<CanvasProps> = ({
    data,
    cellWidth,
    cellHeight,
    onCellClick,
    onScroll,
    wrapperRef
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

    const {
        scrollPosition,
        handleScrollbarDragStart,
        handleWheel,
    } = useSheetScroll(scrollConfig);

    // 移除原来的 useEffect
    const { drawTable } = useSheetDraw(data, {
        cellWidth,
        cellHeight,
        wrapperWidth: containerWidth,
        wrapperHeight: containerHeight
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
                    ref={canvasRef}
                    onClick={(e) => {
                        const canvas = canvasRef.current;
                        if (canvas) {
                            const rect = canvas.getBoundingClientRect();
                            const x = e.clientX - rect.left + scrollPosition.x;
                            const y = e.clientY - rect.top + scrollPosition.y;
                            const colIndex = Math.floor(x / cellWidth);
                            const rowIndex = Math.floor(y / cellHeight);
                            onCellClick(rowIndex, colIndex);
                        }
                    }}
                />
            </div>
            <ScrollBar
                type="vertical"
                viewportSize={containerHeight}
                contentSize={data.length * cellHeight}
                scrollPosition={scrollPosition.y}
                onDragStart={handleScrollbarDragStart}
            />

            <ScrollBar
                type="horizontal"
                viewportSize={containerWidth}
                contentSize={data[0].length * cellWidth}
                scrollPosition={scrollPosition.x}
                onDragStart={handleScrollbarDragStart}
            />
        </>
    );
};