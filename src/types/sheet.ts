export type CellStyle = {
  /**
   * @description 单元格颜色
   */
  color?: string;
  /**
   * @description 单元格字体粗细
   */
  fontWeight?: string | number;
  /**
  * @description 单元格背景颜色
  */
  background?: string;
  /**
  * @description 单元格文字对齐方式
  */
  textAlign?: string;
  /**
  * @description 单元格字体大小
  */
  fontSize?: number;
  /**
  * @description 单元格 字体样式
  */
  fontStyle?: string;
  /**
   * @description 单元格 文字装饰
   */
  textDecoration?: string;
};

export type CellData = {
  /**
   * @description 单元格的值
   * @default ''
   */
  value: string;
  /**
   * @description 单元格样式
   * @default {}
   */
  style: CellStyle;
  /**
   * @description 是否只读
   * @default false
   */
  readOnly?: boolean;
};

export type TableData = CellData[][];

export type SpreadsheetConfig = {
  /**
   * @description 表格行数
   * @default 200
   */
  rows?: number;
  /**
   * @description 表格列数
   * @default 26
   */
  cols?: number;
  /**
   * @description 表格字体大小
   * @default 14
   */
  fontSize?: number;
  /**
 * @description 单元格宽度，用于计算单元格的宽度
 * @default 100
 */
  width?: number;
  /**
   * @description 单元格高度，用于计算单元格的高度
   * @default 30
   */
  height?: number;
};

export type EditingCell = {
  /**
   * @description 当前编辑的单元格的行号
   */
  row: number;
  /**
   * @description 当前编辑的单元格的列号
   */
  col: number;
} | null;