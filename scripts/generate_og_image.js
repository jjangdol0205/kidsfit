/**
 * scripts/generate_og_image.js
 * Generates a high-craft, editorial Toss / Apple Health style OpenGraph preview image (1200x630)
 * using headless Chromium/Edge so typography, anti-aliasing, shadows, and SVG curves look 100% authentic.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_TEMP = path.join(ROOT_DIR, 'logs', 'og_template_render.html');
const OUT_V3 = path.join(ROOT_DIR, 'samples', 'og-kidsfit-studio-v3.png');
const OUT_V2 = path.join(ROOT_DIR, 'samples', 'og-k-growth-ai-v2.png');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    font-family: 'Pretendard', 'Malgun Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #F6F5F0 0%, #EDF1F7 55%, #E8EEF8 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 72px;
    color: #191F28;
    -webkit-font-smoothing: antialiased;
  }

  /* Subtle ambient studio light */
  .ambient-1 {
    position: absolute;
    width: 620px;
    height: 620px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(49, 130, 246, 0.10) 0%, rgba(49, 130, 246, 0) 70%);
    top: -180px;
    right: -80px;
    pointer-events: none;
  }
  .ambient-2 {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%);
    bottom: -200px;
    left: 240px;
    pointer-events: none;
  }

  /* Left Editorial Column */
  .left-col {
    position: relative;
    z-index: 2;
    max-width: 540px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-row {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 26px;
  }
  .brand-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #191F28;
    color: #FFFFFF;
    font-weight: 800;
    font-size: 19px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: -0.02em;
    box-shadow: 0 6px 16px rgba(25, 31, 40, 0.14);
  }
  .brand-name {
    font-size: 18px;
    font-weight: 800;
    color: #191F28;
    letter-spacing: -0.01em;
  }
  .brand-divider {
    width: 1px;
    height: 14px;
    background: #CBD5E1;
    margin: 0 2px;
  }
  .brand-sub {
    font-size: 15px;
    font-weight: 600;
    color: #4E5968;
    letter-spacing: -0.02em;
  }

  .headline {
    font-size: 52px;
    font-weight: 800;
    line-height: 1.24;
    letter-spacing: -0.035em;
    color: #191F28;
    margin-bottom: 20px;
    word-break: keep-all;
  }
  .headline .accent {
    color: #3182F6;
  }

  .subcopy {
    font-size: 21px;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: -0.025em;
    color: #4E5968;
    margin-bottom: 36px;
  }

  .tag-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pill-tag {
    background: #FFFFFF;
    border: 1px solid rgba(25, 31, 40, 0.08);
    border-radius: 999px;
    padding: 10px 18px;
    font-size: 16px;
    font-weight: 700;
    color: #333D4B;
    letter-spacing: -0.02em;
    box-shadow: 0 4px 12px rgba(25, 31, 40, 0.04);
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .pill-dot-blue {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3182F6;
  }
  .pill-dot-green {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00C471;
  }
  .pill-dot-purple {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #8B5CF6;
  }

  /* Right Bento Report Card Preview (Toss / Apple Health style) */
  .right-col {
    position: relative;
    z-index: 2;
    width: 468px;
  }

  .report-card {
    background: #FFFFFF;
    border-radius: 28px;
    padding: 32px 32px 28px;
    box-shadow:
      0 24px 48px -12px rgba(25, 31, 40, 0.10),
      0 4px 16px rgba(25, 31, 40, 0.04),
      0 0 0 1px rgba(25, 31, 40, 0.05);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .card-kicker {
    font-size: 15px;
    font-weight: 700;
    color: #6B7684;
    letter-spacing: -0.02em;
  }
  .card-badge {
    background: #E8F3FF;
    color: #1B64DA;
    font-size: 13px;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 999px;
    letter-spacing: -0.01em;
  }

  .metric-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 22px;
    padding-bottom: 20px;
    border-bottom: 1px solid #F2F4F6;
  }
  .metric-main {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .metric-val {
    font-size: 46px;
    font-weight: 800;
    color: #191F28;
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .metric-unit {
    font-size: 22px;
    font-weight: 700;
    color: #4E5968;
  }
  .metric-delta {
    background: #E6F8F0;
    color: #008A50;
    font-size: 15px;
    font-weight: 800;
    padding: 7px 13px;
    border-radius: 10px;
    letter-spacing: -0.02em;
  }

  /* Clean SVG Growth Trajectory Chart */
  .chart-box {
    background: #F9FAFB;
    border-radius: 18px;
    padding: 18px 20px 14px;
    margin-bottom: 18px;
    border: 1px solid #F2F4F6;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: #6B7684;
    margin-bottom: 8px;
  }
  .chart-legend {
    display: flex;
    gap: 12px;
  }
  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    color: #4E5968;
  }

  /* Bottom Dual Summary Row */
  .mini-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .mini-item {
    background: #F9FAFB;
    border-radius: 14px;
    padding: 13px 15px;
    border: 1px solid #F2F4F6;
  }
  .mini-label {
    font-size: 12px;
    font-weight: 600;
    color: #8B95A1;
    margin-bottom: 4px;
  }
  .mini-value {
    font-size: 15px;
    font-weight: 800;
    color: #191F28;
    letter-spacing: -0.02em;
  }
</style>
</head>
<body>
  <div class="ambient-1"></div>
  <div class="ambient-2"></div>

  <div class="left-col">
    <div class="brand-row">
      <div class="brand-mark">K</div>
      <span class="brand-name">KIDS-FIT</span>
      <div class="brand-divider"></div>
      <span class="brand-sub">질병관리청 성장도표 · K-DST 기준</span>
    </div>

    <h1 class="headline">
      우리 아이 숨은 키와<br>
      <span class="accent">두뇌·학습 골든타임</span><br>
      어디까지 왔을까?
    </h1>

    <p class="subcopy">
      생년월일과 생활 습관으로 확인하는<br>
      신체 성장 궤적 &amp; 연령별 맞춤 학습 리포트
    </p>

    <div class="tag-group">
      <div class="pill-tag"><span class="pill-dot-blue"></span>예상키 3단 분석</div>
      <div class="pill-tag"><span class="pill-dot-green"></span>수면·영양·자세</div>
      <div class="pill-tag"><span class="pill-dot-purple"></span>문해력·수리 성향</div>
    </div>
  </div>

  <div class="right-col">
    <div class="report-card">
      <div class="card-top">
        <span class="card-kicker">맞춤형 성장 · 학습 종합 리포트</span>
        <span class="card-badge">KDCA 표준 백분위 분석</span>
      </div>

      <div class="metric-row">
        <div class="metric-main">
          <span class="metric-val">178.4</span>
          <span class="metric-unit">cm</span>
        </div>
        <div class="metric-delta">잠재키 +6.7cm 회복 가능</div>
      </div>

      <div class="chart-box">
        <div class="chart-header">
          <span>연령별 성장 궤적 시뮬레이션</span>
          <div class="chart-legend">
            <span class="legend-item"><span style="width:8px;height:8px;border-radius:50%;background:#3182F6;display:inline-block;"></span>맞춤 관리 시</span>
            <span class="legend-item"><span style="width:8px;height:8px;border-radius:50%;background:#CBD5E1;display:inline-block;"></span>현재 습관 유지</span>
          </div>
        </div>
        <svg width="364" height="122" viewBox="0 0 364 122" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3182F6" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#3182F6" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <!-- Subtle horizontal guide lines -->
          <line x1="0" y1="26" x2="364" y2="26" stroke="#EAEEF4" stroke-dasharray="4 4"/>
          <line x1="0" y1="64" x2="364" y2="64" stroke="#EAEEF4" stroke-dasharray="4 4"/>
          <line x1="0" y1="102" x2="364" y2="102" stroke="#EAEEF4"/>

          <!-- Unmanaged baseline curve -->
          <path d="M 12 98 C 95 90, 180 76, 348 56" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/>

          <!-- Optimized trajectory area & smooth curve -->
          <path d="M 12 98 C 95 82, 185 45, 348 18 L 348 102 L 12 102 Z" fill="url(#areaGrad)"/>
          <path d="M 12 98 C 95 82, 185 45, 348 18" stroke="#3182F6" stroke-width="4" stroke-linecap="round"/>

          <!-- Key milestone points -->
          <circle cx="140" cy="64" r="5" fill="#FFFFFF" stroke="#3182F6" stroke-width="3"/>
          <circle cx="348" cy="18" r="6.5" fill="#3182F6"/>
          <circle cx="348" cy="18" r="12" fill="#3182F6" fill-opacity="0.18"/>

          <text x="12" y="117" fill="#8B95A1" font-size="11" font-weight="600" font-family="Pretendard, sans-serif">만 7세</text>
          <text x="124" y="117" fill="#4E5968" font-size="11" font-weight="700" font-family="Pretendard, sans-serif">급성장 골든타임</text>
          <text x="312" y="117" fill="#191F28" font-size="11" font-weight="800" font-family="Pretendard, sans-serif">만 18세</text>
        </svg>
      </div>

      <div class="mini-grid">
        <div class="mini-item">
          <div class="mini-label">신체 성장 리포트</div>
          <div class="mini-value">수면 · 영양 · 척추 감압</div>
        </div>
        <div class="mini-item">
          <div class="mini-label">두뇌 · 학습 리포트</div>
          <div class="mini-value">5대 학습역량 · 공부법</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.mkdirSync(path.dirname(HTML_TEMP), { recursive: true });
fs.writeFileSync(HTML_TEMP, html, 'utf8');

// Find Edge or Chrome executable to take a crisp 1200x630 screenshot
const candidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const browserExe = candidates.find((p) => fs.existsSync(p));
if (!browserExe) {
  throw new Error('No Edge or Chrome browser found for rendering OG image');
}

const fileUrl = 'file:///' + HTML_TEMP.replace(/\\/g, '/');
execSync(
  `"${browserExe}" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --force-device-scale-factor=2 --screenshot="${OUT_V3}" "${fileUrl}"`,
  { stdio: 'inherit' }
);
fs.copyFileSync(OUT_V3, OUT_V2);
console.log('Generated OG image:', OUT_V3);
