import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "@/components/ui/tooltip";
import { SheetTabs } from "./SheetTabs";

export const Footer: FC = () => {
  const { zoomSize, currentCtrlKey, setZoomSize } = useStore();
  return (
    <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-6 h-8 z-[1]">
      <SheetTabs />
      <div className="flex items-center h-full">
        <Tooltip content={`缩小（${currentCtrlKey} + ⬇）`}>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              setZoomSize(zoomSize - 0.1);
            }}
          >
            <Minus />
          </Button>
        </Tooltip>
        <Tooltip content="缩放比例 (点击复原)">
          <div
            className="text-sm w-16 text-center cursor-pointer select-none"
            onClick={() => {
              setZoomSize(1);
            }}
          >
            {parseInt((zoomSize * 100).toString())}%
          </div>
        </Tooltip>
        <Tooltip content={`放大（${currentCtrlKey} + ⬆）`}>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              setZoomSize(zoomSize + 0.1);
            }}
          >
            <Plus />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
