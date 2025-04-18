import { useCallback } from 'react';
import { TableData } from '../types/sheet';

interface DrawConfig {
    cellWidth: number;
    cellHeight: number;
    wrapperWidth: number;
    wrapperHeight: number;
}

export const useSheetDraw = (data: TableData, config: DrawConfig) => {
    const drawTable = useCallback((ctx: CanvasRenderingContext2D, scrollPosition: { x: number; y: number }) => {
        ctx.clearRect(0, 0, config.wrapperWidth, config.wrapperHeight);
        ctx.lineWidth = 1;

        const startRow = Math.floor(scrollPosition.y / config.cellHeight);
        const endRow = Math.min(
            startRow + Math.ceil(config.wrapperHeight / config.cellHeight),
            data.length
        );
        const startCol = Math.floor(scrollPosition.x / config.cellWidth);
        const endCol = Math.min(
            startCol + Math.ceil(config.wrapperWidth / config.cellWidth),
            data[0].length
        );

        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex][colIndex];
                const x = colIndex * config.cellWidth - scrollPosition.x;
                const y = rowIndex * config.cellHeight - scrollPosition.y;

                // 绘制网格
                ctx.strokeStyle = '#ddd';
                ctx.strokeRect(x, y, config.cellWidth, config.cellHeight);

                // 设置背景颜色
                if (cell.style.background) {
                    ctx.fillStyle = cell.style.background;
                    ctx.fillRect(x, y, config.cellWidth, config.cellHeight);
                }

                // 设置字体样式
                const fontWeight = cell.style.fontWeight || 'normal';
                ctx.font = `${fontWeight} 16px Arial`;
                ctx.fillStyle = cell.style.color || '#000';

                // 设置文本对齐
                ctx.textAlign = cell.style.textAlign as CanvasTextAlign || 'left';
                ctx.textBaseline = 'middle';

                // 计算文本位置
                let textX = x + 10;
                if (ctx.textAlign === 'center') textX = x + config.cellWidth / 2;
                if (ctx.textAlign === 'right') textX = x + config.cellWidth - 10;
                const textY = y + config.cellHeight / 2;
                ctx.fillText(cell.value, textX, textY);
            }
        }
    }, [data, config]);

    return { drawTable };
};