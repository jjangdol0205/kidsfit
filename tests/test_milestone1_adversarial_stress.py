#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Milestone 1 Challenger Adversarial Stress Test Suite
====================================================
Tests:
1. Corrupted, malformed, empty, and edge-case KB JSON handling.
2. Concurrent reads and writes, file locking, atomic replace behavior on Windows.
3. Deep adversarial non-promotional scanning (affiliate tags, merchant links, tracking params).
4. Citation verification against source dataset `src/data/research-knowledge-base.json`.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESEARCH_KB_PATH = PROJECT_ROOT / "src" / "data" / "research-knowledge-base.json"
TARGET_KB_PATH = PROJECT_ROOT / "docs" / "hourly_benchmark_paper_kb.json"
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "hourly_benchmark_paper_learning.py"

# Add scripts directory to sys.path so we can import modules
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
import hourly_benchmark_paper_learning as hb


class TestAdversarialM1(unittest.TestCase):

    def setUp(self):
        # Backup target KB before each test if it exists
        self.kb_backup = None
        if TARGET_KB_PATH.exists():
            with open(TARGET_KB_PATH, "rb") as f:
                self.kb_backup = f.read()

    def tearDown(self):
        # Restore target KB if backup was made
        if self.kb_backup is not None:
            with open(TARGET_KB_PATH, "wb") as f:
                f.write(self.kb_backup)
        # Clean up any leftover .tmp files
        tmp_file = TARGET_KB_PATH.with_suffix(".tmp")
        if tmp_file.exists():
            try:
                tmp_file.unlink()
            except Exception:
                pass

    # =========================================================================
    # Group 1: Corrupted or Missing KB JSON Handling
    # =========================================================================

    def test_01_missing_kb_json_recovers_as_cycle_1(self):
        """When docs/hourly_benchmark_paper_kb.json is completely missing, it should generate fresh as Cycle 1."""
        if TARGET_KB_PATH.exists():
            TARGET_KB_PATH.unlink()

        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        result = manager.execute_cycle(connector)

        self.assertTrue(TARGET_KB_PATH.exists(), "Target KB was not created")
        self.assertEqual(result["hourly_cycle"], 1)
        self.assertEqual(len(result["hourly_learning_history"]), 1)

    def test_02_empty_file_kb_json_recovers_gracefully(self):
        """When docs/hourly_benchmark_paper_kb.json is 0 bytes (corrupted empty file), manager recovers as Cycle 1."""
        TARGET_KB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TARGET_KB_PATH, "w", encoding="utf-8") as f:
            f.write("")

        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        result = manager.execute_cycle(connector)

        self.assertEqual(result["hourly_cycle"], 1)
        self.assertEqual(len(result["hourly_learning_history"]), 1)

    def test_03_malformed_syntax_kb_json_recovers_gracefully(self):
        """When docs/hourly_benchmark_paper_kb.json contains invalid JSON syntax, manager recovers as Cycle 1."""
        TARGET_KB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TARGET_KB_PATH, "w", encoding="utf-8") as f:
            f.write("{invalid_json: true, unterminated string...")

        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        result = manager.execute_cycle(connector)

        self.assertEqual(result["hourly_cycle"], 1)
        self.assertEqual(len(result["hourly_learning_history"]), 1)

    def test_04_schema_mutation_null_history(self):
        """Adversarial schema mutation: 'hourly_learning_history': null.
        Check if manager crashes with AttributeError or handles null."""
        corrupted_payload = {
            "hourly_cycle": 5,
            "hourly_learning_history": None
        }
        with open(TARGET_KB_PATH, "w", encoding="utf-8") as f:
            json.dump(corrupted_payload, f)

        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        try:
            result = manager.execute_cycle(connector)
            # If it succeeds, verify history is a valid list
            self.assertIsInstance(result["hourly_learning_history"], list)
        except AttributeError as e:
            self.fail(f"VULNERABILITY: Manager crashed with AttributeError on null hourly_learning_history: {e}")

    def test_05_schema_mutation_invalid_cycle_type(self):
        """Adversarial schema mutation: 'hourly_cycle': 'invalid_string' or None.
        Check if manager crashes with TypeError or recovers."""
        corrupted_payload = {
            "hourly_cycle": "NaN_string",
            "hourly_learning_history": []
        }
        with open(TARGET_KB_PATH, "w", encoding="utf-8") as f:
            json.dump(corrupted_payload, f)

        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        try:
            result = manager.execute_cycle(connector)
            self.assertIsInstance(result["hourly_cycle"], int)
        except TypeError as e:
            self.fail(f"VULNERABILITY: Manager crashed with TypeError on string hourly_cycle: {e}")

    # =========================================================================
    # Group 2: Atomic Writes, File Locking, Concurrent Reads & Writes
    # =========================================================================

    def test_06_atomic_replace_during_concurrent_read_on_windows(self):
        """Test whether atomic replace works when another process/thread holds an open read handle on Windows.
        On Windows, if a file is open without FILE_SHARE_DELETE, os.replace() can raise PermissionError!"""
        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
        
        # Ensure file exists
        manager.execute_cycle(connector)

        # Open file for reading
        read_error = None
        write_error = None

        with open(TARGET_KB_PATH, "r", encoding="utf-8") as read_handle:
            # File is now open for reading
            # Attempt to execute cycle (which does temp_path.replace(TARGET_KB_PATH))
            try:
                manager.execute_cycle(connector)
            except PermissionError as pe:
                write_error = pe
            except Exception as e:
                write_error = e

        if write_error is not None:
            self.fail(
                f"CONCURRENCY VULNERABILITY: os.replace failed during concurrent read on Windows: {write_error}\n"
                f"On Windows, atomic replace requires handling PermissionError or opening with FILE_SHARE_DELETE!"
            )

    def test_07_concurrent_writers_temp_file_collision(self):
        """Test what happens when multiple concurrent writer threads execute execute_cycle simultaneously.
        Both might use the hardcoded TARGET_KB_PATH.with_suffix('.tmp') filename!"""
        connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
        manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)

        errors = []
        threads = []

        def worker_task(thread_id):
            try:
                # Small jitter to trigger race conditions during write/replace
                time.sleep(0.01 * (thread_id % 3))
                manager.execute_cycle(connector)
            except Exception as e:
                errors.append((thread_id, type(e).__name__, str(e)))

        for i in range(5):
            t = threading.Thread(target=worker_task, args=(i,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        if errors:
            print(f"[CONCURRENCY STRESS] Encountered {len(errors)} errors under 5 concurrent writers:")
            for tid, etype, emsg in errors:
                print(f"  Thread {tid}: {etype} - {emsg}")
            # Note: We observe whether hardcoded temp file collided
            # If so, document vulnerability
            self.fail(f"CONCURRENCY VULNERABILITY: Concurrent writers collided on temp file: {errors}")

    # =========================================================================
    # Group 3: Non-Promotional Adversarial Scanning
    # =========================================================================

    def test_08_adversarial_non_promotional_scanning(self):
        """Exhaustive regex and token scanning for commercial affiliate tags, codes, and redirect patterns."""
        if not TARGET_KB_PATH.exists():
            connector = hb.PaperKnowledgeConnector(RESEARCH_KB_PATH)
            manager = hb.CumulativeKnowledgeBaseManager(TARGET_KB_PATH)
            manager.execute_cycle(connector)

        with open(TARGET_KB_PATH, "r", encoding="utf-8") as f:
            kb_text = f.read()

        adversarial_signatures = [
            # Coupang
            "AF7865143",
            "lptag",
            "coupang.com",
            # LinkPrice
            "A100708867",
            "linkprice",
            "click.linkprice",
            # Tenping / CPA
            "tenping",
            "010-****-2370",
            # Amazon affiliate
            "tallerbiolab-20",
            "kidfit-20",
            "tag=taller",
            "amazon.com/s?k=",
            # iHerb reward
            "KIDSBIO",
            "kr.iherb.com",
            "iherb.com/search",
            # Adpick / 11st
            "4d31d3",
            "adpick",
            # MyRealTrip / Klook
            "6226316",
            "myrealtrip",
            "140161",
            "klook",
            # Marketing CTAs
            "로켓배송",
            "최저가",
            "특가할인",
            "구매하기",
            "공동구매",
            "협찬",
            "수수료를 제공받습니다"
        ]

        found_violations = []
        for sig in adversarial_signatures:
            if sig.lower() in kb_text.lower():
                found_violations.append(sig)

        self.assertEqual(
            found_violations,
            [],
            f"NON-PROMOTIONAL VIOLATION: Found prohibited affiliate or promotional tokens in KB: {found_violations}"
        )

    # =========================================================================
    # Group 4: Paper Citation Verification
    # =========================================================================

    def test_09_paper_citation_verification_against_source(self):
        """Verify that every cited paper in docs/hourly_benchmark_paper_kb.json exists in src/data/research-knowledge-base.json."""
        with open(RESEARCH_KB_PATH, "r", encoding="utf-8") as f:
            source_data = json.load(f)
        source_papers = source_data.get("papers", [])

        source_pmids = set(str(p.get("pmid")) for p in source_papers if p.get("pmid"))
        source_dois = set(str(p.get("doi")).lower() for p in source_papers if p.get("doi"))
        source_titles = set(p.get("title", "").strip().lower() for p in source_papers if p.get("title"))

        with open(TARGET_KB_PATH, "r", encoding="utf-8") as f:
            target_data = json.load(f)

        rules = target_data.get("synthesized_academic_rules", [])
        blueprints = target_data.get("synthesized_blueprints", [])

        citations_to_check = []
        for r in rules:
            for c in r.get("paper_citations", []):
                citations_to_check.append(("rule", r.get("rule_id"), c))

        for bp in blueprints:
            for c in bp.get("paper_citations", []):
                citations_to_check.append(("blueprint", bp.get("blueprint_id"), c))

        self.assertGreater(len(citations_to_check), 0, "No citations found to verify!")

        missing_citations = []
        verified_count = 0

        for source_type, parent_id, citation in citations_to_check:
            pmid = str(citation.get("pmid", "")).strip()
            doi = str(citation.get("doi", "")).strip().lower()
            title = citation.get("title", "").strip().lower()

            matched = False
            match_reason = []

            if pmid and pmid in source_pmids:
                matched = True
                match_reason.append(f"PMID:{pmid}")
            if doi and doi in source_dois:
                matched = True
                match_reason.append(f"DOI:{doi}")
            if title and title in source_titles:
                matched = True
                match_reason.append("TITLE")

            if matched:
                verified_count += 1
            else:
                missing_citations.append({
                    "parent": f"{source_type}:{parent_id}",
                    "citation_id": citation.get("id"),
                    "pmid": pmid,
                    "doi": doi,
                    "title": citation.get("title", "")[:60]
                })

        print(f"[CITATION AUDIT] Verified {verified_count}/{len(citations_to_check)} citations against source DB.")

        self.assertEqual(
            missing_citations,
            [],
            f"CITATION AUDIT FAILURE: Found {len(missing_citations)} citations that DO NOT exist in research-knowledge-base.json: {missing_citations}"
        )

    # =========================================================================
    # Group 5: Source KB Edge Cases & Data Type Hardening
    # =========================================================================

    def test_10_empty_papers_list_in_research_kb(self):
        """When research KB papers list is empty, get_kdca_paper() crashes with IndexError: list index out of range."""
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump({"papers": []}, tf)
            temp_kb = Path(tf.name)

        try:
            connector = hb.PaperKnowledgeConnector(temp_kb)
            try:
                kdca = connector.get_kdca_paper()
                self.assertIsNotNone(kdca)
            except IndexError as ie:
                self.fail(f"VULNERABILITY: Connector crashed with IndexError on empty papers list: {ie}")
        finally:
            if temp_kb.exists():
                temp_kb.unlink()

    def test_11_null_authors_in_paper(self):
        """When a paper has 'authors': null, query_papers() crashes with TypeError: 'NoneType' object is not subscriptable."""
        malformed_paper = {
            "id": "PMID:99999999",
            "pmid": "99999999",
            "title": "Pediatric Growth and Endocrinology Study",
            "title_ko": "소아 성장 및 내분비 연구",
            "authors": None,
            "journal": "Journal of Pediatrics",
            "year": 2024,
            "pillar": "growth_endocrinology"
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump({"papers": [malformed_paper]}, tf)
            temp_kb = Path(tf.name)

        try:
            connector = hb.PaperKnowledgeConnector(temp_kb)
            try:
                res = connector.query_papers(["growth", "성장"])
                self.assertEqual(len(res), 1)
                self.assertEqual(res[0]["authors"], [])
            except TypeError as te:
                self.fail(f"VULNERABILITY: query_papers crashed with TypeError on null authors: {te}")
        finally:
            if temp_kb.exists():
                temp_kb.unlink()


if __name__ == "__main__":
    unittest.main()

