---
summary: "Automated, hardened Natesclaw installation with Ansible, Tailscale VPN, and firewall isolation"
read_when:
  - You want automated server deployment with security hardening
  - You need firewall-isolated setup with VPN access
  - You're deploying to remote Debian/Ubuntu servers
title: "Ansible"
---

Deploy Natesclaw to production servers with **[natesclaw-ansible](https://github.com/natesclaw/natesclaw-ansible)**, an automated installer with a security-first architecture.

<Info>
The [natesclaw-ansible](https://github.com/natesclaw/natesclaw-ansible) repo is the source of truth for Ansible deployment. This page is a quick overview.
</Info>

## Prerequisites

| Requirement | Details                                                   |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ or Ubuntu 20.04+                               |
| Access      | Root or sudo privileges                                   |
| Network     | Internet connection for package installation              |
| Ansible     | 2.14+ (installed automatically by the quick-start script) |

## What you get

- Firewall-first security: UFW + Docker isolation (only SSH + Tailscale reachable)
- Tailscale VPN for remote access without exposing services publicly
- Docker for isolated sandbox containers with localhost-only bindings
- Systemd integration with hardening, auto-starting on boot
- One-command setup

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/natesclaw/natesclaw-ansible/main/install.sh | bash
```

## What gets installed

1. Tailscale (mesh VPN for secure remote access)
2. UFW firewall (SSH + Tailscale ports only)
3. Docker CE + Compose V2 (default agent sandbox backend)
4. Node.js and pnpm (Natesclaw requires Node 22.22.3+, 24.15+, or 25.9+; Node 26 is recommended)
5. Natesclaw, installed host-based, not containerized
6. A systemd service with security hardening

<Note>
The gateway runs directly on the host, not in Docker. Agent sandboxing is
optional; this playbook installs Docker because it is the default sandbox
backend. See [Sandboxing](/gateway/sandboxing) for other backends.
</Note>

## Post-install setup

<Steps>
  <Step title="Switch to the natesclaw user">
    ```bash
    sudo -i -u natesclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    The post-install script guides you through configuring Natesclaw.
  </Step>
  <Step title="Connect messaging channels">
    Log in to WhatsApp, Telegram, Discord, or Signal:
    ```bash
    natesclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status natesclaw
    sudo journalctl -u natesclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    Join your VPN mesh for secure remote access.
  </Step>
</Steps>

### Quick commands

```bash
# Check service status
sudo systemctl status natesclaw

# View live logs
sudo journalctl -u natesclaw -f

# Restart gateway
sudo systemctl restart natesclaw

# Channel login (run as natesclaw user)
sudo -i -u natesclaw
natesclaw channels login --channel <name>
```

## Security architecture

Four-layer defense model:

1. Firewall (UFW): only SSH (22) and Tailscale (41641/udp) exposed publicly
2. VPN (Tailscale): gateway reachable only via the VPN mesh
3. Docker isolation: `DOCKER-USER` iptables chain prevents external port exposure
4. Systemd hardening: `NoNewPrivileges`, `PrivateTmp`, unprivileged user

Verify your external attack surface:

```bash
nmap -p- YOUR_SERVER_IP
```

Only port 22 (SSH) should be open. Gateway and Docker stay locked down.

Docker is installed for agent sandboxes (isolated tool execution), not for running the gateway. See [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) for sandbox configuration.

## Manual installation

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/natesclaw/natesclaw-ansible.git
    cd natesclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    Or run the playbook directly and then run the setup script manually:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/natesclaw-setup.sh
    ```

  </Step>
</Steps>

## Updating

The Ansible installer sets up Natesclaw for manual updates; see [Updating](/install/updating) for the standard flow.

To re-run the playbook (for example, after configuration changes):

```bash
cd natesclaw-ansible
./run-playbook.sh
```

This is idempotent and safe to run multiple times.

## Troubleshooting

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - Connect via Tailscale VPN first; the gateway is only reachable that way by design.
    - SSH (port 22) is always allowed.

  </Accordion>
  <Accordion title="Service will not start">
    ```bash
    # Check logs
    sudo journalctl -u natesclaw -n 100

    # Verify permissions
    sudo ls -la /opt/natesclaw

    # Test manual start
    sudo -i -u natesclaw
    cd ~/natesclaw
    natesclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox issues">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep natesclaw-sandbox

    # Build the sandbox image if missing (requires a source checkout)
    cd /opt/natesclaw/natesclaw
    sudo -u natesclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.natesclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Channel login fails">
    Make sure you are running as the `natesclaw` user:
    ```bash
    sudo -i -u natesclaw
    natesclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Advanced configuration

For detailed security architecture and troubleshooting, see the natesclaw-ansible repo:

- [Security Architecture](https://github.com/natesclaw/natesclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/natesclaw/natesclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/natesclaw/natesclaw-ansible/blob/main/docs/troubleshooting.md)

## Related

- [natesclaw-ansible](https://github.com/natesclaw/natesclaw-ansible): full deployment guide
- [Docker](/install/docker): containerized gateway setup
- [Sandboxing](/gateway/sandboxing): agent sandbox configuration
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools): per-agent isolation
