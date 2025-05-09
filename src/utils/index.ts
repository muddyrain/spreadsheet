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
