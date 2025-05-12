import JSZip from "jszip";
export async function getAppName(file: ArrayBuffer) {
  const zip = await JSZip.loadAsync(file);
  const appXml = await zip.file("docProps/app.xml")?.async("string");
  if (appXml) {
    const match = appXml.match(/<Application>(.*?)<\/Application>/);
    if (match) return match[1];
  }
  return null;
}
/**
 * 获取浏览器当前系统信息
 */
export function getSystemInfo() {
  const userAgent = window.navigator.userAgent;
  const isMac = /macintosh|mac os x/i.test(userAgent);
  const isWindows = /windows|win32/i.test(userAgent);
  return { isMac, isWindows };
}

/**
 * 生成一个随机的uuid
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * 限制表格大小，防止表格过大导致渲染性能问题
 */
export function limitSheetSize(rows: number, cols: number, maxCells = 2000000) {
  // 计算总单元格数量
  const totalCells = rows * cols;

  // 如果总单元格数量超过200万，则按比例缩小
  if (totalCells > maxCells) {
    const scaleFactor = Math.sqrt(maxCells / totalCells);
    rows = Math.floor(rows * scaleFactor);
    cols = Math.floor(cols * scaleFactor);

    // 确保至少有一行和一列
    rows = Math.max(1, rows);
    cols = Math.max(1, cols);
  }
  return { rows, cols };
}
