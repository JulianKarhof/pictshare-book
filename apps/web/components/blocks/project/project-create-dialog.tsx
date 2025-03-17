"use client";

import { ProjectCreateSchema } from "@api/routes/project/project.schema";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Button } from "@web/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@web/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@web/components/ui/form";
import { Input } from "@web/components/ui/input";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: typeof ProjectCreateSchema.state) => void;
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  const form = useForm<typeof ProjectCreateSchema.state>({
    resolver: typeboxResolver(ProjectCreateSchema),
    defaultValues: { name: "" },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => onOpenChange(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Create New Project
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input id="title" {...field} />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
