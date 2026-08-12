---
summary: "Uninstall Natesclaw completely (CLI, service, state, workspace)"
read_when:
  - You want to remove Natesclaw from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

Two paths:

- **Easy path** if `natesclaw` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
natesclaw uninstall
```

State removal preserves configured workspace directories unless you also select `--workspace`.

Preview what will be removed (safe):

```bash
natesclaw uninstall --dry-run --all
```

Non-interactive (automation / npx). Use with caution and only after confirming scopes:

```bash
natesclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace`, `--app` select individual scopes; `--all` selects all four.

Manual steps (same result):

1. Stop the gateway service:

```bash
natesclaw gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
natesclaw gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${NATESCLAW_STATE_DIR:-$HOME/.natesclaw}"
```

If you set `NATESCLAW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.
If you want to keep a workspace inside the state dir, such as `~/.natesclaw/workspace`, move it aside before running `rm -rf` or delete state contents selectively.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.natesclaw/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g natesclaw
pnpm remove -g natesclaw
bun remove -g natesclaw
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/Natesclaw.app
```

Notes:

- If you used profiles (`--profile` / `NATESCLAW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.natesclaw-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `natesclaw` is missing.

### macOS (launchd)

Default label is `ai.natesclaw.gateway` (or `ai.natesclaw.<profile>` with a profile):

```bash
launchctl bootout gui/$UID/ai.natesclaw.gateway
rm -f ~/Library/LaunchAgents/ai.natesclaw.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.natesclaw.<profile>`.

### Linux (systemd user unit)

Default unit name is `natesclaw-gateway.service` (or `natesclaw-gateway-<profile>.service`). A pre-rename `clawdbot-gateway.service` unit may still exist on machines upgraded from very old installs; `natesclaw uninstall` / `natesclaw gateway uninstall` detects and removes it automatically.

```bash
systemctl --user disable --now natesclaw-gateway.service
rm -f ~/.config/systemd/user/natesclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `Natesclaw Gateway` (or `Natesclaw Gateway (<profile>)`).
The task launches a windowless `gateway.vbs` script under your state dir, which in turn
runs `gateway.cmd`; remove both.

```powershell
schtasks /Delete /F /TN "Natesclaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.natesclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.natesclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

If you used a profile, delete the matching task name and the `gateway.cmd` /
`gateway.vbs` files under `~\.natesclaw-<profile>`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://openclaw.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g natesclaw@latest`.
Remove it with `npm rm -g natesclaw` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `natesclaw ...` / `bun run natesclaw ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

## Related

- [Install overview](/install)
- [Migration guide](/install/migrating)
