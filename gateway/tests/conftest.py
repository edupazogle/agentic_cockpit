# gateway/tests/conftest.py
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db_session():
    dsn = os.environ.get("SUPABASE_TEST_DSN")
    if not dsn:
        pytest.skip("SUPABASE_TEST_DSN not set")
    engine = create_engine(dsn, future=True)
    Session = sessionmaker(bind=engine, future=True)
    s = Session()
    try:
        s.execute("set local role service_role")
        yield s
        s.rollback()
    finally:
        s.close()
