/**
 * @description 表格数据
 */
export interface Sheet {
  /**
   * @description 表格唯一标识
   */
  id: string;
  /**
   * @description 表格名称
   */
  name: string;
  /**
   * @description 表格数据
   */
  data: TableData;
  /**
   * @description 比例缩放
   * @default 1
   */
  zoomSize: number;
  /**
   * @description 表格选择框
   */
  selection: SelectionSheetType | null;
  /**
   * @description 表格当前单元格
   */
  currentCell: CellData | null;
  /**
   * @description 表格选中单元格
   */
  selectedCell: CellData | null;
  /**
   * @description 表格当前编辑单元格
   */
  editingCell: EditingCell;
  /**
   * @description 表格滚动位置
   */
  scrollPosition: PositionType;
  /**
   * @description 表格列宽
   */
  headerColsWidth: number[];
  /**
   * @description 表格行高
   */
  headerRowsHeight: number[];
}
/**
 * @description 单元格样式
 */
export type CellStyle = {
  /**
   * @description 单元格颜色
   * @default '#000000'
   */
  color?: string;
  /**
   * @description 单元格字体粗细
   * @default 'normal'
   */
  fontWeight?: string | number;
  /**
   * @description 单元格背景颜色
   * @default '#FFFFFF'
   */
  backgroundColor?: string;
  /**
   * @description 单元格边框颜色
   * @default '#DFDFDF'
   */
  borderColor?: string;
  /**
   * @description 单元格文字对齐方式
   * @default 'left'
   */
  textAlign?: string;
  /**
   * @description 单元格字体大小 - 是以“磅（pt）”为单位 1pt ≈ 1.333px
   * @default 11
   */
  fontSize?: number;
  /**
   * @description 单元格 字体样式
   * @default 'normal'
   */
  fontStyle?: string;
  /**
   * @description 单元格 文字装饰
   * @default 'none'
   */
  textDecoration?: string;
  /**
   * @description 单元格开启换行
   * @default false
   */
  wrap?: boolean;
};
/**
 * @description 单元格数据
 */
export type CellData = {
  /**
   * @description 单元格的值
   * @default ''
   */
  value: string;
  /**
   * @description 单元格的地址
   * @default ''
   */
  address: string;
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
  /**
   * @description 合并列数
   */
  mergeSpan: MergeSpanType | null;
  /**
   * @description 单元格父级单元格
   * @default null
   */
  mergeParent: { row: number; col: number } | null;
} & EditingCell;
/**
 * @description 合并单元格
 * @description 合并单元格的坐标
 */
export type MergeSpanType = {
  /**
   * @description 起始行号
   */
  r1: number;
  /**
   * @description 起始列号
   */
  c1: number;
  /**
   * @description 结束行号
   */
  r2: number;
  /**
   * @description 结束列号
   */
  c2: number;
};
/**
 * @description 表格数据 - 二维数组
 */
export type TableData = CellData[][];

/**
 * @description 表格配置
 */
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
   * 滚动区域画布整体增加的额外空间
   * @default 50
   */
  scrollAreaPadding?: number;
  /**
   * @description 单元格宽度，用于计算单元格的宽度
   * @default 100
   */
  width?: number;
  /**
   * @description 固定列宽度 - 第一列宽度
   * @default 50
   */
  fixedColWidth?: number;
  /**
   * @description 单元格高度，用于计算单元格的高度
   * @default 30
   */
  height?: number;
  /**
   * @description 默认文本对齐方式
   * @default 'left'
   */
  textAlign?: "left" | "center" | "right";
  /**
   * @description 选择框背景颜色
   * @default 'rgba(60, 112, 255, 0.15)'
   */
  selectionBackgroundColor?: string;
  /**
   * @description 选择框颜色
   * @default 'rgba(60, 112, 255, 1)'
   */
  selectionBorderColor?: string;
  /**
   * @description 只读单元格背景颜色
   * @default '#F2F2F2'
   */
  readOnlyBackgroundColor?: string;
  /**
   * @description 只读单元格边框颜色
   * @default '#CCCCCC'
   */
  readOnlyBorderColor?: string;
  /**
   * @description 单元格边框颜色
   * @default '#DFDFDF'
   */
  borderColor?: string;
  /**
   * @description 单元格背景颜色
   * @default '#FFFFFF'
   */
  backgroundColor?: string;
  /**
   * @description 表格字体大小
   * @default 11
   */
  fontSize?: number;
  /**
   * @description 单元格颜色
   * @default '#000000'
   */
  color?: string;
  /**
   * @description 只读单元格颜色
   * @default '#000000'
   */
  readOnlyColor?: string;
};
/**
 * @description 表格当前编辑单元格
 */
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
/**
 * @description 表格选择框
 */
export type SelectionSheetType = {
  start: { row: number; col: number } | null;
  end: { row: number; col: number } | null;
};
/**
 * @description 电子表格类型
 */
export type SpreadsheetType = {
  currentSheet: Sheet | null;
  currentCell: CellData | null;
  sheets: Sheet[];
  setSheets: (sheets: Sheet[]) => void;
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;
  config: Required<SpreadsheetConfig>; // 全局配置
  updater: number;
  createNewSheet: (
    data?: TableData,
    options?: Partial<Exclude<Sheet, "data">>,
  ) => Sheet;
  createCopySheet: (id: string) => void;
  deleteSheet: (id: string) => void;
  forceUpdate: () => void;
  clearSelection: () => void;
  getCurrentCell: (row: number, col: number) => CellData | null;
  setCurrentSheet: <T extends keyof Sheet>(key: T, value: Sheet[T]) => void;
};
/**
 * @description 位置类型
 */
export type PositionType = {
  x: number;
  y: number;
};
/**
 * @description 表格绘制配置
 */
export interface DrawConfig {
  wrapperWidth: number;
  wrapperHeight: number;
}
/**
 * @description 箭头方向
 */
export type ArrowDirectionType =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

/**
 * @description 表格单元格设置配置
 */
export interface SheetCellSettingsConfig {
  /**
   * 是否以选中单元格为基准作为合并点。
   */
  isAnchorMergePoint: boolean;
}
