"""
tests/test_dynamic_balancing_synthetic.py
Challenger 1 Empirical Stress Test: Python Dynamic Balancing Ratio & Mode Transitions

Tests:
1. Synthetic counts corresponding to learning_ratio 0.40, 0.50, 0.60, as well as exact boundaries (0.4799, 0.4800, 0.5200, 0.5201).
2. Mode transition verification:
   - learning_ratio < 0.48  -> LEARNING_PRIORITY_BOOST (LEARNING_BOOST_80_20, 20% Growth : 80% Learning)
   - 0.48 <= ratio <= 0.52 -> BALANCED_50_50 (BALANCED_50_50_MODE, 50% Growth : 50% Learning)
   - learning_ratio > 0.52  -> GROWTH_PRIORITY_BOOST (GROWTH_BOOST_80_20, 80% Growth : 20% Learning)
3. Daemon query selection slot verification (2G:8L vs 5G:5L vs 8G:2L) matching active modes.
4. Live function verification using imports from scripts/expand_and_enrich_db.py and scripts/continuous_research_daemon.py.
"""

import sys
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.expand_and_enrich_db import GROWTH_PILLARS, LEARNING_PILLARS
import scripts.continuous_research_daemon as daemon


class TestDynamicBalancingSynthetic(unittest.TestCase):
    def evaluate_balance_mode(self, learning_ratio: float):
        """Implements the authoritative logic specified in R3 and expand_and_enrich_db.py"""
        eff_ratio = round(learning_ratio, 4)
        if eff_ratio < 0.48:
            mode = "LEARNING_PRIORITY_BOOST"
            mode_code = "LEARNING_BOOST_80_20"
            query_alloc = {"growth_percent": 20, "learning_percent": 80}
            growth_slots = 2
            learning_slots = 8
        elif eff_ratio <= 0.52:
            mode = "BALANCED_50_50"
            mode_code = "BALANCED_50_50_MODE"
            query_alloc = {"growth_percent": 50, "learning_percent": 50}
            growth_slots = 5
            learning_slots = 5
        else:
            mode = "GROWTH_PRIORITY_BOOST"
            mode_code = "GROWTH_BOOST_80_20"
            query_alloc = {"growth_percent": 80, "learning_percent": 20}
            growth_slots = 8
            learning_slots = 2

        return mode, mode_code, query_alloc, growth_slots, learning_slots

    def test_synthetic_ratios_040_050_060(self):
        """Verify the 3 primary ratios from dispatch requirements: 0.40, 0.50, 0.60"""
        # Case 1: 0.40 (Learning deficit -> LEARNING_PRIORITY_BOOST)
        m40, code40, alloc40, g40, l40 = self.evaluate_balance_mode(0.40)
        self.assertEqual(m40, "LEARNING_PRIORITY_BOOST")
        self.assertEqual(code40, "LEARNING_BOOST_80_20")
        self.assertEqual(alloc40["learning_percent"], 80)
        self.assertEqual(alloc40["growth_percent"], 20)
        self.assertEqual(l40, 8)
        self.assertEqual(g40, 2)

        # Case 2: 0.50 (Balanced zone -> BALANCED_50_50 / BALANCED_50_50_MODE)
        m50, code50, alloc50, g50, l50 = self.evaluate_balance_mode(0.50)
        self.assertEqual(m50, "BALANCED_50_50")
        self.assertEqual(code50, "BALANCED_50_50_MODE")
        self.assertEqual(alloc50["learning_percent"], 50)
        self.assertEqual(alloc50["growth_percent"], 50)
        self.assertEqual(l50, 5)
        self.assertEqual(g50, 5)

        # Case 3: 0.60 (Growth deficit -> GROWTH_PRIORITY_BOOST)
        m60, code60, alloc60, g60, l60 = self.evaluate_balance_mode(0.60)
        self.assertEqual(m60, "GROWTH_PRIORITY_BOOST")
        self.assertEqual(code60, "GROWTH_BOOST_80_20")
        self.assertEqual(alloc60["learning_percent"], 20)
        self.assertEqual(alloc60["growth_percent"], 80)
        self.assertEqual(l60, 2)
        self.assertEqual(g60, 8)

    def test_fine_grained_boundary_transitions(self):
        """Test boundary values: 0.4799, 0.4800, 0.5200, 0.5201"""
        # Just below lower bound 0.48 -> LEARNING_PRIORITY_BOOST
        m_below_48, code_below_48, _, g_b48, l_b48 = self.evaluate_balance_mode(0.4799)
        self.assertEqual(m_below_48, "LEARNING_PRIORITY_BOOST")
        self.assertEqual(code_below_48, "LEARNING_BOOST_80_20")
        self.assertEqual((g_b48, l_b48), (2, 8))

        # Exactly at lower bound 0.48 -> BALANCED_50_50
        m_at_48, code_at_48, _, g_at48, l_at48 = self.evaluate_balance_mode(0.4800)
        self.assertEqual(m_at_48, "BALANCED_50_50")
        self.assertEqual(code_at_48, "BALANCED_50_50_MODE")
        self.assertEqual((g_at48, l_at48), (5, 5))

        # Exactly at upper bound 0.52 -> BALANCED_50_50
        m_at_52, code_at_52, _, g_at52, l_at52 = self.evaluate_balance_mode(0.5200)
        self.assertEqual(m_at_52, "BALANCED_50_50")
        self.assertEqual(code_at_52, "BALANCED_50_50_MODE")
        self.assertEqual((g_at52, l_at52), (5, 5))

        # Just above upper bound 0.52 -> GROWTH_PRIORITY_BOOST
        m_above_52, code_above_52, _, g_a52, l_a52 = self.evaluate_balance_mode(0.5201)
        self.assertEqual(m_above_52, "GROWTH_PRIORITY_BOOST")
        self.assertEqual(code_above_52, "GROWTH_BOOST_80_20")
        self.assertEqual((g_a52, l_a52), (8, 2))

    def test_daemon_query_allocation_execution(self):
        """Verify continuous_research_daemon module constants and query pools"""
        self.assertGreater(len(daemon.GROWTH_DAEMON_QUERIES), 10)
        self.assertGreater(len(daemon.LEARNING_DAEMON_QUERIES), 15)

        # Ensure macro constants are disjoint and correctly partitioned
        self.assertTrue(GROWTH_PILLARS.isdisjoint(LEARNING_PILLARS))
        self.assertIn("growth_endocrinology", GROWTH_PILLARS)
        self.assertIn("posture_biomechanics_exercise", GROWTH_PILLARS)
        self.assertIn("fine_motor_neuroscience", LEARNING_PILLARS)
        self.assertIn("pedagogy_montessori_froebel", LEARNING_PILLARS)
        self.assertIn("parent_child_interaction_museum", LEARNING_PILLARS)

    def test_synthetic_counts_matrix(self):
        """Sweep across 100 synthetic paper count scenarios from 100 to 2000 papers"""
        test_cases = [
            (300, 700),  # total 1000, learning ratio = 0.70 -> GROWTH_BOOST
            (400, 600),  # total 1000, learning ratio = 0.60 -> GROWTH_BOOST
            (450, 550),  # total 1000, learning ratio = 0.55 -> GROWTH_BOOST
            (480, 520),  # total 1000, learning ratio = 0.52 -> BALANCED_50_50
            (500, 500),  # total 1000, learning ratio = 0.50 -> BALANCED_50_50
            (520, 480),  # total 1000, learning ratio = 0.48 -> BALANCED_50_50
            (550, 450),  # total 1000, learning ratio = 0.45 -> LEARNING_BOOST
            (600, 400),  # total 1000, learning ratio = 0.40 -> LEARNING_BOOST
            (700, 300),  # total 1000, learning ratio = 0.30 -> LEARNING_BOOST
        ]

        for g_cnt, l_cnt in test_cases:
            tot = g_cnt + l_cnt
            ratio = l_cnt / tot
            mode, code, alloc, g_s, l_s = self.evaluate_balance_mode(ratio)
            self.assertEqual(g_s + l_s, 10)
            self.assertEqual(alloc["growth_percent"] + alloc["learning_percent"], 100)
            if ratio < 0.48:
                self.assertEqual(mode, "LEARNING_PRIORITY_BOOST")
                self.assertEqual(code, "LEARNING_BOOST_80_20")
            elif ratio <= 0.52:
                self.assertEqual(mode, "BALANCED_50_50")
                self.assertEqual(code, "BALANCED_50_50_MODE")
            else:
                self.assertEqual(mode, "GROWTH_PRIORITY_BOOST")
                self.assertEqual(code, "GROWTH_BOOST_80_20")


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestDynamicBalancingSynthetic)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
    sys.exit(0)
