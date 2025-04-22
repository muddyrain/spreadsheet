import { FC, useMemo } from 'react';
import { Toggle } from "@/components/ui/toggle"
import { Bold, Eraser, Italic, PaintRoller, Redo, Save, Strikethrough, Underline, Undo } from "lucide-react"
import { useStore } from '@/hooks/useStore';
export type ClickType = 'save' | 'undo' | 'redo' | 'paint' | 'eraser' | 'bold' | 'italic' | 'strikethrough' | 'underline'
export const Header: FC<{
  onClick?: (type: ClickType) => void;
}> = ({ onClick }) => {
  const { currentCell, updater, setUpdater } = useStore();
  const cellStyle = useMemo(() => {
    return currentCell?.style || {}
  }, [currentCell, updater])
  const handleClick = (type: ClickType) => {
    if (!currentCell) return
    switch (type) {
      case 'eraser':
        currentCell.style = {};
        break;
      case 'bold':
        currentCell.style.fontWeight = currentCell.style.fontWeight === 'bold' ? 'normal' : 'bold';
        break;
      case 'italic':
        currentCell.style.fontStyle = currentCell.style.fontStyle === 'italic' ? 'normal' : 'italic';
        break;
      case 'strikethrough':
        currentCell.style.textDecoration = currentCell.style.textDecoration === 'line-through' ? 'none' : 'line-through';
        break;
      case 'underline':
        currentCell.style.textDecoration = currentCell.style.textDecoration === 'underline' ? 'none' : 'underline';
        break;
    }
    setUpdater();
    onClick?.(type)
  }
  return <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-4 py-1 h-10 z-[900]">
    <Toggle className='text-lg' onClick={() => {
      handleClick('save')
    }}>
      <Save />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      handleClick('undo')
    }}
    >
      <Undo />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      handleClick('redo')
    }}
    >
      <Redo />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      handleClick('paint')
    }}
    >
      <PaintRoller />
    </Toggle>
    <Toggle pressed={false} className='text-lg' onClick={() => {
      handleClick('eraser')
    }}
    >
      <Eraser />
    </Toggle>
    <Toggle pressed={cellStyle.fontWeight === 'bold'} className='text-lg' onClick={() => {
      handleClick('bold')
    }}
    >
      <Bold />
    </Toggle>
    <Toggle pressed={cellStyle.fontStyle === 'italic'} className='text-lg' onClick={() => {
      handleClick('italic')
    }}
    >
      <Italic />
    </Toggle>
    <Toggle pressed={cellStyle.textDecoration === 'line-through'} className='text-lg' onClick={() => {
      handleClick('strikethrough')
    }}
    >
      <Strikethrough />
    </Toggle>
    <Toggle pressed={cellStyle.textDecoration === 'underline'} className='text-lg' onClick={() => {
      handleClick('underline')
    }}
    >
      <Underline />
    </Toggle>
  </div >
};

