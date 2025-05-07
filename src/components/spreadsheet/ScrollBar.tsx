import React from "react";

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
  const scrollBarSize = (viewportSize / contentSize) * 100;
  const scrollBarPosition = (scrollPosition / contentSize) * 100;
  return (
    <div
      className="relative border border-zinc-200 bg-zinc-50"
      onContextMenu={(e) => {
        e.preventDefault();
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
                width: `${scrollBarSize}%`,
                left: `${scrollBarPosition}%`,
                top: "4px",
              }
            : {
                width: "8px",
                height: `${scrollBarSize}%`,
                top: `${scrollBarPosition}%`,
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
