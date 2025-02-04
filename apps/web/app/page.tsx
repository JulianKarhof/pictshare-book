import type { App } from "@api/index.js";
import { treaty } from "@elysiajs/eden";
import env from "@web/app/env";
import { ProjectList } from "@web/app/projectList";

export default async function Home() {
  const client = treaty<App>(env.DATABASE_URL, {
    fetch: { cache: "no-store" },
  });
  const { data, error } = await client.projects.get();

  if (error) {
    switch (error.status) {
      case 422:
        return <div>Validation Error</div>;
    }
  }

  return <ProjectList data={data} />;
}
