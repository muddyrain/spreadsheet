import React, { useMemo } from "react";

interface ScrollBarProps {
  type: "horizontal" | "vertical";
  viewportSize: number;
  contentSize: number;
  scrollPosition: number;
  onDragStart: (e: React.MouseEvent, type: "horizontal" | "vertical") => void;
}

export const ScrollBar: React.FC<ScrollBarProps> = ({
  type,
  viewportSize,
  contentSize,
  scrollPosition,
  onDragStart,
}) => {
  const isHorizontal = type === "horizontal";
  const scrollBarSize = useMemo(() => {
    return Math.max((viewportSize / contentSize) * viewportSize, 30);
  }, [viewportSize, contentSize]);
  const maxScroll = contentSize - viewportSize;
  const scrollBarPosition = useMemo(() => {
    if (isHorizontal) {
      return Math.max(
        (scrollPosition / maxScroll) * (viewportSize - scrollBarSize - 20),
        10,
      );
    }
    return Math.max(
      (scrollPosition / maxScroll) * (viewportSize - scrollBarSize),
      10,
    );
  }, [maxScroll, scrollPosition, viewportSize, scrollBarSize, isHorizontal]);
  return (
    <div
      className="relative border border-zinc-200 bg-zinc-50"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      style={{
        position: "absolute",
        ...(isHorizontal
          ? {
              left: 0,
              bottom: 0,
              width: "calc(100% - 17px)",
              height: "18px",
            }
          : {
              right: 0,
              top: 0,
              width: "18px",
              height: "100%",
            }),
      }}
    >
      <div
        className="box-border bg-zinc-300"
        style={{
          position: "absolute",
          ...(isHorizontal
            ? {
                height: "8px",
                width: `${scrollBarSize}px`,
                left: `${scrollBarPosition}px`,
                top: "4px",
              }
            : {
                width: "8px",
                height: `${scrollBarSize}px`,
                top: `${scrollBarPosition}px`,
                left: "4px",
              }),
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onMouseDown={(e) => onDragStart(e, type)}
      />
    </div>
  );
};
