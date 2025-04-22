import { TableData, CellData } from '../types/sheet';

export const createInitialData = (rows: number, cols: number): TableData => {
  const initialData: TableData = [];
  const readOnlyStyle: CellData['style'] = {
    background: '#F1F3F3', textAlign: 'center'
  }
  // 第一行：左上角空白，然后A-Z  取名为 列头
  const headerRow: CellData[] = [{
    value: '', style: readOnlyStyle, readOnly: true
  }];
  for (let i = 0;i < cols;i++) {
    const colName = generateColName(i);
    headerRow.push({ value: colName, style: readOnlyStyle, readOnly: true });
  }
  initialData.push(headerRow);

  for (let i = 1;i <= rows;i++) {
    // 每一行：第一列是行号，其余列都是空白 取名为 行头
    const rowData: CellData[] = [{ value: `${i}`, readOnly: true, style: readOnlyStyle }];
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


// 生成 A-Z 然后继续 AA AB AC AD ... 然后继续 BA BB BC BD...
const generateColName = (index: number) => {
  let colName = '';
  let temp = index;
  while (temp >= 0) {
    colName = String.fromCharCode(65 + (temp % 26)) + colName;
    temp = Math.floor(temp / 26) - 1;
  }
  return colName;
}