import { ButtonTrigger } from "@/components/ui/buttonTrigger";
import { Tooltip } from "@/components/ui/tooltip";
import { FC, useState } from "react";
import { DEFAULT_COLOR_CONFIG } from "./defaultColorConfig";
import { Separator } from "@/components/ui/separator";
import { ColorPicker, useColor } from "react-color-palette";
import { CheckIcon, ChevronRightIcon, PaletteIcon } from "lucide-react";
import "react-color-palette/dist/css/rcp.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CellData } from "@/types/sheet";

export const TextColorPicker: FC<{
  color?: string;
  onChange?: (color: string) => void;
  selectionCells: CellData[];
}> = ({ color: _color = "#000000", onChange, selectionCells = [] }) => {
  const [color, setColor] = useState(_color);
  const [customColor, setCustomColor] = useColor(_color);
  const handleClick = (color: string) => {
    selectionCells.forEach((item) => {
      item.style.color = color;
    });
  };
  return (
    <Tooltip content="字体颜色（未开发）">
      <ButtonTrigger
        onClick={() => {
          handleClick(color);
        }}
        content={
          <div className="w-74 flex flex-col pt-1">
            <div className="px-2 py-1 flex items-center hover:bg-zinc-100 rounded-sm duration-300 cursor-pointer">
              <div className="p-0.5 w-7 h-7 border border-transparent">
                <div
                  className={`w-full h-full border border-zinc-100 rounded-sm`}
                  style={{ backgroundColor: "#000000" }}
                />
              </div>
              <span className="text-sm ml-2">默认</span>
            </div>
            <div className="flex flex-wrap px-2 py-1">
              {DEFAULT_COLOR_CONFIG.map((item) => {
                return (
                  <div
                    key={item.color}
                    className="p-0.5 cursor-pointer w-7 h-7 border border-transparent duration-300 hover:border-zinc-200 rounded-sm"
                    onClick={() => {
                      setColor(item.color);
                      onChange?.(item.color);
                      handleClick(item.color);
                    }}
                  >
                    <div
                      className={`w-full h-full flex justify-center items-center text-white border border-zinc-100 rounded-sm`}
                      style={{ backgroundColor: item.color }}
                    >
                      {color === item.color && <CheckIcon size={16} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-2 py-1 flex items-center">
              <span className="text-xs">最近使用自定义颜色</span>
            </div>
            <div className="flex flex-wrap px-2 py-1">
              {DEFAULT_COLOR_CONFIG.slice(0, 2).map((item) => {
                return (
                  <div
                    key={item.color}
                    className="p-0.5 cursor-pointer w-7 h-7 border border-transparent duration-300 hover:border-zinc-200 rounded-sm"
                    onClick={() => {
                      setColor(item.color);
                      onChange?.(item.color);
                      handleClick(item.color);
                    }}
                  >
                    <div
                      className={`w-full h-full flex justify-center items-center text-white border border-zinc-100 rounded-sm`}
                      style={{ backgroundColor: item.color }}
                    >
                      {color === item.color && <CheckIcon size={16} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator orientation="horizontal" />
            <Popover>
              <PopoverTrigger>
                <div className="px-2 py-2.5 flex items-center hover:bg-zinc-100 rounded-sm duration-300 cursor-pointer">
                  <PaletteIcon size={20} />
                  <span className="text-sm ml-2">更多颜色</span>
                  <div className="ml-auto">
                    <ChevronRightIcon size={18} />
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" side="left" className="p-0">
                <div className="w-72 p-2">
                  <ColorPicker
                    height={200}
                    hideInput={["hsv", "hex"]}
                    color={customColor}
                    onChange={(color) => {
                      setCustomColor(color);
                      onChange?.(color.hex);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 128 128"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="inherit"
        >
          <path d="M10 118h118" strokeWidth={12} color={color} />
          <path d="M43 96L69 16l31 80" fill="none" />
          <path d="M51 64h36" />
        </svg>
      </ButtonTrigger>
    </Tooltip>
  );
};
