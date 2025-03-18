# Getting Started

## Installation
For setting up Pictshare Book, follow these steps:

### Requirements
- [Bun](https://bun.sh/docs/installation) version 1.2 or higher
- [Docker Desktop](https://docs.docker.com/get-docker/) (includes docker compose)
  - Alternatively [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

<details open>
<summary>Install commands for Mac (using <a href="https://brew.sh/">Homebrew</a>)</summary>

> - Bun: `curl -fsSL https://bun.sh/install | bash`
> - Docker: `brew install --cask docker`
</details>
<details>
<summary>Install commands for Arch (using <a href="https://wiki.archlinux.org/title/Pacman">Pacman</a>)</summary>

> - Bun: `curl -fsSL https://bun.sh/install | bash`
> - Docker: `sudo pacman -S docker docker-desktop`
</details>
<details>
<summary>Install commands for Ubuntu (manual)</summary>

> - Bun: `curl -fsSL https://bun.sh/install | bash`
> - Docker: Follow these instructions to install Docker on Ubuntu: [link](https://docs.docker.com/desktop/setup/install/linux/ubuntu/#install-docker-desktop)
</details>
<details>
<summary>Install commands for Windows (using <a href="https://chocolatey.org/">Chocolatey</a>)</summary>

> - Bun: `choco install bun`
> - Docker: `choco install docker-desktop`
</details>

### Setup
First, clone the repository:

```bash
git clone https://github.com/juliankarhof/pictshare-book.git && \
cd pictshare-book
```

next run the setup command:

```bash
bun run setup
```

then start the development server:

```bash
bun run dev
```

now you can access Pictshare Book at [http://localhost:3000](http://localhost:3000).
