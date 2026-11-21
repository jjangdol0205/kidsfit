"""
Pre-Flight Automated Compliance Verification Engine
File: compliance_gate.py
Author: shorts_reels_strategy Engineering Team
Project: shorts_reels_strategy (2026)

Verifies:
1. Visual Transformation: Genuine Pure-Python 2D-DCT Perceptual Hash (pHash) Hamming distance >= 18.
2. Acoustic Isolation: Chromaprint / acoustic overlap containment <= 0.20 (20%).
3. Editorial Novelty: Transcript regex n-gram shingling token uniqueness >= 0.75 (75%).

Implementation Note:
This module contains an authentic, mathematically exact, pure-Python 2D Discrete Cosine Transform
(DCT-II) algorithm using standard library math and list matrix operations (zero third-party
binary dependencies required). It implements bilinear interpolation to 32x32, separable 1D DCT passes,
8x8 low-frequency coefficient extraction (excluding DC [0,0]), and 64-bit perceptual hash generation.
"""

import sys
import os
import math
import re
from typing import Dict, Any, List, Union

# Ensure safe UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Pure-Python 2D-DCT Perceptual Hashing Pipeline
# ---------------------------------------------------------------------------

# Precomputed cosine tables for 32x32 spatial grid -> 8x8 DCT-II frequency space
# COS_TABLE[v][y] = cos((2*y + 1) * v * pi / 64.0)
COS_TABLE: List[List[float]] = [
    [math.cos((2 * y + 1) * v * math.pi / 64.0) for y in range(32)]
    for v in range(8)
]
ALPHA: List[float] = [1.0 / math.sqrt(2.0)] + [1.0] * 7


def normalize_frame_to_32x32(
    data: Union[bytes, bytearray, List[List[float]], List[List[int]]],
    width: int = 0,
    height: int = 0,
) -> List[List[float]]:
    """
    Normalizes any frame representation into a 32x32 float luminance matrix.
    Supports:
    - 2D pixel grid List[List[numeric]]
    - 1D raw byte buffer with explicit (width, height)
    - 1D raw byte buffer of 1024 bytes (32x32)
    - Arbitrary byte buffer of length L (mapped to square grid and bilinearly interpolated)
    """
    if isinstance(data, list):
        if not data or not data[0]:
            return [[0.0] * 32 for _ in range(32)]
        H_in, W_in = len(data), len(data[0])
        grid = data
    elif isinstance(data, (bytes, bytearray)):
        L = len(data)
        if L == 0:
            return [[0.0] * 32 for _ in range(32)]
        if width > 0 and height > 0 and L >= width * height:
            W_in, H_in = width, height
            grid = [[float(data[r * W_in + c]) for c in range(W_in)] for r in range(H_in)]
        elif L == 1024:
            return [[float(data[r * 32 + c]) for c in range(32)] for r in range(32)]
        else:
            S = math.isqrt(L)
            if S * S < L:
                S += 1
            W_in, H_in = S, S
            grid = []
            idx = 0
            for r in range(S):
                row = []
                for c in range(S):
                    if idx < L:
                        row.append(float(data[idx]))
                        idx += 1
                    else:
                        row.append(0.0)
                grid.append(row)
    else:
        raise TypeError(f"Unsupported frame data type: {type(data).__name__}")

    if W_in == 32 and H_in == 32:
        return grid

    # Bilinear interpolation
    resized = [[0.0] * 32 for _ in range(32)]
    scale_y = (H_in - 1) / 31.0 if H_in > 1 else 0.0
    scale_x = (W_in - 1) / 31.0 if W_in > 1 else 0.0

    for r in range(32):
        sy = r * scale_y
        r0 = int(sy)
        r1 = min(r0 + 1, H_in - 1)
        dy = sy - r0
        for c in range(32):
            sx = c * scale_x
            c0 = int(sx)
            c1 = min(c0 + 1, W_in - 1)
            dx = sx - c0
            resized[r][c] = (
                grid[r0][c0] * (1.0 - dy) * (1.0 - dx)
                + grid[r0][c1] * (1.0 - dy) * dx
                + grid[r1][c0] * dy * (1.0 - dx)
                + grid[r1][c1] * dy * dx
            )
    return resized


def compute_dct_8x8(matrix_32x32: List[List[float]]) -> List[List[float]]:
    """
    Computes the top-left 8x8 DCT-II coefficients using separable 1D row/column transforms.
    Complexity: O(32*8*32 + 8*8*32) = 10,240 FLOPs (~1ms in pure Python).
    """
    # 1. Row transform
    R = [[0.0] * 8 for _ in range(32)]
    for x in range(32):
        row = matrix_32x32[x]
        for v in range(8):
            cv = COS_TABLE[v]
            s = 0.0
            for y in range(32):
                s += row[y] * cv[y]
            R[x][v] = s

    # 2. Column transform
    D = [[0.0] * 8 for _ in range(8)]
    for u in range(8):
        cu = COS_TABLE[u]
        au = ALPHA[u]
        for v in range(8):
            av = ALPHA[v]
            s = 0.0
            for x in range(32):
                s += R[x][v] * cu[x]
            D[u][v] = au * av * s
    return D


def compute_dct_phash(
    data: Union[bytes, bytearray, List[List[float]], List[List[int]]],
    width: int = 0,
    height: int = 0,
) -> int:
    """
    Computes a genuine 64-bit 2D Discrete Cosine Transform (DCT-II) perceptual hash.
    
    Algorithm:
    1. Normalizes arbitrary frame representations into a 32x32 grayscale luminance matrix.
    2. Computes the 2D DCT-II to extract top-left 8x8 low-frequency coefficients.
    3. Computes the median of the 63 AC coefficients (excluding DC [0,0]).
    4. Generates a 64-bit integer hash where bit[i] = 1 if coeff[i] > median else 0.
    """
    m32 = normalize_frame_to_32x32(data, width, height)
    D = compute_dct_8x8(m32)
    ac_coeffs = [D[u][v] for u in range(8) for v in range(8) if not (u == 0 and v == 0)]
    median = sorted(ac_coeffs)[len(ac_coeffs) // 2]
    h = 0
    for u in range(8):
        for v in range(8):
            bit = 1 if D[u][v] > median else 0
            h = (h << 1) | bit
    return h


# Backward compatibility alias
compute_mock_phash = compute_dct_phash


def hamming_distance_64(hash1: int, hash2: int) -> int:
    """Calculates bitwise Hamming distance between two 64-bit integer hashes."""
    x = (hash1 ^ hash2) & 0xFFFFFFFFFFFFFFFF
    return bin(x).count("1")


# ---------------------------------------------------------------------------
# PreFlightComplianceEngine Class
# ---------------------------------------------------------------------------

class PreFlightComplianceEngine:
    def __init__(
        self,
        min_phash_distance: int = 18,
        max_audio_overlap: float = 0.20,
        min_script_uniqueness: float = 0.75,
        shingle_size: int = 3,
    ):
        self.min_phash_dist = min_phash_distance
        self.max_audio_overlap = max_audio_overlap
        self.min_script_uniq = min_script_uniqueness
        self.shingle_size = shingle_size

    def verify_visual_transformation(
        self,
        src_data: Any,
        rendered_data: Any,
        width: int = 0,
        height: int = 0,
    ) -> Dict[str, Any]:
        """Evaluates whether spatial transformation sufficiently broke the perceptual hash."""
        h_src = compute_dct_phash(src_data, width, height)
        h_render = compute_dct_phash(rendered_data, width, height)
        dist = hamming_distance_64(h_src, h_render)

        passed = dist >= self.min_phash_dist
        return {
            "check": "visual_phash_hamming",
            "score": dist,
            "threshold": self.min_phash_dist,
            "passed": passed,
            "details": f"Hamming Distance {dist} (Required >= {self.min_phash_dist})"
        }

    def verify_acoustic_isolation(self, src_tokens: List[int], rendered_tokens: List[int]) -> Dict[str, Any]:
        """
        Evaluates acoustic fingerprint overlap.
        Normalizes by len(set_render) to enforce containment: short clips extracted
        from long sources are accurately measured as high overlap.
        """
        set_src = set(src_tokens)
        set_render = set(rendered_tokens)
        if not set_src or not set_render:
            overlap = 0.0
        else:
            intersection = set_src.intersection(set_render)
            overlap = len(intersection) / max(len(set_render), 1)

        passed = overlap <= self.max_audio_overlap
        return {
            "check": "acoustic_fingerprint_overlap",
            "score": round(overlap, 4),
            "threshold": self.max_audio_overlap,
            "passed": passed,
            "details": f"Overlap {overlap:.2%} (Permissible <= {self.max_audio_overlap:.2%})"
        }

    def verify_script_originality(self, src_text: str, rendered_script: str) -> Dict[str, Any]:
        """
        Evaluates textual lexical novelty with Unicode regex punctuation stripping
        and n-gram shingling to verify substantive editorial transformation.
        """
        clean_src = re.sub(r'[^\w\s]', '', src_text.lower())
        clean_render = re.sub(r'[^\w\s]', '', rendered_script.lower())

        words_src = clean_src.split()
        words_render = clean_render.split()

        if not words_render:
            uniqueness = 0.0
        else:
            n = self.shingle_size
            if len(words_render) >= n and len(words_src) >= n:
                shingles_src = set(tuple(words_src[i:i + n]) for i in range(len(words_src) - n + 1))
                shingles_render = set(tuple(words_render[i:i + n]) for i in range(len(words_render) - n + 1))
                common = shingles_src.intersection(shingles_render)
                uniqueness = 1.0 - (len(common) / max(len(shingles_render), 1))
            else:
                set_src = set(words_src)
                set_render = set(words_render)
                common = set_src.intersection(set_render)
                uniqueness = 1.0 - (len(common) / max(len(set_render), 1))

        passed = uniqueness >= self.min_script_uniq
        return {
            "check": "script_lexical_uniqueness",
            "score": round(uniqueness, 4),
            "threshold": self.min_script_uniq,
            "passed": passed,
            "details": f"Lexical Novelty {uniqueness:.2%} (Required >= {self.min_script_uniq:.2%})"
        }

    def evaluate_video_candidate(
        self,
        src_frame_bytes: Any,
        rendered_frame_bytes: Any,
        src_audio_fp: List[int],
        rendered_audio_fp: List[int],
        src_transcript: str,
        rendered_script: str,
    ) -> Dict[str, Any]:
        v_res = self.verify_visual_transformation(src_frame_bytes, rendered_frame_bytes)
        a_res = self.verify_acoustic_isolation(src_audio_fp, rendered_audio_fp)
        s_res = self.verify_script_originality(src_transcript, rendered_script)

        all_passed = v_res["passed"] and a_res["passed"] and s_res["passed"]

        return {
            "verdict": "PASSED" if all_passed else "REJECTED",
            "all_passed": all_passed,
            "checks": {
                "visual": v_res,
                "audio": a_res,
                "editorial": s_res,
            }
        }


# ---------------------------------------------------------------------------
# Test Harness
# ---------------------------------------------------------------------------

def run_tests():
    print("=" * 60)
    print("PRE-FLIGHT COMPLIANCE VERIFICATION ENGINE -- TEST HARNESS")
    print("=" * 60)

    engine = PreFlightComplianceEngine(min_phash_distance=18, max_audio_overlap=0.20, min_script_uniqueness=0.75)

    # Test Case 1: Superficial Scraping (Should FAIL)
    raw_frame = b"VIRAL_VIDEO_PIXEL_DATA_STREAM_001_ORIGINAL"
    superficial_frame = b"VIRAL_VIDEO_PIXEL_DATA_STREAM_001_ORIGINAL"  # identical frame
    src_audio = [101, 102, 103, 104, 105, 106, 107]
    superficial_audio = [101, 102, 103, 104, 105, 106, 107]  # identical audio
    src_text = "Look at this insane trickshot he did yesterday"
    superficial_script = "Look at this insane trickshot he did yesterday"

    res1 = engine.evaluate_video_candidate(raw_frame, superficial_frame, src_audio, superficial_audio, src_text, superficial_script)
    print(f"\n[TEST 1] Superficial Scraped Clip Result: {res1['verdict']}")
    print(f" -> Visual Pass: {res1['checks']['visual']['passed']} ({res1['checks']['visual']['details']})")
    print(f" -> Audio Pass:  {res1['checks']['audio']['passed']} ({res1['checks']['audio']['details']})")
    print(f" -> Script Pass: {res1['checks']['editorial']['passed']} ({res1['checks']['editorial']['details']})")
    assert res1["all_passed"] is False, "Test 1 must fail superficial clip!"

    # Test Case 2: Transformative Hybrid Model (Should PASS)
    transformed_frame = b"HYBRID_TRANSFORMED_45PERCENT_DEVICE_BEZEL_CANVAS"
    hybrid_audio = [999, 998, 997, 996, 995, 994, 993]  # Clean cloned studio narration
    hybrid_script = "In 1943, Bletchley Park cryptanalysts engineered the Colossus computing architecture to break Lorenz cipher streams."

    res2 = engine.evaluate_video_candidate(raw_frame, transformed_frame, src_audio, hybrid_audio, src_text, hybrid_script)
    print(f"\n[TEST 2] Transformative Hybrid Asset Result: {res2['verdict']}")
    print(f" -> Visual Pass: {res2['checks']['visual']['passed']} ({res2['checks']['visual']['details']})")
    print(f" -> Audio Pass:  {res2['checks']['audio']['passed']} ({res2['checks']['audio']['details']})")
    print(f" -> Script Pass: {res2['checks']['editorial']['passed']} ({res2['checks']['editorial']['details']})")
    assert res2["all_passed"] is True, "Test 2 must pass genuine hybrid transformation!"

    # Test Case 3: Acoustic Asymmetry Attack (50 tokens stolen from 1000) (Should FAIL)
    res3 = engine.verify_acoustic_isolation(list(range(1, 1001)), list(range(1, 51)))
    print(f"\n[TEST 3] Acoustic Asymmetry Attack Result: {'PASSED' if res3['passed'] else 'REJECTED'}")
    print(f" -> Audio Overlap: {res3['details']} (Passed: {res3['passed']})")
    assert res3["passed"] is False, "Acoustic containment attack must fail!"

    # Test Case 4: Transcript Punctuation Attack (Should FAIL)
    src_text_punct = "Turing engineered the Colossus computing architecture to break cipher streams"
    copied_punct = "Turing? engineered! the 'Colossus' \"computing\" architecture; to break: cipher? streams!"
    res4 = engine.verify_script_originality(src_text_punct, copied_punct)
    print(f"\n[TEST 4] Script Punctuation Attack Result: {'PASSED' if res4['passed'] else 'REJECTED'}")
    print(f" -> Script Novelty: {res4['details']} (Passed: {res4['passed']})")
    assert res4["passed"] is False, "Script punctuation attack must fail!"

    # Test Case 5: 1-Byte Noise Attack (Should FAIL - Distance < 18)
    f_orig = b"FRAME_DATA_EXACT_PIXELS_00000000000000000000000000000000"
    f_1byte = b"FRAME_DATA_EXACT_PIXELS_00000000000000000000000000000001"
    res5 = engine.verify_visual_transformation(f_orig, f_1byte)
    print(f"\n[TEST 5] Visual 1-Byte Noise Attack Result: {'PASSED' if res5['passed'] else 'REJECTED'}")
    print(f" -> Visual Distance: {res5['details']} (Passed: {res5['passed']})")
    assert res5["passed"] is False, "1-byte noise must remain rejected!"

    # Test Case 6: Synthetic Noise vs Genuine Transformation
    base_frame = [[float((x - 16)**2 + (y - 12)**2 + (x * 7 + y * 11) % 50) for y in range(32)] for x in range(32)]
    noise_frame = [[float((x - 16)**2 + (y - 12)**2 + (x * 7 + y * 11) % 50 + (2.0 if (x+y)%2==0 else -2.0)) for y in range(32)] for x in range(32)]
    diff_frame = [[float((x * 19 - y * 23) % 256) for y in range(32)] for x in range(32)]
    res6_noise = engine.verify_visual_transformation(base_frame, noise_frame)
    res6_diff = engine.verify_visual_transformation(base_frame, diff_frame)
    print(f"\n[TEST 6] Synthetic Noise vs Genuine Transformation Result:")
    print(f" -> Slight Noise: {res6_noise['details']} (Passed: {res6_noise['passed']})")
    print(f" -> Distinct Scene: {res6_diff['details']} (Passed: {res6_diff['passed']})")
    assert res6_noise["passed"] is False, "Slight noise must remain rejected!"
    assert res6_diff["passed"] is True, "Distinct scene must pass!"

    print("\n" + "=" * 60)
    print("ALL COMPLIANCE GATE SELF-TEST SUITES PASSED SUCCESSFULLY.")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
