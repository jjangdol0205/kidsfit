/**
 * KidsFit Korea (kidsfit.co.kr / 제3사업부)
 * Dual-Storage Cloud Sync Engine (src/js/cloud-sync.js)
 *
 * Bridges browser temporary storage (localStorage) to external Cloud DB
 * (Supabase PostgreSQL REST API & /api/cloud-sync edge endpoint).
 * Protects child profiles and 14-day routines from KakaoTalk in-app WebView eviction.
 */

(function (global) {
  'use strict';

  const SYNC_META_KEY = 'kidsfit_cloud_sync_meta_v1';
  const CLIENT_ID_KEY = 'kidsfit_client_device_id_v1';
  const SIBLINGS_KEY = 'kidsfit_child_profiles_v1';
  const COHORT_RECORDS_KEY = 'taller_user_cohort_records_v1';
  const ROUTINE_14D_KEY = 'kidsfit_routine_14d_v1';
  const AUTH_USER_KEY = 'taller_auth_user';
  const UNLOCKED_PASS_KEY = 'kidsfit_unlocked_pass_v1';

  function safeGetItem(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        return localStorage.getItem(key);
      }
    } catch (_) {}
    return null;
  }

  function safeSetItem(key, value) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function getClientId() {
    let cid = safeGetItem(CLIENT_ID_KEY);
    if (!cid || typeof cid !== 'string' || cid.length < 8) {
      const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
      const ts = Date.now().toString(36).toUpperCase();
      cid = `KF-DEV-${ts}-${rand}`;
      safeSetItem(CLIENT_ID_KEY, cid);
    }
    return cid;
  }

  function getSyncMeta() {
    const raw = safeGetItem(SYNC_META_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (_) {}
    }
    return {
      clientId: getClientId(),
      userEmail: null,
      lastSyncedAt: null,
      lastEvent: null,
      syncStatus: 'local_only',
      pendingQueue: []
    };
  }

  function saveSyncMeta(meta) {
    const merged = Object.assign(getSyncMeta(), meta || {}, {
      clientId: getClientId()
    });
    if (Array.isArray(merged.pendingQueue) && merged.pendingQueue.length > 25) {
      merged.pendingQueue = merged.pendingQueue.slice(-25);
    }
    safeSetItem(SYNC_META_KEY, JSON.stringify(merged));
    return merged;
  }

  function parseJsonSafe(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function getActiveUserIdentity() {
    const authUser = parseJsonSafe(safeGetItem(AUTH_USER_KEY), null);
    const unlockedPass = parseJsonSafe(safeGetItem(UNLOCKED_PASS_KEY), null);
    const email = (authUser && authUser.email) || (unlockedPass && unlockedPass.email) || null;
    const name = (authUser && authUser.name) || 'Member';
    const planType = (unlockedPass && unlockedPass.planType) || (authUser && authUser.planType) || 'free';
    const isUnlocked = Boolean(
      (unlockedPass && unlockedPass.unlocked) ||
      (authUser && authUser.unlockedPass) ||
      safeGetItem('kidsfit_unlocked') === 'true' ||
      safeGetItem('taller_report_unlocked') === 'true'
    );
    return {
      clientId: getClientId(),
      email: email ? String(email).trim().toLowerCase() : null,
      name,
      planType,
      unlockedPass: isUnlocked,
      orderId: (unlockedPass && unlockedPass.orderId) || null
    };
  }

  function buildCloudPayload(eventType = 'manual_sync', customData = {}) {
    const identity = getActiveUserIdentity();
    const siblingData = parseJsonSafe(safeGetItem(SIBLINGS_KEY), null);
    const cohortRecords = parseJsonSafe(safeGetItem(COHORT_RECORDS_KEY), []);
    const routineData = parseJsonSafe(safeGetItem(ROUTINE_14D_KEY), {});

    const childrenList = (siblingData && Array.isArray(siblingData.children))
      ? siblingData.children
      : [];

    const ownerPrefix = identity.email || identity.clientId;
    const childProfilesRows = childrenList.map((child, idx) => {
      const slot = child.id || `child_${idx + 1}`;
      return {
        profile_key: `${ownerPrefix}:${slot}`,
        client_id: identity.clientId,
        user_email: identity.email,
        child_slot: slot,
        name: child.name || child.childName || `자녀 ${idx + 1}`,
        gender: child.gender === 'girl' ? 'girl' : 'boy',
        birth_date: child.birthDateStr || null,
        age_months: Number(child.ageMonths || (child.ageYears || 10) * 12),
        height_cm: Number(child.currentHeight || child.heightCm || 137.0),
        weight_kg: Number(child.currentWeight || child.weightKg || 35.5),
        recent_growth_6m_cm: Number(child.recentGrowth6m || child.recentGainCm || 3.0),
        father_height_cm: Number(child.fatherHeight || child.fatherHeightCm || 173.5),
        mother_height_cm: Number(child.motherHeight || child.motherHeightCm || 160.5),
        tanner_phase: child.tannerPhase || 'phase_1',
        habits: Array.isArray(child.habits) ? child.habits : [],
        cognitive_axes: Array.isArray(child.cognitiveAxes) ? child.cognitiveAxes : [],
        region: child.region || '대한민국',
        routine_14d: (routineData && routineData[slot]) ? routineData[slot] : {},
        updated_at: new Date().toISOString()
      };
    });

    const recentLogs = Array.isArray(cohortRecords) ? cohortRecords.slice(-10) : [];
    const growthLogsRows = recentLogs.map((rec) => ({
      id: rec.id || `USR-${Date.now().toString(36).toUpperCase()}`,
      client_id: identity.clientId,
      user_email: identity.email,
      child_slot: rec.childId || 'child_1',
      child_name: rec.childName || '자녀',
      gender: rec.gender === 'girl' ? 'girl' : 'boy',
      birth_date: rec.birthDateStr || null,
      exact_months: Number(rec.exactMonths || 120),
      height_cm: Number(rec.currentHeight || 137.0),
      weight_kg: Number(rec.currentWeight || 35.5),
      cdc_percentile: Number(rec.kdcaPercentile || 50.0),
      z_score: Number(rec.zScore || 0.0),
      mph_cm: Number(rec.mph || 173.5),
      unmanaged_adult_cm: Number(rec.unmanagedHeight || 171.2),
      optimized_adult_cm: Number(rec.optimizedHeight || 180.5),
      potential_gain_cm: Number(rec.potentialGainCm || 7.2),
      habits: Array.isArray(rec.habits) ? rec.habits : [],
      recorded_at: rec.timestamp || new Date().toISOString()
    }));

    return {
      eventType,
      syncedAt: new Date().toISOString(),
      identity,
      tables: {
        users: {
          client_id: identity.clientId,
          email: identity.email,
          name: identity.name,
          plan_type: identity.planType,
          unlocked_pass: identity.unlockedPass,
          updated_at: new Date().toISOString()
        },
        child_profiles: childProfilesRows,
        growth_logs: growthLogsRows,
        payment_order: identity.orderId ? {
          order_id: identity.orderId,
          client_id: identity.clientId,
          user_email: identity.email,
          store_id: '296100',
          plan_type: identity.planType,
          verified: identity.unlockedPass,
          paid_at: new Date().toISOString()
        } : null
      },
      customData
    };
  }

  async function syncToCloud(eventType = 'auto_sync', customData = {}) {
    const payload = buildCloudPayload(eventType, customData);
    const meta = getSyncMeta();
    meta.userEmail = payload.identity.email;
    meta.lastEvent = eventType;

    if (typeof fetch !== 'function') {
      saveSyncMeta(Object.assign(meta, {
        syncStatus: 'local_only',
        lastLocalSnapshotAt: payload.syncedAt
      }));
      return { ok: true, mode: 'local_only', payload };
    }

    try {
      const sbConfig = (typeof window !== 'undefined' && window.KIDSFIT_SUPABASE_CONFIG) || null;
      if (sbConfig && sbConfig.url && sbConfig.anonKey && payload.tables.child_profiles.length > 0) {
        const cleanUrl = String(sbConfig.url).replace(/\/+$/, '');
        await fetch(`${cleanUrl}/rest/v1/child_profiles?on_conflict=profile_key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': sbConfig.anonKey,
            'Authorization': `Bearer ${sbConfig.anonKey}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(payload.tables.child_profiles)
        }).catch(() => {});
      }

      const isStaticMockHost = typeof window !== 'undefined' &&
        window.location &&
        /github\.io/i.test(window.location.hostname || '');

      if (!isStaticMockHost) {
        const response = await fetch('/api/cloud-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response && response.ok) {
          saveSyncMeta({
            userEmail: payload.identity.email,
            lastSyncedAt: payload.syncedAt,
            lastEvent: eventType,
            syncStatus: 'synced',
            pendingQueue: []
          });
          return { ok: true, mode: 'cloud_synced', payload };
        }
      }

      saveSyncMeta({
        userEmail: payload.identity.email,
        lastLocalSnapshotAt: payload.syncedAt,
        lastEvent: eventType,
        syncStatus: 'queued_offline',
        pendingQueue: (meta.pendingQueue || []).concat([{ eventType, syncedAt: payload.syncedAt }])
      });
      return { ok: true, mode: 'queued_offline', payload };
    } catch (_err) {
      saveSyncMeta({
        userEmail: payload.identity.email,
        lastLocalSnapshotAt: payload.syncedAt,
        lastEvent: eventType,
        syncStatus: 'queued_offline',
        pendingQueue: (meta.pendingQueue || []).concat([{ eventType, syncedAt: payload.syncedAt }])
      });
      return { ok: false, mode: 'queued_offline', payload };
    }
  }

  async function restoreFromCloud(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || typeof fetch !== 'function') {
      return { ok: false, restored: false };
    }
    try {
      const res = await fetch(`/api/cloud-sync?email=${encodeURIComponent(cleanEmail)}`);
      if (!res || !res.ok) return { ok: false, restored: false };
      const data = await res.json();
      if (data && data.ok && data.snapshot && data.snapshot.tables) {
        const rows = data.snapshot.tables.child_profiles;
        if (Array.isArray(rows) && rows.length > 0 && global.TallerUserCohortDB) {
          const current = global.TallerUserCohortDB.getSiblingData();
          rows.forEach((row) => {
            const slot = row.child_slot || 'child_1';
            const mapped = {
              id: slot,
              name: row.name || '자녀',
              childName: row.name || '자녀',
              gender: row.gender === 'girl' ? 'girl' : 'boy',
              birthDateStr: row.birth_date || '2016-05-12',
              ageMonths: Number(row.age_months || 120),
              ageYears: Math.floor(Number(row.age_months || 120) / 12),
              currentHeight: Number(row.height_cm || 137.0),
              heightCm: Number(row.height_cm || 137.0),
              currentWeight: Number(row.weight_kg || 35.5),
              weightKg: Number(row.weight_kg || 35.5),
              recentGrowth6m: Number(row.recent_growth_6m_cm || 3.0),
              recentGainCm: Number(row.recent_growth_6m_cm || 3.0),
              fatherHeight: Number(row.father_height_cm || 173.5),
              fatherHeightCm: Number(row.father_height_cm || 173.5),
              motherHeight: Number(row.mother_height_cm || 160.5),
              motherHeightCm: Number(row.mother_height_cm || 160.5),
              tannerPhase: row.tanner_phase || 'phase_1',
              habits: Array.isArray(row.habits) ? row.habits : [],
              cognitiveAxes: Array.isArray(row.cognitive_axes) ? row.cognitive_axes : [],
              region: row.region || '대한민국'
            };
            current.profiles[slot] = mapped;
            const existingIdx = current.children.findIndex((c) => c.id === slot);
            if (existingIdx >= 0) {
              current.children[existingIdx] = mapped;
            } else if (current.children.length < 3) {
              current.children.push(mapped);
            }
          });
          global.TallerUserCohortDB.saveSiblingData(current);
          return { ok: true, restored: true, count: rows.length };
        }
      }
    } catch (_) {}
    return { ok: false, restored: false };
  }

  function attachCohortDbHooks() {
    const db = global.TallerUserCohortDB || global.KidsFitUserCohortDB;
    if (!db || db.__cloudSyncHooked) return false;

    const origSaveSiblingData = db.saveSiblingData;
    if (typeof origSaveSiblingData === 'function') {
      db.saveSiblingData = function (data) {
        const result = origSaveSiblingData.apply(this, arguments);
        try { syncToCloud('sibling_profile_saved'); } catch (_) {}
        return result;
      };
    }

    const origRecordDiagnosis = db.recordUserDiagnosis;
    if (typeof origRecordDiagnosis === 'function') {
      db.recordUserDiagnosis = function (profile, computedMetrics) {
        const record = origRecordDiagnosis.apply(this, arguments);
        try { syncToCloud('diagnosis_recorded', { recordId: record && record.id }); } catch (_) {}
        return record;
      };
    }

    db.__cloudSyncHooked = true;
    return true;
  }

  attachCohortDbHooks();
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', attachCohortDbHooks);
    window.addEventListener('online', function () {
      const meta = getSyncMeta();
      if (Array.isArray(meta.pendingQueue) && meta.pendingQueue.length > 0) {
        syncToCloud('online_queue_flush');
      }
    });
  }

  const KidsFitCloudSync = {
    SYNC_META_KEY,
    CLIENT_ID_KEY,
    getClientId,
    getSyncMeta,
    saveSyncMeta,
    getActiveUserIdentity,
    buildCloudPayload,
    syncToCloud,
    restoreFromCloud,
    attachCohortDbHooks
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KidsFitCloudSync;
  }
  global.KidsFitCloudSync = KidsFitCloudSync;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
