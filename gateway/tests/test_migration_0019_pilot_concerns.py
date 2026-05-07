import pytest
import os
from sqlalchemy import create_engine, text

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_severity_and_status_checks():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('con1','test','gdai-default') returning id
        """)).scalar_one()
        with pytest.raises(Exception):
            c.execute(text("""
              insert into pilot_concern (pilot_id, severity, title, tenant_id)
              values (:p, 'BOGUS', 't', 'gdai-default')
            """), {'p': pilot_id})
        with pytest.raises(Exception):
            c.execute(text("""
              insert into pilot_concern (pilot_id, severity, title, status, tenant_id)
              values (:p, 'info', 't', 'BOGUS', 'gdai-default')
            """), {'p': pilot_id})
