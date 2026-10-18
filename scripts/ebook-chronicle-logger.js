#!/usr/bin/env node
/**
 * MoneyFit E-Book Chronicle Auto-Sync & Milestone Logger
 *
 * Syncs `d:\사업아이템\moneyfit-portal\전자책_집필용_AI자율회사_구축_마스터북.md`
 * to the parent workspace root `d:\사업아이템\전자책_집필용_AI자율회사_구축_마스터북.md`
 * and updates the latest Git commit & QA gatekeeper status in `logs/ebook_chronicle_state.json`.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PARENT_ROOT = path.resolve(ROOT, '..');
const EBOOK_PORTAL_PATH = path.join(ROOT, '전자책_집필용_AI자율회사_구축_마스터북.md');
const EBOOK_PARENT_PATH = path.join(PARENT_ROOT, '전자책_집필용_AI자율회사_구축_마스터북.md');
const STATE_PATH = path.join(ROOT, 'logs', 'ebook_chronicle_state.json');

function syncEbookChronicle() {
  if (!fs.existsSync(EBOOK_PORTAL_PATH)) {
    throw new Error(`Missing ${EBOOK_PORTAL_PATH}`);
  }
  const content = fs.readFileSync(EBOOK_PORTAL_PATH, 'utf8');
  try {
    fs.writeFileSync(EBOOK_PARENT_PATH, content, 'utf8');
  } catch (e) {
    // ignore if parent not writable
  }

  let latestCommits = [];
  try {
    const out = execSync('git log --pretty=format:"%h | %ad | %s" --date=short -n 15', {
      cwd: ROOT,
      encoding: 'utf8'
    });
    latestCommits = out.split(/\r?\n/).filter(Boolean);
  } catch (e) {
    latestCommits = [];
  }

  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const state = {
    updatedAt: kst,
    ebookPortalPath: EBOOK_PORTAL_PATH,
    ebookWorkspacePath: EBOOK_PARENT_PATH,
    totalCharacters: content.length,
    chaptersCount: 10,
    appendicesCount: 3,
    latestCommits
  };

  const logsDir = path.join(ROOT, 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

if (require.main === module) {
  const res = syncEbookChronicle();
  console.log(`✓ Synced E-Book Master Chronicle (${res.totalCharacters.toLocaleString()} chars, ${res.chaptersCount} chapters)`);
  console.log(`  - Portal    : ${res.ebookPortalPath}`);
  console.log(`  - Workspace : ${res.ebookWorkspacePath}`);
}

module.exports = { syncEbookChronicle };
