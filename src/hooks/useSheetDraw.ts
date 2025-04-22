import { useCallback } from 'react';
import { CellData, SelectionSheetType, TableData } from '../types/sheet';
import { useStore } from './useStore';

interface DrawConfig {
    cellWidth: number;
    cellHeight: number;
    wrapperWidth: number;
    wrapperHeight: number;
}

// 冻结行数和列数（可根据需要调整）
const FROZEN_ROW_COUNT = 1;
const FROZEN_COL_COUNT = 1;

export const useSheetDraw = (data: TableData, drawConfig: DrawConfig & { selection?: SelectionSheetType }) => {
    const { config, isFocused } = useStore();
    const selection = drawConfig.selection;
    const isCellSelected = (row: number, col: number) => {
        if (!selection?.start || !selection?.end) return false;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);
        return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    };

    const drawTable = useCallback((ctx: CanvasRenderingContext2D, scrollPosition: { x: number; y: number }) => {
        ctx.clearRect(0, 0, drawConfig.wrapperWidth, drawConfig.wrapperHeight);
        ctx.lineWidth = 1;
        const startRow = Math.floor(scrollPosition.y / drawConfig.cellHeight) + FROZEN_ROW_COUNT;
        const endRow = Math.min(
            startRow + Math.ceil(drawConfig.wrapperHeight / drawConfig.cellHeight),
            data.length
        );
        const startCol = Math.floor(scrollPosition.x / drawConfig.cellWidth) + FROZEN_COL_COUNT;
        const endCol = Math.min(
            startCol + Math.ceil(drawConfig.wrapperWidth / drawConfig.cellWidth),
            data[0].length
        );
        const isOneSelection = selection?.start?.row === selection?.end?.row && selection?.start?.col === selection?.end?.col;
        ctx.translate(0.5, 0.5);

        // 绘制内容区（非冻结区）单元格
        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const x = colIndex * drawConfig.cellWidth - scrollPosition.x;
                const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell });
            }
        }
        // 绘制选区边框（只绘制在当前可视区域内的部分）
        if (selection?.start && selection?.end) {
            if (!(isOneSelection && isFocused)) {
                const r1 = Math.min(selection.start.row, selection.end.row);
                const r2 = Math.max(selection.start.row, selection.end.row);
                const c1 = Math.min(selection.start.col, selection.end.col);
                const c2 = Math.max(selection.start.col, selection.end.col);

                // 只绘制在当前可视区域内的部分
                if (
                    r2 >= startRow && r1 < endRow &&
                    c2 >= startCol && c1 < endCol
                ) {
                    const x = c1 * drawConfig.cellWidth - (c1 < FROZEN_COL_COUNT ? 0 : scrollPosition.x);
                    const y = r1 * drawConfig.cellHeight - (r1 < FROZEN_ROW_COUNT ? 0 : scrollPosition.y);
                    const width = (c2 - c1 + 1) * drawConfig.cellWidth;
                    const height = (r2 - r1 + 1) * drawConfig.cellHeight;

                    ctx.save();
                    ctx.strokeStyle = config.selectionBorderColor;
                    ctx.lineWidth = 1;
                    // 防止边框被其他元素遮挡
                    ctx.strokeRect(x + 1, y + 1, width - 1, height - 1);
                    ctx.restore();
                }
            }
        }
        // 绘制冻结首列（除左上角交叉单元格）
        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = 0;colIndex < FROZEN_COL_COUNT;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const x = colIndex * drawConfig.cellWidth;
                const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell });
            }
        }

        // 绘制冻结首行（除左上角交叉单元格）
        for (let rowIndex = 0;rowIndex < FROZEN_ROW_COUNT;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const x = colIndex * drawConfig.cellWidth - scrollPosition.x;
                const y = rowIndex * drawConfig.cellHeight;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell });
            }
        }

        // 绘制左上角交叉单元格（冻结区的左上角）
        for (let rowIndex = 0;rowIndex < FROZEN_ROW_COUNT;rowIndex++) {
            for (let colIndex = 0;colIndex < FROZEN_COL_COUNT;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const x = colIndex * drawConfig.cellWidth;
                const y = rowIndex * drawConfig.cellHeight;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell });
            }
        }
    }, [data, drawConfig, selection]);

    // 单元格绘制函数
    const renderCell = (ctx: CanvasRenderingContext2D, options: {
        rowIndex: number;
        colIndex: number;
        x: number;
        y: number;
        cell: CellData;
    }) => {
        const { rowIndex, colIndex, x, y, cell } = options;
        // 判断是否选中，绘制高亮背景
        if (isCellSelected && isCellSelected(rowIndex, colIndex)) {
            ctx.save();
            ctx.fillStyle = config.selectionBackgroundColor;
            ctx.fillRect(x, y, drawConfig.cellWidth, drawConfig.cellHeight);
            ctx.restore();
        }

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
        const fontStyle = cell.style.fontStyle || 'normal';
        const fontSize = cell.style.fontSize || config.fontSize || 14;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
        ctx.fillStyle = cell.style.color || '#000';

        // 设置剪裁区域
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 12, y, drawConfig.cellWidth, drawConfig.cellHeight);
        ctx.clip();

        // 设置文本对齐
        ctx.textAlign = cell.style.textAlign as CanvasTextAlign || 'left';
        ctx.textBaseline = 'middle';
        // 计算文本位置
        let textX = x + 10;
        if (ctx.textAlign === 'center') textX = x + drawConfig.cellWidth / 2;
        if (ctx.textAlign === 'right') textX = x + drawConfig.cellWidth - 10;
        const textY = y + drawConfig.cellHeight / 2;
        ctx.fillText(cell.value, textX, textY);

        const textDecoration = cell.style.textDecoration || 'none';
        // 绘制删除线
        if (textDecoration === 'line-through') {
            const textMetrics = ctx.measureText(cell.value);
            let lineY = textY;
            let lineStartX = textX;
            let lineEndX = textX;

            if (ctx.textAlign === 'left' || !ctx.textAlign) {
                lineStartX = textX;
                lineEndX = textX + textMetrics.width;
            } else if (ctx.textAlign === 'center') {
                lineStartX = textX - textMetrics.width / 2;
                lineEndX = textX + textMetrics.width / 2;
            } else if (ctx.textAlign === 'right') {
                lineStartX = textX - textMetrics.width;
                lineEndX = textX;
            }
            ctx.save();
            ctx.strokeStyle = cell.style.color || '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(lineEndX, lineY);
            ctx.stroke();
            ctx.restore();
        }
        // 绘制下划线
        if (textDecoration === 'underline') {
            const textMetrics = ctx.measureText(cell.value);
            let lineY = textY + fontSize / 2;
            let lineStartX = textX;
            let lineEndX = textX;
            if (ctx.textAlign === 'left' || !ctx.textAlign) {
                lineStartX = textX;
                lineEndX = textX + textMetrics.width;
            } else if (ctx.textAlign === 'center') {
                lineStartX = textX - textMetrics.width / 2;
                lineEndX = textX + textMetrics.width / 2;
            } else if (ctx.textAlign === 'right') {
                lineStartX = textX - textMetrics.width;
                lineEndX = textX;
            }
            ctx.save();
            ctx.strokeStyle = cell.style.color || '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(lineEndX, lineY);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    };

    return { drawTable };
};