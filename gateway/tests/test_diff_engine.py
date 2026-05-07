import pytest
from uuid import uuid4
from gateway.hermes.diff_engine import (
    propose_diff,
    accept_proposal,
    reject_proposal,
    list_pending_proposals,
)


@pytest.fixture
def pilot_with_artifact(db_session):
    pilot_id = uuid4()
    artifact_id = uuid4()
    db_session.execute(
        "insert into pilot (id, slug, domain, tenant_id) values (%s,'p','test','gdai-default')",
        (pilot_id,),
    )
    db_session.execute(
        """
        insert into pilot_artifact (id, pilot_id, kind, content, created_by, tenant_id)
        values (%s, %s, 'persona', '{"name":"Sophie"}', 'companion', 'gdai-default')
        """,
        (artifact_id, pilot_id),
    )
    db_session.commit()
    return (pilot_id, artifact_id)


def test_propose_diff_creates_pending_row(db_session, pilot_with_artifact):
    pilot_id, artifact_id = pilot_with_artifact
    proposal = propose_diff(
        db_session,
        pilot_id=pilot_id,
        artifact_id=artifact_id,
        artifact_kind='persona',
        version_from=1,
        proposed_content={'name': 'Sophie M.'},
        rationale='Surname adds clarity',
        citations=[],
        originating_message_id=None,
        tenant_id='gdai-default',
    )
    assert proposal.status == 'pending'
    assert proposal.proposed_content == {'name': 'Sophie M.'}


def test_accept_writes_new_artifact_version_and_marks_accepted(
    db_session, pilot_with_artifact
):
    pilot_id, artifact_id = pilot_with_artifact
    p = propose_diff(
        db_session,
        pilot_id=pilot_id,
        artifact_id=artifact_id,
        artifact_kind='persona',
        version_from=1,
        proposed_content={'name': 'Sophie M.'},
        rationale='x',
        citations=[],
        originating_message_id=None,
        tenant_id='gdai-default',
    )
    accept_proposal(
        db_session,
        proposal_id=p.id,
        decided_by=uuid4(),
        tenant_id='gdai-default',
    )
    rows = db_session.execute(
        "select version, content from pilot_artifact where id=%s order by version desc",
        (artifact_id,),
    ).fetchall()
    assert rows[0][0] == 2
    assert rows[0][1] == {'name': 'Sophie M.'}
    status = db_session.execute(
        "select status from artifact_proposal where id=%s", (p.id,)
    ).scalar_one()
    assert status == 'accepted'


def test_reject_marks_rejected_no_artifact_change(db_session, pilot_with_artifact):
    pilot_id, artifact_id = pilot_with_artifact
    p = propose_diff(
        db_session,
        pilot_id=pilot_id,
        artifact_id=artifact_id,
        artifact_kind='persona',
        version_from=1,
        proposed_content={'name': 'X'},
        rationale='x',
        citations=[],
        originating_message_id=None,
        tenant_id='gdai-default',
    )
    reject_proposal(
        db_session,
        proposal_id=p.id,
        decided_by=uuid4(),
        tenant_id='gdai-default',
    )
    versions = db_session.execute(
        "select count(*) from pilot_artifact where id=%s", (artifact_id,)
    ).scalar_one()
    assert versions == 1


def test_list_pending_returns_only_pending(db_session, pilot_with_artifact):
    pilot_id, _ = pilot_with_artifact
    pending = list_pending_proposals(
        db_session, pilot_id=pilot_id, tenant_id='gdai-default'
    )
    assert all(p.status == 'pending' for p in pending)
