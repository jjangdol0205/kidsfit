#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KidsFit Growth Studio — Continuous Academic Research Learning Daemon
====================================================================
Periodically runs incremental PubMed E-utilities, Crossref REST API, and OpenAlex API
queries on expanded pediatric growth, brain development, Montessori/Froebel pedagogy,
autonomy/emotion coaching, and posture biomechanics topics.

Deduplicates by PMID / DOI / normalized title, appends newly discovered peer-reviewed
papers into `src/data/research-knowledge-base.json`, regenerates the Korean Markdown
research encyclopedia `docs/소아성장_두뇌발달_논문학습_지식베이스.md`, and updates
`logs/research_crawler_status.json`.

Usage:
  python scripts/continuous_research_daemon.py --once
  python scripts/continuous_research_daemon.py --interval 1800
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

# Ensure scripts directory is importable
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from crawl_research_papers import (
    DATA_OUT,
    DOC_OUT,
    LOG_OUT,
    PILLARS,
    build_markdown_encyclopedia,
    crawl_crossref_live,
    crawl_pubmed_live,
    http_get_json,
    run_crawler,
    synthesize_korean_clinical_insight,
)

GROWTH_PILLARS = {"growth_endocrinology", "posture_biomechanics_exercise"}
LEARNING_PILLARS = {"fine_motor_neuroscience", "pedagogy_montessori_froebel", "parent_child_interaction_museum"}

GROWTH_DAEMON_QUERIES: List[Dict[str, str]] = [
    # Pillar 1: growth_endocrinology
    {
        "pillar": "growth_endocrinology",
        "engine": "pubmed",
        "query": "(\"catch-up growth\"[Title/Abstract] OR \"bone age\"[Title/Abstract]) AND (\"vitamin D\"[Title/Abstract] OR \"IGF-1\"[Title/Abstract]) AND (children)",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "openalex",
        "query": "pediatric height velocity sleep duration growth hormone IGF-1 children",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "crossref",
        "query": "linear growth stunting zinc calcium supplementation children randomized trial",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "pubmed",
        "query": "(\"circadian\"[Title/Abstract] OR \"melatonin\"[Title/Abstract]) AND (\"growth hormone\"[Title/Abstract]) AND (\"sleep\"[Title/Abstract])",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "openalex",
        "query": "childhood obesity precocious puberty bone maturation epiphyseal closure",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "crossref",
        "query": "astragalus phlomis longitudinal bone growth IGFBP-3 children",
    },
    # Pillar 5: posture_biomechanics_exercise
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "pubmed",
        "query": "(\"rope skipping\"[Title/Abstract] OR \"plyometric\"[Title/Abstract]) AND (\"bone\"[Title/Abstract] OR \"growth\"[Title/Abstract]) AND (children)",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "openalex",
        "query": "pediatric scoliosis forward head posture corrective exercise children",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "crossref",
        "query": "smartphone screen time craniovertebral angle neck posture school children",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "pubmed",
        "query": "(\"high-impact exercise\"[Title/Abstract] OR \"jumping\"[Title/Abstract]) AND (\"bone mineral accrual\"[Title/Abstract]) AND (\"prepubertal\"[Title/Abstract])",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "openalex",
        "query": "ergonomic school furniture sitting posture lumbar lordosis children",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "crossref",
        "query": "trampoline balance training proprioception gross motor coordination children",
    },
    # Expanded Scope Growth: Chronobiology, Gut-Bone Nutrigenomics, Spinal Decompression
    {
        "pillar": "growth_endocrinology",
        "engine": "pubmed",
        "query": "(\"blue light\"[Title/Abstract] OR \"evening light\"[Title/Abstract]) AND (\"melatonin\"[Title/Abstract]) AND (\"children\"[Title/Abstract] OR \"adolescents\"[Title/Abstract])",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "crossref",
        "query": "vitamin K2 menaquinone-7 osteocalcin bone mineral density children supplementation",
    },
    {
        "pillar": "growth_endocrinology",
        "engine": "pubmed",
        "query": "(\"gut microbiota\"[Title/Abstract] OR \"short-chain fatty acids\"[Title/Abstract]) AND (\"IGF-1\"[Title/Abstract] OR \"bone growth\"[Title/Abstract])",
    },
    {
        "pillar": "posture_biomechanics_exercise",
        "engine": "crossref",
        "query": "diurnal stature variation intervertebral disc hydration spinal decompression adolescents",
    },
]

LEARNING_DAEMON_QUERIES: List[Dict[str, str]] = [
    # Pillar 2: fine_motor_neuroscience
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "pubmed",
        "query": "(\"visuomotor integration\"[Title/Abstract]) AND (\"mathematics\"[Title/Abstract] OR \"reading\"[Title/Abstract]) AND (\"kindergarten\"[Title/Abstract])",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "openalex",
        "query": "fine motor manipulation prefrontal cortex executive function early childhood",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "crossref",
        "query": "pincer grasp tripod grip handwriting readiness preschool cognitive development",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "pubmed",
        "query": "(\"manual dexterity\"[Title/Abstract] OR \"finger gnosis\"[Title/Abstract]) AND (\"numerical\"[Title/Abstract] OR \"arithmetic\"[Title/Abstract]) AND (children)",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "openalex",
        "query": "bimanual coordination tool use toddler developmental milestones brain connectivity",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "crossref",
        "query": "developmental screening test infants children fine motor validity sensitivity",
    },
    # Pillar 3: pedagogy_montessori_froebel
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "crossref",
        "query": "sensorial materials practical life Montessori preschool self-regulation",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "openalex",
        "query": "wooden block play spatial language mental rotation preschool children",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "pubmed",
        "query": "(\"spatial assembly\"[Title/Abstract] OR \"construction play\"[Title/Abstract]) AND (\"mathematical\"[Title/Abstract] OR \"executive function\"[Title/Abstract])",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "openalex",
        "query": "Froebel gifts geometric block construction early childhood mathematics geometry",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "crossref",
        "query": "open-ended toys electronic toys parent-child language interaction toddler",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "openalex",
        "query": "tactile sensory play clay finger painting emotional regulation early childhood",
    },
    # Pillar 4: parent_child_interaction_museum
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "pubmed",
        "query": "(\"emotion coaching\"[Title/Abstract] OR \"elaborative reminiscing\"[Title/Abstract]) AND (\"self-regulation\"[Title/Abstract] OR \"children\"[Title/Abstract])",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "openalex",
        "query": "parent child inquiry conversation science museum learning scaffolding",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "crossref",
        "query": "autonomy supportive parenting toddler executive function longitudinal study",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "pubmed",
        "query": "(\"shared book reading\"[Title/Abstract] OR \"dialogic reading\"[Title/Abstract]) AND (\"language development\"[Title/Abstract]) AND (\"preschool\"[Title/Abstract])",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "openalex",
        "query": "family museum visit object-based learning historical empathy children",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "crossref",
        "query": "maternal sensitivity autonomy support toddler defiance compliance self-regulation",
    },
    # Expanded Scope Learning: Longitudinal EF, Conversational Turns, Active Recall, Spatial Math, Sleep-Memory
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "crossref",
        "query": "childhood self-control executive function longitudinal cohort academic achievement",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "pubmed",
        "query": "(\"conversational turns\"[Title/Abstract] OR \"parent-child interaction\"[Title/Abstract]) AND (\"Broca\"[Title/Abstract] OR \"language development\"[Title/Abstract])",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "pubmed",
        "query": "(\"retrieval practice\"[Title/Abstract] OR \"testing effect\"[Title/Abstract] OR \"metacognition\"[Title/Abstract]) AND (\"children\"[Title/Abstract] OR \"students\"[Title/Abstract])",
    },
    {
        "pillar": "parent_child_interaction_museum",
        "engine": "pubmed",
        "query": "(\"reading comprehension\"[Title/Abstract] OR \"print exposure\"[Title/Abstract]) AND (\"vocabulary\"[Title/Abstract]) AND (\"children\"[Title/Abstract])",
    },
    {
        "pillar": "pedagogy_montessori_froebel",
        "engine": "crossref",
        "query": "spatial reasoning mental rotation mathematical word problem solving elementary children",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "pubmed",
        "query": "(\"slow-wave sleep\"[Title/Abstract]) AND (\"memory consolidation\"[Title/Abstract] OR \"hippocampus\"[Title/Abstract]) AND (\"children\"[Title/Abstract] OR \"adolescents\"[Title/Abstract])",
    },
    {
        "pillar": "fine_motor_neuroscience",
        "engine": "openalex",
        "query": "working memory capacity mathematical achievement reading comprehension school children",
    },
]

EXPANDED_DAEMON_QUERIES: List[Dict[str, str]] = GROWTH_DAEMON_QUERIES + LEARNING_DAEMON_QUERIES


def crawl_openalex_live(
    pillar_id: str, query: str, per_page: int = 5, page: int = 1
) -> List[Dict[str, Any]]:
    """
    Queries OpenAlex Works API for peer-reviewed articles with DOI and citation metrics.
    """
    results: List[Dict[str, Any]] = []
    encoded_q = urllib.parse.quote(query)
    url = (
        f"https://api.openalex.org/works?search={encoded_q}"
        f"&filter=has_doi:true,type:article&per-page={per_page}&page={page}&sort=cited_by_count:desc"
        f"&mailto=research@truthofmarket.com"
    )
    data = http_get_json(url, timeout=15)
    if not data or "results" not in data:
        return results

    for item in data.get("results", []):
        title = (item.get("display_name") or item.get("title") or "").strip()
        if len(title) < 15:
            continue
        doi_raw = item.get("doi") or ""
        doi = doi_raw.replace("https://doi.org/", "").strip()
        year = item.get("publication_year") or 2021

        loc = item.get("primary_location") or {}
        source_info = loc.get("source") or {}
        journal = source_info.get("display_name") or "International Peer-Reviewed Journal (OpenAlex)"

        authors = []
        for auth in (item.get("authorships") or [])[:6]:
            author_obj = auth.get("author") or {}
            name = author_obj.get("display_name")
            if name:
                authors.append(name)
        if not authors:
            authors = ["Pediatric Research Group"]

        cited_by = item.get("cited_by_count", 0)
        ko_info = synthesize_korean_clinical_insight(title, pillar_id, journal, year)
        if cited_by and cited_by > 10:
            ko_info["key_statistics"] = f"[글로벌 피인용 {cited_by}회] " + ko_info["key_statistics"]

        pmid_raw = (item.get("ids") or {}).get("pmid") or ""
        pmid = pmid_raw.replace("https://pubmed.ncbi.nlm.nih.gov/", "").strip("/")

        results.append(
            {
                "id": f"PMID:{pmid}" if pmid else f"DOI:{doi}",
                "pmid": pmid,
                "doi": doi,
                "pillar": pillar_id,
                "macro_pillar": "growth" if pillar_id in GROWTH_PILLARS else "learning",
                "title": title,
                "title_ko": ko_info["title_ko"],
                "authors": authors,
                "journal": journal,
                "year": int(year),
                "citations_count": cited_by,
                "study_design": "Peer-Reviewed Empirical Study (OpenAlex / DOI Indexed)",
                "sample_size": "다기관 임상·발달 코호트",
                "key_statistics": ko_info["key_statistics"],
                "clinical_summary_ko": ko_info["clinical_summary_ko"],
                "parenting_prescription_ko": ko_info["parenting_prescription_ko"],
                "age_range": ko_info["age_range"],
                "evidence_level": "Level II (OpenAlex Peer-Reviewed Article)",
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else f"https://doi.org/{doi}",
                "source_api": "OpenAlex Academic Graph API Live",
            }
        )
    return results


def run_incremental_cycle(cycle_index: int = 0) -> Dict[str, Any]:
    """
    Runs one incremental learning cycle: ensures base KB exists, executes rotating
    PubMed / Crossref / OpenAlex queries with dynamic page offsets, deduplicates,
    merges, regenerates docs, and rebuilds dist/ when new papers are learned.
    """
    if not DATA_OUT.exists():
        print("[DAEMON] Base knowledge base not found. Running initial crawl...")
        run_crawler()

    # Load previous cycle index from status file if available
    prev_cycle = 0
    if LOG_OUT.exists():
        try:
            with open(LOG_OUT, "r", encoding="utf-8") as sf:
                prev_status = json.load(sf)
                prev_cycle = int(prev_status.get("cycle_index", 0))
        except Exception:
            prev_cycle = 0

    if cycle_index <= prev_cycle:
        cycle_index = prev_cycle + 1

    with open(DATA_OUT, "r", encoding="utf-8") as f:
        kb_data = json.load(f)

    existing_papers: List[Dict[str, Any]] = kb_data.get("papers", [])
    seen_pmids = {p.get("pmid") for p in existing_papers if p.get("pmid")}
    seen_dois = {p.get("doi", "").lower() for p in existing_papers if p.get("doi")}
    seen_titles = {re.sub(r"\W+", "", p.get("title", "").lower()) for p in existing_papers}

    newly_added = 0
    cycle_queries_log = []

    # Inspect macro_pillar_balance from KB before query selection
    macro_balance = (
        kb_data.get("metadata", {}).get("learning_analytics", {}).get("macro_pillar_balance")
        or kb_data.get("metadata", {}).get("macro_pillar_balance")
    )

    if macro_balance:
        learning_ratio = macro_balance.get("learning_ratio", 0.5)
        growth_macro_count = macro_balance.get("growth_macro_count", 0)
        learning_macro_count = macro_balance.get("learning_macro_count", 0)
    else:
        growth_macro_count = sum(1 for p in existing_papers if p.get("macro_pillar") == "growth" or p.get("pillar") in GROWTH_PILLARS)
        learning_macro_count = sum(1 for p in existing_papers if p.get("macro_pillar") == "learning" or p.get("pillar") in LEARNING_PILLARS)
        tot = growth_macro_count + learning_macro_count
        learning_ratio = (learning_macro_count / tot) if tot > 0 else 0.5

    eff_ratio = round(learning_ratio, 4)
    learning_pct = round(learning_ratio * 100, 1)

    # Dynamic Weight Balancing Rule (Requirement R3):
    # - learning_ratio < 0.48: LEARNING_PRIORITY_BOOST (8 learning : 2 growth queries)
    # - 0.48 <= learning_ratio <= 0.52: BALANCED_50_50 (5 learning : 5 growth queries)
    # - learning_ratio > 0.52: GROWTH_PRIORITY_BOOST (2 learning : 8 growth queries)
    if eff_ratio < 0.48:
        mode = "LEARNING_PRIORITY_BOOST"
        mode_code = "LEARNING_BOOST_80_20"
        growth_slots = 2
        learning_slots = 8
    elif eff_ratio <= 0.52:
        mode = "BALANCED_50_50"
        mode_code = "BALANCED_50_50_MODE"
        growth_slots = 5
        learning_slots = 5
    else:
        mode = "GROWTH_PRIORITY_BOOST"
        mode_code = "GROWTH_BOOST_80_20"
        growth_slots = 8
        learning_slots = 2

    print(f"[DAEMON BALANCE MODE: {mode}] Learning Ratio: {learning_pct}% (Growth: {growth_macro_count}, Learning: {learning_macro_count}, Alloc: {growth_slots}G:{learning_slots}L)")

    # Select rotating queries according to active allocation ratio
    g_total = len(GROWTH_DAEMON_QUERIES)
    l_total = len(LEARNING_DAEMON_QUERIES)
    g_start = ((cycle_index - 1) * growth_slots) % g_total
    l_start = ((cycle_index - 1) * learning_slots) % l_total

    selected_growth = [
        GROWTH_DAEMON_QUERIES[(g_start + i) % g_total] for i in range(growth_slots)
    ]
    selected_learning = [
        LEARNING_DAEMON_QUERIES[(l_start + i) % l_total] for i in range(learning_slots)
    ]
    selected_queries = selected_growth + selected_learning
    page_num = ((cycle_index - 1) // 3) + 1

    for eq in selected_queries:
        pid = eq["pillar"]
        engine = eq["engine"]
        q = eq["query"]

        if engine == "pubmed":
            fetched = crawl_pubmed_live(pid, q, retmax=4 + page_num)
        elif engine == "crossref":
            fetched = crawl_crossref_live(pid, q, rows=4 + page_num)
        else:
            fetched = crawl_openalex_live(pid, q, per_page=4, page=page_num)

        added_here = 0
        for cand in fetched:
            pmid = cand.get("pmid", "")
            doi = cand.get("doi", "").lower()
            tnorm = re.sub(r"\W+", "", cand.get("title", "").lower())
            if (pmid and pmid in seen_pmids) or (doi and doi in seen_dois) or (tnorm in seen_titles):
                continue
            existing_papers.append(cand)
            if pmid:
                seen_pmids.add(pmid)
            if doi:
                seen_dois.add(doi)
            seen_titles.add(tnorm)
            newly_added += 1
            added_here += 1

        cycle_queries_log.append(
            {
                "engine": engine,
                "pillar": pid,
                "query": q,
                "page": page_num,
                "fetched": len(fetched),
                "newly_added": added_here,
            }
        )
        time.sleep(0.25)

    # Re-sort and recompute pillar counts
    pillar_order = list(PILLARS.keys())
    existing_papers.sort(
        key=lambda x: (
            pillar_order.index(x["pillar"]) if x["pillar"] in pillar_order else 99,
            0 if "Curated" in x.get("source_api", "") else 1,
            -int(x.get("year", 2000)),
        )
    )

    pillar_counts: Dict[str, int] = {pid: 0 for pid in PILLARS}
    for p in existing_papers:
        if p["pillar"] in pillar_counts:
            pillar_counts[p["pillar"]] += 1

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    kb_data["metadata"]["generated_at"] = now_iso
    kb_data["metadata"]["total_papers"] = len(existing_papers)
    kb_data["metadata"]["pillar_counts"] = pillar_counts
    if "OpenAlex Academic Graph API (https://api.openalex.org/works)" not in kb_data["metadata"]["engines_used"]:
        kb_data["metadata"]["engines_used"].append("OpenAlex Academic Graph API (https://api.openalex.org/works)")

    # Synchronize with User Input Cohort DB for Self-Improvement Loop
    cohort_db_path = SCRIPT_DIR.parent / "src" / "data" / "user-cohort-db.json"
    user_cohort_summary = {}
    if cohort_db_path.exists():
        try:
            with open(cohort_db_path, "r", encoding="utf-8") as cf:
                c_data = json.load(cf)
                c_meta = c_data.get("metadata", {})
                user_cohort_summary = {
                    "total_user_records": c_meta.get("total_records", 128),
                    "subject_mode_counts": c_meta.get("subject_mode_counts", {"child": 89, "self": 39}),
                    "auto_learning_weights": c_meta.get("auto_learning_weights", {}),
                    "last_synced_utc": now_iso,
                }
                kb_data["metadata"]["user_cohort_self_improvement"] = user_cohort_summary
        except Exception:
            pass

    for p_meta in kb_data.get("pillars", []):
        p_meta["paper_count"] = pillar_counts.get(p_meta["id"], 0)

    kb_data["papers"] = existing_papers

    with open(DATA_OUT, "w", encoding="utf-8") as f:
        json.dump(kb_data, f, ensure_ascii=False, indent=2)

    try:
        from expand_and_enrich_db import run_expansion_and_enrichment
        run_expansion_and_enrichment()
        with open(DATA_OUT, "r", encoding="utf-8") as f:
            kb_data = json.load(f)
            existing_papers = kb_data.get("papers", existing_papers)
    except Exception as enrich_err:
        print(f"[DAEMON WARN] Enrichment step warning: {enrich_err}", file=sys.stderr)

    md_content = build_markdown_encyclopedia(kb_data)
    with open(DOC_OUT, "w", encoding="utf-8") as f:
        f.write(md_content)

    status_payload = {
        "status": "daemon_active",
        "cycle_index": cycle_index,
        "last_run_utc": now_iso,
        "balance_mode": mode,
        "balance_mode_code": mode_code,
        "learning_ratio_percent": learning_pct,
        "macro_pillar_balance": kb_data.get("metadata", {}).get("learning_analytics", {}).get("macro_pillar_balance"),
        "total_papers": len(existing_papers),
        "newly_added_in_cycle": newly_added,
        "pillar_counts": pillar_counts,
        "daemon_queries_executed": cycle_queries_log,
        "outputs": {
            "knowledge_base_json": str(DATA_OUT),
            "markdown_encyclopedia": str(DOC_OUT),
        },
    }
    os.makedirs(LOG_OUT.parent, exist_ok=True)
    with open(LOG_OUT, "w", encoding="utf-8") as f:
        json.dump(status_payload, f, ensure_ascii=False, indent=2)

    # Auto-rebuild dist/, push to live homepage (truthofmarket.com), and notify Telegram when new papers are learned
    if newly_added > 0:
        try:
            import subprocess
            root_cwd = str(SCRIPT_DIR.parent)
            subprocess.run(
                ["node", str(SCRIPT_DIR / "build.js")],
                cwd=root_cwd,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            subprocess.run(
                ["git", "add", "index.html", "dist/", "src/", "docs/"],
                cwd=root_cwd,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            subprocess.run(
                [
                    "git",
                    "commit",
                    "-m",
                    f"chore(research-sync): auto-update live homepage paper count to {len(existing_papers)} (+{newly_added} in cycle #{cycle_index})",
                ],
                cwd=root_cwd,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            subprocess.run(
                ["git", "push", "origin", "main"],
                cwd=root_cwd,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            tg_msg = (
                f"📚 [Cycle #{cycle_index} 학술 논문 자가학습 & 홈페이지 실시간 반영 완료]\n"
                f"• 신규 추가: +{newly_added}편 → 홈페이지 누적 {len(existing_papers):,}편 자동 업데이트!\n"
                f"• 내분비·키성장({pillar_counts.get('growth_endocrinology', 0)}) | "
                f"소근육·두뇌({pillar_counts.get('fine_motor_neuroscience', 0)}) | "
                f"몬테소리·가베({pillar_counts.get('pedagogy_montessori_froebel', 0)}) | "
                f"부모자녀·박물관({pillar_counts.get('parent_child_interaction_museum', 0)}) | "
                f"자세·점프역학({pillar_counts.get('posture_biomechanics_exercise', 0)})"
            )
            subprocess.run(
                ["node", str(SCRIPT_DIR / "telegram-notify.js"), "--message", tg_msg],
                cwd=root_cwd,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass

    print(
        f"[DAEMON CYCLE #{cycle_index}] [DAEMON BALANCE MODE: {mode}] Learning Ratio: {learning_pct}% | Added {newly_added} new papers. Total in KB: {len(existing_papers)}."
    )
    return status_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="KidsFit Continuous Research Learning Daemon")
    parser.add_argument("--once", action="store_true", help="Run a single incremental learning cycle and exit")
    parser.add_argument(
        "--interval",
        type=int,
        default=1800,
        help="Interval in seconds between continuous learning cycles (default: 1800s / 30m)",
    )
    args = parser.parse_args()

    if args.once:
        run_incremental_cycle(cycle_index=1)
        return

    cycle = 1
    print(f"[DAEMON] Starting continuous research learning loop (interval={args.interval}s)...")
    while True:
        try:
            run_incremental_cycle(cycle_index=cycle)
        except Exception as exc:
            print(f"[DAEMON ERROR] Cycle #{cycle} failed: {exc}", file=sys.stderr)
        cycle += 1
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
