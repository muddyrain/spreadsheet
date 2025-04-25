import React, { useState } from 'react';
import { TableData, SpreadsheetConfig, SpreadsheetType, SelectionSheetType, } from '../../types/sheet';
import _ from 'lodash';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import { SpreadsheetContext } from './context';
import Spreadsheet from './spreadsheet';

const RootSpreadsheet: React.FC<{
  config?: SpreadsheetConfig;
  spreadsheet?: SpreadsheetType
  onChange?: (data: TableData) => void;
}> = (props) => {
  const { config: _config, onChange } = props;
  const { config, setEditingCell, selectedCell, setSelectedCell, data, setData, editingCell, currentCell,
    updater,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    forceUpdate } = props.spreadsheet ?? useSpreadsheet(_config);
  const [headerColsWidth, setHeaderColsWidth] = useState<number[]>([]);
  const [headerRowsHeight, setHeaderRowsHeight] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState<SelectionSheetType>({ start: null, end: null });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  return (
    <SpreadsheetContext.Provider value={{
      data,
      config,
      currentCell,
      updater,
      setUpdater: forceUpdate,
      isFocused,
      setIsFocused,
      selection,
      setSelection,
      headerColsWidth,
      setHeaderColsWidth,
      headerRowsHeight,
      setHeaderRowsHeight,
      scrollPosition,
      setScrollPosition,
      selectedCell,
      setSelectedCell,
      editingCell,
      setEditingCell,
      setData
    }}>
      <Spreadsheet onChange={onChange} />
    </SpreadsheetContext.Provider>
  );
};

export default RootSpreadsheet;

