import { FC } from "react";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "../ui/tooltip";
export const Footer: FC = () => {
  const { zoomSize, currentCtrlKey, setZoomSize } = useStore();
  return (
    <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-4 py-1 h-8 z-[900]">
      <div className="flex-1 bg-red-100"> </div>
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
            className="text-sm w-16 text-center cursor-pointer"
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
