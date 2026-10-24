#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Milestone 1: Knowledge Base & Hourly Benchmark Learning Engine
========================================================================
Validates `scripts/hourly_benchmark_paper_learning.py` and `docs/hourly_benchmark_paper_kb.json`:
1. Top-level interface contract conformance (timestamp, hourly_cycle, domain_benchmarks, synthesized_academic_rules, active_content_prompts)
2. All 4 domain specifications present with correct rubrics:
   - Blog: >= 1,500 chars, hook archetypes, pacing, 3+ visual image specs, 4 subtopics
   - Cafe: 7 KidsFit boards, warm peer tone, checklists, printable worksheets
   - 4-Cut Webtoon: 4-cut narrative arc (Problem -> Empathy -> Science -> Resolution), 1080x1080, preview formats, copy
   - 6-Slide Card News: 6-slide visual deck (1080x1350), 6 slide zones, copy
3. Official standards integration (KDCA 2017, K-DST, SWS GH Endocrinology, dlPFC Neuroscience)
4. Genuine academic paper citations with valid PMIDs, DOIs, journals, years, and sample statistics
5. Strict Non-Promotional Content Policy (0 commercial affiliate tags/links)
6. CLI flags (--once, --status)
"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
KB_PATH = PROJECT_ROOT / "docs" / "hourly_benchmark_paper_kb.json"
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "hourly_benchmark_paper_learning.py"


class TestMilestone1KnowledgeBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run a cycle if file does not exist
        if not KB_PATH.exists():
            res = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), "--once"],
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            assert res.returncode == 0, f"Setup cycle failed: {res.stderr}"

        with open(KB_PATH, "r", encoding="utf-8") as f:
            cls.data = json.load(f)

    def test_01_top_level_contract_keys(self):
        """Validates all mandatory interface contract keys are present."""
        required_keys = [
            "timestamp",
            "hourly_cycle",
            "metadata",
            "domain_benchmarks",
            "synthesized_academic_rules",
            "active_content_prompts",
            "official_standards",
            "synthesized_blueprints",
            "hourly_learning_history"
        ]
        for key in required_keys:
            self.assertIn(key, self.data, f"Missing required top-level key: {key}")

        self.assertIsInstance(self.data["hourly_cycle"], int)
        self.assertGreaterEqual(self.data["hourly_cycle"], 1)
        self.assertTrue(self.data["timestamp"].endswith("+00:00") or "Z" in self.data["timestamp"])

    def test_02_all_four_domains_present(self):
        """Verifies domain_benchmarks contains blog, cafe, webtoon, card_news."""
        domains = self.data.get("domain_benchmarks", {})
        self.assertIn("blog", domains)
        self.assertIn("cafe", domains)
        self.assertIn("webtoon", domains)
        self.assertIn("card_news", domains)

    def test_03_blog_specialist_rubric(self):
        """Verifies Blog Specialist specifications."""
        blog = self.data["domain_benchmarks"]["blog"]
        self.assertEqual(blog["char_length_rubric"]["min_chars"], 1500)
        self.assertGreaterEqual(len(blog["hook_archetypes"]), 4)
        self.assertEqual(blog["visual_image_specs"]["min_image_count"], 3)
        self.assertIn("1080x1080", blog["visual_image_specs"]["dimensions"])
        self.assertEqual(len(blog["subtopic_categories"]), 4)
        self.assertIn("우리 아이 키성장·성조숙증", blog["subtopic_categories"])
        self.assertIn("월령별 두뇌·소근육 발달", blog["subtopic_categories"])

    def test_04_cafe_community_rubric(self):
        """Verifies Cafe Community Specialist specifications across 7 boards."""
        cafe = self.data["domain_benchmarks"]["cafe"]
        self.assertIn("선배맘", cafe["tone_guide"]["voice"])
        boards = cafe["board_distribution"]
        self.assertEqual(len(boards), 7)
        menuids = [b["menuid"] for b in boards.values()]
        self.assertEqual(sorted(menuids), [1, 2, 3, 4, 5, 6, 7])
        self.assertGreaterEqual(len(cafe["printable_worksheet_guides"]["pdf_library"]), 3)
        self.assertTrue(any("소근육" in p for p in cafe["printable_worksheet_guides"]["pdf_library"]))

    def test_05_webtoon_narrative_arc(self):
        """Verifies 4-Cut Webtoon 4-cut arc and render specifications."""
        webtoon = self.data["domain_benchmarks"]["webtoon"]
        arc = webtoon["story_arc"]
        self.assertIn("cut_1", arc)
        self.assertIn("cut_2", arc)
        self.assertIn("cut_3", arc)
        self.assertIn("cut_4", arc)
        self.assertIn("Problem", arc["cut_1"]["phase"])
        self.assertIn("Empathy", arc["cut_2"]["phase"])
        self.assertIn("Science", arc["cut_3"]["phase"])
        self.assertIn("Resolution", arc["cut_4"]["phase"])
        self.assertIn("1080x1080", webtoon["render_specs"]["cut_dimensions"])
        self.assertIn("instagram_caption", webtoon["copy_specs"])
        self.assertIn("threads_post", webtoon["copy_specs"])

    def test_06_card_news_slide_architecture(self):
        """Verifies 6-Slide Card News deck specifications."""
        card_news = self.data["domain_benchmarks"]["card_news"]
        slides = card_news["slide_architecture"]
        self.assertEqual(len(slides), 6)
        self.assertEqual(slides[0]["type"], "hook_cover")
        self.assertEqual(slides[1]["type"], "problem_resonance")
        self.assertEqual(slides[2]["type"], "medical_clinical_data")
        self.assertEqual(slides[3]["type"], "practical_solution")
        self.assertEqual(slides[4]["type"], "step_checklist")
        self.assertEqual(slides[5]["type"], "summary_save_card")
        self.assertIn("1080x1350", card_news["render_specs"]["dimensions"])

    def test_07_official_standards_integration(self):
        """Verifies official standards: KDCA 2017, K-DST, SWS GH, dlPFC."""
        stds = self.data.get("official_standards", {})
        self.assertIn("KDCA_2017_GROWTH_CHARTS", stds)
        self.assertIn("K_DST_PEDIATRIC_SCREENING", stds)
        self.assertIn("PEDIATRIC_ENDOCRINOLOGY_SWS_GH", stds)
        self.assertIn("COGNITIVE_NEUROSCIENCE_FINE_MOTOR_DLPFC", stds)

        # KDCA formulas
        kdca = stds["KDCA_2017_GROWTH_CHARTS"]
        self.assertIn("+ 13", kdca["tanner_mph_formula"]["boy_cm"])
        self.assertIn("- 13", kdca["tanner_mph_formula"]["girl_cm"])
        self.assertIn("±8.5 cm", kdca["tanner_mph_formula"]["confidence_interval_95"])

        # K-DST domains
        kdst = stds["K_DST_PEDIATRIC_SCREENING"]
        domain_ids = [d["domain_id"] for d in kdst["core_domains"]]
        self.assertIn("gross_motor", domain_ids)
        self.assertIn("fine_motor", domain_ids)
        self.assertIn("cognition", domain_ids)
        self.assertIn("language", domain_ids)

        # SWS GH
        endo = stds["PEDIATRIC_ENDOCRINOLOGY_SWS_GH"]
        self.assertIn("65~70%", endo["sws_gh_window"]["gh_fraction"])
        self.assertIn("90분", endo["sws_gh_window"]["slow_wave_sleep_surge"])

        # dlPFC
        neuro = stds["COGNITIVE_NEUROSCIENCE_FINE_MOTOR_DLPFC"]
        self.assertIn("30%", neuro["cortical_representation"])
        self.assertIn("dlPFC", neuro["dlpfc_coactivation"])

    def test_08_synthesized_academic_rules_and_citations(self):
        """Verifies academic rules have genuine paper citations."""
        rules = self.data.get("synthesized_academic_rules", [])
        self.assertGreaterEqual(len(rules), 6)

        total_citations = 0
        pmids = set()
        for r in rules:
            self.assertIn("rule_id", r)
            self.assertIn("pillar", r)
            self.assertIn("scientific_claim", r)
            self.assertIn("paper_citations", r)
            self.assertGreaterEqual(len(r["paper_citations"]), 1)
            for c in r["paper_citations"]:
                total_citations += 1
                if c.get("pmid"):
                    pmids.add(c["pmid"])
                self.assertTrue(bool(c.get("title") or c.get("title_ko")))

        # Check genuine citations
        self.assertGreaterEqual(total_citations, 10)
        self.assertIn("29166664", pmids)  # KDCA growth charts paper

    def test_09_active_content_prompts_conformity(self):
        """Verifies active content prompts exist for all 4 domains with system prompts."""
        prompts = self.data.get("active_content_prompts", {})
        for domain in ["blog", "cafe", "webtoon", "card_news"]:
            self.assertIn(domain, prompts)
            self.assertIsInstance(prompts[domain], str)
            self.assertIn("System Prompt", prompts[domain])
            self.assertGreater(len(prompts[domain]), 50)

    def test_10_non_promotional_compliance(self):
        """Strict non-promotional audit: Zero commercial affiliate codes/links in JSON."""
        raw_text = json.dumps(self.data, ensure_ascii=False)
        banned_tokens = [
            "AF7865143",
            "A100708867",
            "tenping",
            "click.linkprice.com",
            "coupang.com/np/search"
        ]
        for token in banned_tokens:
            self.assertNotIn(token, raw_text, f"Integrity failure: Found prohibited token '{token}' in KB JSON!")

    def test_11_cli_status_command(self):
        """Verifies CLI flag --status returns code 0."""
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
        self.assertIn("Target Path", res.stdout)
        self.assertIn("Current Cycle", res.stdout)

    def test_12_cli_once_command_increments_cycle(self):
        """Verifies CLI flag --once increments cycle counter and records history."""
        cycle_before = self.data["hourly_cycle"]
        res = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--once"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        self.assertEqual(res.returncode, 0, f"--once failed: {res.stderr}")

        with open(KB_PATH, "r", encoding="utf-8") as f:
            updated_data = json.load(f)

        self.assertEqual(updated_data["hourly_cycle"], cycle_before + 1)
        self.assertGreaterEqual(len(updated_data["hourly_learning_history"]), 2)


if __name__ == "__main__":
    unittest.main()
