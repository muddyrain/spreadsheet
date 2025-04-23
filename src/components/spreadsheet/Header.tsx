import { FC, useMemo } from 'react';
import { Toggle } from "@/components/ui/toggle"
import { Bold, Eraser, Italic, PaintRoller, Redo, Save, Strikethrough, Underline, Undo } from "lucide-react"
import { useStore } from '@/hooks/useStore';
import { Tooltip } from '../ui/tooltip';
import { getSelection } from '@/utils/sheet';
import { CellData } from '@/types/sheet';
export type ClickType = 'save' | 'undo' | 'redo' | 'paint' | 'eraser' | 'bold' | 'italic' | 'strikethrough' | 'underline'
export const Header: FC<{
  onClick?: (type: ClickType) => void;
}> = ({ onClick }) => {
  const { selection, data, setUpdater, updater } = useStore();
  const selectionCells = useMemo(() => {
    const { r1, r2, c1, c2 } = getSelection(selection);
    if (r1 === r2 && c1 === c2) {
      return [data[r1][c1]]
    }
    const cells: CellData[] = [];
    for (let i = r1;i <= r2;i++) {
      for (let j = c1;j <= c2;j++) {
        cells.push(data[i][j]);
      }
    }
    return cells;
  }, [selection, data, updater]);
  const isStyle = useMemo(() => {
    return {
      isBold: selectionCells.every(cell => cell.style.fontWeight === 'bold'),
      isItalic: selectionCells.every(cell => cell.style.fontStyle === 'italic'),
      isLineThrough: selectionCells.every(cell => cell.style.textDecoration === 'line-through'),
      isUnderline: selectionCells.every(cell => cell.style.textDecoration === 'underline'),
    }
  }, [selectionCells, updater])
  const handleClick = (type: ClickType) => {
    if (!selectionCells?.length) return
    switch (type) {
      case 'eraser': {
        selectionCells.forEach(cell => {
          cell.style = {}
        })
        break;
      }
      case 'bold': {
        const isAll = selectionCells.every(cell => cell.style.fontWeight === 'bold');
        selectionCells.forEach(cell => {
          if (isAll) {
            cell.style.fontWeight = 'normal';
          } else {
            cell.style.fontWeight = 'bold';
          }
        })
        break;
      }
      case 'italic': {
        const isAll = selectionCells.every(cell => cell.style.fontStyle === 'italic');
        selectionCells.forEach(cell => {
          if (isAll) {
            cell.style.fontStyle = 'normal';
          } else {
            cell.style.fontStyle = 'italic';
          }
        })
        break;
      }
      case 'strikethrough': {
        const isAll = selectionCells.every(cell => cell.style.textDecoration === 'line-through');
        selectionCells.forEach(cell => {
          if (isAll) {
            cell.style.textDecoration = 'none';
          } else {
            cell.style.textDecoration = 'line-through';
          }
        })
        break;
      }
      case 'underline':
        {
          const isAll = selectionCells.every(cell => cell.style.textDecoration === 'underline');
          selectionCells.forEach(cell => {
            if (isAll) {
              cell.style.textDecoration = 'none';
            } else {
              cell.style.textDecoration = 'underline';
            }
          })
          break;
        }
    }
    setUpdater();
    onClick?.(type)
  }
  return <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-4 py-1 h-10 z-[900]">
    <Tooltip content="保存">
      <Toggle className='text-lg' onClick={() => {
        handleClick('save')
      }}>
        <Save />
      </Toggle>
    </Tooltip>
    <Tooltip content="撤销">
      <Toggle className='text-lg' onClick={() => {
        handleClick('undo')
      }}
      >
        <Undo />
      </Toggle>
    </Tooltip>
    <Tooltip content="重做">
      <Toggle className='text-lg' onClick={() => {
        handleClick('redo')
      }}
      >
        <Redo />
      </Toggle>
    </Tooltip>
    <Tooltip content="格式刷">
      <Toggle className='text-lg' onClick={() => {
        handleClick('paint')
      }}
      >
        <PaintRoller />
      </Toggle>
    </Tooltip>
    <Tooltip content="清除格式">
      <Toggle pressed={false} className='text-lg' onClick={() => {
        handleClick('eraser')
      }}
      >
        <Eraser />
      </Toggle>
    </Tooltip>
    <Tooltip content="加粗">
      <Toggle pressed={isStyle.isBold} className={`text-lg`} onClick={() => {
        handleClick('bold')
      }}
      >
        <Bold />
      </Toggle>
    </Tooltip>
    <Tooltip content="斜体">
      <Toggle pressed={isStyle.isItalic} className='text-lg' onClick={() => {
        handleClick('italic')
      }}
      >
        <Italic />
      </Toggle>
    </Tooltip>
    <Tooltip content="删除线">
      <Toggle pressed={isStyle.isLineThrough} className='text-lg' onClick={() => {
        handleClick('strikethrough')
      }}
      >
        <Strikethrough />
      </Toggle>
    </Tooltip>
    <Tooltip content="下划线">
      <Toggle pressed={isStyle.isUnderline} className='text-lg' onClick={() => {
        handleClick('underline')
      }}
      >
        <Underline />
      </Toggle>
    </Tooltip>
  </div >
};

