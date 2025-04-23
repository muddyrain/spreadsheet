import { SpreadsheetContext } from "@/components/spreadsheet/context"
import { useContext } from "react"

export const useStore = () => {
  const context = useContext(SpreadsheetContext)
  if (!context) {
    throw new Error('useStore must be used within a SpreadsheetProvider')
  }
  return context
}