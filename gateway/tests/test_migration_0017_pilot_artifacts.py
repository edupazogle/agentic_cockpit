import pytest
import os
from sqlalchemy import create_engine, text

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_kind_check_rejects_unknown():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('art1','test','gdai-default') returning id
        """)).scalar_one()
        with pytest.raises(Exception):
            c.execute(text("""
              insert into pilot_artifact (pilot_id, kind, content, created_by, tenant_id)
              values (:p, 'BOGUS', '{}', 'companion', 'gdai-default')
            """), {'p': pilot_id})


def test_kind_check_accepts_module_spec():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('art2','test','gdai-default') returning id
        """)).scalar_one()
        c.execute(text("""
          insert into pilot_artifact (pilot_id, kind, content, created_by, tenant_id)
          values (:p, 'module_spec', '{"uc_code":"UC-01"}', 'companion', 'gdai-default')
        """), {'p': pilot_id})
