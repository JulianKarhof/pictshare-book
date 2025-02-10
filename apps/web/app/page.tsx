import ProjectList from "@web/app/projectList";
import { revalidateProjects } from "./projectActions";
import { client } from "./util/client";

export default async function Home() {
  const { data, error } = await client.projects.get({
    fetch: { cache: "no-store", next: { tags: ["projects"] } },
  });

  if (error) {
    switch (error.status) {
      case 422:
        return <div>Validation Error</div>;
    }
  }

  return <ProjectList initialProjects={data} onChange={revalidateProjects} />;
}
