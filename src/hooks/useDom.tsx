import { CellData } from "@/types/sheet";
import { useStore } from "./useStore";
import { useCallback } from "react";
import { pxToPt } from "@/utils";

export const useDom = () => {
  const { headerRowsHeight } = useStore();
  const toHtmlTable = useCallback(
    (
      data: CellData[][],
      startRow: number,
      endRow: number,
      startCol: number,
      endCol: number,
    ) => {
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
  return {
    toHtmlTable,
  };
};
