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
