import { useStore } from "@/hooks/useStore";
import {
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  DeleteIcon,
  DiamondPlusIcon,
  EraserIcon,
  ScissorsIcon,
} from "lucide-react";
import { FC, ReactNode, useMemo, useRef } from "react";
import { Separator } from "../ui/separator";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useFunctions } from "@/hooks/useFunctions";

interface MenuType {
  key: string;
  name?: ReactNode;
  type?: "divider";
  icon?: ReactNode;
  shortcutKey?: string;
  onClick?: () => void;
  children?: Pick<MenuType, "key" | "name" | "onClick">[];
}
export const Menu: FC<{
  position: {
    x: number;
    y: number;
  } | null;
  open?: boolean;
  onClose?: () => void;
}> = ({ open, position, onClose }) => {
  const { currentCtrlKey, containerWidth, containerHeight } = useStore();
  const { handleCopy, handlePaste, handlePasteText, handleClearContent } =
    useFunctions();
  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef, () => {
    onClose?.();
  });
  const list: MenuType[] = [
    {
      key: "copy",
      name: "复制",
      icon: <CopyIcon size={16} />,
      shortcutKey: `${currentCtrlKey}+C`,
      onClick: () => {
        handleCopy();
      },
    },
    {
      key: "cut",
      name: "剪切",
      icon: <ScissorsIcon size={16} />,
      shortcutKey: `${currentCtrlKey}+X`,
    },
    {
      key: "paste",
      name: "粘贴",
      icon: <ClipboardIcon size={16} />,
      shortcutKey: `${currentCtrlKey}+V`,
      onClick: () => {
        handlePaste();
      },
    },
    {
      key: "selection-paste",
      name: "选择性粘贴",
      children: [
        {
          key: "paste-value",
          name: "仅粘贴文本",
          onClick: () => {
            handlePasteText();
          },
        },
        {
          key: "paste-format",
          name: "仅粘贴格式",
          onClick: () => {
            handlePaste(false);
          },
        },
        {
          key: "paste-all",
          name: "粘贴所有",
          onClick: () => {
            handlePaste();
          },
        },
      ],
    },
    {
      key: "divider-1",
      type: "divider",
    },
    {
      key: "insert",
      name: "插入",
      icon: <DiamondPlusIcon size={16} />,
      children: [
        {
          key: "insert-row",
          name: "插入行",
        },
        {
          key: "insert-column",
          name: "插入列",
        },
      ],
    },
    {
      key: "delete",
      name: "删除",
      icon: <DeleteIcon size={16} />,
      children: [
        {
          key: "delete-row",
          name: "删除行",
        },
      ],
    },
    {
      key: "clear",
      name: "清除",
      icon: <EraserIcon size={16} />,
      children: [
        {
          key: "clear-content",
          name: "清除内容",
          onClick: () => {
            handleClearContent();
          },
        },
      ],
    },
  ];
  const autoPosition = useMemo(() => {
    let left = 0;
    let top = 0;
    if (position) {
      left = position.x + 20;
      top = position.y - 50;
      if (left + 240 > containerWidth) {
        left = left - 240 - 20;
      }
      if (top > containerHeight / 2) {
        top = containerHeight / 2;
      }
    }
    return {
      left,
      top,
    };
  }, [containerWidth, containerHeight, position]);
  return (
    <div
      ref={menuRef}
      className={`fixed z-50 shadow bg-white rounded py-1`}
      style={{
        width: 240,
        left: autoPosition.left,
        top: autoPosition.top,
        display: open ? "block" : "none",
      }}
    >
      {list.map((item, key) => {
        if (item?.type === "divider") {
          return <Separator key={key} className="my-1" />;
        }
        return (
          <div className="relative px-1 py-0.5 group" key={item.key || key}>
            <div
              className="w-full py-1.5 px-2 text-sm rounded-sm cursor-pointer hover:bg-zinc-100 duration-300 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                item?.onClick?.();
                onClose?.();
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center mr-1">
                {item.icon}
              </div>
              <span className="">{item.name}</span>
              {item.shortcutKey && (
                <span className="ml-auto text-zinc-400">
                  {item.shortcutKey}
                </span>
              )}
              {item.children && (
                <span className="ml-auto">
                  <ChevronRightIcon size={16} className="text-zinc-400" />
                </span>
              )}
            </div>
            {item.children && (
              <div className="scale-0 group-hover:scale-100 origin-top-left duration-300 absolute top-0 left-full z-50 w-56 shadow bg-white rounded p-1 overflow-hidden">
                {item.children.map((child, key) => {
                  return (
                    <div
                      key={child.key || key}
                      className="w-full py-1.5 px-3 text-sm rounded-sm cursor-pointer hover:bg-zinc-100 duration-300 flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        child?.onClick?.();
                        onClose?.();
                      }}
                    >
                      <span className="">{child.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
