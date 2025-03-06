import { MemberSchema } from "@api/routes/project/project.schema";
import { Role } from "@prisma/client";
import { Button } from "@web/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
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
import { capitalize } from "@web/lib/utils";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MemberModalProps {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
}

export function MemberModal({
  open,
  projectId,
  onOpenChange,
}: MemberModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(Role.VIEWER);
  const [members, setMembers] = useState<(typeof MemberSchema.static)[]>([]);
  const memberRoles = [Role.EDITOR, Role.VIEWER].map((role) => ({
    key: capitalize(role),
    value: role,
  }));

  const handleInviteUser = async () => {
    setInviteEmail("");
    client
      .projects({ id: projectId })
      .users.post({ email: inviteEmail, role: selectedRole })
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
        setMembers(() => [...members, res.data]);
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
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <Select
            value={selectedRole}
            onValueChange={(value: Role) => setSelectedRole(value)}
          >
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
          <Button onClick={handleInviteUser}>Invite User</Button>
        </div>

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
