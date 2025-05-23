import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "@/components/ui/tooltip";
import { SheetTabs } from "./SheetTabs";

export const Footer: FC = () => {
  const {
    zoomSize,
    selectedCell,
    cellInputActions,
    currentCtrlKey,
    setZoomSize,
  } = useStore();
  return (
    <div className="relative flex gap-x-1 bg-zinc-50 px-6 h-10 z-[1]">
      <SheetTabs />
      <div className="flex items-center h-8">
        <Tooltip content={`缩小（${currentCtrlKey} + ⬇）`}>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              setZoomSize(zoomSize - 0.1);
              if (selectedCell) {
                cellInputActions?.updateInputSize(selectedCell);
              }
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
              if (selectedCell) {
                cellInputActions?.updateInputSize(selectedCell);
              }
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
              if (selectedCell) {
                cellInputActions?.updateInputSize(selectedCell);
              }
            }}
          >
            <Plus />
          </Button>
        </Tooltip>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-zinc-100"></div>
    </div>
  );
};
