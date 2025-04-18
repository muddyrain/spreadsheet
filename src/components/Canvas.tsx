import React, { useMemo, useRef, useEffect } from 'react';
import { TableData } from '../types/sheet';
import { useSheetScroll } from '../hooks/useSheetScroll';
import { useSheetDraw } from '../hooks/useSheetDraw';
import { ScrollBar } from './ScrollBar';

interface CanvasProps {
    data: TableData;
    cellWidth: number;
    cellHeight: number;
    wrapperWidth: number;
    wrapperHeight: number;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    onCellClick: (row: number, col: number) => void;
    onScroll: (position: { x: number; y: number }) => void;  // 新增
}

export const Canvas: React.FC<CanvasProps> = ({
    data,
    cellWidth,
    cellHeight,
    wrapperWidth,
    wrapperHeight,
    onCellClick,
    onScroll,
    wrapperRef
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollConfig = useMemo(() => ({
        totalWidth: data[0].length * cellWidth,
        totalHeight: data.length * cellHeight,
        viewportWidth: wrapperWidth,
        viewportHeight: wrapperHeight,
        onScroll
    }), [data, cellWidth, cellHeight, wrapperWidth, wrapperHeight, onScroll]);

    const {
        scrollPosition,
        handleScrollbarDragStart,
        handleWheel,
    } = useSheetScroll(scrollConfig);

    // 移除原来的 useEffect
    const { drawTable } = useSheetDraw(data, {
        cellWidth,
        cellHeight,
        wrapperWidth,
        wrapperHeight
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 适配高分屏
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (wrapperWidth + 10) * dpr;
        canvas.height = (wrapperHeight + 10) * dpr;
        canvas.style.width = `${wrapperWidth}px`;
        canvas.style.height = `${wrapperHeight}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            drawTable(ctx, scrollPosition);
        }
    }, [drawTable, scrollPosition, wrapperWidth, wrapperHeight]);
    useEffect(() => {
        onScroll?.(scrollPosition);
    }, [scrollPosition, onScroll]);
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
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >

            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                }}
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
            <ScrollBar
                type="vertical"
                viewportSize={wrapperHeight}
                contentSize={data.length * cellHeight}
                scrollPosition={scrollPosition.y}
                onDragStart={handleScrollbarDragStart}
            />

            <ScrollBar
                type="horizontal"
                viewportSize={wrapperWidth}
                contentSize={data[0].length * cellWidth}
                scrollPosition={scrollPosition.x}
                onDragStart={handleScrollbarDragStart}
            />
        </div>
    );
};