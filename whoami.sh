#!/usr/bin/env bash
# Pure print, nothing else — no downloads, no writes, no state changes.
# Safe to pipe into bash or just run directly:
#   curl -sL https://raw.githubusercontent.com/13RahulKhanna/13RahulKhanna/main/whoami.sh | bash

INDIGO='\033[38;5;111m'
PURPLE='\033[38;5;141m'
WHITE='\033[1;37m'
DIM='\033[2;37m'
RESET='\033[0m'

printf "${INDIGO}"
cat <<'EOF'
 ___    _   _  _ _   _ _      _  ___  _   _   _  _ _  _   _
| _ \  /_\ | || | | | | |    | |/ / || | /_\ | \| | \| | /_\
|   / / _ \| __ | |_| | |__  | ' <| __ |/ _ \| .` | .` |/ _ \
|_|_\/_/ \_\_||_|\___/|____| |_|\_\_||_/_/ \_\_|\_|_|\_/_/ \_\
EOF
printf "${RESET}\n"

printf "${WHITE}  Software Engineer · Builder · Competitive Programmer${RESET}\n\n"

printf "${PURPLE}  ┌─ track record ──────────────────────────────────────────┐${RESET}\n"
printf "  │  LeetCode        2295 · Guardian · Top 0.5%% globally    │\n"
printf "  │  Latest contest  #29 global rank                        │\n"
printf "  │  Problems solved 900+                                   │\n"
printf "  │  2024            Smart India Hackathon, national round  │\n"
printf "${PURPLE}  └─────────────────────────────────────────────────────────┘${RESET}\n\n"

printf "${PURPLE}  ┌─ built ─────────────────────────────────────────────────┐${RESET}\n"
printf "  │  Vault      private life-operating system, solo-built   │\n"
printf "  │  Ceretle    interactive LeetCode learning platform      │\n"
printf "  │  CodeGaze   peer-learning community for CP/DSA          │\n"
printf "${PURPLE}  └─────────────────────────────────────────────────────────┘${RESET}\n\n"

printf "${DIM}  > designing systems for an audience of one${RESET}\n"
printf "${DIM}  > github.com/13RahulKhanna${RESET}\n\n"
