#!/bin/zsh
set -e

project_dir="${0:A:h}"
cd "$project_dir"

if ! curl --silent --fail http://localhost:8080/ >/dev/null 2>&1; then
  nohup python3 -m http.server 8080 > /tmp/ielts-study-platform.log 2>&1 &
  for attempt in {1..20}; do
    curl --silent --fail http://localhost:8080/ >/dev/null 2>&1 && break
    sleep 0.1
  done
fi

open "http://localhost:8080/#library"
