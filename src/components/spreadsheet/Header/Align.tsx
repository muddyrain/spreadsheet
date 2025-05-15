import { FC } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { ClickType } from "@/hooks/useUpdateStyle";

export const Align: FC<{
  isAlignLeft?: boolean;
  isAlignCenter?: boolean;
  isAlignRight?: boolean;
  onClick?: (clickType: ClickType) => void;
}> = ({ isAlignLeft, isAlignCenter, isAlignRight, onClick }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <Tooltip content="对齐方式">
            <Toggle pressed={false} className="text-lg outline-0">
              {isAlignLeft && <AlignLeftIcon />}
              {isAlignCenter && <AlignCenterIcon />}
              {isAlignRight && <AlignRightIcon />}
              {!isAlignLeft && !isAlignCenter && !isAlignRight && (
                <AlignLeftIcon />
              )}
              <ChevronDownIcon />
            </Toggle>
          </Tooltip>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuCheckboxItem
          checked={isAlignLeft}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("alignLeft");
            }
          }}
        >
          <AlignLeftIcon />
          <span>左对齐</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={isAlignCenter}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("alignCenter");
            }
          }}
        >
          <AlignCenterIcon />
          <span>居中对齐</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={isAlignRight}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("alignRight");
            }
          }}
        >
          <AlignRightIcon />
          <span>右对齐</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
