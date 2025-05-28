import _ from "lodash";
import {
  SelectionSheetType,
  MergeSpanType,
  SpreadsheetConfig,
  CellData,
  TableData,
} from "../types/sheet";

export const createDefaultStyle = (config: SpreadsheetConfig) => {
  return {
    color: config.color,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    fontSize: config.fontSize,
    textAlign: config.textAlign,
    verticalAlign: config.verticalAlign,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    wrap: false,
  };
};
export const createDefaultCell = (
  config: SpreadsheetConfig,
  row: number,
  col: number,
): CellData => {
  const cell = {
    mergeSpan: null,
    mergeParent: null,
    value: ``,
    style: createDefaultStyle(config),
    row: row,
    col: col,
    address: generateColName(col) + row,
  };
  return cell;
};

export const createInitialData = (
  config: SpreadsheetConfig,
  rows: number,
  cols: number,
  initialData: TableData = [],
): TableData => {
  const isInitialData = initialData.length === 0;
  const readOnlyStyle: CellData["style"] = {
    backgroundColor: config?.readOnlyBackgroundColor,
    textAlign: "center",
    borderColor: config.readOnlyBorderColor,
    color: config.color,
  };
  const colNames: CellData[] = [
    {
      ...createDefaultCell(config, 0, 0),
      style: readOnlyStyle,
      readOnly: true,
      value: "",
      address: "0",
    },
  ];

  for (let i = 0; i < (isInitialData ? cols : initialData[0].length); i++) {
    colNames.push({
      ...createDefaultCell(config, 0, i + 1),
      readOnly: true,
      style: readOnlyStyle,
      value: generateColName(i + 1),
    });
  }
  if (isInitialData) {
    initialData.push(colNames);
    for (let i = 1; i <= rows; i++) {
      // 每一行：第一列是行号，其余列都是空白 取名为 行头
      const rowData: CellData[] = [];
      rowData.push({
        mergeSpan: null,
        mergeParent: null,
        value: `${i}`,
        readOnly: true,
        style: readOnlyStyle,
        row: i,
        col: 0,
        address: i.toString(),
      });
      for (let j = 0; j < cols; j++) {
        rowData.push(createDefaultCell(config, i, j + 1));
      }
      initialData.push(rowData);
    }
  } else {
    initialData.unshift(colNames);
    initialData.forEach((row, rowIndex) => {
      if (rowIndex > 0) {
        row.unshift({
          ...createDefaultCell(config, rowIndex, 0),
          readOnly: true,
          style: readOnlyStyle,
          value: `${rowIndex}`,
          address: `${rowIndex}`,
        });
      }
    });
  }
  return initialData;
};

// 生成 A-Z 然后继续 AA AB AC AD ... 然后继续 BA BB BC BD...
export const generateColName = (index: number) => {
  let colName = "";
  // 默认col 从 1 开始 前方自带一个固定列头 所以这里要 -1
  let temp = index - 1;
  while (temp >= 0) {
    colName = String.fromCharCode(65 + (temp % 26)) + colName;
    temp = Math.floor(temp / 26) - 1;
  }
  return colName;
};

// 例如 A1 -> { row: 1, col: 1 }，B2 -> { row: 2, col: 2 }
export function addressToPosition(address: string): {
  row: number;
  col: number;
} {
  const match = address.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 0, col: 0 };
  const [, colStr, rowStr] = match;
  // 计算列号
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col *= 26;
    col += colStr.charCodeAt(i) - 65 + 1;
  }
  return { row: parseInt(rowStr, 10), col };
}
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

/**
 * 计算表格的差异
 * @param oldData 旧表格数据
 * @param newData 新表格数据
 * @returns 差异数组
 */
export function getTableDiffs(_oldData: TableData, _newData: TableData) {
  const originData: Array<CellData> = [];
  const currentData: Array<CellData> = [];
  const maxRows = Math.max(_oldData.length, _newData.length);
  for (let row = 0; row < maxRows; row++) {
    const oldRow = _oldData[row] || [];
    const newRow = _newData[row] || [];
    const maxCols = Math.max(oldRow.length, newRow.length);
    for (let col = 0; col < maxCols; col++) {
      const oldValue = oldRow[col];
      const newValue = newRow[col];
      // 只要有差异（包括undefined和null），就记录
      if (!_.isEqual(oldValue, newValue)) {
        originData.push(oldValue);
        currentData.push(newValue);
      }
    }
  }
  return {
    originData,
    currentData,
  };
}
