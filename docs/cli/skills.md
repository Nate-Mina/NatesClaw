---
summary: "CLI reference for `natesclaw skills` (search/install/update/verify/list/info/check/workshop)"
read_when:
  - You want to see which skills are available and ready to run
  - You want to search ClawHub or install skills from ClawHub, Git, or local directories
  - You need to remove an installed ClawHub skill
  - You want to verify a ClawHub skill with ClawHub
  - You want to debug missing binaries/env/config for skills
title: "Skills"
---

# `natesclaw skills`

Inspect local skills, search ClawHub, install skills from ClawHub/Git/local
directories, verify ClawHub skills, and update ClawHub-tracked installs.

Related:

- Skills system: [Skills](/tools/skills)
- Skill Workshop: [Skill Workshop](/tools/skill-workshop)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub installs: [ClawHub](/clawhub/cli)

## Commands

```bash
natesclaw skills search "calendar"
natesclaw skills search --limit 20 --json
natesclaw skills install @owner/<slug>
natesclaw skills install @owner/<slug> --version <version>
natesclaw skills install skills-sh:<owner>/<repo>/<slug>
natesclaw skills install git:owner/repo
natesclaw skills install git:owner/repo@main
natesclaw skills install ./path/to/skill --as custom-name
natesclaw skills install @owner/<slug> --force
natesclaw skills install @owner/<slug> --force-install
natesclaw skills install @owner/<slug> --acknowledge-clawhub-risk
natesclaw skills install @owner/<slug> --agent <id>
natesclaw skills install @owner/<slug> --global
natesclaw skills update @owner/<slug>
natesclaw skills update @owner/<slug> --force-install
natesclaw skills update @owner/<slug> --acknowledge-clawhub-risk
natesclaw skills update @owner/<slug> --global
natesclaw skills update --all
natesclaw skills update --all --agent <id>
natesclaw skills update --all --global
natesclaw skills verify @owner/<slug>
natesclaw skills verify @owner/<slug> --json
natesclaw skills verify @owner/<slug> --version <version>
natesclaw skills verify @owner/<slug> --tag <tag>
natesclaw skills verify @owner/<slug> --card
natesclaw skills verify @owner/<slug> --global
natesclaw skills list
natesclaw skills list --eligible
natesclaw skills list --json
natesclaw skills list --verbose
natesclaw skills list --agent <id>
natesclaw skills info <name>
natesclaw skills info <name> --json
natesclaw skills info <name> --agent <id>
natesclaw skills check
natesclaw skills check --agent <id>
natesclaw skills check --json
natesclaw skills curator status
natesclaw skills curator status --json
natesclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
natesclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
natesclaw skills workshop list
natesclaw skills workshop inspect <proposal-id>
natesclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
natesclaw skills workshop apply <proposal-id>
natesclaw skills workshop reject <proposal-id> --reason "Not reusable"
natesclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, and `verify` use ClawHub directly. `install @owner/<slug>`
installs a native ClawHub skill. `install skills-sh:<owner>/<repo>/<slug>` asks
ClawHub to resolve an external listing to its exact synchronized GitHub commit;
Natesclaw does not download from skills.sh. These entries are shown as
**Not scanned by ClawHub**, and that trust state is preserved through updates
and verification. Claimed or ClawHub-scanned skills use `@owner/<slug>`.
`install git:owner/repo[@ref]` clones an unmanaged Git skill, and `install
./path` copies a local skill directory. By default, `install`,
`update`, and `verify` target the active workspace `skills/` directory; with
`--global`, they target the shared managed skills directory. `list`/`info`/`check`
still inspect the local skills visible to the current workspace and config.
Workspace-backed commands resolve the target workspace from `--agent <id>`,
then the current working directory when it is inside a configured agent
workspace, then the default agent.

Git and local directory installs expect `SKILL.md` at the source root. The
install slug comes from `SKILL.md` frontmatter `name` when it is valid, then
the source directory or repository name; use `--as <slug>` to override it.
`--version` is ClawHub-only. Skill installs do not support npm package specs
or zip/archive paths, and `natesclaw skills update` updates ClawHub-tracked
installs only.

Gateway-backed skill dependency installs triggered from onboarding or Skills
settings use the separate `skills.install` request path instead.

Notes:

| Flag/behavior                    | Description                                                                                                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optional query; omit it to browse the default ClawHub search feed.                                                                                                                                                                                                               |
| `search --limit <n>`             | Caps returned results.                                                                                                                                                                                                                                                           |
| `install git:owner/repo[@ref]`   | Installs a Git skill. Branch refs may contain slashes, such as `git:owner/repo@feature/foo`.                                                                                                                                                                                     |
| `install ./path/to/skill`        | Installs a local directory whose root contains `SKILL.md`.                                                                                                                                                                                                                       |
| `install --as <slug>`            | Overrides the inferred slug for Git and local directory installs.                                                                                                                                                                                                                |
| `install --version <version>`    | Applies to native ClawHub skill refs, not `skills-sh:` refs; the mirrored reference already identifies the exact synchronized commit.                                                                                                                                            |
| `install --force`                | Overwrites an existing workspace skill folder for the same slug.                                                                                                                                                                                                                 |
| `install/update --force-install` | Installs a pending GitHub-backed ClawHub skill before ClawHub's scan completes.                                                                                                                                                                                                  |
| `--global`                       | Targets the shared managed skills directory; cannot combine with `--agent <id>`.                                                                                                                                                                                                 |
| `--agent <id>`                   | Targets one configured agent workspace; overrides current working directory inference.                                                                                                                                                                                           |
| `update @owner/<slug>`           | Updates a single tracked skill. Add `--global` to target the shared managed skills directory instead of the workspace.                                                                                                                                                           |
| `update --all`                   | Updates tracked ClawHub installs in the selected workspace, or the shared managed skills directory with `--global`.                                                                                                                                                              |
| `verify @owner/<slug>`           | Prints ClawHub's `clawhub.skill.verify.v1` JSON envelope by default. `--json` is accepted as the explicit machine-output spelling. Bare slugs are accepted for compatibility when the skill is already installed or unambiguous; owner-qualified refs avoid publisher ambiguity. |
| `verify` provenance              | When ClawHub returns server-resolved source provenance, verify JSON also includes a commit-pinned `natesclaw.verifiedSourceUrl`. Unavailable or self-declared source URLs stay only in the raw provenance envelope and are not promoted.                                          |
| `verify` version selector        | `verify` uses `.clawhub/origin.json` for installed ClawHub skills, so it verifies the installed version against the registry it came from. `--version` and `--tag` override the version selector but keep that installed registry when origin metadata exists.                   |
| `verify --card`                  | Prints the generated Skill Card Markdown instead of JSON. Exits non-zero when ClawHub returns `ok: false` or `decision: "fail"`; unsigned signatures are informational unless ClawHub policy changes.                                                                            |
| Skill Card fingerprint           | Installed ClawHub bundles can include a generated `skill-card.md`. Natesclaw treats verification as a ClawHub server decision and does not reject an installed skill just because that generated card changes the bundle fingerprint.                                             |
| `check --agent <id>`             | Checks the selected agent's workspace and reports which ready skills are actually visible to that agent's prompt or command surface.                                                                                                                                             |
| `list`                           | Default action when no subcommand is provided.                                                                                                                                                                                                                                   |
| `list`/`info`/`check` output     | Rendered output goes to stdout. With `--json`, the machine-readable payload stays on stdout for pipes and scripts.                                                                                                                                                               |
| `curator status --json`          | Returns legacy age-based lifecycle state written by older releases. Daily collection review does not use this state.                                                                                                                                                             |

Community ClawHub skill installs and updates check trust before downloading.
Versioned community archive releases use exact-release trust metadata.
Resolver-backed GitHub skills rely on ClawHub's install resolver to enforce
scan and force-install policy before it returns a pinned commit; use
`--force-install` to install a pending GitHub-backed skill before that scan
completes. Malicious or blocked community releases are refused. Risky
community releases require review and `--acknowledge-clawhub-risk` when a
non-interactive command should continue after that review. Official ClawHub
skill publishers and bundled Natesclaw skill sources bypass this release-trust
prompt.

## Remove a ClawHub skill

Use the standalone ClawHub CLI to remove a ClawHub-tracked skill. If the CLI
is not installed, install it explicitly first:

```bash
npm i -g clawhub
clawhub uninstall @owner/my-skill
```

The CLI asks for confirmation before deleting the skill directory and its
`.clawhub/lock.json` entry. Use the installed skill's owner-qualified name or
bare slug, not its original `skills-sh:` reference.

Select the same root where the skill was installed: the agent workspace for an
agent-specific skill, or the Natesclaw state directory for a shared skill
installed with `--global`:

```bash
clawhub --workdir /path/to/agent-workspace uninstall @owner/my-skill
clawhub --workdir ~/.natesclaw uninstall @owner/my-skill
```

If `NATESCLAW_STATE_DIR` is set, use that configured state directory for shared
skills instead:

```bash
clawhub --workdir "$NATESCLAW_STATE_DIR" uninstall @owner/my-skill
```

The default [skills watcher](/tools/skills#snapshots-and-refresh) picks up the
removal on the next agent turn. If watching is disabled, start a new session.

## Skill Workshop

`natesclaw skills workshop` manages pending skill proposals in the selected
workspace. Proposals are not active skills until applied. For proposal
storage, support-file safeguards, Gateway methods, and approval policy, see
[Skill Workshop](/tools/skill-workshop).

```bash
natesclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
natesclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
natesclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
natesclaw skills workshop list
natesclaw skills workshop inspect <proposal-id>
natesclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
natesclaw skills workshop apply <proposal-id>
natesclaw skills workshop reject <proposal-id> --reason "Duplicate"
natesclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`, `propose-update`, and `revise` also accept `--goal <text>`
and `--evidence <text>` to record the proposal's motivation and supporting
notes alongside the `--proposal`/`--proposal-dir` content.

## Related

- [CLI reference](/cli)
- [Skills](/tools/skills)
