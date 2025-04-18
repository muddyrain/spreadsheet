import { useCallback, useContext } from 'react';
import { TableData } from '../types/sheet';
import { SpreadsheetContext } from '../components/spreadsheet';

interface DrawConfig {
    cellWidth: number;
    cellHeight: number;
    wrapperWidth: number;
    wrapperHeight: number;
}

export const useSheetDraw = (data: TableData, drawConfig: DrawConfig) => {
    const { config } = useContext(SpreadsheetContext)
    const drawTable = useCallback((ctx: CanvasRenderingContext2D, scrollPosition: { x: number; y: number }) => {
        ctx.clearRect(0, 0, drawConfig.wrapperWidth, drawConfig.wrapperHeight);
        ctx.lineWidth = 1;

        const startRow = Math.floor(scrollPosition.y / drawConfig.cellHeight);
        const endRow = Math.min(
            startRow + Math.ceil(drawConfig.wrapperHeight / drawConfig.cellHeight),
            data.length
        );
        const startCol = Math.floor(scrollPosition.x / drawConfig.cellWidth);
        const endCol = Math.min(
            startCol + Math.ceil(drawConfig.wrapperWidth / drawConfig.cellWidth),
            data[0].length
        );
        ctx.translate(0.5, 0.5)
        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex][colIndex];
                const x = colIndex * drawConfig.cellWidth - scrollPosition.x;
                const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                // 绘制网格
                ctx.strokeStyle = '#dfdfdf';
                ctx.strokeRect(x, y, drawConfig.cellWidth, drawConfig.cellHeight);

                // 设置背景颜色
                if (cell.style.background) {
                    ctx.fillStyle = cell.style.background;
                    ctx.fillRect(x, y, drawConfig.cellWidth, drawConfig.cellHeight);
                }

                // 设置字体样式
                const fontWeight = cell.style.fontWeight || 'normal';
                const fontSize = cell.style.fontSize || config.fontSize || 16;
                ctx.font = `${fontWeight} ${fontSize}px Arial`;
                ctx.fillStyle = cell.style.color || '#000';

                // 设置文本对齐
                ctx.textAlign = cell.style.textAlign as CanvasTextAlign || 'left';
                ctx.textBaseline = 'middle';

                // 计算文本位置
                let textX = x + 10;
                if (ctx.textAlign === 'center') textX = x + drawConfig.cellWidth / 2;
                if (ctx.textAlign === 'right') textX = x + drawConfig.cellWidth - 10;
                const textY = y + drawConfig.cellHeight / 2;
                ctx.fillText(cell.value, textX, textY);
            }
        }
    }, [data, drawConfig]);

    return { drawTable };
};