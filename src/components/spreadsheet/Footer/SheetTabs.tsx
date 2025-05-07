import { FC, Fragment, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ListIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/useClickOutside";
import { measureTextWidth } from "@/utils/dom";

export const SheetTabs: FC = () => {
  const [currentContextMenuId, setCurrentContextMenuId] = useState("");
  const [currentReNameId, setCurrentReNameId] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    config,
    activeSheetId,
    sheets,
    createNewSheet,
    createCopySheet,
    deleteSheet,
    setActiveSheetId,
    setEditingCell,
  } = useStore();
  useClickOutside(
    [menuRef],
    () => {
      setCurrentContextMenuId("");
    },
    Boolean(currentContextMenuId),
  );
  return (
    <div
      className="flex-1 h-full flex items-center"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
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
                  setEditingCell(null);
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
                className="min-w-24 max-w-48 relative h-full text-sm px-4 cursor-pointer flex items-center justify-center hover:bg-zinc-100 duration-300"
                onClick={() => {
                  setEditingCell(null);
                  setActiveSheetId(item.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCurrentContextMenuId(item.id);
                }}
              >
                {currentReNameId === item.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="min-w-16 max-w-48 px-2 text-sm rounded-sm outline-0 border"
                    style={{
                      borderColor: config.selectionBorderColor,
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        setCurrentReNameId("");
                      }
                    }}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.name = e.target.value;
                    }}
                    onBlur={() => {
                      setCurrentReNameId("");
                    }}
                  />
                ) : (
                  <span
                    ref={textRef}
                    className="select-none truncate"
                    style={{
                      color:
                        activeSheetId === item.id
                          ? config.selectionBorderColor
                          : "black",
                    }}
                  >
                    {item.name}
                  </span>
                )}

                {currentContextMenuId === item.id && (
                  <div
                    ref={menuRef}
                    className="absolute w-full py-1 bg-white bottom-[105%] shadow border rounded-sm"
                  >
                    <div
                      className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentContextMenuId("");
                        if (sheets.length === 1) {
                          toast.info("至少保留一个工作表");
                          return;
                        }
                        toast.info(`确定删除工作表\n【${item.name}】?`, {
                          action: (
                            <div className="ml-auto flex items-center">
                              <Button
                                size={"sm"}
                                variant="ghost"
                                onClick={() => {
                                  toast.dismiss();
                                }}
                              >
                                取消
                              </Button>
                              <Button
                                className="ml-2"
                                size={"sm"}
                                onClick={() => {
                                  toast.dismiss();
                                  deleteSheet(item.id);
                                }}
                              >
                                确定
                              </Button>
                            </div>
                          ),
                        });
                      }}
                    >
                      <span>删除</span>
                    </div>
                    <div
                      className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        const textWidth = measureTextWidth(
                          item.name,
                          textRef.current,
                        );
                        setCurrentReNameId(item.id);
                        setCurrentContextMenuId("");
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.value = item.name;
                            inputRef.current.style.width = `${textWidth + 12}px`;
                          }
                          inputRef.current?.focus();
                          // 光标移到末尾
                        }, 0);
                      }}
                    >
                      <span>重命名</span>
                    </div>
                    <div
                      className="w-full py-2 px-3 text-sm cursor-pointer hover:bg-zinc-100 duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentContextMenuId("");
                        setEditingCell(null);
                        createCopySheet(item.id);
                      }}
                    >
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
