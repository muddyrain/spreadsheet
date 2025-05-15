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
 * 解析html表格
 */
export function parseHtmlTable(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return [];
  const result: { value: string; style: Record<string, string> }[][] = [];
  const rows = table.querySelectorAll("tr");
  rows.forEach((tr) => {
    const row: { value: string; style: Record<string, string> }[] = [];
    tr.querySelectorAll("td").forEach((td) => {
      const style =
        (td.getAttribute("style") ?? "")
          ? Object.fromEntries(
              (td.getAttribute("style") ?? "")
                .split(";")
                .filter(Boolean)
                .map((s) => {
                  const [k, v] = s.split(":");
                  return [k.trim(), v.trim()];
                }),
            )
          : {};
      row.push({
        value: td.textContent?.trim() ?? "",
        style: cssStyleKeysToCamelCase(style),
      });
    });
    result.push(row);
  });
  return result;
}

/**
 * 批量将 style 对象的 key 转为小驼峰
 */
export function cssStyleKeysToCamelCase(
  styleObj: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(styleObj).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  });
  return result;
}
