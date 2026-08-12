#!/usr/bin/env bash
# Targeted partial revert: website domains + npm scope -> openclaw.
# Keeps: program/CLI/GUI name 'natesclaw', app IDs (natesclaw.app), file ids (.js/.json/.mjs).
set -u
cd "D:/natesclaw/.worktrees/renamed" || exit 1

files=$(git grep -I -l -e '@natesclaw/' -e 'natesclaw\.\(ai\|com\|io\|dev\|org\)' -e 'github.com/natesclaw/' -e 'npm install natesclaw' -e 'npm i natesclaw' -e 'npx natesclaw' -e 'pnpm add natesclaw' -e 'yarn add natesclaw' -e '"name": "natesclaw"' 2>/dev/null)

echo "files to process: $(echo "$files" | wc -l)"

# 1) npm scope @natesclaw/ -> @openclaw/
# 2) website domains natesclaw.{ai,com,io,dev,org} -> openclaw.{...}
# 3) mangled upstream github.com/natesclaw/ -> github.com/openclaw/
# 4) install commands npx/npm/pnpm/yarn ... natesclaw -> openclaw (package name, not CLI)
# 5) bare published package name "natesclaw" -> "openclaw"  (NOT touching bin name or program strings)
echo "$files" | while IFS= read -r f; do
  [ -z "$f" ] && continue
  perl -pi -e '
    s{\@natesclaw/}{\@openclaw/}g;
    s{natesclaw\.(ai|com|io|dev|org)}{openclaw.$1}g;
    s{github\.com/natesclaw/}{github.com/openclaw/}g;
    s{(npx|npx -y|npm install|npm i|pnpm add|yarn add)\s+natesclaw(\@|$|\s)}{$1 openclaw$2}g;
    s{"name":\s*"natesclaw"}{"name": "openclaw"}g;
  ' "$f"
done

echo "=== residual after revert ==="
echo -n "@natesclaw/ scope: " && git grep -I -o '@natesclaw/' | wc -l
echo -n "natesclaw.{ai,com,io,dev,org}: " && git grep -I -o 'natesclaw\.\(ai\|com\|io\|dev\|org\)' | wc -l
echo -n "github.com/natesclaw/: " && git grep -I -o 'github.com/natesclaw/' | wc -l
echo -n "npx/npm ... natesclaw (install): " && git grep -I -e 'npm install natesclaw' -e 'npx natesclaw' -e 'pnpm add natesclaw' -e 'yarn add natesclaw' | wc -l
echo -n 'bare "name":"natesclaw": ' && git grep -I -o '"name": "natesclaw"' | wc -l
echo -n "natesclaw.app (MUST stay >0): " && git grep -I -o 'natesclaw\.app' | wc -l
echo -n "bin natesclaw (should stay): " && git grep -I -o '"bin":\s*"natesclaw"' | wc -l
