import { useCallback, useMemo } from "react";
import { useStore } from "../useStore";
import { RenderOptions } from "./useRenderCell";
import { CellData } from "@/types/sheet";

export const useTools = () => {
  const { config, zoomSize } = useStore();
  // 缓存字体样式
  const fontFamily = useMemo(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-family")
      .trim();
  }, []);
  const getFontSize = useCallback(
    (cell: CellData) => {
      return (cell.style.fontSize || config.fontSize) * zoomSize;
    },
    [config.fontSize, zoomSize],
  );
  const getFontStyle = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { cell } = options;
      // 最低宽度尺寸
      const minWidth = 25 * zoomSize;
      const textAlign = cell.style.textAlign || config.textAlign;
      const verticalAlign = cell.style.verticalAlign || config.verticalAlign;
      const color = cell.style.color || config.color || "#000000";
      // 设置字体样式
      const fontWeight = cell.style.fontWeight || "normal";
      const fontStyle = cell.style.fontStyle || "normal";
      const fontSize = getFontSize(cell);
      // 获取 CSS 变量定义的字体
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}pt ${fontFamily}`;
      // 设置文本对齐
      ctx.textAlign = (cell.style.textAlign as CanvasTextAlign) || "left";
      ctx.textBaseline = "middle";
      return {
        minWidth,
        textAlign,
        color,
        fontWeight,
        fontStyle,
        fontSize,
        verticalAlign,
      };
    },
    [
      config.color,
      config.textAlign,
      config.verticalAlign,
      fontFamily,
      zoomSize,
      getFontSize,
    ],
  );
  const wrapText = useCallback(
    (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
      const lines: string[] = [];
      let currentLine = "";
      for (const char of text) {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    },
    [],
  );
  const getWrapContent = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      { cell, cellWidth }: { cell: CellData; cellWidth: number },
    ) => {
      if (cell.style?.wrap) {
        const contents = cell.value?.split("\n");
        let wrappedContents: string[] = [];
        for (let i = 0; i < contents.length; i++) {
          wrappedContents = wrappedContents.concat(
            wrapText(ctx, contents[i], cellWidth - config.inputPadding * 2),
          );
        }
        return wrappedContents;
      } else {
        return [];
      }
    },
    [config.inputPadding, wrapText],
  );
  return { getFontStyle, getFontSize, getWrapContent, wrapText };
};
