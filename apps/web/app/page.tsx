import type { App } from "@api/index.js";
import { treaty } from "@elysiajs/eden";
import env from "./env";
import { ProjectList } from "./projectList";

export default async function Home() {
  const client = treaty<App>(env.DATABASE_URL);
  const { data, error } = await client.projects.get();

  if (error) {
    switch (error.status) {
      case 422:
        return <div>Validation Error</div>;
    }
  }

  return <ProjectList data={data} />;
}
