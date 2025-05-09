import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useImportExcel } from "@/hooks/useImportExcel";
import { generateUUID } from "@/utils";
import { UploadIcon } from "lucide-react";

type FileType = {
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  uid: string;
};
export const FileUpload = ({
  onChange,
}: {
  onChange?: (filesList: FileType[]) => void;
}) => {
  const [filesList, setFilesList] = useState<FileType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importExcel = useImportExcel();
  const handleFileChange = (newFiles: File[]) => {
    const newFilesList: FileType[] = newFiles.map((file) => {
      const uid = generateUUID();
      importExcel(file, {
        onProgress: (progress) => {
          setFilesList((prev) => {
            const index = prev.findIndex((item) => item.uid === uid);
            prev[index] = { ...prev[index], status: "uploading", progress };
            return [...prev];
          });
        },
      }).then(() => {
        // 延迟0.5秒后更新状态
        setTimeout(() => {
          setFilesList((prev) => {
            const index = prev.findIndex((item) => item.uid === uid);
            prev[index] = {
              ...prev[index],
              status: "success",
              progress: 100,
            };
            return [...prev];
          });
        }, 500);
      });
      return {
        uid,
        file,
        status: "uploading",
        progress: 0,
      };
    });
    setFilesList((prev) => {
      if (onChange) {
        onChange([...prev, ...newFilesList]);
      }
      return [...prev, ...newFilesList];
    });
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full outline-0" {...getRootProps()}>
      <div
        onClick={handleClick}
        className="p-10 block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          accept=".xlsx, .xls, .csv"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            上传文件
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            将文件拖放到此处或点击上传
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {filesList.length > 0 &&
              filesList.map((fileItem, idx) => (
                <div
                  key={"file" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm",
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <p className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                      {fileItem.file.name}
                    </p>
                    <p className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
                      {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                    <p>
                      文件修改时间{" "}
                      {new Date(
                        fileItem.file.lastModified,
                      ).toLocaleDateString()}
                    </p>
                    {fileItem.status === "success" && <span>上传成功</span>}
                    {fileItem.status === "uploading" && (
                      <p>
                        上传进度:{" "}
                        {parseFloat(
                          (fileItem.progress * 100).toString(),
                        ).toFixed(2)}
                        %
                      </p>
                    )}
                    {fileItem.status === "error" && <span>上传失败</span>}
                  </div>
                </div>
              ))}
            {!filesList.length && (
              <div
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]",
                )}
              >
                {isDragActive ? (
                  <p className="text-neutral-600 flex flex-col items-center">
                    Drop it
                    <UploadIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </p>
                ) : (
                  <UploadIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </div>
            )}
            {!filesList.length && (
              <div className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
