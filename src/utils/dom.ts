import { CellData } from "@/types/sheet";

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
 *  将数据转换为html表格
 */
export function toHtmlTable(
  data: CellData[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
) {
  let html =
    '<muddyrain-sheet-html-origin><table style="border-collapse:collapse;">';
  for (let i = startRow; i <= endRow; i++) {
    html += "<tr>";
    for (let j = startCol; j <= endCol; j++) {
      const cell = data[i][j];
      const style = cell.style;
      let styleString = "";
      if (style) {
        if (style.color) {
          styleString += `color:${style.color};`;
        }
        if (style.fontSize) {
          styleString += `font-size:${style.fontSize}pt;`;
        }
        if (style.fontWeight) {
          styleString += `font-weight:${style.fontWeight};`;
        }
        if (style.textAlign) {
          styleString += `text-align:${style.textAlign};`;
        }
        if (style.textDecoration) {
          styleString += `text-decoration:${style.textDecoration};`;
        }
        if (style.backgroundColor) {
          styleString += `background-color:${style.backgroundColor};`;
        }
        styleString += `white-space:${style.wrap ? "normal" : "nowrap"};`;
        styleString += `font-style:${style.fontStyle || "none"};`;
      }
      html += `<td style="${styleString}">${cell.value}</td>`;
    }
    html += "</tr>";
  }
  html += "</table></muddyrain-sheet-html-origin>";
  return html;
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
