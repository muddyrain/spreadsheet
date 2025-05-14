import { useStore } from "@/hooks/useStore";
import { FC } from "react";

export const Current: FC = () => {
  const { config, currentCell, data, zoomSize, setData } = useStore();
  const row = currentCell?.row || 0;
  const col = currentCell?.col || 0;
  return (
    <div className="h-8 border-t border-zinc-200 flex">
      <div
        className="h-full flex justify-center items-center border-r select-none text-sm border-zinc-200"
        style={{
          width: config.fixedColWidth * zoomSize + 1,
          fontSize: config.fontSize * zoomSize * 1.333,
        }}
      >
        <span>
          {data[0]?.[col]?.value}
          {data[row]?.[0]?.value}
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-2">
        <input
          value={currentCell?.value || ""}
          type="text"
          className="w-full h-full outline-0"
          style={{
            fontSize: config.fontSize * zoomSize * 1.333,
          }}
          onChange={(e) => {
            e.stopPropagation();
            data[row][col].value = e.target.value;
            setData([...data]);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          readOnly={!currentCell}
        />
      </div>
    </div>
  );
};
