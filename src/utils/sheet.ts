import { TableData, CellData, SpreadsheetConfig, SelectionSheetType, PositionType } from '../types/sheet';
export const createInitialData = (config: SpreadsheetConfig, rows: number, cols: number): TableData => {
  const initialData: TableData = [];
  const readOnlyStyle: CellData['style'] = {
    backgroundColor: config?.readOnlyBackgroundColor, textAlign: 'center', borderColor: config.readOnlyBorderColor,
  }
  const colNames: CellData[] = [{ value: '', readOnly: true, style: readOnlyStyle, row: 0, col: 0, }];
  for (let i = 0;i < cols;i++) {
    colNames.push({ value: generateColName(i), readOnly: true, style: readOnlyStyle, row: 0, col: i + 1, });
  }
  initialData.push(colNames);

  for (let i = 1;i <= rows;i++) {
    // 每一行：第一列是行号，其余列都是空白 取名为 行头
    const rowData: CellData[] = [{ value: `${i}`, readOnly: true, style: readOnlyStyle, row: i, col: 0, }];
    for (let j = 0;j < cols;j++) {
      rowData.push({ value: ``, style: {}, row: i, col: j + 1, });
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


// 获取选区 r1 最小行 r2 最大行 c1 最小列 c2 最大列
export const getAbsoluteSelection = (selection?: SelectionSheetType) => {
  const r1 = Math.min(selection?.start?.row || 0, selection?.end?.row || 0);
  const r2 = Math.max(selection?.start?.row || 0, selection?.end?.row || 0);
  const c1 = Math.min(selection?.start?.col || 0, selection?.end?.col || 0);
  const c2 = Math.max(selection?.start?.col || 0, selection?.end?.col || 0);
  return {
    r1,
    r2,
    c1,
    c2
  }
}


// 获取 x - left
export const getLeft = (col: number, headerColsWidth: number[], scrollPosition: PositionType) => {
  const beforeAllWidth = col === 0 ? 0 : headerColsWidth.slice(0, col).reduce((a, b) => a + b, 0);
  return col === 0 ? 0 : beforeAllWidth - scrollPosition.x;
}
// 获取 y - top
export const getTop = (row: number, headerRowsHeight: number[], scrollPosition: PositionType) => {
  const beforeAllHeight = row === 0 ? 0 : headerRowsHeight.slice(0, row).reduce((a, b) => a + b, 0);
  return row === 0 ? 0 : beforeAllHeight - scrollPosition.y;
}


export const getStartEndCol = (headerColsWidth: number[], wrapperWidth: number, scrollPosition: PositionType) => {
  // 计算 startCol
  let acc = 0;
  let startCol = 0;
  for (let i = 0;i < headerColsWidth.length;i++) {
    acc += headerColsWidth[i];
    if (acc > scrollPosition.x) {
      startCol = i;
      break;
    }
  }
  // 计算 endCol      
  let endCol = startCol;
  let visibleWidth = 0;
  for (let i = startCol;i < headerColsWidth.length;i++) {
    visibleWidth += headerColsWidth[i];
    if (visibleWidth > wrapperWidth) {
      endCol = i + 1;
      break;
    }
  }
  endCol = Math.max(endCol, headerColsWidth.length);

  return {
    startCol,
    endCol
  }
}

export const getStartEndRow = (headerRowsHeight: number[], wrapperHeight: number, scrollPosition: PositionType) => {
  // 计算 startRow
  let acc = 0;
  let startRow = 0;
  for (let i = 0;i < headerRowsHeight.length;i++) {
    acc += headerRowsHeight[i];
    if (acc > scrollPosition.y) {
      startRow = i;
      break;
    }
  }
  // 计算 endRow     
  let endRow = startRow;
  let visibleHeight = 0;
  for (let i = startRow;i < headerRowsHeight.length;i++) {
    visibleHeight += headerRowsHeight[i];
    if (visibleHeight > wrapperHeight) {
      endRow = i + 1;
      break;
    }
  }
  endRow = Math.max(endRow, headerRowsHeight.length);

  return {
    startRow,
    endRow
  }
}

// 通用的累加查找函数
export function findIndexByAccumulate(arr: number[], offset: number) {
  let acc = 0;
  for (let i = 0;i < arr.length;i++) {
    acc += arr[i];
    if (offset < acc) return i;
  }
  return arr.length - 1;
}