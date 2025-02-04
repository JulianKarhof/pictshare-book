"use client";

import { ProjectWithoutElementsSchema } from "@api/routes/project/project.schemas";
import { useRouter } from "next/navigation";

export function ProjectList({
  data,
}: {
  data: (typeof ProjectWithoutElementsSchema.static)[];
}) {
  const router = useRouter();

  return (
    <div className="m-10">
      {data.map((project) => (
        <div
          className="mb-1 p-2 bg-gray-500 cursor-pointer"
          key={project.id}
          onClick={() => router.push(`/${project.id}`)}
        >
          {project.name}
        </div>
      ))}
    </div>
  );
}
