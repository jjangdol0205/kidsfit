#!/usr/bin/env node
/**
 * 🦉 [제2본부 트리플 10K 자가학습(Self-Learning) & 안티밴(Anti-Ban) 총괄 엔진 엔트리포인트]
 * `division2-creator-adpost-engine.js` (v3.0)과 100% 연동되어 작동합니다.
 */
const engine = require('./division2-creator-adpost-engine');

if (require.main === module) {
  engine.generateDivision2DailyPack();
}

module.exports = engine;
