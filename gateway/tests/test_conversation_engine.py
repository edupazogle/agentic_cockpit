import pytest
from gateway.hermes.conversation_engine import assemble_prompt, AssembledPrompt


def test_assemble_includes_all_three_layers():
    p = assemble_prompt(
        level='l0_build',
        movement='i',
        recent_messages=[{'role': 'user', 'content': 'Bonjour'}],
        artifacts_summary='3 personas, 8 journey nodes',
        pane_state={'current_movement': 'i'},
    )
    assert isinstance(p, AssembledPrompt)
    assert 'CHARTER' in p.system
    assert 'L0_BUILD' in p.system
    assert 'STEP1_PERSONAS' in p.system
    assert any(m['role'] == 'user' for m in p.messages)


def test_assemble_unknown_movement_raises():
    with pytest.raises(ValueError):
        assemble_prompt(
            level='l0_build',
            movement='zz',
            recent_messages=[],
            artifacts_summary='',
            pane_state={},
        )


def test_assemble_unknown_level_raises():
    with pytest.raises(ValueError):
        assemble_prompt(
            level='lzz',
            movement='i',
            recent_messages=[],
            artifacts_summary='',
            pane_state={},
        )


def test_assemble_includes_artifacts_summary_in_context():
    p = assemble_prompt(
        level='l0_build',
        movement='ii',
        recent_messages=[],
        artifacts_summary='12 citations stream',
        pane_state={},
    )
    assert '12 citations stream' in p.system
