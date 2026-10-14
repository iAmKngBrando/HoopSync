import pytest
from fastapi.testclient import TestClient

from twokot.api import create_app
from twokot.config import Settings
from twokot.db import Store, connect


@pytest.fixture
def store(tmp_path):
    return Store(connect(tmp_path / "test.db"))


@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(Settings(data_dir=tmp_path)))
