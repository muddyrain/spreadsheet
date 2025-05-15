import { useCallback, useMemo } from "react";
import { useStore } from "../useStore";
import { RenderOptions } from "./useRenderCell";

export const useTools = () => {
  const { config, zoomSize } = useStore();
  // 缓存字体样式
  const fontFamily = useMemo(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-family")
      .trim();
  }, []);
  const getFontStyle = useCallback(
    (ctx: CanvasRenderingContext2D, options: RenderOptions) => {
      const { cell } = options;
      // 最低宽度尺寸
      const minWidth = 25 * zoomSize;
      const textAlign = cell.style.textAlign || config.textAlign;
      const color = cell.style.color || config.color || "#000000";
      // 设置字体样式
      const fontWeight = cell.style.fontWeight || "normal";
      const fontStyle = cell.style.fontStyle || "normal";
      const fontSize = (cell.style.fontSize || config.fontSize) * zoomSize;
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
      };
    },
    [config.color, config.fontSize, config.textAlign, fontFamily, zoomSize],
  );
  return { getFontStyle };
};
