import {
  MemberCreateSchema,
  MemberSchema,
} from "@api/routes/project/project.schema";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Role } from "@prisma/client";
import { Button } from "@web/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@web/components/ui/form";
import { Input } from "@web/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { client } from "@web/lib/client";
import { useOrigin } from "@web/lib/use-origin";
import { capitalize } from "@web/lib/utils";
import { Copy, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface MemberModalProps {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function MemberModal({
  open,
  projectId,
  onOpenChange,
  role,
}: MemberModalProps) {
  const [members, setMembers] = useState<(typeof MemberSchema.static)[]>([]);
  const inviteUrl = `${useOrigin()}/${projectId}`;
  const memberRoles = [Role.EDITOR, Role.VIEWER].map((role) => ({
    key: capitalize(role),
    value: role,
  }));

  const form = useForm<typeof MemberCreateSchema.state>({
    resolver: typeboxResolver(MemberCreateSchema),
    defaultValues: { email: "", role: Role.EDITOR },
  });

  const handleInviteUser = async (values: typeof MemberCreateSchema.static) => {
    client
      .projects({ id: projectId })
      .users.post({ email: values.email, role: values.role })
      .then((res) => {
        if (res.error) {
          switch (res.error.status) {
            case 404:
              toast.error("User not found");
              break;
            case 409:
              toast.error("User already exists");
              break;
            default:
              toast.error("Something went wrong");
          }
          return;
        }
        setMembers((prev) => [...prev, res.data]);
        form.reset();
      });
  };

  const handleRemoveUser = async (userId: string) => {
    client
      .projects({ id: projectId })
      .users({ userId: userId })
      .delete()
      .then((res) => {
        if (res.error) {
          toast.error("Failed to remove user");
          return;
        }

        setMembers((members) =>
          members.filter((member) => member.userId !== userId),
        );
      });
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copied to clipboard");
  };

  useEffect(() => {
    client
      .projects({ id: projectId })
      .users.get()
      .then((res) => {
        if (res.error) {
          toast.error("Failed to fetch members");
          return;
        }
        setMembers(res.data);
      });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-col justify-between">
          <div>
            <DialogTitle>
              {role === Role.OWNER ? "Manage Access" : "Members"}
            </DialogTitle>
            <DialogDescription>
              {role === Role.OWNER
                ? "Manage access to your book."
                : "View members of this book."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input className="flex-1" value={inviteUrl} readOnly />
          <Button
            variant="outline"
            className="flex items-center gap-2"
            autoFocus={role !== Role.OWNER}
            onClick={handleCopyInviteLink}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
        </div>

        {role === Role.OWNER && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleInviteUser)}
              className="flex gap-2"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        placeholder="Enter email address"
                        data-1p-ignore
                        data-lpignore
                        data-protonpass-ignore
                        autoComplete="off"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRoles.map((role) => (
                          <SelectItem
                            key={role.key}
                            value={role.value}
                            className="capitalize"
                          >
                            {role.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit">Invite User</Button>
            </form>
          </Form>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>{member.email}</TableCell>
                <TableCell className="capitalize">
                  {capitalize(member.role)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveUser(member.userId)}
                    className={member.role === Role.OWNER ? "invisible" : ""}
                  >
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
