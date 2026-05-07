import pytest
import json
from uuid import uuid4
from gateway.hermes.adaptive_questions import (
    eval_exit_criteria,
    ExitCriteriaResult,
)


def _new_pilot(db):
    pid = uuid4()
    db.execute(
        "insert into pilot (id, slug, domain, tenant_id) values (%s,'eq1','t','gdai-default')",
        (pid,),
    )
    db.commit()
    return pid


def _add_persona(db, pilot_id, name):
    db.execute(
        """
        insert into pilot_artifact (pilot_id, kind, content, created_by, tenant_id)
        values (%s, 'persona', %s::jsonb, 'companion', 'gdai-default')
        """,
        (pilot_id, json.dumps({'name': name})),
    )
    db.commit()


def test_movement_i_returns_missing_when_zero_personas(db_session):
    pid = _new_pilot(db_session)
    res = eval_exit_criteria(
        db_session, pilot_id=pid, movement='i', tenant_id='gdai-default'
    )
    assert res.met is False
    assert any('personas_min' in m['id'] for m in res.missing)
    assert len(res.suggested_questions) >= 1


def test_movement_i_met_when_three_personas_and_eight_journey_nodes(db_session):
    pid = _new_pilot(db_session)
    for n in ('A', 'B', 'C'):
        _add_persona(db_session, pid, n)
    for i in range(8):
        db_session.execute(
            """
            insert into pilot_artifact (pilot_id, kind, content, created_by, tenant_id)
            values (%s, 'journey_node', %s::jsonb, 'companion', 'gdai-default')
            """,
            (
                pid,
                json.dumps({'actor': 'A', 'action': f'step{i}', 'tool_used': 'X'}),
            ),
        )
    db_session.commit()
    res = eval_exit_criteria(
        db_session, pilot_id=pid, movement='i', tenant_id='gdai-default'
    )
    assert res.met is True
    assert res.missing == []


def test_returns_unknown_movement_error():
    with pytest.raises(ValueError):
        eval_exit_criteria(None, pilot_id=uuid4(), movement='x', tenant_id='gdai-default')
