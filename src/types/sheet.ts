export type CellStyle = {
  color?: string;
  fontWeight?: string | number;
  background?: string;
  textAlign?: string;
  fontSize?: number;
};

export type CellData = {
  value: string;
  style: CellStyle;
  readOnly?: boolean;
};

export type TableData = CellData[][];

export type SpreadsheetConfig = {
  rows?: number;
  cols?: number;
  fontSize?: number;
};

export type EditingCell = {
  row: number;
  col: number;
} | null;