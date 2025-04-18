import { TableData } from '../types/sheet';
export const filterData = (data: TableData) => {
  const newData = data.map((row, rowIndex) => {
    if (rowIndex === 0) {
      return null
    }
    return row.map((cell, colIndex) => {
      if (colIndex === 0) {
        return null
      }
      return cell
    }).filter((cell) => cell !== null)
  }).filter((row) => row !== null)
  return newData
}