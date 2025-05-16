/**
 * 测量文本宽度
 */
export const measureTextWidth = (
  text: string,
  element?: HTMLElement | null,
) => {
  const measureEl = document.createElement("span");
  measureEl.style.visibility = "hidden";
  measureEl.style.position = "absolute";
  measureEl.style.whiteSpace = "nowrap";

  if (element) {
    const styles = window.getComputedStyle(element);
    measureEl.style.fontSize = styles.fontSize;
    measureEl.style.fontFamily = styles.fontFamily;
    measureEl.style.fontWeight = styles.fontWeight;
    measureEl.style.letterSpacing = styles.letterSpacing;
  }

  measureEl.textContent = text;
  document.body.appendChild(measureEl);
  const width = measureEl.getBoundingClientRect().width;
  document.body.removeChild(measureEl);
  return width;
};

/**
 * 从 html 字符串中获取指定属性的值
 * @param html HTML 字符串
 * @param attrName 属性名
 * @returns 属性值或空字符串
 */
export function getAttrFromHtml(html: string, attrName: string): string {
  const reg = new RegExp(attrName + "=[\"']([^\"']+)[\"']");
  const match = html.match(reg);
  return match ? match[1] : "";
}
