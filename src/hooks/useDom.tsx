import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";
import { useCallback } from "react";
import { pxToPt } from "@/utils";
import { addressToPosition } from "@/utils/sheet";

export const useDom = () => {
  const { headerRowsHeight } = useStore();
  /**
   * 将表格数据转换为html表格
   */
  const toHtmlTable = useCallback(
    (
      data: CellData[][],
      startRow: number,
      endRow: number,
      startCol: number,
      endCol: number,
      tag?: string,
    ) => {
      let html = `<muddyrain-sheet-html-origin ${tag}><table style="border-collapse:collapse;">`;
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
            const rowHeight = headerRowsHeight[i];
            styleString += `height:${pxToPt(rowHeight)}pt;`;
          }
          html += `<td style="${styleString}">${cell.value}</td>`;
        }
        html += "</tr>";
      }
      html += "</table></muddyrain-sheet-html-origin>";
      return html;
    },
    [headerRowsHeight],
  );
  /**
   * 批量将 style 对象的 key 转为小驼峰
   */
  const cssStyleKeysToCamelCase = useCallback(
    (styleObj: Record<string, string>): Record<string, string> => {
      const result: Record<string, string> = {};
      Object.entries(styleObj).forEach(([key, value]) => {
        const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = value;
      });
      return result;
    },
    [],
  );
  /**
   * 解析html表格
   */
  const parseHtmlTable = useCallback(
    (html: string) => {
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
    },
    [cssStyleKeysToCamelCase],
  );

  const parseSelectionRange = useCallback((selectionRange: string) => {
    // 匹配 !F11:H20 或 !F11:F11
    const match = selectionRange.match(/!([A-Z]+\d+):([A-Z]+\d+)/);
    if (match) {
      const start = addressToPosition(match[1]);
      const end = addressToPosition(match[2]);
      return {
        start,
        end,
      };
    }
    return { start: { col: -1, row: -1 }, end: { col: -1, row: -1 } };
  }, []);

  return {
    toHtmlTable,
    parseHtmlTable,
    parseSelectionRange,
    cssStyleKeysToCamelCase,
  };
};
