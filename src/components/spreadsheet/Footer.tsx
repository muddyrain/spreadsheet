import { FC, Fragment } from "react";
import { Button } from "../ui/button";
import { ListIcon, Minus, Plus, PlusIcon } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Tooltip } from "../ui/tooltip";
import { Separator } from "../ui/separator";
export const Footer: FC = () => {
  const {
    config,
    zoomSize,
    currentCtrlKey,
    activeSheetId,
    sheets,
    setZoomSize,
    createNewSheet,
    setActiveSheetId,
  } = useStore();
  return (
    <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-6 h-8 z-[1]">
      <div className="flex-1 h-full flex items-center">
        <Button className="mr-4" variant={"ghost"} size={"sm"}>
          <ListIcon />
        </Button>
        <div className="h-full flex items-center">
          {sheets.map((item, index) => {
            return (
              <Fragment key={item.id}>
                <Separator orientation="vertical" />
                <div
                  className="h-full text-sm px-4 cursor-pointer flex items-center justify-center hover:bg-zinc-100 duration-300"
                  style={{
                    color:
                      activeSheetId === item.id
                        ? config.selectionBorderColor
                        : "black",
                  }}
                  onClick={() => {
                    setActiveSheetId(item.id);
                  }}
                >
                  sheet{index + 1}
                </div>
              </Fragment>
            );
          })}
        </div>
        <>
          <Separator orientation="vertical" />
          <div
            className="h-full px-4 cursor-pointer flex items-center justify-center hover:bg-zinc-100 duration-300"
            onClick={() => {
              createNewSheet();
            }}
          >
            <PlusIcon size={20} />
          </div>
          <Separator orientation="vertical" />
        </>
      </div>
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
