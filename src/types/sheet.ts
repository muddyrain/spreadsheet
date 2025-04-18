export type CellStyle = {
  color?: string;
  fontWeight?: string;
  background?: string;
  textAlign?: string;
  readOnly?: boolean;
};

export type CellData = {
  value: string;
  style: CellStyle;
};

export type TableData = CellData[][];

export type SpreadsheetConfig = {
  rows: number;
  cols: number;
};

export type EditingCell = {
  row: number;
  col: number;
} | null;