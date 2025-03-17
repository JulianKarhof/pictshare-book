"use client";

import { Button } from "@web/components/ui/button";
import { Card, CardHeader, CardTitle } from "@web/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@web/components/ui/dropdown-menu";
import {
  generateGradient,
  getProjectEmoji,
  urlFromEmoji,
} from "@web/lib/project-utils";
import { MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Project } from "./project-list";

interface ProjectCardProps {
  project: Project;
  isGridView: boolean;
  index: number;
  onDelete: (projectId: string) => void;
  onShare: (projectId: string) => void;
}

export function ProjectCard({
  project,
  isGridView,
  index,
  onDelete,
  onShare,
}: ProjectCardProps) {
  if (project.isLoading) {
    return <LoadingCard isGridView={isGridView} />;
  }

  return (
    <Link href={`/b/${project.id}`}>
      <Card
        style={{ animationDelay: index * 50 + "ms" }}
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group bg-card motion-preset-slide-down-sm
        ${isGridView ? "" : "flex"} ${project.isDeleted ? "motion-translate-y-out-[10%] motion-duration-500 motion-opacity-out-0" : ""}`}
      >
        <div
          className={`relative overflow-hidden ${isGridView ? "aspect-video" : "w-1/3"}`}
        >
          <div
            style={{
              background: generateGradient(project.id, false),
            }}
            className={`w-full h-full transition-all duration-300 group-hover:scale-120`}
          >
            <div
              className="absolute inset-0 transition-opacity duration-300
                bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)]
                [background-size:20px_20px]
                opacity-25
                group-hover:opacity-40
                z-[1]"
            />
            <div className="absolute inset-0 flex items-center justify-center z-[2]">
              <Image
                src={urlFromEmoji(getProjectEmoji(project.id)) ?? ""}
                alt="book"
                className="w-24 h-24 select-none pointer-events-none opacity-[0.8] group-hover:opacity-100 transition-opacity mix-blend-hard-light"
                loading={index < 9 ? "eager" : "lazy"}
                height={96}
                width={96}
              />
            </div>
          </div>
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
                    onShare(project.id);
                  }}
                >
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
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
  );
}

export const LoadingCard = ({ isGridView }: { isGridView: boolean }) => (
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

export const Spinner = () => (
  <div
    className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
    role="status"
  >
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
      Loading...
    </span>
  </div>
);
