import { ArrowDirectionType } from "@/types/sheet";
import { useCallback, useEffect } from "react";
import { useStore } from "./useStore";
import { useFunctions } from "./useFunctions";
import { useUpdateStyle } from "./useUpdateStyle";

interface useKeyDownCallback {
  onCellInputKey?: (value: string) => void;
  onCellCopyKey?: () => void;
  onCellPasteKey?: () => void;
  onCellCutKey?: () => void;
  onCellDeleteKey?: () => void;
  onSelectAll?: () => void;
  onDirectionKey?: (key: ArrowDirectionType) => void;
  onTabKey?: () => void;
  onEnterKey?: () => void;
}
export const useKeyDown = (callback: useKeyDownCallback = {}) => {
  const { selection, setZoomSize } = useStore();
  const { updateStyle, isStyle } = useUpdateStyle();
  const { handleCopy, handlePaste, handleCut, handleClearContent } =
    useFunctions();
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;
      if (e.key === "Enter") {
        e.preventDefault();
        callback?.onEnterKey?.();
        return;
      }
      console.log(e.ctrlKey || e.metaKey, e.shiftKey, key);
      // 处理 ctrl/cmd + - 和 ctrl/cmd + shift + = 放大
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "+") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "=" && e.shiftKey)
      ) {
        e.preventDefault();
        setZoomSize((zoomSize) => zoomSize + 0.1);
        return;
      }
      // 处理 ctrl/cmd + - 和 ctrl/cmd + shift + - 缩小
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "-") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "-" && e.shiftKey)
      ) {
        e.preventDefault();
        setZoomSize((zoomSize) => zoomSize - 0.1);
        return;
      }
      // 处理 ctrl/cmd + z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (isStyle.isUndo) {
          updateStyle("undo");
        }
        return;
      }
      // 处理 ctrl/cmd + y 重做
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (isStyle.isRedo) {
          updateStyle("redo");
        }
        return;
      }
      // 处理 ctrl/cmd + \ 清除格式
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "\\") {
        e.preventDefault();
        updateStyle("eraser");
        return;
      }
      // 处理 ctrl/cmd + b 加粗
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        updateStyle("bold");
        return;
      }
      // 处理 ctrl/cmd + i 斜体
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        updateStyle("italic");
        return;
      }
      // 处理 ctrl/cmd + i 下划线
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        updateStyle("underline");
        return;
      }
      // 处理 ctrl/cmd + shift + x 删除线
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "x" &&
        e.shiftKey
      ) {
        e.preventDefault();
        updateStyle("strikethrough");
        return;
      }
      // 处理 ctrl/cmd + r
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        window.location.reload();
        return;
      }
      // 处理 ctrl/cmd + a
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        callback.onSelectAll?.();
        return;
      }
      // 处理上下左右键
      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        e.preventDefault();
        callback?.onDirectionKey?.(key);
        return;
      }
      // 已经有选中单元格才会处理键盘事件
      if (selection?.start && selection?.end) {
        // 处理 tab 键
        if (key === "Tab") {
          e.preventDefault();
          callback?.onTabKey?.();
        }
        // 处理粘贴
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
          e.preventDefault();
          handlePaste();
          callback?.onCellPasteKey?.();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
          e.preventDefault();
          handleCut();
          callback?.onCellCutKey?.();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          e.preventDefault();
          handleCopy();
          callback?.onCellCopyKey?.();
        } else if (key === "Delete") {
          e.preventDefault();
          handleClearContent();
          callback?.onCellDeleteKey?.();
        } else if (
          key.length === 1 &&
          (/[a-zA-Z0-9]/.test(key) || // 字母数字
            /[~!@#$%^&*()_+\-=[\]{};':"|,.<>\\/?`]/.test(key)) // 常见符号
        ) {
          e.preventDefault();
          // 处理输入的字母数字和常见符号
          callback?.onCellInputKey?.(key);
        }
      }
    },
    [
      selection,
      setZoomSize,
      callback,
      isStyle,
      updateStyle,
      handlePaste,
      handleCut,
      handleCopy,
      handleClearContent,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);
};
