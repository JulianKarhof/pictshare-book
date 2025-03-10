"use client";
import { ProjectCreateSchema } from "@api/routes/project/project.schema";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Role } from "@prisma/client";
import { Button } from "@web/components/ui/button";
import { Card, CardHeader, CardTitle } from "@web/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@web/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@web/components/ui/dropdown-menu";
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
import { ModeToggle } from "@web/components/ui/mode-toggle";
import { useSession } from "@web/lib/auth-client";
import { client } from "@web/lib/client";
import {
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MemberModal } from "../auth/member-modal";
import ProfileButton from "../auth/profile-button";

interface Project {
  id: string;
  name: string;
  coverImage?: string;
  isLoading?: boolean;
  isDeleted?: boolean;
}

export default function ProjectList({
  initialProjects = [],
  onChange,
}: {
  initialProjects: Project[];
  onChange?: (projects: Project[]) => void;
}) {
  const form = useForm<typeof ProjectCreateSchema.state>({
    resolver: typeboxResolver(ProjectCreateSchema),
    defaultValues: { name: "" },
  });
  const router = useRouter();
  const session = useSession();
  const [projects, setProjects] = useState(initialProjects);
  const [isGridView, setIsGridView] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [memberModalProjectId, setMemberModalProjectId] = useState<
    string | null
  >(null);

  const handleCreateProject = async (
    newProject: SubmitHandler<typeof ProjectCreateSchema.static>,
  ) => {
    try {
      const loadingProject: Project = {
        id: "loading",
        name: newProject.name,
        isLoading: true,
      };

      setProjects([...projects, loadingProject]);
      setIsCreateDialogOpen(false);

      const [{ data, error }] = await Promise.all([
        client.projects.post(newProject),
        new Promise((resolve) => setTimeout(resolve, 700)),
      ]);

      if (error) {
        switch (error.status) {
          case 422:
            error.value.type === "validation";
            return; // TODO
        }
      }

      router.refresh();
      onChange?.(projects);
      setProjects((projects) =>
        projects.map((p) => (p.id === "loading" ? data : p)),
      );
    } catch (error) {
      console.error("Failed to create project:", error);
      setProjects((projects) => projects.filter((p) => p.id !== "loading"));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await client.projects({ id: projectId }).delete();

      if (error) {
        switch (error.status) {
          case 422:
            toast.error("Failed to delete project");
            return;
        }
      }

      toast.success("Project deleted successfully");
      onChange?.(projects);
      setProjects((projects) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, isDeleted: true } : p,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 700));

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const getUserRole = (projectId: string) =>
    session.data?.members.find((member) => member.projectId === projectId)
      ?.role ?? Role.VIEWER;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Pictshare Book
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <ModeToggle />
              <Button
                variant="outline"
                size="icon"
                aria-label={
                  isGridView ? "Switch to list view" : "Switch to grid view"
                }
                onClick={() => setIsGridView(!isGridView)}
              >
                {isGridView ? (
                  <LayoutList className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
            </div>
            {memberModalProjectId !== null && (
              <MemberModal
                projectId={memberModalProjectId}
                open={memberModalProjectId !== null}
                onOpenChange={() => setMemberModalProjectId(null)}
                role={getUserRole(memberModalProjectId)}
              />
            )}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => setIsCreateDialogOpen(true)}
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
                  <form onSubmit={form.handleSubmit(handleCreateProject)}>
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
            <Suspense fallback={<p>...</p>}>
              <ProfileButton />
            </Suspense>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <div
          className={`grid gap-6 ${isGridView ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {projects.map((project, i) =>
            project.isLoading ? (
              <LoadingCard key={project.id} isGridView={isGridView} />
            ) : (
              <Link href={`/b/${project.id}`} key={project.id}>
                <Card
                  style={{ animationDelay: i * 50 + "ms" }}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group bg-card motion-preset-slide-down-sm
                  ${isGridView ? "" : "flex"} ${project.isDeleted ? "motion-translate-y-out-[10%] motion-duration-500 motion-opacity-out-0" : ""}`}
                >
                  <div
                    className={`relative overflow-hidden ${isGridView ? "aspect-video" : "w-1/3"}`}
                  >
                    <img
                      src={project.coverImage || "https://placehold.co/600x400"}
                      alt={project.name}
                      className={`object-cover w-full h-full transition-transform duration-300
                      ${isGridView ? "group-hover:scale-110" : ""}`}
                    />
                  </div>
                  <CardHeader className={isGridView ? "" : "w-2/3"}>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-semibold text-card-foreground">
                        {project.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberModalProjectId(project.id);
                            }}
                          >
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ),
          )}
        </div>
      </main>
    </div>
  );
}

const LoadingCard = ({ isGridView }: { isGridView: boolean }) => (
  <Card
    className={`overflow-hidden transition-all duration-300 bg-card motion-preset-bounce ${
      isGridView ? "" : "flex"
    }`}
  >
    <div
      className={`relative overflow-hidden ${
        isGridView ? "aspect-video" : "w-1/3"
      }`}
    >
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
        <Spinner />
      </div>
    </div>
    <CardHeader className={isGridView ? "" : "w-2/3"}>
      <div className="flex justify-between items-start">
        <div className="w-2/3 h-6 bg-muted animate-pulse rounded" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
      </div>
    </CardHeader>
  </Card>
);

const Spinner = () => (
  <div
    className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
    role="status"
  >
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
      Loading...
    </span>
  </div>
);
