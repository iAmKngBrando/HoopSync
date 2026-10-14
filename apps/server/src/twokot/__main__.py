"""Run the server: `uv run python -m twokot` (add --port to change the port)."""

from __future__ import annotations

import argparse

import uvicorn

from .api import create_app
from .config import DEFAULT_PORT


def main() -> None:
    parser = argparse.ArgumentParser(description="2KOT local server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    # Bound to loopback only: this is a single-user local service with no auth.
    uvicorn.run(create_app(), host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
