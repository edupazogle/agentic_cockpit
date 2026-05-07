import pytest
import os
from sqlalchemy import create_engine, text

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_pilot_module_columns():
    e = create_engine(DSN)
    with e.connect() as c:
        cols = {r[0] for r in c.execute(text("""
            select column_name from information_schema.columns
            where table_name='pilot_module'
        """)).fetchall()}
    assert {'id','pilot_id','uc_code','slug','agent_name','risk_level',
            'kyc_level','has_payment','status','agent_id','gateway_url',
            'module_spec','tenant_id'} <= cols


def test_pilot_module_unique_uc_per_pilot():
    e = create_engine(DSN)
    pilot_id = None
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('p1','test','gdai-default') returning id
        """)).scalar_one()
        c.execute(text("""
          insert into pilot_module (pilot_id, uc_code, slug, tenant_id)
          values (:p, 'UC-01', 'attestation', 'gdai-default')
        """), {'p': pilot_id})
        with pytest.raises(Exception):
            c.execute(text("""
              insert into pilot_module (pilot_id, uc_code, slug, tenant_id)
              values (:p, 'UC-01', 'duplicate', 'gdai-default')
            """), {'p': pilot_id})
