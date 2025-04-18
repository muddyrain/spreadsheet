import { FC, useContext, useMemo, useState } from 'react';
import { Toggle } from "@/components/ui/toggle"
import { Bold, Eraser, Italic, PaintRoller, Redo, Save, Strikethrough, Underline, Undo } from "lucide-react"
import { SpreadsheetContext } from '.';
export type ClickType = 'save' | 'undo' | 'redo' | 'paint' | 'eraser' | 'bold' | 'italic' | 'strikethrough' | 'underline'
export const Header: FC = () => {
  const [updater, setUpdater] = useState(+ new Date());
  const { currentCell, data } = useContext(SpreadsheetContext);
  const isBlod = useMemo(() => {
    return currentCell?.style.fontWeight === 'bold'
  }, [currentCell, updater])
  const onClick = (type: ClickType) => {
    console.log('click', currentCell);
    if (!currentCell) return
    switch (type) {
      case 'bold':
        currentCell.style.fontWeight = currentCell.style.fontWeight === 'bold' ? 'normal' : 'bold';
        break;
    }
    setUpdater(+ new Date());
  }
  return <div className="flex items-center gap-x-1 justify-center bg-zinc-50 px-4 py-1 h-10 z-[900]">
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('save')
    }}>
      <Save />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('undo')
    }}
    >
      <Undo />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('redo')
    }}
    >
      <Redo />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('paint')
    }}
    >
      <PaintRoller />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('eraser')
    }}
    >
      <Eraser />
    </Toggle>
    <Toggle pressed={isBlod} className='text-lg' onClick={() => {
      onClick && onClick('bold')
    }}
    >
      <Bold />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('italic')
    }}
    >
      <Italic />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('strikethrough')
    }}
    >
      <Strikethrough />
    </Toggle>
    <Toggle className='text-lg' onClick={() => {
      onClick && onClick('underline')
    }}
    >
      <Underline />
    </Toggle>
  </div >
};

