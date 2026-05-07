import pytest
import os
from sqlalchemy import create_engine, text

DSN = os.environ.get("SUPABASE_TEST_DSN")
pytestmark = pytest.mark.skipif(not DSN, reason="SUPABASE_TEST_DSN not set")


def test_one_thread_per_pilot():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('chat1','test','gdai-default') returning id
        """)).scalar_one()
        c.execute(text("insert into chat_thread (pilot_id, tenant_id) values (:p, 'gdai-default')"),
                  {'p': pilot_id})
        with pytest.raises(Exception):
            c.execute(text("insert into chat_thread (pilot_id, tenant_id) values (:p, 'gdai-default')"),
                      {'p': pilot_id})


def test_chat_message_role_check():
    e = create_engine(DSN)
    with e.connect() as c, c.begin():
        pilot_id = c.execute(text("""
          insert into pilot (slug, domain, tenant_id) values ('chat2','test','gdai-default') returning id
        """)).scalar_one()
        thread_id = c.execute(text("""
          insert into chat_thread (pilot_id, tenant_id) values (:p, 'gdai-default') returning id
        """), {'p': pilot_id}).scalar_one()
        with pytest.raises(Exception):
            c.execute(text("""
              insert into chat_message (thread_id, role, content, tenant_id)
              values (:t, 'BOGUS', '{}', 'gdai-default')
            """), {'t': thread_id})
