import { useStore } from "@/hooks/useStore";
import { createDefaultCell } from "@/utils/sheet";
import { produce } from "immer";
import { FC, useState } from "react";

export const AppendRow: FC<{
  viewportSize: number;
  contentSize: number;
  scrollPosition: number;
}> = ({ viewportSize, contentSize, scrollPosition }) => {
  const [row, setRow] = useState(200);
  const { config, setData, setHeaderRowsHeight } = useStore();
  const handleClick = () => {
    setData(
      produce((data) => {
        const cols = data[0].length;
        const rows = data.length;
        for (let i = rows; i < row + rows; i++) {
          data[i] = [];
          for (let j = 0; j < cols; j++) {
            data[i][j] = createDefaultCell(config, i, j);
          }
        }
      }),
    );
    setHeaderRowsHeight(
      produce((rows) => {
        const rowsLength = rows.length;
        for (let i = rowsLength; i < row + rowsLength; i++) {
          rows.push(config.height);
        }
      }),
    );
  };

  return (
    <div
      className="absolute p-2 bg-white left-2 text-sm"
      style={{
        bottom: -(contentSize - scrollPosition - viewportSize),
      }}
    >
      <span>在底部添加</span>
      <input
        value={row}
        className="border rounded-sm py-0.5 px-1 mx-2 w-16 outline-0 focus:border-blue-500"
        type="number"
        max={1000}
        min={1}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        onInput={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          e.stopPropagation();
          const value = Number(e.target.value);
          if (value <= 1000) {
            if (value < 1) {
              setRow(1);
              return;
            }
            setRow(value);
          } else {
            setRow(1000);
          }
        }}
      />
      <span>行</span>
      <button
        className="cursor-pointer border rounded-sm px-2 py-0.5 mx-2 hover:bg-zinc-100 duration-300"
        onClick={handleClick}
      >
        添加
      </button>
    </div>
  );
};
