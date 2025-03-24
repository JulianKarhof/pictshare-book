import "dotenv/config";
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Pictshare Book Docs",
  description: "Relive your memories",
  ignoreDeadLinks: true,
  rewrites(id) {
    if (id.endsWith("README.md")) {
      return id.replace("README.md", "index.md");
    }
    return id;
  },
  themeConfig: {
    outline: "deep",
    logo: "/logo.svg",
    nav: [
      { text: "Home", link: "/" },
      { text: "API Reference", link: `${process.env.BACKEND_URL}/docs` },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is Pictshare Book?", link: "/" },
          { text: "Getting Started", link: "/docs/getting-started" },
          { text: "Features", link: "/docs/features" },
          { text: "Development", link: "/docs/development" },
          { text: "Deployment", link: "/docs/deployment" },
          { text: "Security", link: "/docs/security" },
          { text: "Testing", link: "/docs/testing" },
        ],
      },
      {
        text: "Package Documentation",
        items: [
          {
            text: "Frontend",
            link: "/apps/web",
            items: [
              { text: "Overview", link: "/apps/web/" },
              {
                text: "Canvas",
                items: [
                  {
                    text: "Elements",
                    link: "/apps/web/components/canvas/objects/",
                  },
                  {
                    text: "Managers",
                    link: "/apps/web/components/canvas/managers/",
                  },
                ],
              },
              { text: "Services", link: "/apps/web/services/" },
            ],
          },
          {
            text: "Backend",
            link: "/apps/api",
            items: [
              { text: "Overview", link: "/apps/api/" },
              { text: "Database", link: "/apps/api/prisma/" },
              {
                text: "Routes",
                items: [
                  {
                    text: "Authentication",
                    link: "/apps/api/src/routes/auth/",
                  },
                  {
                    text: "Websocket",
                    link: "/apps/api/src/routes/ws/",
                  },
                ],
              },
              {
                text: "API Reference",
                link: `${process.env.BACKEND_URL}/docs`,
              },
            ],
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/juliankarhof/pictshare-book",
      },
    ],
  },
});
