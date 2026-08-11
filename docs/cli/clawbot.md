---
summary: "CLI reference for `natesclaw clawbot` (legacy alias namespace)"
read_when:
  - You maintain older scripts using `natesclaw clawbot ...`
  - You need migration guidance to current commands
title: "Clawbot"
---

# `natesclaw clawbot`

Legacy alias namespace kept for backward compatibility. It registers the same QR command as the top-level CLI, so `natesclaw clawbot qr` accepts every [`natesclaw qr`](/cli/qr) flag.

## Migration

Prefer the modern top-level command:

- `natesclaw clawbot qr` -> `natesclaw qr`

## Related

- [CLI reference](/cli)
