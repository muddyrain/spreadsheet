import { ChevronDownIcon } from "lucide-react";
import { FC, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "./separator";

export const ButtonTrigger: FC<{
  children?: React.ReactNode;
  content?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}> = ({ children = null, content = null, onClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <PopoverTrigger>
        <div
          className={cn(
            "flex cursor-pointer items-center h-8 text-lg group border duration-300 border-transparent rounded-sm hover:border-zinc-200",
            open && "bg-zinc-100 border-zinc-200",
          )}
        >
          <div
            className="h-full px-1 flex items-center hover:bg-zinc-100"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(e);
            }}
          >
            {children}
          </div>
          <Separator
            className={cn(
              "h-full duration-300 opacity-0 group-hover:opacity-100",
              open && "opacity-100",
            )}
            orientation="vertical"
          />
          <div
            className="h-full px-1 flex items-center hover:bg-zinc-100"
            onClick={() => {
              setOpen(!open);
            }}
          >
            <ChevronDownIcon size={14} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        {content}
      </PopoverContent>
    </Popover>
  );
};
