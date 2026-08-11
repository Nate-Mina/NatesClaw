---
summary: "ClawHub CLI entry points for discovering, installing, removing, publishing, and verifying Natesclaw skills and plugins."
read_when:
  - You want to use ClawHub from the command line
  - You want to install ClawHub skills or plugins through Natesclaw
  - You need to remove an installed ClawHub skill
  - You want to publish ClawHub packages
title: "ClawHub CLI"
---

# ClawHub CLI

Two command-line surfaces talk to ClawHub:

- `natesclaw skills` / `natesclaw plugins` - discover, install, and update
  packages for a local Natesclaw agent or Gateway.
- The standalone `clawhub` CLI - remove installed skills and handle publisher
  workflows including login, publish, sync, and transfer.

## Discover and install

```bash
natesclaw skills search "calendar"
natesclaw skills install @owner/<slug>
natesclaw skills install @owner/<slug> --version <version> --global
natesclaw skills install skills-sh:<owner>/<repo>/<slug>
natesclaw skills update @owner/<slug>
natesclaw skills update --all --acknowledge-clawhub-risk
natesclaw skills verify @owner/<slug> --card

natesclaw plugins search "calendar"
natesclaw plugins install clawhub:<package>
natesclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
natesclaw plugins update <id-or-npm-spec>
natesclaw plugins update --all
```

Skill installs target the active workspace `skills/` directory by default; add
`--global` for the shared managed skills directory. Plugin installs need the
explicit `clawhub:` prefix to force ClawHub resolution over npm, git, or a
local path. Full flag reference: [`natesclaw skills`](/cli/skills) and
[`natesclaw plugins`](/cli/plugins).

`skills-sh:` is an explicitly external catalog reference. Natesclaw sends it to
ClawHub and installs the exact commit-pinned GitHub source returned by the
resolver; it never downloads skill content from skills.sh directly. Unclaimed
entries are labeled **Not scanned by ClawHub**. Claimed and ClawHub-scanned
skills use the native `@owner/<slug>` form instead.

### Release trust

Natesclaw checks a release's ClawHub trust state before downloading it, for
both skills and plugins. Versioned releases use exact-release trust metadata;
resolver-backed GitHub skills go through ClawHub's install resolver, which
enforces scan and force-install policy before returning a pinned commit.

- **Malicious or blocked** releases are refused outright.
- **Risky** releases (non-clean scan, non-blocking moderation state) print a
  warning and require `--acknowledge-clawhub-risk` to continue
  non-interactively.
- **Official ClawHub publishers/packages and bundled Natesclaw sources** skip
  the trust prompt and security-verdict fetch entirely.

## Remove an installed skill

If the standalone ClawHub CLI is not already installed, install it explicitly:

```bash
npm i -g clawhub
clawhub uninstall @owner/my-skill
```

The command asks for confirmation, then removes the installed skill directory
and its ClawHub lockfile entry. Select the original agent workspace or shared
Natesclaw state directory when the installation is outside the current workdir:

```bash
clawhub --workdir /path/to/agent-workspace uninstall @owner/my-skill
clawhub --workdir ~/.natesclaw uninstall @owner/my-skill
```

For a custom `NATESCLAW_STATE_DIR`, replace `~/.natesclaw` with that configured
directory. See [Remove a ClawHub skill](/cli/skills#remove-a-clawhub-skill) for
workspace targeting and skill refresh behavior.

## Publish and maintain

Install the standalone CLI once, then log in:

```bash
npm i -g clawhub
clawhub login
```

Publish a plugin package (folder path, GitHub repo `owner/repo[@ref]`, or
tarball URL) with `clawhub package publish`:

```bash
clawhub package publish ./my-plugin --dry-run
clawhub package publish ./my-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Publish a skill folder with `clawhub skill publish`:

```bash
clawhub skill publish ./skills/review-helper
clawhub skill publish ./skills/review-helper --version 1.0.0 --owner your-org
```

Other maintenance commands:

```bash
clawhub sync --all                                          # scan local skills, publish new/updated ones
clawhub package transfer @old-owner/package --to new-owner   # move a plugin package to another publisher
clawhub skill rename old-slug new-slug                       # rename a published skill, redirect the old slug
clawhub explore --sort trending                              # browse the registry, sorted by trending
```

## Related

- [`natesclaw skills`](/cli/skills) - local skill search, install, update, and
  verification
- [`natesclaw plugins`](/cli/plugins) - plugin search, install, update, and
  inspection
- [ClawHub publishing](/clawhub/publishing) - owner scope, release validation,
  and review flow
- [Creating skills](/tools/creating-skills) - skill authoring and publish flow
- [Building plugins](/plugins/building-plugins) - plugin package authoring
