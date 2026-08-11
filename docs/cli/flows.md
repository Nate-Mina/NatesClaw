---
summary: "Redirect: flow commands live under `natesclaw tasks flow`"
read_when:
  - You encounter `natesclaw flows` in older docs or release notes
  - You want a quick TaskFlow inspection reference
title: "Flows (redirect)"
---

# `natesclaw tasks flow`

There is no top-level `natesclaw flows` command. Durable TaskFlow inspection lives under `natesclaw tasks flow`.

## Subcommands

```bash
natesclaw tasks flow list   [--json] [--status <name>]
natesclaw tasks flow show   <lookup> [--json]
natesclaw tasks flow cancel <lookup>
```

| Subcommand | Description                | Arguments / options                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | List tracked TaskFlows.    | `--json` machine-readable output; `--status <name>` filter (see status values below). |
| `show`     | Show one TaskFlow.         | `<lookup>` flow id or owner key; `--json` machine-readable output.                    |
| `cancel`   | Cancel a running TaskFlow. | `<lookup>` flow id or owner key.                                                      |

`<lookup>` accepts either a flow id (returned by `list` / `show`) or the flow's owner key (the stable identifier the owning subsystem uses to track the flow).

### Status filter values

`--status` on `list` accepts one of: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Examples

```bash
natesclaw tasks flow list
natesclaw tasks flow list --status running
natesclaw tasks flow list --json
natesclaw tasks flow show flow_abc123
natesclaw tasks flow show flow_abc123 --json
natesclaw tasks flow cancel flow_abc123
```

For TaskFlow concepts and authoring, see [TaskFlow](/automation/taskflow). For the parent `tasks` command, see [tasks CLI reference](/cli/tasks).

## Related

- [CLI reference](/cli)
- [Automation](/automation)
- [TaskFlow](/automation/taskflow)
