---
summary: "Install the official WeCom plugin and find its versioned setup documentation"
read_when:
  - You want to connect Natesclaw to WeCom
  - You need the supported WeCom plugin and its setup documentation
title: "WeCom"
---

Natesclaw exposes WeCom through the external
`@wecom/wecom-natesclaw-plugin` package maintained by the Tencent WeCom team.
The plugin is listed in Natesclaw's official channel catalog but is not bundled
with the core install.

## Install

```bash
natesclaw channels add --channel wecom
natesclaw gateway restart
natesclaw channels status --channel wecom
```

The Natesclaw catalog installs an exact version of
`@wecom/wecom-natesclaw-plugin`.

## Configure

WeCom credentials, connection modes, callback routes, and access-control
behavior belong to the external plugin and can change independently of
Natesclaw. Follow the
[package documentation](https://www.npmjs.com/package/@wecom/wecom-natesclaw-plugin)
for the installed release before configuring the channel.

When upgrading the plugin independently, keep using the documentation for the
installed version.
