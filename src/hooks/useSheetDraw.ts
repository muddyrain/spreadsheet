import { useCallback } from 'react';
import { CellData, EditingCell, SelectionSheetType, TableData } from '../types/sheet';
import { useStore } from './useStore';
import { getAbsoluteSelection } from '../utils/sheet';

interface DrawConfig {
    cellWidth: number;
    cellHeight: number;
    wrapperWidth: number;
    wrapperHeight: number;
}

// 冻结行数和列数（可根据需要调整）
const FROZEN_ROW_COUNT = 1;
const FROZEN_COL_COUNT = 1;

export const useSheetDraw = (data: TableData, drawConfig: DrawConfig & { selection?: SelectionSheetType; selectedCell: EditingCell }) => {
    const { config, isFocused } = useStore();
    const selection = drawConfig.selection;
    const selectedCell = drawConfig.selectedCell;
    const fixedColWidth = config.fixedColWidth
    const drawTable = useCallback((ctx: CanvasRenderingContext2D, scrollPosition: { x: number; y: number }) => {
        const isCellSelected = (row: number, col: number) => {
            if (!selection?.start || !selection?.end) return false;
            const r1 = Math.min(selection.start.row, selection.end.row);
            const r2 = Math.max(selection.start.row, selection.end.row);
            const c1 = Math.min(selection.start.col, selection.end.col);
            const c2 = Math.max(selection.start.col, selection.end.col);
            return row >= r1 && row <= r2 && col >= c1 && col <= c2;
        };
        // 单元格绘制函数
        const renderCell = (ctx: CanvasRenderingContext2D, options: {
            rowIndex: number;
            colIndex: number;
            x: number;
            y: number;
            cell: CellData;
            colWidth: number;
            isHeader?: boolean;
            isRow?: boolean;
            selection?: SelectionSheetType;
        }) => {
            const { rowIndex, colIndex, x, y, cell, colWidth, isHeader, isRow } = options;

            // 绘制网格
            ctx.strokeStyle = cell.style.borderColor || config.borderColor;
            ctx.strokeRect(x, y, colWidth, drawConfig.cellHeight);
            // 设置背景颜色
            ctx.fillStyle = cell.style.backgroundColor || config.backgroundColor;
            ctx.fillRect(x + 1, y + 1, colWidth - 1, drawConfig.cellHeight - 1);

            // 如果是表头，并且当前列在选中范围内
            if ((isHeader || isRow) && selection && selection.start && selection.end) {
                const { c1, c2, r1, r2 } = getAbsoluteSelection(selection)
                if (c1 <= colIndex && colIndex <= c2 || r1 <= rowIndex && rowIndex <= r2) {
                    // 设置选中高亮颜色
                    ctx.globalAlpha = 0.85;
                    ctx.fillStyle = config.selectionBackgroundColor;
                    ctx.fillRect(x + 1, y + 1, colWidth - 1, drawConfig.cellHeight - 1);
                    ctx.globalAlpha = 1;
                }
            }


            // 判断是否选中，绘制高亮背景
            if (isCellSelected && isCellSelected(rowIndex, colIndex)) {
                ctx.save();
                ctx.fillStyle = config.selectionBackgroundColor;
                ctx.fillRect(x, y, colWidth, drawConfig.cellHeight);
                ctx.restore();
            }
            // 设置字体样式
            const fontWeight = cell.style.fontWeight || 'normal';
            const fontStyle = cell.style.fontStyle || 'normal';
            const fontSize = cell.style.fontSize || config.fontSize || 14;
            let color = cell.style.color || config.color || '#000000'
            if (cell.readOnly) color = config.readOnlyColor || cell.style.color || config.color || '#000000'
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
            ctx.fillStyle = color

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
            if (ctx.textAlign === 'center') textX = x + colWidth / 2;
            if (ctx.textAlign === 'right') textX = x + colWidth - 10;
            const textY = y + drawConfig.cellHeight / 2 + 2;
            ctx.fillText(cell.value, textX, textY);

            const textDecoration = cell.style.textDecoration || 'none';
            // 绘制删除线
            if (textDecoration === 'line-through') {
                const textMetrics = ctx.measureText(cell.value);
                const lineY = textY;
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
                const lineY = textY + fontSize / 2;
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
        // 当前是否为单个单元格的选区
        const isOneSelection = selection?.start?.row === selection?.end?.row && selection?.start?.col === selection?.end?.col;
        ctx.translate(0.5, 0.5);

        // 绘制内容区（非冻结区）单元格
        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const colWidth = colIndex === 0 ? fixedColWidth : drawConfig.cellWidth;
                const x = colIndex === 0 ? 0 : fixedColWidth + (colIndex - 1) * drawConfig.cellWidth - scrollPosition.x;
                const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell, colWidth });
            }
        }
        // 绘制选区边框（只绘制在当前可视区域内的部分）
        if (selection?.start && selection?.end) {
            if (!(isOneSelection && isFocused)) {
                const { r1, r2, c1, c2 } = getAbsoluteSelection(selection)

                // 只绘制在当前可视区域内的部分
                if (
                    r2 >= startRow && r1 < endRow &&
                    c2 >= startCol && c1 < endCol
                ) {
                    const x = (c1 - 1) * drawConfig.cellWidth - (c1 < FROZEN_COL_COUNT ? 0 : scrollPosition.x) + fixedColWidth;
                    const y = r1 * drawConfig.cellHeight - (r1 < FROZEN_ROW_COUNT ? 0 : scrollPosition.y);
                    const width = (c2 - c1 + 1) * drawConfig.cellWidth;
                    const height = (r2 - r1 + 1) * drawConfig.cellHeight;

                    ctx.save();
                    ctx.strokeStyle = config.selectionBorderColor;
                    ctx.lineWidth = 1;
                    // 防止边框被其他元素遮挡
                    ctx.strokeRect(x, y, width, height);
                    ctx.restore();
                }
            }
        }
        // 绘制当前选中单元格 且 没有输入框焦点
        if (selectedCell && !isFocused) {
            const { row, col } = selectedCell
            const cell = data[row]?.[col];
            if (!cell) return;
            const x = col === 0 ? 0 : fixedColWidth + (col - 1) * drawConfig.cellWidth - scrollPosition.x;
            const y = row * drawConfig.cellHeight - scrollPosition.y;
            ctx.save();
            ctx.strokeStyle = config.selectionBorderColor;
            ctx.lineWidth = 1.5;
            // 防止边框被其他元素遮挡
            ctx.strokeRect(x - 0.5, y - 0.5, drawConfig.cellWidth, drawConfig.cellHeight);
            ctx.restore();
        }
        // 绘制冻结首列（除左上角交叉单元格）
        for (let rowIndex = startRow;rowIndex < endRow;rowIndex++) {
            for (let colIndex = 0;colIndex < FROZEN_COL_COUNT;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const colWidth = colIndex === 0 ? fixedColWidth : drawConfig.cellWidth;
                const x = colIndex === 0 ? 0 : fixedColWidth + (colIndex - 1) * drawConfig.cellWidth;
                const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell, colWidth, isRow: true });
            }
        }
        // 绘制冻结首行（除左上角交叉单元格）
        for (let rowIndex = 0;rowIndex < FROZEN_ROW_COUNT;rowIndex++) {
            for (let colIndex = startCol;colIndex < endCol;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const colWidth = colIndex === 0 ? fixedColWidth : drawConfig.cellWidth;
                const x = colIndex === 0 ? 0 : fixedColWidth + (colIndex - 1) * drawConfig.cellWidth - scrollPosition.x;
                const y = rowIndex * drawConfig.cellHeight;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell, colWidth, selection, isHeader: true });
            }
        }
        // 绘制 当前选中区域列头行头高亮
        if (selection?.start && selection?.end) {
            const { r1, r2, c1, c2 } = getAbsoluteSelection(selection)
            // 只绘制在当前可视区域内的部分
            if (
                r2 >= startRow && r1 < endRow &&
                c2 >= startCol && c1 < endCol
            ) {
                // 列头高亮
                for (let colIndex = c1;colIndex <= c2;colIndex++) {
                    const cell = data[r1]?.[colIndex];
                    if (!cell) continue;
                    const colWidth = colIndex === 0 ? fixedColWidth : drawConfig.cellWidth;
                    const x = colIndex === 0 ? 0 : fixedColWidth + (colIndex - 1) * drawConfig.cellWidth - scrollPosition.x;
                    const y = 0;
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(x, y + drawConfig.cellHeight - 0.5);
                    ctx.lineTo(x + colWidth, y + drawConfig.cellHeight - 0.5);
                    ctx.strokeStyle = config.selectionBorderColor;
                    ctx.stroke();
                    ctx.restore();
                }
                // 行头高亮
                for (let rowIndex = r1;rowIndex <= r2;rowIndex++) {
                    const cell = data[rowIndex]?.[c1];
                    if (!cell) continue;
                    const colWidth = fixedColWidth;
                    const x = 0;
                    const y = rowIndex * drawConfig.cellHeight - scrollPosition.y;
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(x + colWidth - 0.5, y);
                    ctx.lineTo(x + colWidth - 0.5, y + drawConfig.cellHeight);
                    ctx.strokeStyle = config.selectionBorderColor;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
        // 绘制左上角交叉单元格（冻结区的左上角）
        for (let rowIndex = 0;rowIndex < FROZEN_ROW_COUNT;rowIndex++) {
            for (let colIndex = 0;colIndex < FROZEN_COL_COUNT;colIndex++) {
                const cell = data[rowIndex]?.[colIndex];
                if (!cell) continue;
                const colWidth = colIndex === 0 ? fixedColWidth : drawConfig.cellWidth;
                const colHeight = drawConfig.cellHeight
                const x = colIndex === 0 ? 0 : fixedColWidth + (colIndex - 1) * drawConfig.cellWidth;
                const y = rowIndex * drawConfig.cellHeight;
                renderCell(ctx, { rowIndex, colIndex, x, y, cell, colWidth });
                // 绘制一个倒三角作为左上角交叉单元格的标志
                ctx.fillStyle = config.selectionBorderColor;
                ctx.beginPath();
                ctx.moveTo(x + (colWidth / 2) - 5 + 0.5, y + (colHeight / 2) + 5 + 0.5);
                ctx.lineTo(x + (colWidth / 2) + 5 + 0.5, y + (colHeight / 2) + 5 + 0.5);
                ctx.lineTo(x + (colWidth / 2) + 5 + 0.5, y + (colHeight / 2) - 5 + 0.5);
                ctx.closePath();
                ctx.fill();
            }
        }
    }, [data, drawConfig, selection, selectedCell, config, fixedColWidth, isFocused]);
    return { drawTable };
};