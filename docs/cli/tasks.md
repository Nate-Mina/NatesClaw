---
summary: "CLI reference for `natesclaw tasks` (background task ledger and Task Flow state)"
read_when:
  - You want to inspect, audit, or cancel background task records
  - You are documenting Task Flow commands under `natesclaw tasks flow`
title: "`natesclaw tasks`"
---

Inspect durable background tasks and Task Flow state. With no subcommand,
`natesclaw tasks` is equivalent to `natesclaw tasks list`.

See [Background Tasks](/automation/tasks) for the lifecycle and delivery
model, and its `tasks audit` section for full finding descriptions.

## Usage

```bash
natesclaw tasks
natesclaw tasks list
natesclaw tasks list --runtime acp
natesclaw tasks list --status running
natesclaw tasks show <lookup>
natesclaw tasks notify <lookup> state_changes
natesclaw tasks cancel <lookup>
natesclaw tasks retry <lookup> [lookup...]
natesclaw tasks dismiss <lookup> [lookup...]
natesclaw tasks audit
natesclaw tasks maintenance
natesclaw tasks maintenance --apply
natesclaw tasks flow list
natesclaw tasks flow show <lookup>
natesclaw tasks flow cancel <lookup>
```

## Root Options

| Flag               | Description                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Output JSON.                                                                                       |
| `--runtime <name>` | Filter by kind: `subagent`, `acp`, `cron`, or `cli`.                                               |
| `--status <name>`  | Filter by status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, or `lost`. |

## Subcommands

### `list`

```bash
natesclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Lists tracked background tasks newest first.

### `show`

```bash
natesclaw tasks show <lookup> [--json]
```

Shows one task by task ID, run ID, or session key.

### `notify`

```bash
natesclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Changes the notification policy for a running task.

### `cancel`

```bash
natesclaw tasks cancel <lookup>
```

Cancels a running background task.

### `retry`

```bash
natesclaw tasks retry <lookup> [lookup...]
```

Retries 1-10 blocked subagent completion deliveries. The child execution stays
successful; retry creates a fenced delivery generation from the retained
canonical result. An ambiguous earlier acknowledgement can still cause a
duplicate visible result.

### `dismiss`

```bash
natesclaw tasks dismiss <lookup> [lookup...]
```

Records intentional non-delivery for 1-10 blocked subagent completions. The task
continues to show a blocked terminal outcome and retains its result until the
7-day completion-retention window expires.

### `audit`

```bash
natesclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Surfaces stale, lost, delivery-failed, or otherwise inconsistent task and
Task Flow records. Lost tasks retained until `cleanupAfter` are warnings;
expired or unstamped lost tasks are errors.

`--code` accepts task codes (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) and Task
Flow codes (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). See
[Background Tasks](/automation/tasks) for severity and trigger detail per
code.

### `maintenance`

```bash
natesclaw tasks maintenance [--apply] [--json]
```

Previews or applies task and Task Flow reconciliation, cleanup stamping,
pruning, and stale cron run session registry cleanup.

For cron tasks, reconciliation uses persisted run logs/job state before
marking an old active task `lost`, so completed cron runs do not become
false audit errors just because the in-memory Gateway runtime state is gone.
Offline CLI audit is not authoritative for the Gateway's process-local cron
active-job set. CLI tasks with a run id/source id are marked `lost` when
their live Gateway run context is gone, even if an old child-session row
remains.

When applied, maintenance also prunes `cron:<jobId>:run:<uuid>` session
registry rows older than 7 days while preserving currently running cron
jobs and leaving non-cron session rows untouched.

### `flow`

```bash
natesclaw tasks flow list [--status <name>] [--json]
natesclaw tasks flow show <lookup> [--json]
natesclaw tasks flow cancel <lookup>
```

Inspects or cancels durable Task Flow state under the task ledger.
`flow list --status` accepts `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled`, or `lost`.

## Related

- [CLI reference](/cli)
- [Background tasks](/automation/tasks)
