import pytest
import os
from sqlalchemy import create_engine, text

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_status_check_rejects_unknown():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('prop1','test','gdai-default') returning id
        """)).scalar_one()
        with pytest.raises(Exception):
            c.execute(text("""
              insert into artifact_proposal (pilot_id, artifact_kind, proposed_content, status, tenant_id)
              values (:p, 'persona', '{}', 'BOGUS', 'gdai-default')
            """), {'p': pilot_id})
