import { TableData, CellData } from '../types/sheet';

export const createInitialData = (rows: number, cols: number): TableData => {
  const initialData: TableData = [];
  // 第一行：左上角空白，然后A-Z  取名为 列头
  const headerRow: CellData[] = [{
    value: '', style: {}
  }];
  for (let i = 0;i < cols;i++) {
    headerRow.push({
      value: String.fromCharCode(65 + i), readOnly: true, style: {
        background: '#f4f6fa', fontWeight: 'bold', textAlign: 'center'
      }
    });
  }
  initialData.push(headerRow);

  for (let i = 1;i <= rows;i++) {
    // 每一行：第一列是行号，其余列都是空白 取名为 行头
    const rowData: CellData[] = [{ value: `${i}`, readOnly: true, style: { background: '#f4f6fa', fontWeight: 'bold', textAlign: 'center' } }];
    for (let j = 0;j < cols;j++) {
      rowData.push({ value: ``, style: {} });
    }
    initialData.push(rowData);
  }

  return initialData;
};

export const drawTableGrid = (
  ctx: CanvasRenderingContext2D,
  data: TableData,
  cellWidth: number,
  cellHeight: number
) => {
  data.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      if (colIndex < data[0].length - 1) {
        ctx.beginPath();
        ctx.moveTo((colIndex + 1) * cellWidth, rowIndex * cellHeight);
        ctx.lineTo((colIndex + 1) * cellWidth, (rowIndex + 1) * cellHeight);
        ctx.stroke();
      }
      if (rowIndex < data.length - 1) {
        ctx.beginPath();
        ctx.moveTo(colIndex * cellWidth, (rowIndex + 1) * cellHeight);
        ctx.lineTo((colIndex + 1) * cellWidth, (rowIndex + 1) * cellHeight);
        ctx.stroke();
      }
    });
  });
};