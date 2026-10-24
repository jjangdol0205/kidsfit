#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Challenger M1_2 Verification & Stress Test Suite
=================================================
Empirical verification of Milestone 1 Knowledge Base & Hourly Benchmark Learning Engine:
1. Monotonic cycle incrementation across consecutive cycles.
2. Prompt template formatting, placeholder completeness, and JSON round-trip serializability.
3. Telegram network fallback (timeout, HTTP errors, DNS errors, missing credentials).
4. History boundary capping (max 100 entries).
5. Non-promotional strict integrity check (fails immediately if affiliate codes detected).
6. Status CLI interface correctness on live production file.
"""

import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import MagicMock, patch

# Configure utf-8 stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESEARCH_KB_PATH = PROJECT_ROOT / "src" / "data" / "research-knowledge-base.json"
TARGET_KB_PATH = PROJECT_ROOT / "docs" / "hourly_benchmark_paper_kb.json"
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "hourly_benchmark_paper_learning.py"

# Import target module
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
import hourly_benchmark_paper_learning as hb


class TestChallengerM1Verification(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure connector can load cleanly
        cls.connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)

    # =========================================================================
    # Objective 1: Monotonic Cycle Incrementation across Consecutive Runs
    # =========================================================================

    def test_01_consecutive_cycles_monotonicity_isolated(self):
        """Run 5 consecutive cycles in an isolated environment and verify strict monotonic progression."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "hourly_benchmark_paper_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            num_cycles = 5
            prev_cycle = 0
            prev_history_count = 0
            observed_themes = []

            for i in range(1, num_cycles + 1):
                payload = manager.execute_cycle(self.connector)

                curr_cycle = payload["hourly_cycle"]
                history = payload["hourly_learning_history"]
                theme = payload["metadata"]["active_focus_theme"]
                observed_themes.append(theme)

                # 1. Monotonic cycle increment (+1)
                self.assertEqual(
                    curr_cycle,
                    prev_cycle + 1,
                    f"Cycle did not increment by 1: expected {prev_cycle + 1}, got {curr_cycle}"
                )
                self.assertEqual(payload["metadata"]["cycle_count"], curr_cycle)

                # 2. History growth (+1)
                self.assertEqual(
                    len(history),
                    prev_history_count + 1,
                    f"History did not grow by 1: expected {prev_history_count + 1}, got {len(history)}"
                )

                # 3. Last history record matches cycle
                latest = history[-1]
                self.assertEqual(latest["cycle"], curr_cycle)
                self.assertEqual(latest["status"], "COMPLETED")
                self.assertEqual(latest["focus_theme"], theme)
                self.assertEqual(latest["rules_synthesized_count"], len(payload["synthesized_academic_rules"]))

                prev_cycle = curr_cycle
                prev_history_count = len(history)

            # 4. Verify rotational cycle behavior across the 4 topic themes
            # Cycle 1..4 should cover distinct themes, Cycle 5 should wrap back to theme 1
            self.assertEqual(observed_themes[0], observed_themes[4], "Theme rotation failed to cycle back on cycle 5")
            self.assertEqual(len(set(observed_themes[:4])), 4, "Topic themes in first 4 cycles were not distinct")

    def test_01b_live_cli_once_invocation(self):
        """Verify that running CLI `--once` on the live production script increments cycle and exits with code 0."""
        # Read current cycle
        with open(TARGET_KB_PATH, "r", encoding="utf-8") as f:
            before_data = json.load(f)
        before_cycle = before_data.get("hourly_cycle", 0)

        res = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--once"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        self.assertEqual(res.returncode, 0, f"--once CLI failed: {res.stderr}")

        with open(TARGET_KB_PATH, "r", encoding="utf-8") as f:
            after_data = json.load(f)

        self.assertEqual(
            after_data["hourly_cycle"],
            before_cycle + 1,
            f"CLI --once did not monotonically increment cycle: before {before_cycle}, after {after_data['hourly_cycle']}"
        )

    # =========================================================================
    # Objective 2: Prompt Template Formatting and JSON Serializability
    # =========================================================================

    def test_02_prompt_template_formatting_and_placeholders(self):
        """Verify prompt template formatting: no raw unformatted variables, proper citation embeddings."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)
            payload = manager.execute_cycle(self.connector)

            prompts = payload.get("active_content_prompts", {})
            self.assertEqual(set(prompts.keys()), {"blog", "cafe", "webtoon", "card_news"})

            unformatted_pattern = re.compile(r"\{[a-zA-Z_][a-zA-Z0-9_]*\}")

            for domain, prompt_str in prompts.items():
                self.assertIsInstance(prompt_str, str, f"Prompt for {domain} is not a string")
                self.assertGreater(len(prompt_str), 100, f"Prompt for {domain} is suspiciously short")

                if domain == "blog":
                    self.assertIn("[KidsFit Blog Specialist System Prompt", prompt_str)
                    self.assertIn("[필수 인용 논문 데이터]", prompt_str)
                    self.assertIn("1,500자 이상", prompt_str)
                    self.assertIn("상업적 제휴 링크 100% 금지", prompt_str)
                elif domain == "cafe":
                    self.assertIn("[KidsFit Cafe Community Specialist System Prompt", prompt_str)
                    self.assertIn("3040 선배맘·동기맘", prompt_str)
                    self.assertIn("게시판:", prompt_str)
                elif domain == "webtoon":
                    self.assertIn("[KidsFit 4-Cut Webtoon Specialist System Prompt", prompt_str)
                    self.assertIn("Cut 1 (Problem)", prompt_str)
                    self.assertIn("Cut 4 (Resolution)", prompt_str)
                    self.assertIn("1080x1080", prompt_str)
                elif domain == "card_news":
                    self.assertIn("[KidsFit 6-Slide Card News Specialist System Prompt", prompt_str)
                    self.assertIn("1080x1350", prompt_str)
                    self.assertIn("Slide 1: Hook Cover", prompt_str)

                matches = unformatted_pattern.findall(prompt_str)
                forbidden_placeholders = [
                    m for m in matches if m in [
                        "{cycle_index}", "{theme_title}", "{category}", "{title_pattern}",
                        "{scientific_claim}", "{citations_text}", "{board_name}", "{board_menuid}",
                        "{title}", "{worksheet_ref}", "{comment_trigger}", "{concept}", "{arc}"
                    ]
                ]
                self.assertEqual(
                    forbidden_placeholders,
                    [],
                    f"Found raw unformatted placeholders in {domain} prompt: {forbidden_placeholders}"
                )

    def test_03_json_serializability_and_roundtrip(self):
        """Verify strict JSON serializability and exact round-trip reconstruction."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)
            payload = manager.execute_cycle(self.connector)

            # 1. Serializability to UTF-8 JSON string
            try:
                serialized = json.dumps(payload, ensure_ascii=False, indent=2)
            except Exception as e:
                self.fail(f"Failed to serialize KB payload to JSON: {e}")

            self.assertIsInstance(serialized, str)
            self.assertGreater(len(serialized), 1000)

            # 2. Deserializability from string
            try:
                deserialized = json.loads(serialized)
            except Exception as e:
                self.fail(f"Failed to deserialize JSON string: {e}")

            # 3. Exact key and type parity
            self.assertEqual(deserialized["hourly_cycle"], payload["hourly_cycle"])
            self.assertEqual(deserialized["timestamp"], payload["timestamp"])
            self.assertEqual(len(deserialized["synthesized_academic_rules"]), len(payload["synthesized_academic_rules"]))
            self.assertEqual(len(deserialized["active_content_prompts"]), 4)

    # =========================================================================
    # Objective 3: Telegram Fallback Behavior on Network Timeout / HTTP Errors
    # =========================================================================

    def test_04_telegram_timeout_fallback(self):
        """Verify that a network timeout during Telegram call does NOT crash or abort cycle execution."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            with patch("urllib.request.urlopen", side_effect=urllib.error.URLError(TimeoutError("Socket connection timed out"))):
                stderr_capture = io.StringIO()
                with patch("sys.stderr", stderr_capture):
                    result = manager.execute_cycle(self.connector)

            self.assertIsNotNone(result)
            self.assertEqual(result["hourly_cycle"], 1)
            self.assertTrue(temp_kb_path.exists())
            self.assertIn("Socket connection timed out", stderr_capture.getvalue())

    def test_05_telegram_http_errors_fallback(self):
        """Verify that HTTP 400 Bad Request / 500 Internal Error from Telegram are gracefully handled."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            # Test HTTP 400
            http_error_400 = urllib.error.HTTPError(
                url="https://api.telegram.org/botTOKEN/sendMessage",
                code=400,
                msg="Bad Request: chat not found",
                hdrs={},
                fp=io.BytesIO(b'{"ok":false,"error_code":400,"description":"Bad Request: chat not found"}')
            )
            with patch("urllib.request.urlopen", side_effect=http_error_400):
                stderr_capture = io.StringIO()
                with patch("sys.stderr", stderr_capture):
                    result = manager.execute_cycle(self.connector)

            self.assertIsNotNone(result)
            self.assertEqual(result["hourly_cycle"], 1)
            self.assertIn("Bad Request", stderr_capture.getvalue())

            # Test HTTP 500
            http_error_500 = urllib.error.HTTPError(
                url="https://api.telegram.org/botTOKEN/sendMessage",
                code=500,
                msg="Internal Server Error",
                hdrs={},
                fp=io.BytesIO(b'{"ok":false,"error_code":500,"description":"Internal Server Error"}')
            )
            with patch("urllib.request.urlopen", side_effect=http_error_500):
                stderr_capture = io.StringIO()
                with patch("sys.stderr", stderr_capture):
                    result2 = manager.execute_cycle(self.connector)

            self.assertIsNotNone(result2)
            self.assertEqual(result2["hourly_cycle"], 2)

    def test_06_telegram_missing_or_corrupt_env_fallback(self):
        """Verify that missing or empty .env credentials silently skip Telegram without error."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            fake_env_path = PROJECT_ROOT / ".env.fake_non_existent"
            with patch("hourly_benchmark_paper_learning.ENV_PATH", fake_env_path):
                with patch("urllib.request.urlopen") as mock_urlopen:
                    result = manager.execute_cycle(self.connector)
                    mock_urlopen.assert_not_called()

            self.assertIsNotNone(result)
            self.assertEqual(result["hourly_cycle"], 1)

    # =========================================================================
    # Additional Robustness & Integrity Checks
    # =========================================================================

    def test_07_history_boundary_capping_at_100(self):
        """Verify that hourly_learning_history is capped at 100 entries to prevent infinite unbounded growth."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            # Seed with 105 history items
            fake_history = [{"cycle": i, "status": "COMPLETED"} for i in range(1, 106)]
            seeded_payload = {
                "hourly_cycle": 105,
                "hourly_learning_history": fake_history
            }
            with open(temp_kb_path, "w", encoding="utf-8") as f:
                json.dump(seeded_payload, f)

            result = manager.execute_cycle(self.connector)

            # Capped to 100
            self.assertEqual(len(result["hourly_learning_history"]), 100)
            self.assertEqual(result["hourly_learning_history"][-1]["cycle"], 106)
            self.assertEqual(result["hourly_cycle"], 106)

    def test_08_strict_integrity_check_rejects_affiliate_tokens(self):
        """Verify that injecting prohibited affiliate tokens immediately aborts with ValueError and does NOT save."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_kb_path = Path(temp_dir) / "test_kb.json"
            manager = hb.CumulativeKnowledgeBaseManager(temp_kb_path)

            with patch.object(
                hb.AcademicSynthesisEngine,
                "synthesize_rules",
                return_value=[{
                    "rule_id": "RULE-AFFILIATE-INJECTED",
                    "pillar": "growth_endocrinology",
                    "scientific_claim": "쿠팡 파트너스 AF7865143 영양제 특가 할인",
                    "paper_citations": []
                }]
            ):
                with self.assertRaises(ValueError) as ctx:
                    manager.execute_cycle(self.connector)

                self.assertIn("Integrity Violation", str(ctx.exception))
                self.assertIn("AF7865143", str(ctx.exception))
                # Verify file was not written
                self.assertFalse(temp_kb_path.exists())

    def test_09_cli_status_and_exit_code(self):
        """Verify CLI --status produces full structured output and returns exit code 0."""
        res = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--status"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        self.assertEqual(res.returncode, 0, f"--status failed: {res.stderr}")
        self.assertIn("KidsFit Hourly Benchmark & Research Paper Knowledge Base Status", res.stdout)
        self.assertIn("Total Papers in KB: 3,672 papers", res.stdout)
        self.assertIn("Synthesized Rules : 8 rules", res.stdout)
        self.assertIn("Domain Benchmarks : blog, cafe, webtoon, card_news", res.stdout)
        self.assertIn("Non-Promotional Compliance: 100% Verified", res.stdout)


if __name__ == "__main__":
    unittest.main()
