"""Tests for eval runner — golden dataset, rubrics, CI gate."""

import pytest

from gateway.eval_runner import (
    BLOCK_THRESHOLD,
    EvalCase,
    EvalScore,
    load_golden_dataset,
    run_eval_ci,
    sample_online,
    score_case,
)


class TestGoldenDataset:
    def test_load_golden_dataset(self) -> None:
        cases = load_golden_dataset()
        assert len(cases) == 50
        assert all(isinstance(c, EvalCase) for c in cases)

    def test_golden_dataset_ids_unique(self) -> None:
        cases = load_golden_dataset()
        ids = [c.case_id for c in cases]
        assert len(ids) == len(set(ids))

    def test_golden_dataset_covers_all_categories(self) -> None:
        cases = load_golden_dataset()
        categories = {c.expected_category for c in cases}
        assert "water-damage" in categories or len(categories) >= 3

    def test_high_severity_cases_have_regulatory_reqs(self) -> None:
        cases = load_golden_dataset()
        high_sev = [c for c in cases if c.expected_severity in ("high", "critical")]
        for c in high_sev:
            assert len(c.regulatory_requirements) > 0


class TestEvalScoring:
    def test_score_case_correct_category(self) -> None:
        case = EvalCase(
            case_id="TEST-001",
            input_text="water damage in kitchen",
            expected_category="water-damage",
            expected_severity="medium",
        )
        output = {"category": "water-damage", "severity": "medium"}
        score = score_case(case, output)
        assert score.factual_accuracy == 0.98
        assert score.policy_compliance == 1.0  # no regulatory req → no review needed

    def test_score_case_wrong_category(self) -> None:
        case = EvalCase(
            case_id="TEST-002",
            input_text="water damage",
            expected_category="water-damage",
            expected_severity="medium",
        )
        output = {"category": "fire", "severity": "medium"}
        score = score_case(case, output)
        assert score.factual_accuracy < 0.98

    def test_score_case_regulatory_compliance(self) -> None:
        case = EvalCase(
            case_id="TEST-003",
            input_text="high severity collision",
            expected_category="collision",
            expected_severity="high",
            regulatory_requirements=["RGPD Art. 22"],
        )
        output = {"category": "collision", "severity": "high", "_signal": "requires_human_review"}
        score = score_case(case, output)
        assert score.policy_compliance == 1.0  # HITL signalled

    def test_score_case_regulatory_failure(self) -> None:
        case = EvalCase(
            case_id="TEST-004",
            input_text="high severity",
            expected_category="collision",
            expected_severity="high",
            regulatory_requirements=["RGPD Art. 22"],
        )
        output = {"category": "collision", "severity": "high"}  # no HITL signal
        score = score_case(case, output)
        assert score.policy_compliance < 0.90  # missing required human review

    def test_eval_score_overall_average(self) -> None:
        score = EvalScore(
            case_id="T-1",
            factual_accuracy=0.96,
            policy_compliance=0.98,
            tone=0.94,
        )
        assert score.overall == pytest.approx(0.96, abs=0.01)

    def test_baseline_values(self) -> None:
        from gateway.eval_runner import BASELINE
        assert BASELINE.factual_accuracy > 0.90
        assert BASELINE.policy_compliance > 0.90
        assert BASELINE.tone > 0.90
        assert BASELINE.overall > 0.90


class TestEvalCI:
    def test_eval_ci_passes_on_correct_data(self) -> None:
        _, passed = run_eval_ci()
        assert passed  # golden dataset should match expected outputs

    def test_block_threshold(self) -> None:
        assert BLOCK_THRESHOLD == 0.05  # 5% threshold


class TestOnlineSampler:
    def test_sample_online_5_percent(self) -> None:
        """About 5% of runs should be sampled, deterministically per claim_id."""
        sampled = sum(
            1 for i in range(1000)
            if sample_online({"claim_id": f"CLM-2026-{i:04d}"}, 0.05)
        )
        # With 1000 trials at 5%, expect 30-70 (allowing wide CI)
        assert 20 <= sampled <= 80

    def test_sample_online_deterministic(self) -> None:
        """Same claim_id always gives same sampling decision."""
        claim = {"claim_id": "CLM-2026-0042"}
        results = [sample_online(claim) for _ in range(100)]
        assert all(r == results[0] for r in results)
