#!/usr/bin/env bash
# Agent-canary report for u64.cam — reads the GoatCounter stats API (read-only).
# Requires GOATCOUNTER_API_TOKEN (goatcounter → [username in top menu] → API).
# Usage: scripts/agent-canary-report.sh [START_DATE YYYY-MM-DD]   # default: 30 days ago
set -euo pipefail

: "${GOATCOUNTER_API_TOKEN:?export GOATCOUNTER_API_TOKEN first (goatcounter → username menu → API)}"
API="https://u64cam.goatcounter.com/api/v0"
START="${1:-$(date -v-30d +%F 2>/dev/null || date -u -d '30 days ago' +%F)}"
AUTH=(-H "Authorization: Bearer $GOATCOUNTER_API_TOKEN")

echo "u64.cam agent-canary report since $START"
echo
echo "== totals (all JS traffic) =="
curl -sS "${AUTH[@]}" "$API/stats/total?start=$START" \
  | jq -r '"visits: \(.total)  (utc: \(.total_utc))  events: \(.total_events)"'

echo
echo "== canary channels =="
curl -sS "${AUTH[@]}" "$API/stats/hits?start=$START" \
  | jq -r '.hits[] | select(.path | test("^/canary/|^/agents-only/")) | [.path, .count] | @tsv' \
  | awk -F'\t' '{printf "  %-48s %s\n", $1, $2}'
echo "  (nothing above = no canary fetches recorded yet; channels:"
echo "   open    /agents-only/hello.md   <- via /llms.txt"
echo "   robots  /canary/robots-*        <- via /robots.txt Disallow"
echo "   comment /canary/comment-*       <- via HTML comment in page source)"

echo
echo "== top paths (all JS traffic) =="
curl -sS "${AUTH[@]}" "$API/stats/hits?start=$START" \
  | jq -r '.hits[] | [.path, .count] | @tsv' \
  | awk -F'\t' '{printf "  %-48s %s\n", $1, $2}' | head -15
