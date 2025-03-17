"use client";

import { ProjectCreateSchema } from "@api/routes/project/project.schema";
import { Role } from "@prisma/client";
import { ProjectCard } from "@web/components/blocks/project/project-card";
import { CreateProjectDialog } from "@web/components/blocks/project/project-create-dialog";
import { Button } from "@web/components/ui/button";
import { ModeToggle } from "@web/components/ui/mode-toggle";
import { useSession } from "@web/lib/auth-client";
import { client } from "@web/lib/client";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { MemberModal } from "../auth/member-modal";

export interface Project {
  id: string;
  name: string;
  coverImage?: string;
  isLoading?: boolean;
  isDeleted?: boolean;
}
import ProfileButton from "../auth/profile-button";

export default function ProjectList({
  initialProjects = [],
  onChange,
}: {
  initialProjects: Project[];
  onChange?: (projects: Project[]) => void;
}) {
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
            toast.error("Validation error");
            return;
          default:
            toast.error("Failed to create project");
            return;
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
            <CreateProjectDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSubmit={handleCreateProject}
            />
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
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              isGridView={isGridView}
              index={i}
              onDelete={handleDeleteProject}
              onShare={(projectId) => setMemberModalProjectId(projectId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
