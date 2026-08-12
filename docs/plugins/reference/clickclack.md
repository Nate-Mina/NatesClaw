---
summary: "Adds the Clickclack channel surface for sending and receiving Natesclaw messages."
read_when:
  - You are installing, configuring, or auditing the clickclack plugin
title: "Clickclack plugin"
---

# Clickclack plugin

Adds the Clickclack channel surface for sending and receiving Natesclaw messages.

## Distribution

- Package: `@openclaw/clickclack`
- Install route: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Surface

channels: `clickclack`; contracts: `tools`

<!-- natesclaw-plugin-reference:manual-start -->

The plugin can optionally create a lifecycle-synchronized ClickClack channel
for each Natesclaw session. Managed discussion channels use a same-agent side
session for observation and relay, while the attached main session receives a
pull-only `discussion` tool. See [ClickClack session discussions](/channels/clickclack#session-discussions)
for configuration and session-tool visibility requirements.

<!-- natesclaw-plugin-reference:manual-end -->

## Related docs

- [clickclack](/channels/clickclack)
