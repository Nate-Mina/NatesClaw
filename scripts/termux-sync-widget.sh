#!/data/data/com.termux/files/usr/bin/bash
# Natesclaw OAuth Sync Widget
# Syncs Claude Code tokens to Natesclaw over SSH
# Place in ~/.shortcuts/ on phone for Termux:Widget

termux-toast "Syncing Natesclaw auth..."

# Run sync on the configured Natesclaw host.
SERVER="${NATESCLAW_SERVER:-natesclaw-host}"
RESULT=$(ssh "$SERVER" '$HOME/natesclaw/scripts/sync-claude-code-auth.sh' 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    # Extract expiry time from output
    EXPIRY=$(echo "$RESULT" | grep "Token expires:" | cut -d: -f2-)

    termux-vibrate -d 100
    termux-toast "Natesclaw synced! Expires:${EXPIRY}"

    # Optional: restart natesclaw service
    ssh "$SERVER" 'systemctl --user restart natesclaw' 2>/dev/null
else
    termux-vibrate -d 300
    termux-toast "Sync failed: ${RESULT}"
fi
