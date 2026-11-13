#!/usr/bin/env node
/**
 * [Zero-Ban Neutralized Guard]
 * Division 5 (kidsfit.co.kr) strictly isolates Korean passive clinical SEO from Division 2 (Global English).
 * Legacy cross-division global_auto_promotion_engine.js has been safely neutralized here so it can never
 * overwrite kidsfit.co.kr sitemaps, feeds, or IndexNow pings with foreign host URLs.
 */

'use strict';

async function runAutoPromotionEngine() {
  const msg = '[KFK Guard] global_auto_promotion_engine.js is disabled in 5사업부. Use python scripts/kfk_hourly_passive_promo.py instead.';
  console.log(msg);
  return { skipped: true, reason: msg };
}

if (require.main === module) {
  runAutoPromotionEngine();
}

module.exports = { runAutoPromotionEngine };
