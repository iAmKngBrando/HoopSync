"""Runtime settings, overridable through environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_PORT = 8787


@dataclass(frozen=True)
class Settings:
    data_dir: Path

    @property
    def db_path(self) -> Path:
        return self.data_dir / "2kot.db"

    @property
    def frames_dir(self) -> Path:
        return self.data_dir / "frames"

    def ensure_dirs(self) -> None:
        self.frames_dir.mkdir(parents=True, exist_ok=True)


def load_settings() -> Settings:
    """Data lives in ~/.2kot unless TWOKOT_DATA_DIR points elsewhere."""
    data_dir = os.environ.get("TWOKOT_DATA_DIR")
    return Settings(data_dir=Path(data_dir).expanduser() if data_dir else Path.home() / ".2kot")
