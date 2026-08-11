---
summary: "Run Natesclaw Gateway 24/7 on a cheap Hetzner VPS (Docker) with durable state and baked-in binaries"
read_when:
  - You want Natesclaw running 24/7 on a cloud VPS (not your laptop)
  - You want a production-grade, always-on Gateway on your own VPS
  - You want full control over persistence, binaries, and restart behavior
  - You are running Natesclaw in Docker on Hetzner or a similar provider
title: "Hetzner"
---

Run a persistent Natesclaw Gateway on a Hetzner VPS using Docker, with durable state, baked-in binaries, and safe restart behavior.

Hetzner pricing changes; pick the smallest Debian/Ubuntu VPS that fits and scale up if you hit OOMs.

The Gateway can be accessed via SSH port forwarding from your laptop, or via direct port exposure if you manage firewalling and tokens yourself.

Security model reminder:

- Company-shared agents are fine when everyone is in the same trust boundary and the runtime is business-only.
- Keep strict separation: dedicated VPS/runtime + dedicated accounts; no personal Apple/Google/browser/password-manager profiles on that host.
- If users are adversarial to each other, split by gateway/host/OS user.

See [Security](/gateway/security) and [VPS hosting](/vps).

This guide assumes Ubuntu or Debian on Hetzner. On another Linux VPS, map packages accordingly. For the generic Docker flow, see [Docker](/install/docker).

## What you need

- Hetzner VPS with root access
- SSH access from your laptop
- Docker and Docker Compose
- Model auth credentials
- Optional provider credentials (WhatsApp QR, Telegram bot token, Gmail OAuth)
- ~20 minutes

## Quick path

1. Provision Hetzner VPS
2. Install Docker
3. Clone the Natesclaw repository
4. Create persistent host directories
5. Configure `.env` and `docker-compose.yml`
6. Bake required binaries into the image
7. `docker compose up -d`
8. Verify persistence and Gateway access

<Steps>
  <Step title="Provision the VPS">
    Create an Ubuntu or Debian VPS in Hetzner, then connect as root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Treat the VPS as stateful, not disposable infrastructure.

  </Step>

  <Step title="Install Docker (on the VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verify:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the Natesclaw repository">
    ```bash
    git clone https://github.com/natesclaw/natesclaw.git
    cd natesclaw
    ```

    This guide builds a custom image so any binaries you bake in survive restarts.

  </Step>

  <Step title="Create persistent host directories">
    Docker containers are ephemeral; all long-lived state must live on the host.

    ```bash
    mkdir -p /root/.natesclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.natesclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    Create `.env` in the repository root:

    ```bash
    NATESCLAW_IMAGE=natesclaw:latest
    NATESCLAW_GATEWAY_TOKEN=
    NATESCLAW_GATEWAY_BIND=lan
    NATESCLAW_GATEWAY_PORT=18789

    NATESCLAW_CONFIG_DIR=/root/.natesclaw
    NATESCLAW_WORKSPACE_DIR=/root/.natesclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.natesclaw
    ```

    Set `NATESCLAW_GATEWAY_TOKEN` to manage the stable gateway token through
    `.env`; otherwise configure `gateway.auth.token` before relying on clients
    across restarts. If neither is set, Natesclaw uses a runtime-only token for
    that startup. Generate a keyring password for `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Do not commit this file.** It holds container/runtime env such as
    `NATESCLAW_GATEWAY_TOKEN`. Stored provider OAuth/API-key auth lives in the
    mounted `~/.natesclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose configuration">
    Create or update `docker-compose.yml`:

    ```yaml
    services:
      natesclaw-gateway:
        image: ${NATESCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - NATESCLAW_GATEWAY_BIND=${NATESCLAW_GATEWAY_BIND}
          - NATESCLAW_GATEWAY_PORT=${NATESCLAW_GATEWAY_PORT}
          - NATESCLAW_GATEWAY_TOKEN=${NATESCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${NATESCLAW_CONFIG_DIR}:/home/node/.natesclaw
          - ${NATESCLAW_WORKSPACE_DIR}:/home/node/.natesclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${NATESCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${NATESCLAW_GATEWAY_BIND}",
            "--port",
            "${NATESCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` is only for bootstrap convenience, not a substitute for real gateway configuration. Still set auth (`gateway.auth.token` or password) and a safe bind mode for your deployment.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Follow the shared runtime guide for the common Docker host flow:

    - [Bake required binaries into the image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build and launch](/install/docker-vm-runtime#build-and-launch)
    - [What persists where](/install/docker-vm-runtime#what-persists-where)
    - [Updates](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    After the shared build and launch steps, open the tunnel.

    **Prerequisite:** ensure your VPS sshd config allows TCP forwarding. If you
    hardened your SSH config, check `/etc/ssh/sshd_config` and set:

    ```text
    AllowTcpForwarding local
    ```

    `local` allows `ssh -L` local forwards from your laptop while blocking
    remote forwards from the server. Setting it to `no` fails the tunnel with:
    `channel 3: open failed: administratively prohibited: open failed`

    After confirming TCP forwarding is enabled, restart the SSH service
    (`systemctl restart ssh`) and run the tunnel from your laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Open `http://127.0.0.1:18789/` and paste the configured shared secret.
    This guide uses the gateway token by default; use your configured password
    instead if you switched to password auth.

  </Step>
</Steps>

The shared persistence map lives in [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

For teams preferring infrastructure-as-code workflows, a community-maintained Terraform setup provides:

- Modular Terraform configuration with remote state management
- Automated provisioning via cloud-init
- Deployment scripts (bootstrap, deploy, backup/restore)
- Security hardening (firewall, UFW, SSH-only access)
- SSH tunnel configuration for gateway access

**Repositories:**

- Infrastructure: [natesclaw-terraform-hetzner](https://github.com/andreesg/natesclaw-terraform-hetzner)
- Docker config: [natesclaw-docker-config](https://github.com/andreesg/natesclaw-docker-config)

This approach complements the Docker setup above with reproducible deployments, version-controlled infrastructure, and automated disaster recovery.

<Note>
Community-maintained. For issues or contributions, see the repository links above.
</Note>

## Next steps

- Set up messaging channels: [Channels](/channels)
- Configure the Gateway: [Gateway configuration](/gateway/configuration)
- Keep Natesclaw up to date: [Updating](/install/updating)

## Related

- [Install overview](/install)
- [Fly.io](/install/fly)
- [Docker](/install/docker)
- [VPS hosting](/vps)
