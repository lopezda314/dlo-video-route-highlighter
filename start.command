#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
echo "Starting VideoRouteHighlighter on http://localhost:$PORT ..."
open "http://localhost:$PORT/index.html"
python3 -m http.server $PORT
