import { FC } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Eraser,
  Italic,
  PaintRoller,
  Redo,
  Save,
  Share,
  Strikethrough,
  TableCellsMerge,
  Underline,
  Undo,
  WrapText,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Settings } from "./Settings";
import { ColorPicker } from "./ColorPicker";
import { Import } from "./import";
import { TextAlign } from "./TextAlign";
import { ClickType, useUpdateStyle } from "@/hooks/useUpdateStyle";
import { VerticalAlign } from "./VerticalAlign";

export const Header: FC<{
  onClick?: (type: ClickType) => void;
}> = ({ onClick }) => {
  const { isStyle, updateStyle } = useUpdateStyle();

  const handleClick = (type: ClickType) => {
    updateStyle(type);
    onClick?.(type);
  };
  return (
    <div
      className="flex items-center gap-x-1 bg-zinc-50 px-4 py-1 h-10 z-[1]"
      onKeyDown={(e) => {
        e.preventDefault();
      }}
    >
      <Tooltip content="保存（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("save");
          }}
        >
          <Save />
        </Toggle>
      </Tooltip>
      <Tooltip content="撤销（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("undo");
          }}
        >
          <Undo />
        </Toggle>
      </Tooltip>
      <Tooltip content="重做（未开发）">
        <Toggle
          className="text-lg"
          onClick={() => {
            handleClick("redo");
          }}
        >
          <Redo />
        </Toggle>
      </Tooltip>
      <Tooltip content="格式刷">
        <Toggle
          pressed={isStyle.isPaint}
          className="text-lg"
          onClick={() => {
            handleClick("paint");
          }}
        >
          <PaintRoller />
        </Toggle>
      </Tooltip>
      <Tooltip content="清除格式">
        <Toggle
          pressed={false}
          className="text-lg"
          onClick={() => {
            handleClick("eraser");
          }}
        >
          <Eraser />
        </Toggle>
      </Tooltip>
      <Tooltip content="加粗">
        <Toggle
          pressed={isStyle.isBold}
          className={`text-lg`}
          onClick={() => {
            handleClick("bold");
          }}
        >
          <Bold />
        </Toggle>
      </Tooltip>
      <Tooltip content="斜体">
        <Toggle
          pressed={isStyle.isItalic}
          className="text-lg"
          onClick={() => {
            handleClick("italic");
          }}
        >
          <Italic />
        </Toggle>
      </Tooltip>
      <Tooltip content="删除线">
        <Toggle
          pressed={isStyle.isLineThrough}
          className="text-lg"
          onClick={() => {
            handleClick("strikethrough");
          }}
        >
          <Strikethrough />
        </Toggle>
      </Tooltip>
      <Tooltip content="下划线">
        <Toggle
          pressed={isStyle.isUnderline}
          className="text-lg"
          onClick={() => {
            handleClick("underline");
          }}
        >
          <Underline />
        </Toggle>
      </Tooltip>
      <Separator orientation="vertical" />
      <ColorPicker type="text" />
      <ColorPicker type="background" />
      <Separator orientation="vertical" />
      <VerticalAlign
        isVerticalAlignStart={isStyle.isVerticalAlignStart}
        isVerticalAlignCenter={isStyle.isVerticalAlignCenter}
        isVerticalAlignEnd={isStyle.isVerticalAlignEnd}
        onClick={handleClick}
      />
      <TextAlign
        isAlignLeft={isStyle.isAlignLeft}
        isAlignCenter={isStyle.isALignCenter}
        isAlignRight={isStyle.isALignRight}
        onClick={handleClick}
      />
      <Tooltip content={"换行"}>
        <Toggle
          pressed={isStyle.isWrap}
          className="text-lg outline-0"
          onClick={() => {
            handleClick("wrap");
          }}
        >
          <WrapText />
          <span className="text-xs">换行</span>
        </Toggle>
      </Tooltip>
      <Tooltip content={(isStyle.isMergeCell ? "拆分" : "合并") + "单元格"}>
        <Toggle
          pressed={isStyle.isMergeCell}
          className="text-lg outline-0"
          onClick={() => {
            handleClick("merge");
          }}
        >
          <TableCellsMerge />
          <span className="text-xs">
            {isStyle.isMergeCell ? "拆分" : "合并"}
          </span>
        </Toggle>
      </Tooltip>
      <Separator orientation="vertical" />
      <Tooltip content={"导出表格"}>
        <Toggle
          pressed={false}
          className="text-lg outline-0"
          onClick={() => {
            handleClick("export");
          }}
        >
          <Share />
          <span className="text-xs">导出表格</span>
        </Toggle>
      </Tooltip>
      <Import />

      <div className="ml-auto">
        <Settings />
      </div>
    </div>
  );
};
