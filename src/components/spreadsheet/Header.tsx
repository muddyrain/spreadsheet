import { FC, useContext, useMemo } from 'react';
import { Toggle } from "@/components/ui/toggle"
import { Bold, Eraser, Italic, PaintRoller, Redo, Save, Strikethrough, Underline, Undo } from "lucide-react"
import { SpreadsheetContext } from '.';
export type ClickType = 'save' | 'undo' | 'redo' | 'paint' | 'eraser' | 'bold' | 'italic' | 'strikethrough' | 'underline'
export const Header: FC = () => {
  const { currentCell, updater, setUpdater } = useContext(SpreadsheetContext);
  const cellStyle = useMemo(() => {
    return currentCell?.style || {}
  }, [currentCell, updater])
  const onClick = (type: ClickType) => {
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
    setUpdater(+new Date());
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
    <Toggle pressed={false} className='text-lg' onClick={() => {
      onClick && onClick('eraser')
    }}
    >
      <Eraser />
    </Toggle>
    <Toggle pressed={cellStyle.fontWeight === 'bold'} className='text-lg' onClick={() => {
      onClick && onClick('bold')
    }}
    >
      <Bold />
    </Toggle>
    <Toggle pressed={cellStyle.fontStyle === 'italic'} className='text-lg' onClick={() => {
      onClick && onClick('italic')
    }}
    >
      <Italic />
    </Toggle>
    <Toggle pressed={cellStyle.textDecoration === 'line-through'} className='text-lg' onClick={() => {
      onClick && onClick('strikethrough')
    }}
    >
      <Strikethrough />
    </Toggle>
    <Toggle pressed={cellStyle.textDecoration === 'underline'} className='text-lg' onClick={() => {
      onClick && onClick('underline')
    }}
    >
      <Underline />
    </Toggle>
  </div >
};

