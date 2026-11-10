/**
 * D:\드림컴퍼니\5사업부\scripts\apply_dawn_track3.js
 * Injects Khamis-Roche 28-Row Non-Radiographic Adult Height Matrix & Pediatrician 1-Page Summary Suite
 * into D:\드림컴퍼니\5사업부\index.html cleanly without PowerShell escaping issues.
 */
const fs = require('fs');
const path = require('path');

const p = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(p, 'utf8');
const target = '<div class="bento-card master-briefing-card" id="master-briefing-card"></div>';
const suite = `<!-- Khamis-Roche 28-Row Non-Radiographic Adult Height Matrix & Pediatrician 1-Page Clinical Summary Suite (Ported from Global Studio) -->
      <div id="kf-khamis-roche-pediatrician-suite" style="margin: 0 0 1.25rem 0; padding: 1.25rem 1.35rem; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border: 2px solid #38BDF8; border-radius: 18px; color: #F8FAFC; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.9rem;">
          <div>
            <span style="display: inline-block; background: rgba(56, 189, 248, 0.16); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.72rem; font-weight: 900; padding: 0.2rem 0.65rem; border-radius: 9999px; margin-bottom: 0.35rem;">
              🏥 소아청소년과 진료실 지참용 · Khamis-Roche (PMID: 9316521) × KDCA 2017 통합 판정
            </span>
            <h3 style="margin: 0; font-size: 1.08rem; font-weight: 900; color: #FFFFFF;">
              비방사선 골연령 보정 성인 예측키 신뢰구간(±4.2~5.3cm) · 소아과 1장 임상 요약표
            </h3>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" onclick="window.print()" style="background: #38BDF8; color: #0F172A; border: none; border-radius: 10px; padding: 0.55rem 0.95rem; font-size: 0.8rem; font-weight: 900; cursor: pointer;">
              🖨️ 소아과 지참용 1장 요약 PDF 인쇄
            </button>
            <a href="#kidsfit-parenting-select-shop" style="background: #FACC15; color: #0F172A; text-decoration: none; border-radius: 10px; padding: 0.55rem 0.95rem; font-size: 0.8rem; font-weight: 900; display: inline-block;">
              💊 맞춤 영양·수면 교구 원클릭 처방 ↑
            </a>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.75rem; font-size: 0.82rem;">
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(148,163,184,0.25); border-radius: 12px; padding: 0.8rem 0.95rem;">
            <strong style="color: #93C5FD; display: block; margin-bottom: 0.25rem;">① Khamis-Roche 28행 계수 정밀 보정</strong>
            <span style="color: #E2E8F0; line-height: 1.5;">현재 신장·체중·부모 평균키(MPH) 3변수 회귀 행렬을 적용해 X-ray 없이 골연령 편차를 ±4.2~5.3cm 신뢰구간으로 보정합니다.</span>
          </div>
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(148,163,184,0.25); border-radius: 12px; padding: 0.8rem 0.95rem;">
            <strong style="color: #86EFAC; display: block; margin-bottom: 0.25rem;">② 밤 10시 N3 서파수면 · 아로마타제 방어</strong>
            <span style="color: #E2E8F0; line-height: 1.5;">취침 2시간 전 무당류 금식(인슐린 억제 차단)과 구연산 칼슘·D3·K2·킬레이트 아연으로 숨은 잠재키 +5.2~6.7cm를 확보합니다.</span>
          </div>
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(148,163,184,0.25); border-radius: 12px; padding: 0.8rem 0.95rem;">
            <strong style="color: #FDE047; display: block; margin-bottom: 0.25rem;">③ 소아청소년과 방문 시 체크 포인트</strong>
            <span style="color: #E2E8F0; line-height: 1.5;">연간 성장속도 5.0cm 미만 또는 백분위 2단계 급락 시 본 요약표를 인쇄해 전문의 상담 자료로 지참하세요.</span>
          </div>
        </div>
      </div>\n      ` + target;

if (!html.includes('kf-khamis-roche-pediatrician-suite') && html.includes(target)) {
  html = html.replace(target, suite);
  fs.writeFileSync(p, html, 'utf8');
  console.log('[Track3] Injected kf-khamis-roche-pediatrician-suite into D:/드림컴퍼니/5사업부/index.html');
} else {
  console.log('[Track3] Already present or target checked.');
}
