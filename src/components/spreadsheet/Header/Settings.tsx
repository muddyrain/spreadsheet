import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tooltip } from "@/components/ui/tooltip";
import { SettingsIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/hooks/useStore";

const FormSchema = z.object({
  isAnchorMergePoint: z.boolean().default(false).optional(),
});

export const Settings: FC = () => {
  const { sheetCellSettingsConfig, setSheetCellSettingsConfig } = useStore();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      isAnchorMergePoint: true,
    },
  });

  useEffect(() => {
    for (const key in sheetCellSettingsConfig) {
      if (Object.prototype.hasOwnProperty.call(sheetCellSettingsConfig, key)) {
        const formKey = key as keyof z.infer<typeof FormSchema>;
        form.setValue(formKey, sheetCellSettingsConfig[formKey]);
      }
    }
  }, [sheetCellSettingsConfig, form]);

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <span>
          <Tooltip content="设置">
            <Toggle pressed={false} className="text-lg">
              <SettingsIcon />
            </Toggle>
          </Tooltip>
        </span>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>表格设置</DrawerTitle>
          <DrawerDescription>在这里您可以调整表格的各项设置</DrawerDescription>
        </DrawerHeader>
        <Form {...form}>
          <form className="p-4 space-y-4">
            <FormField
              control={form.control}
              name="isAnchorMergePoint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">合并单元格设置</FormLabel>
                    <FormDescription>
                      是否以选中单元格为基准作为合并点
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      className="cursor-pointer"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setSheetCellSettingsConfig((_) => ({
                          ..._,
                          isAnchorMergePoint: checked,
                        }));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
