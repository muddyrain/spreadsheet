import { ButtonTrigger } from "@/components/ui/buttonTrigger";
import { Tooltip } from "@/components/ui/tooltip";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_COLOR_CONFIG } from "./defaultColorConfig";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ChevronRightIcon, PaletteIcon } from "lucide-react";
import { CellData } from "@/types/sheet";
import { useStore } from "@/hooks/useStore";

const RECENT_COLORS_KEY = "recent_text_colors";
function getRecentColors(): typeof DEFAULT_COLOR_CONFIG {
  try {
    const data = localStorage.getItem(RECENT_COLORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function setRecentColors(colors: typeof DEFAULT_COLOR_CONFIG) {
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors));
}

export const TextColorPicker: FC<{
  color?: string;
  onChange?: (color: string) => void;
  selectionCells: CellData[];
}> = ({ color: _color = "", onChange, selectionCells = [] }) => {
  const [recentColors, setRecentColorsState] =
    useState<typeof DEFAULT_COLOR_CONFIG>(getRecentColors());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputColorRef = useRef<HTMLInputElement>(null);
  const { config, currentCell, setUpdater } = useStore();
  const [color, setColor] = useState(config.color);
  const handleRecentColor = (item: (typeof DEFAULT_COLOR_CONFIG)[0]) => {
    let colors = getRecentColors();
    colors = [item, ...colors.filter((c) => c.color !== item.color)].slice(
      0,
      10,
    );
    setRecentColors(colors);
    setRecentColorsState(colors);
  };
  const handleClick = (item: (typeof DEFAULT_COLOR_CONFIG)[0]) => {
    setColor(item.color);
    selectionCells.forEach((cItem) => {
      cItem.style.color = item.color;
    });
    handleRecentColor(item);
    setUpdater();
  };
  const currentCellColor = useMemo(() => {
    return currentCell?.style.color;
  }, [currentCell]);
  useEffect(() => {
    setRecentColorsState(getRecentColors());
  }, []);
  return (
    <Tooltip content="字体颜色（未开发）">
      <ButtonTrigger
        onClick={() => {
          handleClick({
            color: color,
            label: "默认",
          });
        }}
        content={
          <div className="w-74 flex flex-col pt-1">
            <div className="px-2 py-1 flex items-center hover:bg-zinc-100 rounded-sm duration-300 cursor-pointer">
              <div className="p-0.5 w-7 h-7 border border-transparent">
                <div
                  className={`w-full h-full border border-zinc-100 rounded-sm`}
                  style={{ backgroundColor: config.color }}
                />
              </div>
              <span className="text-sm ml-2">默认</span>
            </div>
            <div className="flex flex-wrap px-2 py-1">
              {DEFAULT_COLOR_CONFIG.map((item, index) => {
                return (
                  <div
                    key={item.color}
                    className="p-0.5 cursor-pointer w-7 h-7 border border-transparent duration-300 hover:border-zinc-200 rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColor(item.color);
                      onChange?.(item.color);
                      handleClick(item);
                    }}
                  >
                    <div
                      className={`w-full h-full flex justify-center items-center border border-zinc-100 rounded-sm`}
                      style={{ backgroundColor: item.color }}
                    >
                      <CheckIcon
                        className={`duration-300 ${index >= 5 && index <= 9 ? "text-black" : "text-white"} ${currentCellColor === item.color ? "scale-100" : "scale-0"}`}
                        size={16}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {recentColors.length > 0 && (
              <>
                <div className="px-2 py-1 flex items-center justify-between text-xs">
                  <span>最近使用自定义颜色</span>
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentColors([]);
                      setRecentColorsState([]);
                    }}
                  >
                    清空
                  </span>
                </div>
                <div className="flex flex-wrap px-2 py-1">
                  {recentColors.map((item, index) => {
                    return (
                      <div
                        key={item.color}
                        className="p-0.5 cursor-pointer w-7 h-7 border border-transparent duration-300 hover:border-zinc-200 rounded-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setColor(item.color);
                          onChange?.(item.color);
                          handleClick(item);
                        }}
                      >
                        <div
                          className={`w-full h-full flex justify-center items-center text-white border border-zinc-100 rounded-sm`}
                          style={{ backgroundColor: item.color }}
                        >
                          <CheckIcon
                            className={`duration-300 ${index >= 5 && index <= 9 ? "text-black" : "text-white"} ${currentCellColor === item.color ? "scale-100" : "scale-0"}`}
                            size={16}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <Separator orientation="horizontal" />
            <div
              onClick={(e) => {
                e.stopPropagation();
                setTimeout(() => {
                  inputColorRef.current?.click();
                }, 0);
              }}
              className="px-2 py-2.5 flex items-center hover:bg-zinc-100 rounded-sm duration-300 cursor-pointer"
            >
              <PaletteIcon size={20} />
              <span className="text-sm ml-2">更多颜色</span>
              <div className="ml-auto">
                <ChevronRightIcon size={18} />
              </div>
            </div>
            <input
              type="color"
              className="w-0 h-0"
              ref={inputColorRef}
              value={color}
              onChange={(e) => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                const value = e.target.value;
                debounceRef.current = setTimeout(() => {
                  handleClick({
                    color: value,
                    label: value,
                  });
                }, 300);
              }}
            />
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
