#!/usr/bin/env sh
# likeag6/build.sh
#
# Build helper that:
#  - builds the WebAssembly module (frontend/main.wasm) from ./wasm
#  - copies Go's wasm_exec.js into frontend/wasm/wasm_exec.js
#  - builds the server binary (likeag6-server)
#  - runs the server (unless NO_RUN=1)
#
# Usage:
#   ./build.sh            # build everything and run the server (foreground)
#   NO_RUN=1 ./build.sh   # build artifacts but do not start the server
#   ./build.sh --help     # show help
#
# Environment:
#   GO_CMD    - (optional) override the 'go' command (default: go)
#   NO_RUN=1  - if set, do not start the server after building
#
# Notes:
# - This script expects to live in the likeag6 directory. It will operate relative
#   to its own location.
# - Requires a Go toolchain available.
# - If wasm_exec.js cannot be found automatically, the script will instruct you
#   how to copy it manually.

set -eu

# Determine script directory and cd into it so paths are consistent.
SCRIPT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
if [ -z "$SCRIPT_DIR" ]; then
  echo "ERROR: could not determine script directory" >&2
  exit 1
fi
cd "$SCRIPT_DIR"

GO_CMD="${GO_CMD:-go}"
WASM_SRC_DIR="./wasm"
WASM_OUT="./frontend/main.wasm"
WASM_EXEC_DIR="./frontend/wasm"
WASM_EXEC_DEST="$WASM_EXEC_DIR/wasm_exec.js"
SERVER_BIN="./likeag6-server"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--help]

Build steps performed:
  1) Build Go -> WebAssembly: $WASM_OUT (from $WASM_SRC_DIR)
  2) Copy Go's wasm_exec.js -> $WASM_EXEC_DEST
  3) Build server binary -> $SERVER_BIN
  4) Run server (unless NO_RUN=1)

Environment:
  GO_CMD      Override go command (default: 'go')
  NO_RUN=1    Build artifacts but do not start the server

Examples:
  ./build.sh
  NO_RUN=1 ./build.sh
EOF
}

# Handle help
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi

# Verify go is available
if ! command -v "$GO_CMD" >/dev/null 2>&1; then
  echo "ERROR: go toolchain not found. Ensure Go is installed and available on PATH, or set GO_CMD to the go binary." >&2
  exit 1
fi

# Ensure wasm source exists
if [ ! -d "$WASM_SRC_DIR" ]; then
  echo "ERROR: wasm source directory not found: $WASM_SRC_DIR" >&2
  echo "If you moved files, adjust the script or create the directory with the wasm package." >&2
  exit 1
fi

echo "[build] Building WebAssembly module -> $WASM_OUT"
# Ensure output dir exists
mkdir -p "$(dirname "$WASM_OUT")"

# Build wasm
# Note: GOOS=js GOARCH=wasm env variables instruct the go tool to produce wasm.
GOOS=js GOARCH=wasm "$GO_CMD" build -o "$WASM_OUT" "$WASM_SRC_DIR"
echo "[build] Built $WASM_OUT"

echo "[build] Ensuring $WASM_EXEC_DIR exists"
mkdir -p "$WASM_EXEC_DIR"

# Attempt to locate wasm_exec.js in common GOROOT locations
GOROOT="$("$GO_CMD" env GOROOT 2>/dev/null || true)"
FOUND=""
if [ -n "$GOROOT" ]; then
  CAND1="$GOROOT/lib/wasm/wasm_exec.js"
  CAND2="$GOROOT/misc/wasm/wasm_exec.js"
  CAND3="$GOROOT/libexec/misc/wasm/wasm_exec.js"
  CAND4="$GOROOT/libexec/lib/wasm/wasm_exec.js"
  for c in "$CAND1" "$CAND2" "$CAND3" "$CAND4"; do
    if [ -f "$c" ]; then
      FOUND="$c"
      break
    fi
  done
fi

# fallback: try to find file under GOROOT subtree (best-effort, limited depth)
if [ -z "$FOUND" ] && [ -n "$GOROOT" ] && command -v find >/dev/null 2>&1; then
  # limit the search to reasonable depth to avoid long scans
  FOUND="$(find "$GOROOT" -maxdepth 6 -type f -name wasm_exec.js -print -quit 2>/dev/null || true)"
fi

if [ -n "$FOUND" ] && [ -f "$FOUND" ]; then
  echo "[build] Copying wasm_exec.js from: $FOUND"
  cp -f "$FOUND" "$WASM_EXEC_DEST"
  echo "[build] Copied to $WASM_EXEC_DEST"
else
  echo "WARNING: Could not automatically locate wasm_exec.js in GOROOT ($GOROOT)." >&2
  echo "You must copy wasm_exec.js from your Go installation into: $WASM_EXEC_DEST" >&2
  echo "Common locations include:" >&2
  echo "  \$GOROOT/lib/wasm/wasm_exec.js" >&2
  echo "  \$GOROOT/misc/wasm/wasm_exec.js" >&2
  echo "If you installed Go via a package manager, search your Go root for wasm_exec.js and copy it." >&2
  echo "Continuing without wasm_exec.js; the app may still run if you provide wasm_exec.js manually." >&2
fi

echo "[build] Building server binary -> $SERVER_BIN"
"$GO_CMD" build -o "$SERVER_BIN" .
echo "[build] Built $SERVER_BIN"

if [ "${NO_RUN:-}" = "1" ]; then
  echo "[build] NO_RUN=1 set; build complete. Artifacts:"
  echo "  - $WASM_OUT"
  [ -f "$WASM_EXEC_DEST" ] && echo "  - $WASM_EXEC_DEST" || echo "  - $WASM_EXEC_DEST (missing)"
  echo "  - $SERVER_BIN"
  exit 0
fi

echo "[build] Starting server ($SERVER_BIN). Press Ctrl+C to stop."
# Use exec so that the server receives signals directly
exec "$SERVER_BIN"
