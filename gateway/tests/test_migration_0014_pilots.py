import pytest
from sqlalchemy import create_engine, text
import os

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_pilot_table_exists_with_columns():
    engine = create_engine(DSN)
    with engine.connect() as c:
        rows = c.execute(text("""
            select column_name from information_schema.columns
            where table_name = 'pilot' order by ordinal_position
        """)).fetchall()
    cols = {r[0] for r in rows}
    assert {'id','slug','domain','level','version','owner_id','facilitator_id',
            'parent_id','language','tenant_id','created_at','updated_at'} <= cols


def test_pilot_level_check_constraint():
    engine = create_engine(DSN)
    with engine.connect() as c, c.begin():
        with pytest.raises(Exception):
            c.execute(text("""
              insert into pilot (slug, domain, level, tenant_id)
              values ('x','x','BOGUS','gdai-default')
            """))


def test_pilot_rls_enabled():
    engine = create_engine(DSN)
    with engine.connect() as c:
        row = c.execute(text("""
          select rowsecurity from pg_tables where tablename='pilot'
        """)).fetchone()
    assert row[0] is True
