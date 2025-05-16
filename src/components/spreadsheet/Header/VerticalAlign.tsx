import { FC } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlignVerticalJustifyStartIcon,
  AlignVerticalJustifyCenterIcon,
  AlignVerticalJustifyEndIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { ClickType } from "@/hooks/useUpdateStyle";

export const VerticalAlign: FC<{
  isVerticalAlignStart?: boolean;
  isVerticalAlignCenter?: boolean;
  isVerticalAlignEnd?: boolean;
  onClick?: (clickType: ClickType) => void;
}> = ({
  isVerticalAlignStart,
  isVerticalAlignCenter,
  isVerticalAlignEnd,
  onClick,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <Tooltip content="对齐方式">
            <Toggle pressed={false} className="text-lg outline-0">
              {isVerticalAlignStart && <AlignVerticalJustifyStartIcon />}
              {isVerticalAlignCenter && <AlignVerticalJustifyCenterIcon />}
              {isVerticalAlignEnd && <AlignVerticalJustifyEndIcon />}
              {!isVerticalAlignStart &&
                !isVerticalAlignCenter &&
                !isVerticalAlignEnd && <AlignVerticalJustifyCenterIcon />}
              <ChevronDownIcon />
            </Toggle>
          </Tooltip>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuCheckboxItem
          checked={isVerticalAlignStart}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("verticalAlignStart");
            }
          }}
        >
          <AlignVerticalJustifyStartIcon />
          <span>顶端对齐</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={isVerticalAlignCenter}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("verticalAlignCenter");
            }
          }}
        >
          <AlignVerticalJustifyCenterIcon />
          <span>垂直对齐</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={isVerticalAlignEnd}
          onCheckedChange={(checked) => {
            if (checked) {
              onClick?.("verticalAlignEnd");
            }
          }}
        >
          <AlignVerticalJustifyEndIcon />
          <span>底端对齐</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
