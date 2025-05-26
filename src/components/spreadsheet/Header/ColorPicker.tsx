import { ButtonTrigger } from "@/components/ui/buttonTrigger";
import { FC, memo, useMemo, useRef, useState } from "react";
import { DEFAULT_COLOR_CONFIG } from "@/constant/colors/default_colors";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ChevronRightIcon, PaletteIcon } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useUpdateStyle } from "@/hooks/useUpdateStyle";

type ColorItemType = (typeof DEFAULT_COLOR_CONFIG)[0];
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
const ColorList: FC<{
  list?: ColorItemType[];
  type?: "text" | "background";
  onClick?: (item: ColorItemType) => void;
}> = ({ list = [], type = "text", onClick }) => {
  const { isStyle } = useUpdateStyle();
  const currentCellColor = useMemo(() => {
    if (type === "background") {
      return isStyle.backgroundColor;
    } else {
      return isStyle.color;
    }
  }, [isStyle, type]);
  return (
    <div className="flex flex-wrap px-2 py-1">
      {list.map((item, index) => {
        return (
          <div
            key={item.value}
            className="relative p-0.5 cursor-pointer w-7 h-7 border border-transparent duration-300 hover:border-zinc-200 rounded-sm group flex flex-col items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(item);
            }}
          >
            <div
              className={`w-full h-full flex justify-center items-center border border-zinc-100 rounded-sm`}
              style={{ backgroundColor: item.value }}
            >
              <CheckIcon
                className={`duration-300 ${index >= 5 && index <= 9 ? "text-black" : "text-white"} ${currentCellColor === item.value ? "scale-100" : "scale-0"}`}
                size={16}
              />
            </div>
            <div
              className={`absolute w-fit text-center opacity-0 scale-0 origin-bottom duration-100 whitespace-nowrap -translate-y-full py-1 px-2 bg-black/90 text-white rounded-sm pointer-events-none text-sm group-hover:opacity-100 group-hover:scale-100`}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const ColorPickerInner: FC<{
  color?: string;
  onChange?: (color: string) => void;
  type?: "text" | "background";
}> = ({ color: _color = "", type = "text", onChange }) => {
  const [recentColors, setRecentColorsState] =
    useState<ColorItemType[]>(getRecentColors());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputColorRef = useRef<HTMLInputElement>(null);
  const { config } = useStore();
  const backgroundType = type === "background";
  const defaultColor = backgroundType ? config.backgroundColor : config.color;
  const [color, setColor] = useState<ColorItemType>({
    value: defaultColor,
    label: "默认",
  });
  const { handleUpdaterColor } = useUpdateStyle();

  const handleRecentColor = (item: ColorItemType) => {
    let colors = getRecentColors();
    colors = [item, ...colors.filter((c) => c.value !== item.value)].slice(
      0,
      10,
    );
    setRecentColors(colors);
    setRecentColorsState(colors);
  };
  const handleClick = (item: ColorItemType, isRecent = true) => {
    setColor(item);
    if (isRecent) handleRecentColor(item);
    handleUpdaterColor(backgroundType, item.value);
  };

  return (
    <ButtonTrigger
      buttonTooltip={`${backgroundType ? "背景" : "字体"}颜色`}
      moreTooltip="更多颜色"
      onClick={() => {
        handleClick({
          value: color.value,
          label: color.label,
        });
      }}
      onClickMore={() => {
        setRecentColorsState(getRecentColors());
      }}
      content={
        <div className="w-74 flex flex-col pt-1">
          <div
            className="px-2 py-1 flex items-center hover:bg-zinc-100 rounded-sm duration-300 cursor-pointer"
            onClick={() => {
              onChange?.(defaultColor);
              handleClick(
                {
                  value: defaultColor,
                  label: "默认",
                },
                false,
              );
            }}
          >
            <div className={` p-0.5 w-7 h-7`}>
              <div
                className={`w-full h-full border border-zinc-100 rounded-sm`}
                style={{ backgroundColor: defaultColor }}
              />
            </div>
            <span className="text-sm ml-2">
              {backgroundType ? "无填充色" : "默认"}
            </span>
          </div>
          <ColorList
            list={DEFAULT_COLOR_CONFIG}
            type={type}
            onClick={(item) => {
              onChange?.(item.value);
              handleClick(item);
            }}
          />
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
              <ColorList
                list={recentColors}
                type={type}
                onClick={(item) => {
                  onChange?.(item.value);
                  handleClick(item);
                }}
              />
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
            value={color.value || "#000000"}
            onChange={(e) => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              const value = e.target.value;
              debounceRef.current = setTimeout(() => {
                handleClick({
                  value: value,
                  label: value,
                });
              }, 300);
            }}
          />
        </div>
      }
    >
      {backgroundType ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="lucide lucide-paint-bucket-icon lucide-paint-bucket"
        >
          <path d="M2 20h16" color={color.value} />
          <path d="m15 9-6-6-6.6 6.6a1.5 1.5 0 0 0 0 2.1l4 4c.6.6 1.5.6 2.1 0L16 9Z" />
          <path d="m4 2 4 4" />
          <path d="M2 11h12" />
          <path d="M18 16a1.5 1.5 0 1 1-3 0c0-1.2 1.2-1.8 1.5-3 .3 1.2 1.5 1.8 1.5 3Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="lucide lucide-baseline-icon lucide-baseline"
        >
          <path d="M4 20h16" color={color.value} />
          <path d="m6 16 6-12 6 12" />
          <path d="M8 12h8" />
        </svg>
      )}
    </ButtonTrigger>
  );
};

export const ColorPicker = memo(ColorPickerInner);
