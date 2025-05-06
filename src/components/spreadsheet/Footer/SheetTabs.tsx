import { FC, Fragment, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ListIcon, PlusIcon, TargetIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/useClickOutside";

export const SheetTabs: FC = () => {
  const [currentContextMenuId, setCurrentContextMenuId] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const { config, activeSheetId, sheets, createNewSheet, setActiveSheetId } =
    useStore();
  useClickOutside(
    menuRef,
    () => {
      setCurrentContextMenuId("");
    },
    Boolean(currentContextMenuId),
  );
  return (
    <div className="flex-1 h-full flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <span>
            <Button className="mr-4" variant={"ghost"} size={"sm"}>
              <ListIcon />
            </Button>
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-36 p-1.5">
          {sheets.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center w-full py-2 px-2 text-sm cursor-pointer rounded-sm hover:bg-zinc-50 duration-300"
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
                {item.name}
                {activeSheetId === item.id && (
                  <CheckIcon className="ml-auto" size={18} />
                )}
              </div>
            );
          })}
        </PopoverContent>
      </Popover>
      <div className="h-full flex items-center">
        {sheets.map((item) => {
          return (
            <Fragment key={item.id}>
              <Separator orientation="vertical" />
              <div
                className="min-w-24 relative h-full text-sm px-4 cursor-pointer flex items-center justify-center hover:bg-zinc-100 duration-300"
                onClick={() => {
                  setActiveSheetId(item.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCurrentContextMenuId(item.id);
                }}
              >
                <span
                  style={{
                    color:
                      activeSheetId === item.id
                        ? config.selectionBorderColor
                        : "black",
                  }}
                >
                  {item.name}
                </span>
                {activeSheetId === item.id && (
                  <TargetIcon className="absolute left-2" size={12} />
                )}
                {currentContextMenuId === item.id && (
                  <div
                    ref={menuRef}
                    className="absolute w-full py-1 bg-white bottom-[105%] shadow border rounded-sm"
                  >
                    <div className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300">
                      <span>删除</span>
                    </div>
                    <div className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300">
                      <span>重命名</span>
                    </div>
                    <div className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300">
                      <span>创建副本</span>
                    </div>
                  </div>
                )}
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
  );
};
