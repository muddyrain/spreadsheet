import { FC, ReactNode } from "react";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip.tsx";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
type ContentType = React.ComponentProps<typeof TooltipPrimitive.Content>;
export const Tooltip: FC<
  {
    children: ReactNode;
    content?: ReactNode;
  } & Pick<ContentType, "align" | "side">
> = ({ children, content, align, side }) => {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span>{children}</span>
        </TooltipTrigger>
        {content && (
          <TooltipContent align={align} side={side}>
            {content}
          </TooltipContent>
        )}
      </TooltipRoot>
    </TooltipProvider>
  );
};
