---
summary: "Generated inventory of Natesclaw plugins shipped in core, published externally, or kept source-only"
read_when:
  - You are deciding whether a plugin ships in the core npm package or installs separately
  - You are updating bundled plugin package metadata or release automation
  - You need the canonical internal vs external plugin list
title: "Plugin inventory"
---

# Plugin inventory

This page is generated from top-level `extensions/*/natesclaw.plugin.json`
manifests and the root npm package `files` exclusions. Optional `package.json`
metadata enriches package and distribution details. Regenerate it with:

```bash
pnpm plugins:inventory:gen
```

## Definitions

- **Core npm package:** built into the `natesclaw` npm package and available without a separate plugin install.
- **Official external package:** Natesclaw-maintained plugin omitted from the core npm package, kept in this official inventory, and installed on demand through ClawHub and/or npm.
- **Source checkout only:** repo-local plugin omitted from published npm artifacts and not advertised as an installable package.

Source checkouts are different from npm installs: after `pnpm install`, bundled
plugins load from `extensions/<id>` so local edits and package-local workspace
dependencies are available.

## Install a plugin

Use the install route in each entry to decide whether install is needed. Plugins
that say `included in Natesclaw` are already present in the core package.
Official external packages need one install, then a Gateway restart.

For example, Discord is an official external package:

```bash
natesclaw plugins install @natesclaw/discord
natesclaw gateway restart
natesclaw plugins inspect discord --runtime --json
```

During the launch cutover, ordinary bare package specs still install from npm.
Use `clawhub:@natesclaw/discord` or `npm:@natesclaw/discord` when you need an
explicit source. After install, follow the plugin's setup doc, such as
[Discord](/channels/discord), to add credentials and channel config. See
[Manage plugins](/plugins/manage-plugins) for update, uninstall, and publishing
commands.

Each entry lists the package, distribution route, and description.

## Core npm package

58 plugins

- **[active-memory](/plugins/reference/active-memory)** (`natesclaw`) - included in Natesclaw. Runs bounded pre-reply memory retrieval and implements per-agent Remember across conversations for eligible private conversations.

- **[admin-http-rpc](/plugins/reference/admin-http-rpc)** (`@natesclaw/admin-http-rpc`) - included in Natesclaw. Natesclaw admin HTTP RPC endpoint.

- **[alibaba](/plugins/reference/alibaba)** (`@natesclaw/alibaba-provider`) - included in Natesclaw. Adds video generation provider support.

- **[anthropic](/plugins/reference/anthropic)** (`@natesclaw/anthropic-provider`) - included in Natesclaw. Anthropic models, Claude CLI, and native Claude session catalog.

- **[azure-speech](/plugins/reference/azure-speech)** (`@natesclaw/azure-speech`) - included in Natesclaw. Azure AI Speech text-to-speech (MP3, native Ogg/Opus voice notes, PCM telephony).

- **[beam](/plugins/reference/beam)** (`@natesclaw/beam`) - included in Natesclaw. Read-only coding-session Beam receiver.

- **[bonjour](/plugins/reference/bonjour)** (`@natesclaw/bonjour`) - included in Natesclaw. Advertise the local Natesclaw gateway over Bonjour/mDNS.

- **[browser](/plugins/reference/browser)** (`@natesclaw/browser-plugin`) - included in Natesclaw. Adds agent-callable tools.

- **[canvas](/plugins/reference/canvas)** (`@natesclaw/canvas-plugin`) - included in Natesclaw. Experimental Canvas control and A2UI rendering surfaces for paired nodes.

- **[clawrouter](/plugins/reference/clawrouter)** (`@natesclaw/clawrouter`) - included in Natesclaw. Adds ClawRouter model provider support to Natesclaw.

- **[copilot-proxy](/plugins/reference/copilot-proxy)** (`@natesclaw/copilot-proxy`) - included in Natesclaw. Adds Copilot Proxy model provider support to Natesclaw.

- **[crabbox](/plugins/reference/crabbox)** (`@natesclaw/crabbox-provider`) - included in Natesclaw. Cloud worker provider backed by the Crabbox CLI.

- **[cua-computer](/plugins/reference/cua-computer)** (`@natesclaw/cua-computer`) - included in Natesclaw. Experimental CUA Driver SDK computer control for Windows and Linux node hosts.

- **[deepgram](/plugins/reference/deepgram)** (`@natesclaw/deepgram-provider`) - included in Natesclaw. Adds media understanding provider support. Adds realtime transcription provider support.

- **[device-pair](/plugins/reference/device-pair)** (`natesclaw`) - included in Natesclaw. Generate setup codes and approve device pairing requests.

- **[document-extract](/plugins/reference/document-extract)** (`@natesclaw/document-extract-plugin`) - included in Natesclaw. Extract text and fallback page images from local document attachments.

- **[elevenlabs](/plugins/reference/elevenlabs)** (`@natesclaw/elevenlabs-speech`) - included in Natesclaw. Adds media understanding provider support. Adds realtime transcription provider support. Adds text-to-speech provider support.

- **[fal](/plugins/reference/fal)** (`@natesclaw/fal-provider`) - included in Natesclaw. Adds fal model provider support to Natesclaw.

- **[file-transfer](/plugins/reference/file-transfer)** (`@natesclaw/file-transfer`) - included in Natesclaw. Fetch, list, and write files on paired nodes via dedicated node commands. Bypasses bash stdout truncation by using base64 over node.invoke for binaries up to 16 MB.

- **[github-copilot](/plugins/reference/github-copilot)** (`@natesclaw/github-copilot-provider`) - included in Natesclaw. Adds GitHub Copilot model provider support to Natesclaw.

- **[google](/plugins/reference/google)** (`@natesclaw/google-plugin`) - included in Natesclaw. Adds Google, Google Gemini CLI, Google Vertex model provider support to Natesclaw.

- **[huggingface](/plugins/reference/huggingface)** (`@natesclaw/huggingface-provider`) - included in Natesclaw. Adds Hugging Face model provider support to Natesclaw.

- **[linux-canvas](/plugins/reference/linux-canvas)** (`@natesclaw/linux-canvas`) - included in Natesclaw. Canvas rendering bridge for the Natesclaw Linux desktop app.

- **[linux-node](/plugins/reference/linux-node)** (`@natesclaw/linux-node`) - included in Natesclaw. Desktop notifications, camera capture, and location for Linux node hosts.

- **[litellm](/plugins/reference/litellm)** (`@natesclaw/litellm-provider`) - included in Natesclaw. Adds LiteLLM model provider support to Natesclaw.

- **[llm-task](/plugins/reference/llm-task)** (`@natesclaw/llm-task`) - included in Natesclaw. Generic JSON-only LLM tool for structured tasks callable from workflows.

- **[lmstudio](/plugins/reference/lmstudio)** (`@natesclaw/lmstudio-provider`) - included in Natesclaw. Adds LM Studio model provider support to Natesclaw.

- **[logbook](/plugins/reference/logbook)** (`@natesclaw/logbook`) - included in Natesclaw. Automatic work journal: captures periodic screen snapshots from a paired node and turns them into a reviewable timeline of your day.

- **[memory-core](/plugins/reference/memory-core)** (`@natesclaw/memory-core`) - included in Natesclaw. Adds agent-callable tools.

- **[memory-wiki](/plugins/reference/memory-wiki)** (`@natesclaw/memory-wiki`) - included in Natesclaw. Persistent wiki compiler and Obsidian-friendly knowledge vault for Natesclaw.

- **[microsoft](/plugins/reference/microsoft)** (`@natesclaw/microsoft-speech`) - included in Natesclaw. Adds text-to-speech provider support.

- **[microsoft-foundry](/plugins/reference/microsoft-foundry)** (`@natesclaw/microsoft-foundry`) - included in Natesclaw. Adds Microsoft Foundry model provider support to Natesclaw.

- **[migrate-claude](/plugins/reference/migrate-claude)** (`@natesclaw/migrate-claude`) - included in Natesclaw. Imports Claude Code and Claude Desktop instructions, MCP servers, skills, and safe configuration into Natesclaw.

- **[migrate-hermes](/plugins/reference/migrate-hermes)** (`@natesclaw/migrate-hermes`) - included in Natesclaw. Imports Hermes configuration, memories, skills, and supported credentials into Natesclaw.

- **[minimax](/plugins/reference/minimax)** (`@natesclaw/minimax-provider`) - included in Natesclaw. Adds MiniMax, MiniMax Portal model provider support to Natesclaw.

- **[nvidia](/plugins/reference/nvidia)** (`@natesclaw/nvidia-provider`) - included in Natesclaw. Adds NVIDIA model provider support to Natesclaw.

- **[oc-path](/plugins/reference/oc-path)** (`@natesclaw/oc-path`) - included in Natesclaw. Adds the natesclaw path CLI for oc:// workspace file addressing.

- **[ollama](/plugins/reference/ollama)** (`@natesclaw/ollama-provider`) - included in Natesclaw. Adds Ollama, Ollama Cloud model provider support to Natesclaw.

- **[onepassword](/plugins/reference/onepassword)** (`@natesclaw/onepassword`) - included in Natesclaw. 1Password SecretRef resolver and curated agent broker with approval policy and SQLite audit history.

- **[open-prose](/plugins/reference/open-prose)** (`@natesclaw/open-prose`) - included in Natesclaw. OpenProse VM skill pack with a /prose slash command.

- **[openai](/plugins/reference/openai)** (`@natesclaw/openai-provider`) - included in Natesclaw. Adds OpenAI model provider support to Natesclaw.

- **[opencode-go](/plugins/reference/opencode-go)** (`@natesclaw/opencode-go-provider`) - included in Natesclaw. Adds OpenCode Go model provider support to Natesclaw.

- **[openrouter](/plugins/reference/openrouter)** (`@natesclaw/openrouter-provider`) - included in Natesclaw. Adds OpenRouter model provider support to Natesclaw.

- **[policy](/plugins/reference/policy)** (`@natesclaw/policy`) - included in Natesclaw. Adds policy-backed doctor checks for workspace conformance.

- **[reef](/plugins/reference/reef)** (`@natesclaw/reef`) - included in Natesclaw. Guarded end-to-end encrypted claw channel.

- **[runway](/plugins/reference/runway)** (`@natesclaw/runway-provider`) - included in Natesclaw. Adds video generation provider support.

- **[senseaudio](/plugins/reference/senseaudio)** (`@natesclaw/senseaudio-provider`) - included in Natesclaw. Adds media understanding provider support.

- **[sglang](/plugins/reference/sglang)** (`@natesclaw/sglang-provider`) - included in Natesclaw. Adds SGLang model provider support to Natesclaw.

- **[talk-voice](/plugins/reference/talk-voice)** (`natesclaw`) - included in Natesclaw. Manage Talk voice selection (list/set).

- **[telegram](/plugins/reference/telegram)** (`@natesclaw/telegram`) - included in Natesclaw. Adds the Telegram channel surface for sending and receiving Natesclaw messages.

- **[together](/plugins/reference/together)** (`@natesclaw/together-provider`) - included in Natesclaw. Adds Together model provider support to Natesclaw.

- **[tts-local-cli](/plugins/reference/tts-local-cli)** (`@natesclaw/tts-local-cli`) - included in Natesclaw. Adds text-to-speech provider support.

- **[vault](/plugins/reference/vault)** (`@natesclaw/vault`) - included in Natesclaw. HashiCorp Vault SecretRef provider integration.

- **[vllm](/plugins/reference/vllm)** (`@natesclaw/vllm-provider`) - included in Natesclaw. Adds vLLM model provider support to Natesclaw.

- **[web-readability](/plugins/reference/web-readability)** (`@natesclaw/web-readability-plugin`) - included in Natesclaw. Extract readable article content from local HTML web fetch responses.

- **[webhooks](/plugins/reference/webhooks)** (`@natesclaw/webhooks`) - included in Natesclaw. Authenticated inbound webhooks that bind external automation to Natesclaw TaskFlows.

- **[workboard](/plugins/reference/workboard)** (`@natesclaw/workboard`) - included in Natesclaw. Dashboard workboard for agent-owned issues and sessions.

- **[xai](/plugins/reference/xai)** (`@natesclaw/xai-plugin`) - included in Natesclaw. Adds xAI model provider support to Natesclaw.

## Official external packages

90 plugins

- **[acpx](/plugins/reference/acpx)** (`@natesclaw/acpx`) - npm; ClawHub. Natesclaw ACP runtime backend with plugin-owned session and transport management.

- **[amazon-bedrock](/plugins/reference/amazon-bedrock)** (`@natesclaw/amazon-bedrock-provider`) - npm; ClawHub. Natesclaw Amazon Bedrock provider plugin with model discovery, embeddings, and guardrail support.

- **[amazon-bedrock-mantle](/plugins/reference/amazon-bedrock-mantle)** (`@natesclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Natesclaw Amazon Bedrock Mantle provider plugin for OpenAI-compatible model routing.

- **[anthropic-vertex](/plugins/reference/anthropic-vertex)** (`@natesclaw/anthropic-vertex-provider`) - npm; ClawHub. Natesclaw Anthropic Vertex provider plugin for Claude models on Google Vertex AI.

- **[arcee](/plugins/reference/arcee)** (`@natesclaw/arcee-provider`) - npm; ClawHub: `clawhub:@natesclaw/arcee-provider`. Adds Arcee model provider support to Natesclaw.

- **[baseten](/plugins/reference/baseten)** (`@natesclaw/baseten-provider`) - npm; ClawHub: `clawhub:@natesclaw/baseten-provider`. Natesclaw Baseten provider plugin.

- **[brave](/plugins/reference/brave)** (`@natesclaw/brave-plugin`) - npm; ClawHub. Natesclaw Brave Search provider plugin for web search.

- **[buzz](/plugins/reference/buzz)** (`@natesclaw/buzz`) - npm; ClawHub: `clawhub:@natesclaw/buzz`. Connect Natesclaw agents to Buzz rooms.

- **[byteplus](/plugins/reference/byteplus)** (`@natesclaw/byteplus-provider`) - npm; ClawHub: `clawhub:@natesclaw/byteplus-provider`. Adds BytePlus, BytePlus Plan model provider support to Natesclaw.

- **[cerebras](/plugins/reference/cerebras)** (`@natesclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@natesclaw/cerebras-provider`. Adds Cerebras model provider support to Natesclaw.

- **[chutes](/plugins/reference/chutes)** (`@natesclaw/chutes-provider`) - npm; ClawHub: `clawhub:@natesclaw/chutes-provider`. Adds Chutes model provider support to Natesclaw.

- **[clickclack](/plugins/reference/clickclack)** (`@natesclaw/clickclack`) - npm; ClawHub: `clawhub:@natesclaw/clickclack`. Adds the Clickclack channel surface for sending and receiving Natesclaw messages.

- **[cloudflare-ai-gateway](/plugins/reference/cloudflare-ai-gateway)** (`@natesclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@natesclaw/cloudflare-ai-gateway-provider`. Adds Cloudflare AI Gateway model provider support to Natesclaw.

- **[codex](/plugins/reference/codex)** (`@natesclaw/codex`) - npm; ClawHub. Codex app-server harness and native session catalog.

- **[cohere](/plugins/reference/cohere)** (`@natesclaw/cohere-provider`) - npm; ClawHub: `clawhub:@natesclaw/cohere-provider`. Natesclaw Cohere provider plugin.

- **[comfy](/plugins/reference/comfy)** (`@natesclaw/comfy-provider`) - npm; ClawHub: `clawhub:@natesclaw/comfy-provider`. Adds ComfyUI model provider support to Natesclaw.

- **[copilot](/plugins/reference/copilot)** (`@natesclaw/copilot`) - npm; ClawHub: `clawhub:@natesclaw/copilot`. Registers the GitHub Copilot agent runtime.

- **[deepinfra](/plugins/reference/deepinfra)** (`@natesclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@natesclaw/deepinfra-provider`. Adds DeepInfra model provider support to Natesclaw.

- **[deepseek](/plugins/reference/deepseek)** (`@natesclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@natesclaw/deepseek-provider`. Adds DeepSeek model provider support to Natesclaw.

- **[diagnostics-otel](/plugins/reference/diagnostics-otel)** (`@natesclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@natesclaw/diagnostics-otel`. Natesclaw diagnostics OpenTelemetry exporter for metrics, traces, and logs.

- **[diagnostics-prometheus](/plugins/reference/diagnostics-prometheus)** (`@natesclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@natesclaw/diagnostics-prometheus`. Natesclaw diagnostics Prometheus exporter for runtime metrics.

- **[diffs](/plugins/reference/diffs)** (`@natesclaw/diffs`) - npm; ClawHub. Natesclaw read-only diff viewer plugin and file renderer for agents.

- **[diffs-language-pack](/plugins/reference/diffs-language-pack)** (`@natesclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@natesclaw/diffs-language-pack`. Adds syntax highlighting for languages outside the default diffs viewer set.

- **[discord](/plugins/reference/discord)** (`@natesclaw/discord`) - npm; ClawHub. Natesclaw Discord channel plugin for channels, DMs, commands, and app events.

- **[duckduckgo](/plugins/reference/duckduckgo)** (`@natesclaw/duckduckgo-plugin`) - npm; ClawHub: `clawhub:@natesclaw/duckduckgo-plugin`. Adds web search provider support.

- **[exa](/plugins/reference/exa)** (`@natesclaw/exa-plugin`) - npm; ClawHub: `clawhub:@natesclaw/exa-plugin`. Adds web search provider support.

- **[featherless](/plugins/reference/featherless)** (`@natesclaw/featherless-provider`) - npm; ClawHub: `clawhub:@natesclaw/featherless-provider`. Natesclaw Featherless AI provider plugin.

- **[feishu](/plugins/reference/feishu)** (`@natesclaw/feishu`) - npm; ClawHub. Natesclaw Feishu/Lark channel plugin for chats and workplace tools (community maintained by @m1heng).

- **[firecrawl](/plugins/reference/firecrawl)** (`@natesclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@natesclaw/firecrawl-plugin`. Adds agent-callable tools. Adds web fetch provider support. Adds web search provider support.

- **[fireworks](/plugins/reference/fireworks)** (`@natesclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@natesclaw/fireworks-provider`. Adds Fireworks model provider support to Natesclaw.

- **[fish-audio-speech](/plugins/reference/fish-audio-speech)** (`@natesclaw/fish-audio-speech`) - npm; ClawHub: `clawhub:@natesclaw/fish-audio-speech`. Fish Audio S2.1 hosted text-to-speech with streaming, voice notes, and telephony output.

- **[gmi](/plugins/reference/gmi)** (`@natesclaw/gmi-provider`) - npm; ClawHub: `clawhub:@natesclaw/gmi-provider`. Natesclaw GMI Cloud provider plugin.

- **[google-meet](/plugins/reference/google-meet)** (`@natesclaw/google-meet`) - npm; ClawHub. Natesclaw Google Meet participant plugin for joining calls through Chrome or Twilio transports.

- **[googlechat](/plugins/reference/googlechat)** (`@natesclaw/googlechat`) - npm; ClawHub. Natesclaw Google Chat channel plugin for spaces and direct messages.

- **[gradium](/plugins/reference/gradium)** (`@natesclaw/gradium-speech`) - npm; ClawHub: `clawhub:@natesclaw/gradium-speech`. Adds text-to-speech provider support.

- **[groq](/plugins/reference/groq)** (`@natesclaw/groq-provider`) - npm; ClawHub: `clawhub:@natesclaw/groq-provider`. Adds Groq model provider support to Natesclaw.

- **[imessage](/plugins/reference/imessage)** (`@natesclaw/imessage`) - npm; ClawHub: `clawhub:@natesclaw/imessage`. Adds the iMessage channel surface for sending and receiving Natesclaw messages.

- **[inworld](/plugins/reference/inworld)** (`@natesclaw/inworld-speech`) - npm; ClawHub: `clawhub:@natesclaw/inworld-speech`. Inworld streaming text-to-speech (MP3, OGG_OPUS, PCM telephony).

- **[irc](/plugins/reference/irc)** (`@natesclaw/irc`) - npm; ClawHub: `clawhub:@natesclaw/irc`. Adds the IRC channel surface for sending and receiving Natesclaw messages.

- **[kilocode](/plugins/reference/kilocode)** (`@natesclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@natesclaw/kilocode-provider`. Adds Kilocode model provider support to Natesclaw.

- **[kimi](/plugins/reference/kimi)** (`@natesclaw/kimi-provider`) - npm; ClawHub: `clawhub:@natesclaw/kimi-provider`. Adds Kimi, Kimi Coding model provider support to Natesclaw.

- **[line](/plugins/reference/line)** (`@natesclaw/line`) - npm; ClawHub. Natesclaw LINE channel plugin for LINE Bot API chats.

- **[llama-cpp](/plugins/reference/llama-cpp)** (`@natesclaw/llama-cpp-provider`) - npm; ClawHub. Local GGUF text inference and embeddings through node-llama-cpp.

- **[lobster](/plugins/reference/lobster)** (`@natesclaw/lobster`) - npm; ClawHub. Lobster workflow tool plugin for typed pipelines and resumable approvals.

- **[longcat](/plugins/reference/longcat)** (`@natesclaw/longcat-provider`) - npm; ClawHub: `clawhub:@natesclaw/longcat-provider`. Natesclaw LongCat provider plugin.

- **[matrix](/plugins/reference/matrix)** (`@natesclaw/matrix`) - ClawHub: `clawhub:@natesclaw/matrix`; npm. Natesclaw Matrix channel plugin for rooms and direct messages.

- **[mattermost](/plugins/reference/mattermost)** (`@natesclaw/mattermost`) - npm; ClawHub: `clawhub:@natesclaw/mattermost`. Adds the Mattermost channel surface for sending and receiving Natesclaw messages.

- **[memory-lancedb](/plugins/reference/memory-lancedb)** (`@natesclaw/memory-lancedb`) - npm; ClawHub. Natesclaw LanceDB-backed long-term memory plugin with auto-recall, auto-capture, and vector search.

- **[meta](/plugins/reference/meta)** (`@natesclaw/meta-provider`) - npm; ClawHub: `clawhub:@natesclaw/meta-provider`. Adds Meta model provider support to Natesclaw.

- **[mistral](/plugins/reference/mistral)** (`@natesclaw/mistral-provider`) - npm; ClawHub: `clawhub:@natesclaw/mistral-provider`. Adds Mistral model provider support to Natesclaw.

- **[moonshot](/plugins/reference/moonshot)** (`@natesclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@natesclaw/moonshot-provider`. Adds Moonshot model provider support to Natesclaw.

- **[msteams](/plugins/reference/msteams)** (`@natesclaw/msteams`) - npm; ClawHub. Natesclaw Microsoft Teams channel plugin for bot conversations.

- **[mxc](/plugins/reference/mxc)** (`@natesclaw/mxc-sandbox`) - npm; ClawHub. OS-level sandboxed tool execution via MXC: runs commands in a Windows ProcessContainer with configured MXC policy files.

- **[nextcloud-talk](/plugins/reference/nextcloud-talk)** (`@natesclaw/nextcloud-talk`) - npm; ClawHub. Natesclaw Nextcloud Talk channel plugin for conversations.

- **[nostr](/plugins/reference/nostr)** (`@natesclaw/nostr`) - npm; ClawHub. Natesclaw Nostr channel plugin for NIP-04 encrypted direct messages.

- **[novita](/plugins/reference/novita)** (`@natesclaw/novita-provider`) - npm; ClawHub: `clawhub:@natesclaw/novita-provider`. Adds Novita, Novita AI, Novitaai model provider support to Natesclaw.

- **[opencode](/plugins/reference/opencode)** (`@natesclaw/opencode-provider`) - npm; ClawHub: `clawhub:@natesclaw/opencode-provider`. Adds OpenCode model provider support to Natesclaw.

- **[openshell](/plugins/reference/openshell)** (`@natesclaw/openshell-sandbox`) - npm; ClawHub. Natesclaw sandbox backend for the NVIDIA OpenShell CLI with mirrored local workspaces and SSH command execution.

- **[parallel](/tools/parallel-search)** (`@natesclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@natesclaw/parallel-plugin`. Adds web search provider support.

- **[perplexity](/plugins/reference/perplexity)** (`@natesclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@natesclaw/perplexity-plugin`. Adds web search provider support.

- **[pixverse](/plugins/reference/pixverse)** (`@natesclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@natesclaw/pixverse-provider`. Natesclaw PixVerse video generation provider plugin.

- **[qianfan](/plugins/reference/qianfan)** (`@natesclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@natesclaw/qianfan-provider`. Adds Qianfan model provider support to Natesclaw.

- **[qqbot](/plugins/reference/qqbot)** (`@natesclaw/qqbot`) - npm; ClawHub. Natesclaw QQ Bot channel plugin for group and direct-message workflows.

- **[qwen](/plugins/reference/qwen)** (`@natesclaw/qwen-provider`) - npm; ClawHub: `clawhub:@natesclaw/qwen-provider`. Adds Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan, Bailian Token Plan model provider support to Natesclaw.

- **[raft](/plugins/reference/raft)** (`@natesclaw/raft`) - npm; ClawHub. Natesclaw Raft channel plugin for secure CLI wake bridges.

- **[searxng](/plugins/reference/searxng)** (`@natesclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@natesclaw/searxng-plugin`. Adds web search provider support.

- **[signal](/plugins/reference/signal)** (`@natesclaw/signal`) - npm; ClawHub: `clawhub:@natesclaw/signal`. Adds the Signal channel surface for sending and receiving Natesclaw messages.

- **[slack](/plugins/reference/slack)** (`@natesclaw/slack`) - npm; ClawHub. Natesclaw Slack channel plugin for channels, DMs, commands, and app events.

- **[sms](/plugins/reference/sms)** (`@natesclaw/sms`) - npm; ClawHub: `clawhub:@natesclaw/sms`. Twilio SMS/MMS channel plugin for Natesclaw messages.

- **[stepfun](/plugins/reference/stepfun)** (`@natesclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@natesclaw/stepfun-provider`. Adds StepFun, StepFun Plan model provider support to Natesclaw.

- **[synology-chat](/plugins/reference/synology-chat)** (`@natesclaw/synology-chat`) - npm; ClawHub. Synology Chat channel plugin for Natesclaw channels and direct messages.

- **[synthetic](/plugins/reference/synthetic)** (`@natesclaw/synthetic-provider`) - npm; ClawHub: `clawhub:@natesclaw/synthetic-provider`. Adds Synthetic model provider support to Natesclaw.

- **[tavily](/plugins/reference/tavily)** (`@natesclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@natesclaw/tavily-plugin`. Adds agent-callable tools. Adds web search provider support.

- **[teams-meetings](/plugins/reference/teams-meetings)** (`@natesclaw/teams-meetings`) - npm; ClawHub: `clawhub:@natesclaw/teams-meetings`. Join Microsoft Teams meetings as a Chrome browser guest.

- **[tencent](/plugins/reference/tencent)** (`@natesclaw/tencent-provider`) - npm; ClawHub: `clawhub:@natesclaw/tencent-provider`. Adds Tencent TokenHub, Tencent Tokenplan model provider support to Natesclaw.

- **[tlon](/plugins/reference/tlon)** (`@natesclaw/tlon`) - npm; ClawHub. Natesclaw Tlon/Urbit channel plugin for chat workflows.

- **[tokenjuice](/plugins/reference/tokenjuice)** (`@natesclaw/tokenjuice`) - npm; ClawHub: `clawhub:@natesclaw/tokenjuice`. Compacts exec and bash tool results with tokenjuice reducers.

- **[twitch](/plugins/reference/twitch)** (`@natesclaw/twitch`) - npm; ClawHub. Natesclaw Twitch channel plugin for chat and moderation workflows.

- **[venice](/plugins/reference/venice)** (`@natesclaw/venice-provider`) - npm; ClawHub: `clawhub:@natesclaw/venice-provider`. Adds Venice model provider support to Natesclaw.

- **[vercel-ai-gateway](/plugins/reference/vercel-ai-gateway)** (`@natesclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@natesclaw/vercel-ai-gateway-provider`. Adds Vercel AI Gateway model provider support to Natesclaw.

- **[voice-call](/plugins/reference/voice-call)** (`@natesclaw/voice-call`) - npm; ClawHub. Natesclaw voice-call plugin for Twilio, Telnyx, and Plivo phone calls.

- **[volcengine](/plugins/reference/volcengine)** (`@natesclaw/volcengine-provider`) - npm; ClawHub: `clawhub:@natesclaw/volcengine-provider`. Adds Volcengine, Volcengine Plan model provider support to Natesclaw.

- **[voyage](/plugins/reference/voyage)** (`@natesclaw/voyage-provider`) - npm; ClawHub: `clawhub:@natesclaw/voyage-provider`. Adds memory embedding provider support.

- **[vydra](/plugins/reference/vydra)** (`@natesclaw/vydra-provider`) - npm; ClawHub: `clawhub:@natesclaw/vydra-provider`. Adds Vydra model provider support to Natesclaw.

- **[whatsapp](/plugins/reference/whatsapp)** (`@natesclaw/whatsapp`) - ClawHub: `clawhub:@natesclaw/whatsapp`; npm. Natesclaw WhatsApp channel plugin for WhatsApp Web chats.

- **[xiaomi](/plugins/reference/xiaomi)** (`@natesclaw/xiaomi-provider`) - npm; ClawHub: `clawhub:@natesclaw/xiaomi-provider`. Adds Xiaomi, Xiaomi Token Plan model provider support to Natesclaw.

- **[zai](/plugins/reference/zai)** (`@natesclaw/zai-provider`) - npm; ClawHub: `clawhub:@natesclaw/zai-provider`. Adds Z.AI model provider support to Natesclaw.

- **[zalo](/plugins/reference/zalo)** (`@natesclaw/zalo`) - npm; ClawHub. Natesclaw Zalo channel plugin for bot and webhook chats.

- **[zalouser](/plugins/reference/zalouser)** (`@natesclaw/zalouser`) - npm; ClawHub. Natesclaw Zalo Personal Account plugin via native zca-js integration.

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@natesclaw/zoom-meetings`) - npm; ClawHub: `clawhub:@natesclaw/zoom-meetings`. Join Zoom meetings as a Chrome browser guest.

## Source checkout only

2 plugins

- **[qa-channel](/plugins/reference/qa-channel)** (`@natesclaw/qa-channel`) - source checkout only. Adds the QA Channel surface for sending and receiving Natesclaw messages.

- **[qa-lab](/plugins/reference/qa-lab)** (`@natesclaw/qa-lab`) - source checkout only. Natesclaw QA lab plugin with private debugger UI and scenario runner.
