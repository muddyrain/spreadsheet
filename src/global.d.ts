import { SpreadsheetType } from "./types/sheet";

// 声明全局类型
declare global {
  interface Window {
    $sheet: SpreadsheetType;
  }
}
