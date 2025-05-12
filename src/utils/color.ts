export function blendColor(hex: string, percent: number): string {
  // percent > 0 向黑色靠近，percent < 0 向白色靠近
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r * (1 - percent) + 0 * percent);
  g = Math.round(g * (1 - percent) + 0 * percent);
  b = Math.round(b * (1 - percent) + 0 * percent);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
export function getSmartBorderColor(
  bgColor: string,
  defaultBorder: string = "#DFDFDF",
): string {
  if (bgColor.toUpperCase() === "#FFFFFF") return defaultBorder;
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const L = 0.299 * r + 0.587 * g + 0.114 * b;
  // 亮色背景，边框加深 5%
  if (L > 180) {
    return blendColor(bgColor, 0.05);
  }
  // 中等亮度，边框加深 10%
  if (L > 80) {
    return blendColor(bgColor, 0.1);
  }
  // 很深色，边框加深 20%
  return blendColor(bgColor, 0.2);
}

/**
 * 支持将主题色索引和色调值转换为标准颜色格式
 */
export function applyTint(hex: string, tint: number): string {
  // 去掉#
  hex = hex.replace("#", "");
  // 解析RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  // tint > 0 变亮，tint < 0 变暗
  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }
  // 限制范围
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  // 转回hex
  return (
    "#" +
    r.toString(16).padStart(2, "0").toUpperCase() +
    g.toString(16).padStart(2, "0").toUpperCase() +
    b.toString(16).padStart(2, "0").toUpperCase()
  );
}
