import pytest
from uuid import uuid4
from gateway.hermes.concern_tracker import (
    add_concern,
    ack_concern,
    resolve_concern,
    list_open_concerns,
    has_critical_open,
)


def _new_pilot(db):
    pid = uuid4()
    db.execute(
        "insert into pilot (id, slug, domain, tenant_id) values (%s,'cn1','t','gdai-default')",
        (pid,),
    )
    db.commit()
    return pid


def test_add_creates_open_concern(db_session):
    pid = _new_pilot(db_session)
    c = add_concern(
        db_session,
        pilot_id=pid,
        severity='warning',
        title='SLA risk',
        body='90s tight',
        origin_movement='iii',
        tenant_id='gdai-default',
    )
    assert c.status == 'open' and c.severity == 'warning'


def test_critical_concern_blocks_via_has_critical_open(db_session):
    pid = _new_pilot(db_session)
    add_concern(
        db_session,
        pilot_id=pid,
        severity='critical',
        title='RGPD violation',
        body='',
        origin_movement='iii',
        tenant_id='gdai-default',
    )
    assert has_critical_open(db_session, pilot_id=pid, tenant_id='gdai-default') is True


def test_ack_only_for_info_or_warning_not_critical(db_session):
    pid = _new_pilot(db_session)
    crit = add_concern(
        db_session,
        pilot_id=pid,
        severity='critical',
        title='X',
        body='',
        origin_movement='iii',
        tenant_id='gdai-default',
    )
    with pytest.raises(ValueError):
        ack_concern(db_session, concern_id=crit.id, tenant_id='gdai-default')


def test_resolve_clears_critical(db_session):
    pid = _new_pilot(db_session)
    crit = add_concern(
        db_session,
        pilot_id=pid,
        severity='critical',
        title='X',
        body='',
        origin_movement='iii',
        tenant_id='gdai-default',
    )
    resolve_concern(
        db_session,
        concern_id=crit.id,
        resolution_artifact_id=None,
        tenant_id='gdai-default',
    )
    assert has_critical_open(db_session, pilot_id=pid, tenant_id='gdai-default') is False


def test_list_open_orders_critical_first(db_session):
    pid = _new_pilot(db_session)
    add_concern(
        db_session,
        pilot_id=pid,
        severity='info',
        title='i',
        body='',
        origin_movement='i',
        tenant_id='gdai-default',
    )
    add_concern(
        db_session,
        pilot_id=pid,
        severity='critical',
        title='c',
        body='',
        origin_movement='ii',
        tenant_id='gdai-default',
    )
    add_concern(
        db_session,
        pilot_id=pid,
        severity='warning',
        title='w',
        body='',
        origin_movement='iii',
        tenant_id='gdai-default',
    )
    open_ = list_open_concerns(db_session, pilot_id=pid, tenant_id='gdai-default')
    assert [c.severity for c in open_] == ['critical', 'warning', 'info']
