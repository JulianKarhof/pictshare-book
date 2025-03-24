import { revalidateProjects } from "@web/components/blocks/project/project-actions";
import ProjectList from "@web/components/blocks/project/project-list";
import { client } from "@web/lib/client";
import { cookies } from "next/headers";

export default async function Home() {
  const cookie = await cookies();
  const { data, error } = await client.projects.get({
    fetch: {
      cache: "no-store",
      next: { tags: ["projects"] },
      headers: {
        cookie: cookie.toString(),
      },
    },
  });

  if (error) {
    switch (error.status) {
      case 401:
        return <div>Session Error, try deleting your cookies!</div>;
      case 422:
        return <div>Validation Error</div>;
      default:
        return <div>Unknown Error</div>;
    }
  }

  return <ProjectList initialProjects={data} onChange={revalidateProjects} />;
}
