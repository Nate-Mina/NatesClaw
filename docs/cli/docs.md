---
summary: "CLI reference for `natesclaw docs` (search the live docs index)"
read_when:
  - You want to search the live Natesclaw docs from the terminal
  - You need to know which hosted search API the docs CLI calls
title: "Docs"
---

# `natesclaw docs`

Search the live Natesclaw docs index from the terminal.

## Usage

```bash
natesclaw docs                              # print docs entrypoint and example search
natesclaw docs --json                       # print the same guidance as JSON
natesclaw docs <query...> [--json]          # search the live docs index
```

| Argument/option | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `[query...]`    | Free-form search query. Multi-word queries are joined with spaces and sent as one. |
| `--json`        | Emit one machine-readable JSON object on stdout.                                   |

With no query, `natesclaw docs` prints the docs entrypoint URL and a sample search command instead of running a search.

## Examples

```bash
natesclaw docs browser existing-session
natesclaw docs browser existing-session --json
natesclaw docs sandbox allowHostControl
natesclaw docs gateway token secretref
```

## How it works

`natesclaw docs` calls `https://docs.openclaw.ai/api/search` and renders the JSON results. The search request uses a fixed 30 second timeout.

## Output

In a rich (TTY) terminal, results render as a heading followed by a bullet list: page title, linked docs URL, and a short snippet on the next line. Empty results print "No results.".

In non-rich output (piped, `--no-color`, scripts), the same data renders as Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

With `--json`, stdout contains one object with the normalized query and result
list. With no query, `query` is `null`, `url` is the docs entrypoint, and
`results` is empty. Styling and headings are suppressed; request diagnostics
stay on stderr so stdout can be piped directly to a JSON parser.

## Exit codes

| Code | Meaning                                                                  |
| ---- | ------------------------------------------------------------------------ |
| `0`  | Search succeeded, including zero-result responses.                       |
| `1`  | The hosted docs search API call failed; stderr prints the error message. |

## Related

- [CLI reference](/cli)
- [Live docs](https://docs.openclaw.ai)
