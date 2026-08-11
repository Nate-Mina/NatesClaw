# @natesclaw/comfy-provider

Official ComfyUI image, video, and music generation provider plugin for
Natesclaw.

## Install

```bash
natesclaw plugins install @natesclaw/comfy-provider
natesclaw gateway restart
```

## Configure

Local ComfyUI workflows do not require credentials. Comfy Cloud workflows use
`COMFY_API_KEY` or `COMFY_CLOUD_API_KEY`.

Full workflow, model, and provider configuration:

- https://docs.natesclaw.ai/providers/comfy

## Package

- Plugin id: `comfy`
- Package: `@natesclaw/comfy-provider`
- Minimum Natesclaw host: `2026.7.2`
