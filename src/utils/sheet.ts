import {
  TableData,
  CellData,
  SpreadsheetConfig,
  SelectionSheetType,
  MergeSpanType,
} from "../types/sheet";
export const createInitialData = (
  config: SpreadsheetConfig,
  rows: number,
  cols: number,
): TableData => {
  const initialData: TableData = [];
  const readOnlyStyle: CellData["style"] = {
    backgroundColor: config?.readOnlyBackgroundColor,
    textAlign: "center",
    borderColor: config.readOnlyBorderColor,
    color: config.color,
  };
  const defaultCellData = {
    mergeSpan: null,
    mergeParent: null,
  };
  const colNames: CellData[] = [
    {
      ...defaultCellData,
      value: "",
      readOnly: true,
      style: readOnlyStyle,
      row: 0,
      col: 0,
    },
  ];
  for (let i = 0; i < cols; i++) {
    colNames.push({
      ...defaultCellData,
      value: generateColName(i),
      readOnly: true,
      style: readOnlyStyle,
      row: 0,
      col: i + 1,
    });
  }
  initialData.push(colNames);

  for (let i = 1; i <= rows; i++) {
    // 每一行：第一列是行号，其余列都是空白 取名为 行头
    const rowData: CellData[] = [
      {
        ...defaultCellData,
        value: `${i}`,
        readOnly: true,
        style: readOnlyStyle,
        row: i,
        col: 0,
      },
    ];
    for (let j = 0; j < cols; j++) {
      rowData.push({
        ...defaultCellData,
        value: ``,
        style: {
          color: config.color,
        },
        row: i,
        col: j + 1,
      });
    }
    initialData.push(rowData);
  }
  return initialData;
};

export const drawTableGrid = (
  ctx: CanvasRenderingContext2D,
  data: TableData,
  cellWidth: number,
  cellHeight: number,
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
  let colName = "";
  let temp = index;
  while (temp >= 0) {
    colName = String.fromCharCode(65 + (temp % 26)) + colName;
    temp = Math.floor(temp / 26) - 1;
  }
  return colName;
};

// 获取选区 r1 最小行 r2 最大行 c1 最小列 c2 最大列
export const getAbsoluteSelection = (
  selection?: SelectionSheetType,
): MergeSpanType => {
  const r1 = Math.min(selection?.start?.row || 0, selection?.end?.row || 0);
  const r2 = Math.max(selection?.start?.row || 0, selection?.end?.row || 0);
  const c1 = Math.min(selection?.start?.col || 0, selection?.end?.col || 0);
  const c2 = Math.max(selection?.start?.col || 0, selection?.end?.col || 0);
  return {
    r1,
    r2,
    c1,
    c2,
  };
};
