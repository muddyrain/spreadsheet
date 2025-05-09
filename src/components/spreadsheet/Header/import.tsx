import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { ImportIcon } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
export const Import: FC = () => {
  return (
    <Tooltip content={"导入表格"}>
      <Dialog>
        <DialogTrigger asChild>
          <Toggle pressed={false} className="text-lg outline-0">
            <ImportIcon />
            <span className="text-xs">导入表格</span>
          </Toggle>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入表格</DialogTitle>
            <DialogDescription>仅支持.xlsx, .xls, .csv</DialogDescription>
          </DialogHeader>
          <FileUpload />
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};
