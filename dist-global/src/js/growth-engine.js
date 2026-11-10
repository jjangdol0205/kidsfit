/**
 * Taller Bio Labs - Auxology & Skeletal Maturation Engine (src/js/growth-engine.js)
 * Implements Core 1:
 * - US CDC 2000 & KDCA 2017 LMS Box-Cox Z-Score & erf normal CDF percentiles (Height, Weight, BMI)
 * - Tanner Mid-Parental Height (MPH +/- 8.5cm)
 * - Annualized Growth Velocity (cm/yr) with < 4.0 cm/yr pediatric red-flag alert
 * - 3 Adult Predicted Height Trajectories (Genetic baseline, Unmanaged -5cm cap, Optimized +5~+9.2cm)
 * - Interactive 3-curve SVG chart with tooltips, percentile bands (P3, P50, P97), and pulse dot
 */

(function (global) {
  'use strict';

  // 1. Data Loader (Node.js require or Browser global/embedded)
  let growthData = null;
  let authoritiesData = null;
  let researchData = null;

  if (typeof require !== 'undefined') {
    try {
      growthData = require('../data/growth-standards.json');
    } catch (e) {}
    try {
      authoritiesData = require('../data/official-authorities.json');
    } catch (e) {}
    try {
      researchData = require('../data/research-knowledge-base.json');
    } catch (e) {}
  }
  if (!growthData && typeof window !== 'undefined' && window.KIDSFIT_GROWTH_DATA) {
    growthData = window.KIDSFIT_GROWTH_DATA;
  }
  if (!authoritiesData && typeof window !== 'undefined' && window.KIDSFIT_AUTHORITIES_DATA) {
    authoritiesData = window.KIDSFIT_AUTHORITIES_DATA;
  }
  if (!researchData && typeof window !== 'undefined' && window.KIDSFIT_RESEARCH_DATA) {
    researchData = window.KIDSFIT_RESEARCH_DATA;
  }

  // Fallback table for standalone operation
  const FALLBACK_KDCA = {
    boy: [
      { m: 12, L: 1.0, M: 75.7, S: 0.0337, p3: 71.0, p50: 75.7, p97: 80.5, wM: 9.8, wS: 0.102, bmiP5: 14.5, bmiP50: 17.0, bmiP85: 18.8, bmiP95: 19.8 },
      { m: 24, L: 1.0, M: 87.1, S: 0.0371, p3: 81.0, p50: 87.1, p97: 93.2, wM: 12.3, wS: 0.107, bmiP5: 14.0, bmiP50: 16.2, bmiP85: 17.8, bmiP95: 18.8 },
      { m: 36, L: 1.0, M: 96.5, S: 0.0401, p3: 89.7, p50: 96.5, p97: 104.4, wM: 14.7, wS: 0.115, bmiP5: 13.8, bmiP50: 15.8, bmiP85: 17.4, bmiP95: 18.4 },
      { m: 48, L: 1.0, M: 103.1, S: 0.0416, p3: 95.6, p50: 103.1, p97: 111.2, wM: 16.7, wS: 0.124, bmiP5: 13.6, bmiP50: 15.7, bmiP85: 17.3, bmiP95: 18.5 },
      { m: 60, L: 1.0, M: 109.6, S: 0.0429, p3: 101.6, p50: 109.6, p97: 118.0, wM: 19.0, wS: 0.136, bmiP5: 13.6, bmiP50: 15.8, bmiP85: 17.6, bmiP95: 19.0 },
      { m: 72, L: 1.0, M: 115.5, S: 0.0441, p3: 106.7, p50: 115.5, p97: 124.5, wM: 21.5, wS: 0.149, bmiP5: 13.7, bmiP50: 16.0, bmiP85: 18.1, bmiP95: 19.8 },
      { m: 84, L: 1.0, M: 121.1, S: 0.0453, p3: 111.5, p50: 121.1, p97: 130.9, wM: 24.4, wS: 0.163, bmiP5: 13.9, bmiP50: 16.5, bmiP85: 19.0, bmiP95: 21.0 },
      { m: 96, L: 1.0, M: 126.5, S: 0.0468, p3: 116.0, p50: 126.5, p97: 137.1, wM: 27.6, wS: 0.175, bmiP5: 14.1, bmiP50: 17.1, bmiP85: 20.0, bmiP95: 22.3 },
      { m: 108, L: 1.0, M: 131.7, S: 0.0483, p3: 120.3, p50: 131.7, p97: 143.3, wM: 31.3, wS: 0.184, bmiP5: 14.4, bmiP50: 17.8, bmiP85: 21.1, bmiP95: 23.6 },
      { m: 120, L: 1.0, M: 137.0, S: 0.0498, p3: 124.5, p50: 137.0, p97: 149.7, wM: 35.5, wS: 0.190, bmiP5: 14.8, bmiP50: 18.6, bmiP85: 22.1, bmiP95: 24.8 },
      { m: 132, L: 1.0, M: 142.5, S: 0.0521, p3: 128.8, p50: 142.5, p97: 156.4, wM: 40.2, wS: 0.193, bmiP5: 15.2, bmiP50: 19.4, bmiP85: 23.0, bmiP95: 25.8 },
      { m: 144, L: 1.0, M: 148.7, S: 0.0545, p3: 133.5, p50: 148.7, p97: 163.9, wM: 45.4, wS: 0.191, bmiP5: 15.7, bmiP50: 20.1, bmiP85: 23.8, bmiP95: 26.6 },
      { m: 156, L: 1.0, M: 155.6, S: 0.0558, p3: 138.9, p50: 155.6, p97: 171.9, wM: 51.0, wS: 0.185, bmiP5: 16.3, bmiP50: 20.8, bmiP85: 24.4, bmiP95: 27.2 },
      { m: 168, L: 1.0, M: 162.4, S: 0.0560, p3: 145.1, p50: 162.4, p97: 179.5, wM: 56.5, wS: 0.176, bmiP5: 16.9, bmiP50: 21.3, bmiP85: 24.9, bmiP95: 27.6 },
      { m: 180, L: 1.0, M: 167.4, S: 0.0489, p3: 151.3, p50: 167.4, p97: 182.2, wM: 61.0, wS: 0.168, bmiP5: 17.4, bmiP50: 21.7, bmiP85: 25.2, bmiP95: 27.9 },
      { m: 192, L: 1.0, M: 170.0, S: 0.0441, p3: 155.7, p50: 170.0, p97: 184.1, wM: 63.8, wS: 0.162, bmiP5: 17.8, bmiP50: 22.0, bmiP85: 25.4, bmiP95: 28.0 },
      { m: 204, L: 1.0, M: 171.4, S: 0.0436, p3: 157.9, p50: 171.4, p97: 185.5, wM: 65.3, wS: 0.158, bmiP5: 18.1, bmiP50: 22.2, bmiP85: 25.5, bmiP95: 28.1 },
      { m: 216, L: 1.0, M: 172.0, S: 0.0430, p3: 158.6, p50: 172.0, p97: 185.8, wM: 66.2, wS: 0.155, bmiP5: 18.3, bmiP50: 22.4, bmiP85: 25.6, bmiP95: 28.2 },
      { m: 240, L: 1.0, M: 172.0, S: 0.0430, p3: 158.8, p50: 172.0, p97: 186.0, wM: 67.2, wS: 0.152, bmiP5: 18.6, bmiP50: 22.6, bmiP85: 25.8, bmiP95: 28.4 }
    ],
    girl: [
      { m: 12, L: 1.0, M: 74.0, S: 0.0349, p3: 69.2, p50: 74.0, p97: 78.9, wM: 9.2, wS: 0.105, bmiP5: 14.1, bmiP50: 16.6, bmiP85: 18.4, bmiP95: 19.4 },
      { m: 24, L: 1.0, M: 85.7, S: 0.0384, p3: 79.3, p50: 85.7, p97: 92.1, wM: 11.7, wS: 0.111, bmiP5: 13.7, bmiP50: 15.9, bmiP85: 17.5, bmiP95: 18.5 },
      { m: 36, L: 1.0, M: 95.4, S: 0.0409, p3: 88.1, p50: 95.4, p97: 103.0, wM: 14.1, wS: 0.119, bmiP5: 13.5, bmiP50: 15.5, bmiP85: 17.2, bmiP95: 18.2 },
      { m: 48, L: 1.0, M: 102.2, S: 0.0422, p3: 94.4, p50: 102.2, p97: 110.1, wM: 16.1, wS: 0.129, bmiP5: 13.4, bmiP50: 15.4, bmiP85: 17.2, bmiP95: 18.4 },
      { m: 60, L: 1.0, M: 108.4, S: 0.0435, p3: 99.9, p50: 108.4, p97: 117.0, wM: 18.3, wS: 0.141, bmiP5: 13.4, bmiP50: 15.5, bmiP85: 17.4, bmiP95: 18.8 },
      { m: 72, L: 1.0, M: 114.7, S: 0.0445, p3: 106.6, p50: 114.7, p97: 123.3, wM: 20.8, wS: 0.153, bmiP5: 13.5, bmiP50: 15.7, bmiP85: 17.8, bmiP95: 19.4 },
      { m: 84, L: 1.0, M: 120.8, S: 0.0460, p3: 112.2, p50: 120.8, p97: 130.2, wM: 23.6, wS: 0.165, bmiP5: 13.6, bmiP50: 16.1, bmiP85: 18.5, bmiP95: 20.3 },
      { m: 96, L: 1.0, M: 126.7, S: 0.0478, p3: 117.5, p50: 126.7, p97: 137.1, wM: 26.8, wS: 0.175, bmiP5: 13.8, bmiP50: 16.6, bmiP85: 19.3, bmiP95: 21.3 },
      { m: 108, L: 1.0, M: 132.6, S: 0.0501, p3: 122.8, p50: 132.6, p97: 144.1, wM: 30.5, wS: 0.183, bmiP5: 14.1, bmiP50: 17.2, bmiP85: 20.2, bmiP95: 22.3 },
      { m: 120, L: 1.0, M: 139.1, S: 0.0526, p3: 128.2, p50: 139.1, p97: 151.2, wM: 34.8, wS: 0.187, bmiP5: 14.5, bmiP50: 17.9, bmiP85: 21.1, bmiP95: 23.3 },
      { m: 132, L: 1.0, M: 145.8, S: 0.0532, p3: 133.8, p50: 145.8, p97: 157.6, wM: 39.7, wS: 0.186, bmiP5: 15.0, bmiP50: 18.6, bmiP85: 21.9, bmiP95: 24.2 },
      { m: 144, L: 1.0, M: 151.7, S: 0.0494, p3: 139.5, p50: 151.7, p97: 162.6, wM: 44.5, wS: 0.180, bmiP5: 15.5, bmiP50: 19.3, bmiP85: 22.6, bmiP95: 24.9 },
      { m: 156, L: 1.0, M: 155.9, S: 0.0438, p3: 144.7, p50: 155.9, p97: 166.0, wM: 48.6, wS: 0.171, bmiP5: 16.1, bmiP50: 19.9, bmiP85: 23.2, bmiP95: 25.5 },
      { m: 168, L: 1.0, M: 158.3, S: 0.0416, p3: 147.9, p50: 158.3, p97: 168.1, wM: 51.5, wS: 0.162, bmiP5: 16.6, bmiP50: 20.4, bmiP85: 23.6, bmiP95: 25.9 },
      { m: 180, L: 1.0, M: 159.5, S: 0.0408, p3: 149.3, p50: 159.5, p97: 169.2, wM: 53.2, wS: 0.155, bmiP5: 17.0, bmiP50: 20.8, bmiP85: 23.9, bmiP95: 26.2 },
      { m: 192, L: 1.0, M: 160.0, S: 0.0403, p3: 150.3, p50: 160.0, p97: 169.8, wM: 54.1, wS: 0.150, bmiP5: 17.2, bmiP50: 21.0, bmiP85: 24.1, bmiP95: 26.3 },
      { m: 204, L: 1.0, M: 160.2, S: 0.0400, p3: 151.0, p50: 160.2, p97: 170.1, wM: 54.5, wS: 0.147, bmiP5: 17.4, bmiP50: 21.1, bmiP85: 24.2, bmiP95: 26.4 },
      { m: 216, L: 1.0, M: 160.3, S: 0.0398, p3: 151.2, p50: 160.3, p97: 170.2, wM: 54.7, wS: 0.145, bmiP5: 17.5, bmiP50: 21.2, bmiP85: 24.3, bmiP95: 26.5 },
      { m: 240, L: 1.0, M: 160.5, S: 0.0395, p3: 151.4, p50: 160.5, p97: 170.4, wM: 55.0, wS: 0.143, bmiP5: 17.7, bmiP50: 21.4, bmiP85: 24.5, bmiP95: 26.7 }
    ]
  };

  /**
   * Published Khamis-Roche Empirical Regression Coefficients (Ages 4.0 to 17.5 in 0.5-yr intervals)
   * Source: Khamis HJ, Roche AF. "Predicting adult stature without using skeletal age: the Khamis-Roche method."
   * Pediatrics. 1994;94(4):504-507 and erratum Pediatrics. 1995;95(3):457.
   * Regression equation:
   *   Predicted Adult Height (in) = b0 + (b1 * Height_in) + (b2 * Weight_lbs) + (b3 * MidParentStature_in)
   * 28 rows per sex. 90% confidence corridor: ±5.34 cm (±2.1 in) boys, ±4.25 cm (±1.7 in) girls.
   */
  const KHAMIS_ROCHE_COEFFICIENTS = {
    boy: [
      { age: 4.0, b0: -10.25670, b1: 1.23812, b2: -0.087235, b3: 0.50286 },
      { age: 4.5, b0: -10.71900, b1: 1.15964, b2: -0.074454, b3: 0.52887 },
      { age: 5.0, b0: -11.02130, b1: 1.10674, b2: -0.064778, b3: 0.53919 },
      { age: 5.5, b0: -11.15560, b1: 1.07480, b2: -0.057760, b3: 0.53691 },
      { age: 6.0, b0: -11.11380, b1: 1.05923, b2: -0.052947, b3: 0.52513 },
      { age: 6.5, b0: -11.02210, b1: 1.05542, b2: -0.049892, b3: 0.50692 },
      { age: 7.0, b0: -10.99840, b1: 1.05877, b2: -0.048144, b3: 0.48538 },
      { age: 7.5, b0: -11.02140, b1: 1.06467, b2: -0.047256, b3: 0.46361 },
      { age: 8.0, b0: -11.06960, b1: 1.06853, b2: -0.046778, b3: 0.44469 },
      { age: 8.5, b0: -11.12200, b1: 1.06572, b2: -0.046261, b3: 0.43171 },
      { age: 9.0, b0: -11.15710, b1: 1.05166, b2: -0.045254, b3: 0.42776 },
      { age: 9.5, b0: -11.14050, b1: 1.02174, b2: -0.043311, b3: 0.43593 },
      { age: 10.0, b0: -11.03800, b1: 0.97135, b2: -0.039981, b3: 0.45932 },
      { age: 10.5, b0: -10.82860, b1: 0.89589, b2: -0.034814, b3: 0.50101 },
      { age: 11.0, b0: -10.49170, b1: 0.81239, b2: -0.029050, b3: 0.54781 },
      { age: 11.5, b0: -10.00650, b1: 0.74134, b2: -0.024167, b3: 0.58409 },
      { age: 12.0, b0: -9.35220, b1: 0.68325, b2: -0.020076, b3: 0.60927 },
      { age: 12.5, b0: -8.60550, b1: 0.63869, b2: -0.016681, b3: 0.62279 },
      { age: 13.0, b0: -7.86320, b1: 0.60818, b2: -0.013895, b3: 0.62407 },
      { age: 13.5, b0: -7.13480, b1: 0.59228, b2: -0.011624, b3: 0.61253 },
      { age: 14.0, b0: -6.42990, b1: 0.59151, b2: -0.009776, b3: 0.58762 },
      { age: 14.5, b0: -5.75780, b1: 0.60643, b2: -0.008261, b3: 0.54875 },
      { age: 15.0, b0: -5.12820, b1: 0.63757, b2: -0.006988, b3: 0.49536 },
      { age: 15.5, b0: -4.50920, b1: 0.68548, b2: -0.005863, b3: 0.42687 },
      { age: 16.0, b0: -3.92920, b1: 0.75069, b2: -0.004795, b3: 0.34271 },
      { age: 16.5, b0: -3.48730, b1: 0.83375, b2: -0.003695, b3: 0.24231 },
      { age: 17.0, b0: -3.28300, b1: 0.93520, b2: -0.002470, b3: 0.12510 },
      { age: 17.5, b0: -3.41560, b1: 1.05558, b2: -0.001027, b3: -0.00950 }
    ],
    girl: [
      { age: 4.0, b0: -8.13250, b1: 1.24768, b2: -0.194350, b3: 0.44774 },
      { age: 4.5, b0: -6.47656, b1: 1.22177, b2: -0.185190, b3: 0.41381 },
      { age: 5.0, b0: -5.13582, b1: 1.19932, b2: -0.175300, b3: 0.38467 },
      { age: 5.5, b0: -4.13791, b1: 1.17880, b2: -0.164840, b3: 0.36039 },
      { age: 6.0, b0: -3.51039, b1: 1.15866, b2: -0.154000, b3: 0.34105 },
      { age: 6.5, b0: -3.14322, b1: 1.13737, b2: -0.142940, b3: 0.32672 },
      { age: 7.0, b0: -2.87645, b1: 1.11342, b2: -0.131840, b3: 0.31748 },
      { age: 7.5, b0: -2.66291, b1: 1.08525, b2: -0.120860, b3: 0.31340 },
      { age: 8.0, b0: -2.45559, b1: 1.05135, b2: -0.110190, b3: 0.31457 },
      { age: 8.5, b0: -2.20728, b1: 1.01018, b2: -0.099990, b3: 0.32105 },
      { age: 9.0, b0: -1.87098, b1: 0.96020, b2: -0.090440, b3: 0.33291 },
      { age: 9.5, b0: -1.06330, b1: 0.89989, b2: -0.081710, b3: 0.35025 },
      { age: 10.0, b0: 0.33468, b1: 0.82771, b2: -0.073970, b3: 0.37312 },
      { age: 10.5, b0: 1.97366, b1: 0.74213, b2: -0.067390, b3: 0.40161 },
      { age: 11.0, b0: 3.50436, b1: 0.67173, b2: -0.061360, b3: 0.42042 },
      { age: 11.5, b0: 4.57747, b1: 0.64150, b2: -0.055180, b3: 0.41686 },
      { age: 12.0, b0: 4.84365, b1: 0.64452, b2: -0.048940, b3: 0.39490 },
      { age: 12.5, b0: 4.27869, b1: 0.67386, b2: -0.042720, b3: 0.35850 },
      { age: 13.0, b0: 3.21417, b1: 0.72260, b2: -0.036610, b3: 0.31163 },
      { age: 13.5, b0: 1.83456, b1: 0.78383, b2: -0.030670, b3: 0.25826 },
      { age: 14.0, b0: 0.32425, b1: 0.85062, b2: -0.025000, b3: 0.20235 },
      { age: 14.5, b0: -1.13224, b1: 0.91605, b2: -0.019670, b3: 0.14787 },
      { age: 15.0, b0: -2.35055, b1: 0.97319, b2: -0.014770, b3: 0.09880 },
      { age: 15.5, b0: -3.10326, b1: 1.01514, b2: -0.010370, b3: 0.05909 },
      { age: 16.0, b0: -3.17885, b1: 1.03496, b2: -0.006550, b3: 0.03272 },
      { age: 16.5, b0: -2.41657, b1: 1.02573, b2: -0.003400, b3: 0.02364 },
      { age: 17.0, b0: -0.65579, b1: 0.98054, b2: -0.001000, b3: 0.03584 },
      { age: 17.5, b0: 2.26429, b1: 0.89246, b2: 0.000570, b3: 0.07327 }
    ]
  };

  function normalizeSex(sex) {
    if (!sex) return 'boy';
    const s = String(sex).toLowerCase();
    if (s.startsWith('g') || s.startsWith('f')) return 'girl';
    return 'boy';
  }

  function getStandardsTable(sex, standard = 'KDCA') {
    if (!growthData && typeof window !== 'undefined' && window.KIDSFIT_GROWTH_DATA) {
      growthData = window.KIDSFIT_GROWTH_DATA;
    }
    const s = normalizeSex(sex);
    const isCdc = String(standard).toUpperCase().includes('CDC');

    if (growthData) {
      if (isCdc) {
        if (growthData[`cdc_${s}`]) return growthData[`cdc_${s}`];
        if (growthData.cdc && growthData.cdc[s]) return growthData.cdc[s];
      }
      if (growthData[s]) return growthData[s];
    }
    return FALLBACK_KDCA[s] || FALLBACK_KDCA.boy;
  }

  // 2. Numerical Approximation of Error Function erf(x) & Normal CDF
  function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  function normalCDF(z) {
    if (z === Infinity) return 1.0;
    if (z === -Infinity) return 0.0;
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  // 3. Interpolate LMS for any arbitrary month (12~240)
  function getLmsForMonth(sex, months, standard = 'KDCA') {
    const table = getStandardsTable(sex, standard);
    const clampedM = Math.max(12, Math.min(240, Number(months) || 120));

    if (clampedM <= table[0].m) return table[0];
    if (clampedM >= table[table.length - 1].m) return table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
      const r1 = table[i];
      const r2 = table[i + 1];
      if (clampedM >= r1.m && clampedM <= r2.m) {
        const alpha = (clampedM - r1.m) / (r2.m - r1.m);
        return {
          m: clampedM,
          L: (1 - alpha) * (r1.L !== undefined ? r1.L : 1.0) + alpha * (r2.L !== undefined ? r2.L : 1.0),
          M: Math.round(((1 - alpha) * r1.M + alpha * r2.M) * 10) / 10,
          S: (1 - alpha) * r1.S + alpha * r2.S,
          p3: Math.round(((1 - alpha) * r1.p3 + alpha * r2.p3) * 10) / 10,
          p50: Math.round(((1 - alpha) * r1.p50 + alpha * r2.p50) * 10) / 10,
          p97: Math.round(((1 - alpha) * r1.p97 + alpha * r2.p97) * 10) / 10,
          wM: Math.round(((1 - alpha) * (r1.wM || 16.5) + alpha * (r2.wM || 16.5)) * 10) / 10,
          wS: (1 - alpha) * (r1.wS || 0.13) + alpha * (r2.wS || 0.13),
          bmiP5: (1 - alpha) * (r1.bmiP5 || 13.8) + alpha * (r2.bmiP5 || 13.8),
          bmiP50: (1 - alpha) * (r1.bmiP50 || 16.0) + alpha * (r2.bmiP50 || 16.0),
          bmiP85: (1 - alpha) * (r1.bmiP85 || 18.0) + alpha * (r2.bmiP85 || 18.0),
          bmiP95: (1 - alpha) * (r1.bmiP95 || 19.5) + alpha * (r2.bmiP95 || 19.5)
        };
      }
    }
    return table[0];
  }

  // 4. Box-Cox LMS Z-Score & Percentile Engine
  function calculateLMSZScore(measure, ageMonths, sex, type = 'height', standard = 'KDCA') {
    const val = Number(measure) || 0;
    const stdName = String(standard).toUpperCase().includes('CDC') ? 'CDC 2000' : 'KDCA 2017';
    if (val <= 0) {
      return { zScore: 0.0, percentile: 50.0, standard: stdName };
    }

    const lms = getLmsForMonth(sex, ageMonths, standard);
    let L = lms.L !== undefined ? lms.L : 1.0;
    let M = lms.M;
    let S = lms.S;

    if (type === 'weight' || type === 'w') {
      L = 1.0;
      M = lms.wM || 16.5;
      S = lms.wS || 0.13;
    } else if (type === 'bmi') {
      L = 1.0;
      M = lms.bmiP50 || 16.0;
      S = 0.11;
    }

    let z;
    if (Math.abs(L) <= 0.0001) {
      z = Math.log(val / M) / S;
    } else {
      z = (Math.pow(val / M, L) - 1.0) / (L * S);
    }

    const rawP = normalCDF(z) * 100.0;
    const percentile = Math.min(99.9, Math.max(0.1, Math.round(rawP * 10) / 10));

    return {
      zScore: Math.round(z * 100) / 100,
      percentile,
      standard: stdName
    };
  }

  // KDCA LMS Percentile Calculator (Backward compatible)
  function calculateKdcaPercentile(val, L, M, S) {
    const v = Number(val) || 0;
    if (v <= 0 || !M || !S) {
      return { zScore: 0, percentile: 50.0, topPercent: 50.0, deltaMedian: 0 };
    }
    let z;
    if (Math.abs(L) <= 0.0001) {
      z = Math.log(v / M) / S;
    } else {
      z = (Math.pow(v / M, L) - 1.0) / (L * S);
    }
    const rawP = normalCDF(z) * 100.0;
    const percentile = Math.min(99.9, Math.max(0.1, Math.round(rawP * 10) / 10));
    const topPercent = Math.round((100.0 - percentile) * 10) / 10;
    const deltaMedian = Math.round((v - M) * 10) / 10;
    return {
      zScore: Math.round(z * 100) / 100,
      percentile,
      topPercent,
      deltaMedian
    };
  }

  // 4-1. KDCA Weight & BMI Status Evaluator (Full Weight Percentile + Height-Adjusted Optimal Weight)
  function evaluateWeightAndBmi(heightCm, weightKg, lms) {
    const hVal = Math.max(50.0, Number(heightCm) || Number(lms && lms.M) || 137.0);
    const hMeter = hVal / 100.0;
    const stdWeight = Math.round((Number(lms && lms.wM) || 35.5) * 10) / 10;
    const stdHeight = Math.round((Number(lms && lms.M) || 137.0) * 10) / 10;
    const wKg = Math.round(Math.max(3.0, Number(weightKg) || stdWeight) * 10) / 10;
    const bmi = Math.round((wKg / (hMeter * hMeter)) * 10) / 10;
    const wPct = calculateKdcaPercentile(wKg, 1.0, stdWeight, (lms && lms.wS) || 0.15);

    const stdBmiP50 = (lms && lms.bmiP50) ? Number(lms.bmiP50) : (stdWeight / Math.pow(stdHeight / 100.0, 2));
    const optimalWeightForHeight = Math.round((stdBmiP50 * hMeter * hMeter) * 10) / 10;
    const weightVsHeightDelta = Math.round((wKg - optimalWeightForHeight) * 10) / 10;
    const futureHeight6mMeter = (hVal + 3.2) / 100.0;
    const targetWeight6m = Math.round(Math.max(optimalWeightForHeight + 1.0, stdBmiP50 * futureHeight6mMeter * futureHeight6mMeter) * 10) / 10;

    let bmiStatus = 'Optimal Proportional Stature (Normative 5th–84th Percentile)';
    let bmiShortStatus = 'Optimal Weight-for-Height Linear Growth Balance';
    let bmiNote = 'Body mass is ideally balanced with current stature. Maintain daily bioavailable protein and calcium accrual.';
    let bmiBadgeColor = '#1D4ED8';

    if (bmi < ((lms && lms.bmiP5) || 13.8) || wKg < optimalWeightForHeight * 0.88) {
      bmiStatus = 'Underweight · Nutritional Fortification Required (<5th Percentile)';
      bmiShortStatus = 'Underweight · Bone Density & Protein Support Needed';
      bmiNote = `Current weight is ${Math.abs(weightVsHeightDelta).toFixed(1)} kg below the optimal weight (${optimalWeightForHeight} kg) for stature (${hVal} cm). Prioritize bioavailable protein, calcium citrate, and zinc for anabolic linear growth.`;
      bmiBadgeColor = '#1D4ED8';
    } else if (bmi >= ((lms && lms.bmiP95) || 21.0) || wKg > optimalWeightForHeight * 1.2) {
      bmiStatus = 'Overweight · Precocious Maturation Alert (≥95th Percentile)';
      bmiShortStatus = 'Excess Adiposity · Accelerated Epiphyseal Fusion Risk';
      bmiNote = `Current weight is +${Math.abs(weightVsHeightDelta).toFixed(1)} kg above optimal weight (${optimalWeightForHeight} kg) for stature (${hVal} cm). Excess adipose tissue stimulates aromatase and leptin signaling, accelerating pubertal bone-age closure. Eliminate late nocturnal carbs and introduce daily plyometric jumping.`;
      bmiBadgeColor = '#1D4ED8';
    } else if (bmi >= ((lms && lms.bmiP85) || 18.8) || wKg > optimalWeightForHeight * 1.1) {
      bmiStatus = 'Borderline Overweight (85th–94th Percentile)';
      bmiShortStatus = 'Borderline Overweight · Adiposity Management Recommended';
      bmiNote = `Current weight is +${Math.abs(weightVsHeightDelta).toFixed(1)} kg above optimal weight (${optimalWeightForHeight} kg). Ensure annualized weight gain does not outpace linear height velocity. Limit pre-bedtime glycemic load.`;
      bmiBadgeColor = '#1D4ED8';
    }

    return {
      bmi,
      currentWeight: wKg,
      standardWeight: stdWeight,
      weightPercentile: wPct.percentile,
      weightTopPercent: wPct.topPercent,
      weightZScore: wPct.zScore,
      weightDelta: wPct.deltaMedian,
      optimalWeightForHeight,
      weightVsHeightDelta,
      targetWeight6m,
      bmiStatus,
      bmiShortStatus,
      bmiNote,
      bmiBadgeColor
    };
  }

  // 5. Tanner Mid-Parental Height (MPH) Formula
  function calculateMPH(fatherHeight, motherHeight, sex) {
    const f = Number(fatherHeight) > 0 ? Number(fatherHeight) : 173.5;
    const m = Number(motherHeight) > 0 ? Number(motherHeight) : 161.0;
    const isBoy = normalizeSex(sex) === 'boy';
    const delta = isBoy ? 13.0 : -13.0;
    const mph = (f + m + delta) / 2.0;
    const roundedMph = Math.round(mph * 10) / 10;
    const min = Math.round((mph - 8.5) * 10) / 10;
    const max = Math.round((mph + 8.5) * 10) / 10;

    return {
      mph: roundedMph,
      min,
      max,
      margin: 8.5,
      rangeStr: `${min}cm ~ ${max}cm`
    };
  }

  function calculateMph(fatherHeight, motherHeight, gender) {
    return calculateMPH(fatherHeight, motherHeight, gender).mph;
  }

  // 5-1. Khamis-Roche Empirical Adult Stature Prediction Method (Pediatrics 1994; 94(4):504-507)
  function calculateKhamisRoche(ageYearsOrObj, heightCm, weightKg, fatherHeightCm, motherHeightCm, sex) {
    let age, hCm, wKg, fCm, mCm, s;
    if (typeof ageYearsOrObj === 'object' && ageYearsOrObj !== null) {
      age = Number(ageYearsOrObj.ageYears !== undefined ? ageYearsOrObj.ageYears : (ageYearsOrObj.ageMonths ? ageYearsOrObj.ageMonths / 12 : 10));
      hCm = Number(ageYearsOrObj.heightCm || ageYearsOrObj.currentHeight || 137.0);
      wKg = Number(ageYearsOrObj.weightKg || ageYearsOrObj.currentWeight || 35.5);
      fCm = Number(ageYearsOrObj.fatherHeightCm || ageYearsOrObj.fatherHeight || 173.5);
      mCm = Number(ageYearsOrObj.motherHeightCm || ageYearsOrObj.motherHeight || 160.5);
      s = normalizeSex(ageYearsOrObj.sex || ageYearsOrObj.gender || 'boy');
    } else {
      age = Number(ageYearsOrObj) || 10.0;
      hCm = Number(heightCm) || 137.0;
      wKg = Number(weightKg) || 35.5;
      fCm = Number(fatherHeightCm) || 173.5;
      mCm = Number(motherHeightCm) || 160.5;
      s = normalizeSex(sex || 'boy');
    }

    // Khamis-Roche standard inputs:
    // Stature in inches
    const heightIn = hCm / 2.54;
    // Weight in pounds
    const weightLbs = wKg * 2.20462262;
    // Unadjusted Midparent Stature in inches: (Father + Mother) / 2
    const midParentStatureIn = ((fCm + mCm) / 2.0) / 2.54;

    // Lookup 28-row coefficient table for sex
    const table = KHAMIS_ROCHE_COEFFICIENTS[s] || KHAMIS_ROCHE_COEFFICIENTS.boy;
    // Clamp age to 4.0 - 17.5
    const clampedAge = Math.max(4.0, Math.min(17.5, age));

    let coeff = null;
    if (clampedAge <= table[0].age) {
      coeff = table[0];
    } else if (clampedAge >= table[table.length - 1].age) {
      coeff = table[table.length - 1];
    } else {
      for (let i = 0; i < table.length - 1; i++) {
        const r1 = table[i];
        const r2 = table[i + 1];
        if (clampedAge >= r1.age && clampedAge <= r2.age) {
          const t = (clampedAge - r1.age) / (r2.age - r1.age);
          coeff = {
            age: clampedAge,
            b0: (1 - t) * r1.b0 + t * r2.b0,
            b1: (1 - t) * r1.b1 + t * r2.b1,
            b2: (1 - t) * r1.b2 + t * r2.b2,
            b3: (1 - t) * r1.b3 + t * r2.b3
          };
          break;
        }
      }
    }
    if (!coeff) coeff = table[0];

    // Predicted Adult Stature in inches
    // Y_hat = b0 + (b1 * statureIn) + (b2 * weightLbs) + (b3 * midParentStatureIn)
    const predictedInRaw = coeff.b0 + (coeff.b1 * heightIn) + (coeff.b2 * weightLbs) + (coeff.b3 * midParentStatureIn);
    const predictedCm = Math.round((predictedInRaw * 2.54) * 10) / 10;
    const predictedIn = Math.round(predictedInRaw * 10) / 10;

    // Fels Longitudinal Study standard error and 90% confidence corridor:
    // Boys: 90% CI = ±5.34 cm (±2.1 in), standard error ≈ 3.25 cm
    // Girls: 90% CI = ±4.25 cm (±1.67 in), standard error ≈ 2.58 cm
    const isBoy = s === 'boy';
    const ci90BoundCm = isBoy ? 5.34 : 4.25;
    const standardErrorCm = isBoy ? 3.25 : 2.58;
    const standardErrorIn = Math.round((standardErrorCm / 2.54) * 10) / 10;

    const ci90MinCm = Math.round((predictedCm - ci90BoundCm) * 10) / 10;
    const ci90MaxCm = Math.round((predictedCm + ci90BoundCm) * 10) / 10;

    const cmToFtIn = (cmVal) => {
      const totIn = cmVal / 2.54;
      const ft = Math.floor(totIn / 12);
      const remIn = Math.round(totIn % 12);
      return `${ft}'${remIn}"`;
    };

    const predictedFtIn = cmToFtIn(predictedCm);
    const ci90MinFtIn = cmToFtIn(ci90MinCm);
    const ci90MaxFtIn = cmToFtIn(ci90MaxCm);

    return {
      predictedCm,
      predictedIn,
      predictedFtIn,
      ci90BoundCm,
      ci90BoundIn: Math.round((ci90BoundCm / 2.54) * 10) / 10,
      ci90MinCm,
      ci90MaxCm,
      ci90MinFtIn,
      ci90MaxFtIn,
      ci90RangeStr: `${ci90MinCm} cm ~ ${ci90MaxCm} cm (${ci90MinFtIn} ~ ${ci90MaxFtIn})`,
      standardErrorCm,
      standardErrorIn,
      method: 'Khamis-Roche (1994, Fels Longitudinal Study)',
      ageEvaluated: Math.round(clampedAge * 10) / 10,
      coefficientsUsed: coeff
    };
  }

  // 5-2. Circadian SWS Bedtime & Pituitary HGH Release Scheduler
  function calculateCircadianSleepSchedule(wakeTimeStrOrObj, ageYears) {
    let wakeStr = '07:00';
    let age = 10;

    if (typeof wakeTimeStrOrObj === 'object' && wakeTimeStrOrObj !== null) {
      wakeStr = wakeTimeStrOrObj.wakeTime || wakeTimeStrOrObj.wakeTimeStr || '07:00';
      age = Number(wakeTimeStrOrObj.ageYears || wakeTimeStrOrObj.age || 10);
    } else {
      if (typeof wakeTimeStrOrObj === 'string' && wakeTimeStrOrObj.trim()) {
        wakeStr = wakeTimeStrOrObj.trim();
      }
      if (typeof ageYears === 'number' && ageYears > 0) {
        age = ageYears;
      }
    }

    let wakeH = 7;
    let wakeM = 0;
    const match = String(wakeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      wakeH = parseInt(match[1], 10);
      wakeM = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === 'PM' && wakeH < 12) wakeH += 12;
      if (meridiem === 'AM' && wakeH === 12) wakeH = 0;
    }

    const wakeMinutes = (wakeH * 60 + wakeM) % 1440;

    // Age-specific sleep cycles (each cycle is 90 mins = 1.5 hrs)
    // Toddler/Preschool (age 2-5): 7 cycles (10.5h)
    // School-age (age 6-13): 6 cycles (9.0h)
    // Teen (age 14-18): 5.5 to 6 cycles (8.25-9.0h)
    let recommendedCycles = 6;
    if (age <= 5) recommendedCycles = 7;
    else if (age >= 14) recommendedCycles = 5.5;

    const totalSleepMin = Math.round(recommendedCycles * 90);
    const totalSleepHours = totalSleepMin / 60;
    const sleepLatencyMin = 15; // Mean physiological sleep latency

    // Bedtime (lights out) = wake time minus (total sleep time + latency)
    let lightsOutMin = (wakeMinutes - totalSleepMin - sleepLatencyMin) % 1440;
    if (lightsOutMin < 0) lightsOutMin += 1440;

    // Sleep onset = lights out + 15 min
    let sleepOnsetMin = (lightsOutMin + sleepLatencyMin) % 1440;

    // Stage N3 Slow-Wave Sleep (SWS) window:
    // SWS starts ~45-60 min post sleep onset and peaks for ~90-120 min during Cycles 1 & 2
    let swsStartMin = (sleepOnsetMin + 45) % 1440;
    let swsEndMin = (sleepOnsetMin + 195) % 1440;

    // Glycemic fasting window cutoff: 3.0 hours before lights out
    let glycemicCutoffMin = (lightsOutMin - 180) % 1440;
    if (glycemicCutoffMin < 0) glycemicCutoffMin += 1440;

    const minToTimeStr = (totalM) => {
      const h = Math.floor(totalM / 60) % 24;
      const m = totalM % 60;
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const mStr = String(m).padStart(2, '0');
      const h24Str = String(h).padStart(2, '0');
      return {
        h24: `${h24Str}:${mStr}`,
        h12: `${h12}:${mStr} ${ampm}`
      };
    };

    const lightsOutTime = minToTimeStr(lightsOutMin);
    const sleepOnsetTime = minToTimeStr(sleepOnsetMin);
    const swsStartTime = minToTimeStr(swsStartMin);
    const swsEndTime = minToTimeStr(swsEndMin);
    const glycemicCutoffTime = minToTimeStr(glycemicCutoffMin);
    const wakeFormatted = minToTimeStr(wakeMinutes);

    // Build 90-minute cycle breakdown
    const cycleTable = [];
    const numIntCycles = Math.ceil(recommendedCycles);
    for (let c = 1; c <= numIntCycles; c++) {
      const cStartMin = (sleepOnsetMin + (c - 1) * 90) % 1440;
      const cEndMin = (sleepOnsetMin + c * 90) % 1440;
      let phaseName, hghPct, desc;
      if (c === 1) {
        phaseName = 'Cycle 1 · Stage N3 Slow-Wave Sleep (SWS Peak)';
        hghPct = '45%';
        desc = 'Deep delta-wave synchronous sleep; major anterior pituitary growth hormone (GH) pulse release window.';
      } else if (c === 2) {
        phaseName = 'Cycle 2 · Deep N3 Transition & Early REM';
        hghPct = '25%';
        desc = 'Secondary GH pulse secretion and bone epiphyseal chondrocyte protein synthesis.';
      } else if (c === 3) {
        phaseName = 'Cycle 3 · Balanced N2 NREM & REM Consolidation';
        hghPct = '15%';
        desc = 'Motor memory consolidation and osteoblast mineral apposition.';
      } else if (c === 4) {
        phaseName = 'Cycle 4 · Prolonged REM Sleep & Neuro-Plasticity';
        hghPct = '8%';
        desc = 'Prefrontal synaptic pruning, cognitive processing, and emotional regulation.';
      } else if (c === 5) {
        phaseName = 'Cycle 5 · REM Sleep & Cortisol Preparation';
        hghPct = '4%';
        desc = 'Light sleep architecture preparing hypothalamic-pituitary-adrenal axis for awakening.';
      } else {
        phaseName = 'Cycle 6 · Final REM & Gentle Awakening';
        hghPct = '3%';
        desc = 'Natural cortisol awakening response with zero grogginess.';
      }
      cycleTable.push({
        cycleNumber: c,
        phaseName,
        startTime: minToTimeStr(cStartMin).h12,
        endTime: minToTimeStr(cEndMin).h12,
        hghOutputPercent: hghPct,
        clinicalSignificance: desc
      });
    }

    return {
      wakeTime: wakeFormatted.h12,
      wakeTime24: wakeFormatted.h24,
      ageYears: age,
      recommendedCycles,
      totalSleepHours,
      sleepLatencyMin,
      lightsOutTime: lightsOutTime.h12,
      lightsOutTime24: lightsOutTime.h24,
      sleepOnsetTime: sleepOnsetTime.h12,
      swsWindowStart: swsStartTime.h12,
      swsWindowEnd: swsEndTime.h12,
      swsWindowStr: `${swsStartTime.h12} – ${swsEndTime.h12}`,
      glycemicCutoffTime: glycemicCutoffTime.h12,
      glycemicCutoff24: glycemicCutoffTime.h24,
      cycleTable,
      clinicalRationale: 'Endogenous human growth hormone (somatotropin) is secreted in nocturnal pulsatile surges tightly coupled to Stage N3 slow-wave sleep (delta EEG activity). Late sleep or high-glycemic bedtime snacking triggers somatostatin release, truncating up to 68% of daily GH output.'
    };
  }

  // 6. Annual Growth Velocity Engine
  function calculateVelocity(currentHeight, previousHeightOrAge, monthsDiff = 6) {
    let velocity;
    let age = 7;

    if (monthsDiff === 6 && typeof previousHeightOrAge === 'number' && previousHeightOrAge < 30) {
      // (recentGain6m, ageYears) signature
      velocity = Math.round(Number(currentHeight || 0) * 2 * 10) / 10;
      age = previousHeightOrAge;
    } else if (typeof previousHeightOrAge === 'number' && previousHeightOrAge > 30) {
      // (currentHeight, previousHeight, monthsDiff) signature
      const mDiff = monthsDiff > 0 ? monthsDiff : 6;
      velocity = Math.round(((Number(currentHeight) - Number(previousHeightOrAge)) * (12.0 / mDiff)) * 10) / 10;
    } else {
      velocity = Math.round(Number(currentHeight || 0) * 2 * 10) / 10;
    }

    const isRedFlag = age >= 4 && age <= 9 && velocity < 4.0;
    return {
      velocityCmPerYear: velocity,
      alert: isRedFlag,
      isRedFlag: isRedFlag,
      status: velocity >= 7.0 ? 'accelerated' : (isRedFlag ? 'red_flag' : 'normal')
    };
  }

  // 7. Growth Inhibiting Habits Penalty Map
  const HABIT_LOSS_MAP = {
    late_sleep: 1.5,
    night_carbs: 1.2,
    poor_posture: 1.2,
    picky_eater: 1.3,
    sedentary: 1.0,
    milk_trouble: 0.8,
    obesity_risk: 1.7
  };

  // 8. 3 Trajectories Prediction Engine
  function predictAdultHeightTrajectories(childData, growthHistory, inhibitionFactors) {
    let mph = 175.0;
    let habits = [];
    let tannerPhase = 'phase_1';
    let curAgeYears = 10;
    let curHeight = 137.0;

    if (typeof childData === 'number') {
      mph = childData;
      habits = Array.isArray(growthHistory) ? growthHistory : (Array.isArray(inhibitionFactors) ? inhibitionFactors : []);
      if (typeof inhibitionFactors === 'string') tannerPhase = inhibitionFactors;
    } else if (childData && typeof childData === 'object') {
      if (childData.fatherHeight && childData.motherHeight) {
        mph = calculateMPH(childData.fatherHeight, childData.motherHeight, childData.gender).mph;
      } else if (childData.mph) {
        mph = childData.mph;
      }
      habits = childData.habits || inhibitionFactors || [];
      tannerPhase = childData.tannerPhase || childData.pubertyStage || 'phase_1';
      curAgeYears = childData.ageYears || (childData.ageMonths ? Math.round(childData.ageMonths / 12) : 10);
      curHeight = childData.currentHeight || 137.0;
    }

    habits = Array.isArray(habits) ? habits : [];
    let totalPenalty = 0;
    for (const h of habits) {
      if (HABIT_LOSS_MAP[h]) totalPenalty += HABIT_LOSS_MAP[h];
    }
    const cappedPenalty = Math.min(5.0, Math.round(totalPenalty * 10) / 10);
    const unmanaged = Math.round((mph - cappedPenalty) * 10) / 10;

    let goldenBoost = 6.0;
    if (tannerPhase === 'phase_2') goldenBoost = 5.0;
    else if (tannerPhase === 'phase_3') goldenBoost = 4.0;
    else if (tannerPhase === 'phase_4') goldenBoost = 1.8;

    let optimizedGain;
    if (tannerPhase === 'phase_4') {
      optimizedGain = Math.min(2.5, Math.max(1.5, Math.round((goldenBoost + cappedPenalty * 0.5) * 10) / 10));
    } else {
      optimizedGain = Math.min(9.2, Math.max(5.0, Math.round((goldenBoost + cappedPenalty * 0.5) * 10) / 10));
    }
    const optimized = Math.round((unmanaged + optimizedGain) * 10) / 10;

    // Generate curve points from current age to 20
    const startAge = Math.max(1, Math.min(19, curAgeYears));
    const ageArray = [];
    const baselineCurve = [];
    const unmanagedCurve = [];
    const optimizedCurve = [];

    const yearsRemaining = Math.max(1, 20 - startAge);
    for (let a = startAge; a <= 20; a++) {
      ageArray.push(a);
      const frac = (a - startAge) / yearsRemaining;
      baselineCurve.push(Math.round((curHeight + (mph - curHeight) * frac) * 10) / 10);
      unmanagedCurve.push(Math.round((curHeight + (unmanaged - curHeight) * frac) * 10) / 10);
      optimizedCurve.push(Math.round((curHeight + (optimized - curHeight) * frac) * 10) / 10);
    }

    return {
      baselineMPH: {
        height: mph,
        range: [Math.round((mph - 8.5) * 10) / 10, Math.round((mph + 8.5) * 10) / 10]
      },
      unmanaged: {
        height: unmanaged,
        penalty: cappedPenalty,
        lossPercent: Math.round((cappedPenalty / mph) * 1000) / 10
      },
      optimized: {
        height: optimized,
        gainOverUnmanaged: optimizedGain,
        potentialGain: [5.0, 9.2]
      },
      curvePoints: {
        ageArray,
        baselineCurve,
        unmanagedCurve,
        optimizedCurve
      }
    };
  }

  // 8-1. Age & Sex Accurate Epiphyseal Growth Plate Remaining Window Calculator
  function calculateRemainingGrowthWindow(ageMonths = 120, sex = 'boy', pubertyStage = 'none') {
    const isBoy = normalizeSex(sex) === 'boy';
    const exactYears = Math.max(1.0, Math.min(20.0, (Number(ageMonths) || 120) / 12.0));
    const ageYearsInt = Math.floor(exactYears);
    // Korean Pediatric Endocrinology standard epiphyseal closure age: Boy ~16.5-17.0 yrs, Girl ~14.5-15.0 yrs
    const closureAge = isBoy ? 17.0 : 15.0;
    const phvAge = isBoy ? 12.5 : 10.5;
    const rawRemYears = Math.max(0, closureAge - exactYears);
    const remMinYr = Math.max(1, Math.floor(rawRemYears - 0.5));
    const remMaxYr = Math.max(remMinYr + 1, Math.ceil(rawRemYears + 0.5));

    if (pubertyStage === 'phase_4' || rawRemYears <= 0.8) {
      return {
        headline: 'Approx. 6–12 Months (Postural & Spinal Decompression Window)',
        shortBadge: 'Approx. 6–12 Mos Remaining',
        subLabel: 'Late Epiphyseal Stage · Spinal Disc Decompression (+1.8 cm) Focus',
        fullText: 'Approx. 6–12 Months (Late Epiphyseal Stage / Intervertebral Hydration & Hidden +1.8 cm Stature Target)',
        meaningKo: `Final epiphyseal stage: correcting forward-head posture and lumbar compression restores 1.5–2.2 cm of hidden stature.`
      };
    }

    if (pubertyStage === 'urgent_secondary_signs' || pubertyStage === 'phase_3' || rawRemYears <= 2.2) {
      const remMosMin = Math.max(6, Math.round((rawRemYears - 0.5) * 12));
      const remMosMax = Math.max(remMosMin + 6, Math.round((rawRemYears + 0.3) * 12));
      return {
        headline: `Approx. ${remMosMin}–${remMosMax} Months Remaining`,
        shortBadge: `Approx. ${remMosMin}–${remMosMax} Mos Remaining`,
        subLabel: `Final Growth Spurt Before Epiphyseal Plate Fusion (Age ${closureAge})`,
        fullText: `Approx. ${remMosMin}–${remMosMax} Months Remaining (Final Golden Window Before Epiphyseal Closure at Age ${closureAge})`,
        meaningKo: `Late secondary sexual maturation stage with rapid epiphyseal closure. Rigorous sleep, calcium, and spinal decompression preserve remaining stature before age ${closureAge}.`
      };
    }

    if (ageYearsInt <= 6) {
      return {
        headline: `Approx. ${remMinYr}–${remMaxYr} Years Open`,
        shortBadge: `Approx. ${remMinYr}–${remMaxYr} Yrs Open (95%+ Openness)`,
        subLabel: `Early Pre-Pubertal Stature Accrual Phase (Fusion at Age ${closureAge})`,
        fullText: `Approx. ${remMinYr}–${remMaxYr} Years Open (Age ${ageYearsInt} · Epiphyseal Plates 95%+ Open → 6–7 cm/yr Baseline Linear Growth)`,
        meaningKo: `At age ${ageYearsInt}, growth plates are 95%+ open. Build linear bone mineral density and steady 6–7 cm annual velocity before pubertal onset at age ~${phvAge}.`
      };
    }

    if (ageYearsInt <= Math.floor(phvAge - 1)) {
      return {
        headline: `Approx. ${remMinYr}–${remMaxYr} Years Open`,
        shortBadge: `Approx. ${remMinYr}–${remMaxYr} Yrs Open (85%+ Openness)`,
        subLabel: `Pre-Pubertal Growth Reserve · Epiphyseal Fusion at Age ${closureAge}`,
        fullText: `Approx. ${remMinYr}–${remMaxYr} Years Open (Epiphyseal Fusion at Age ${closureAge} · Critical Pre-Pubertal Linear Accrual Window)`,
        meaningKo: `Growth plates remain open for approx. ${remMinYr}–${remMaxYr} years until age ${closureAge}. Maximize linear baseline stature and prevent excess adiposity prior to Peak Height Velocity (PHV at ~${phvAge}y).`
      };
    }

    return {
      headline: `Approx. ${remMinYr}–${remMaxYr} Years Remaining`,
      shortBadge: `Approx. ${remMinYr}–${remMaxYr} Yrs Remaining (Peak Height Velocity PHV)`,
      subLabel: `Maximum Acceleration Golden Window Before Plate Fusion at Age ${closureAge}`,
      fullText: `Approx. ${remMinYr}–${remMaxYr} Years Remaining (Peak Height Velocity PHV · Critical Golden Window Before Epiphyseal Closure at Age ${closureAge})`,
      meaningKo: `Peak Height Velocity (PHV) phase: deep 10 PM sleep, bioavailable calcium citrate, and osteogenic loading unlock up to +7–9 cm of final adult potential.`
    };
  }

  // Legacy calculateHeightPrediction for compatibility (now age & sex aware!)
  function calculateHeightPrediction(mph, habits = [], pubertyStage = 'none', ageMonths = null, sex = 'boy') {
    habits = Array.isArray(habits) ? habits : [];
    let loss = 0;
    habits.forEach((h) => {
      if (HABIT_LOSS_MAP[h]) loss += HABIT_LOSS_MAP[h];
    });
    const unmanagedLoss = Math.min(5.0, Math.round(loss * 10) / 10);
    const unmanagedHeight = Math.round((mph - unmanagedLoss) * 10) / 10;

    let goldenBoost = 5.0;
    let legacyStageMonths = 'Approx. 36–48 Months Open';
    if (pubertyStage === 'growth_spurt' || pubertyStage === 'phase_2') {
      goldenBoost = 4.0;
      legacyStageMonths = 'Approx. 18–24 Months Golden Window';
    } else if (pubertyStage === 'urgent_secondary_signs' || pubertyStage === 'phase_3') {
      goldenBoost = 2.5;
      legacyStageMonths = 'Approx. 6–12 Months Urgent Golden Window!';
    } else if (pubertyStage === 'phase_4') {
      goldenBoost = 1.8;
      legacyStageMonths = 'Approx. <6 Months Late Stage';
    }

    const effectiveAgeMonths = (ageMonths !== null && ageMonths !== undefined && Number(ageMonths) > 0) ? Number(ageMonths) : 120;
    const windowInfo = calculateRemainingGrowthWindow(effectiveAgeMonths, sex, pubertyStage);
    const monthsRemaining = (ageMonths !== null && ageMonths !== undefined && Number(ageMonths) > 0)
      ? windowInfo.fullText
      : `${windowInfo.fullText} (${legacyStageMonths})`;

    const rawGain = Math.round((mph + goldenBoost + (unmanagedLoss * 0.5) - unmanagedHeight) * 10) / 10;
    const goldenTimeGain = Math.min(9.5, Math.max(0, rawGain));
    const potentialHeight = Math.round((unmanagedHeight + goldenTimeGain) * 10) / 10;

    return {
      geneticMph: mph,
      unmanagedLoss,
      unmanagedHeight,
      goldenBoost,
      potentialHeight,
      goldenTimeGain,
      monthsRemaining,
      windowHeadline: windowInfo.headline,
      windowShortBadge: windowInfo.shortBadge,
      windowSubLabel: windowInfo.subLabel,
      windowMeaningKo: windowInfo.meaningKo,
      _legacyKorean: false
    };
  }

  // 8-3. What-If Trajectory & Intervention Simulator Auxology Engine
  function calculateInterventionGains(baseInches, sex = 'boy', ageYears = 10, activeInterventions = []) {
    const isBoy = normalizeSex(sex) === 'boy';
    const ageY = Math.max(3.0, Math.min(20.0, Number(ageYears) || 10.0));

    // Normalization for base stature: accept either inches or cm
    let baseIn = Number(baseInches) || 68.0;
    let baseCm = baseIn;
    if (baseInches > 95.0) {
      baseCm = baseInches;
      baseIn = Math.round((baseCm / 2.54) * 10) / 10;
    } else {
      baseCm = Math.round((baseIn * 2.54) * 10) / 10;
    }

    // Epiphyseal closure age calibration
    const closureAge = isBoy ? 17.5 : 15.5;
    const remainingYears = Math.max(0, closureAge - ageY);
    let ageFactor = 1.0;
    if (remainingYears >= 4.0) {
      ageFactor = 1.0;
    } else if (remainingYears > 0) {
      ageFactor = Math.max(0.35, Math.min(1.0, remainingYears / 4.0));
    } else {
      ageFactor = 0.2; // Residual spinal disc hydration / postural recovery
    }

    const INTERVENTION_SPECS = {
      sleep_sws: {
        id: 'sleep_sws',
        label: 'Circadian SWS Lights-Out Shift',
        baseGainCm: 1.5,
        baseMonths: 3,
        description: 'Deep Stage N3 slow-wave sleep delta-wave optimization restoring up to 70% of daily pituitary GH pulses.'
      },
      glycemic_fast: {
        id: 'glycemic_fast',
        label: '3-Hour Pre-Bed Glycemic Fast',
        baseGainCm: 1.2,
        baseMonths: 2,
        description: 'Eliminates nocturnal hyperinsulinemia to unblock somatostatin suppression on growth hormone secretion.'
      },
      wolff_exercise: {
        id: 'wolff_exercise',
        label: "Wolff's Law Piezoelectric Loading",
        baseGainCm: 1.4,
        baseMonths: 2,
        description: '15-min daily vertical axial loading & rope skipping inducing osteocyte electrical signals for chondrocyte hypertrophy.'
      },
      bone_minerals: {
        id: 'bone_minerals',
        label: 'Targeted Bone Matrix Mineral Dosing',
        baseGainCm: 1.1,
        baseMonths: 2,
        description: 'Elemental Calcium Citrate + Vitamin D3 & K2 MK-7 ensuring complete osteoid matrix calcification.'
      }
    };

    const activeList = Array.isArray(activeInterventions) ? activeInterventions : [];
    const activeSet = new Set(activeList.map(item => String(item).toLowerCase().trim()));

    let sumGainCm = 0;
    let sumMonths = 0;
    const gainsBreakdown = {};

    for (const key of Object.keys(INTERVENTION_SPECS)) {
      const spec = INTERVENTION_SPECS[key];
      const isActive = activeSet.has(key);
      const gainCm = isActive ? Math.round(spec.baseGainCm * ageFactor * 10) / 10 : 0.0;
      const gainIn = isActive ? Math.round((gainCm / 2.54) * 10) / 10 : 0.0;
      const months = isActive ? Math.round(spec.baseMonths * ageFactor) : 0;

      if (isActive) {
        sumGainCm += gainCm;
        sumMonths += months;
      }

      gainsBreakdown[key] = {
        active: isActive,
        label: spec.label,
        gainCm,
        gainInches: gainIn,
        windowExtensionMonths: months,
        description: spec.description
      };
    }

    const totalGainCm = Math.round(sumGainCm * 10) / 10;
    const totalGainInches = Math.round((totalGainCm / 2.54) * 10) / 10;
    const simulatedAdultCm = Math.round((baseCm + totalGainCm) * 10) / 10;
    const simulatedAdultInches = Math.round((simulatedAdultCm / 2.54) * 10) / 10;

    return {
      baseStatureCm: baseCm,
      baseStatureInches: baseIn,
      sex: isBoy ? 'boy' : 'girl',
      ageYears: ageY,
      ageFactor: Math.round(ageFactor * 100) / 100,
      totalGainCm,
      totalGainInches,
      simulatedAdultCm,
      simulatedAdultInches,
      windowExtensionMonths: sumMonths,
      gainsBreakdown,
      activeInterventions: activeList
    };
  }

  // 9. Normative Growth Curve Data (CDC 2000 & KDCA LMS Percentile Corridors: P3, P10, P50, P90, P97)
  function getGrowthCurveData(sex, standard = 'KDCA') {
    const table = getStandardsTable(sex, standard);
    const z10 = -1.28155;
    const z90 = 1.28155;

    const calcLmsP = (L, M, S, Z) => {
      if (!M || !S) return M || 0;
      if (Math.abs(L) < 0.01) {
        return Math.round(M * Math.exp(S * Z) * 10) / 10;
      }
      return Math.round(M * Math.pow(Math.max(0.001, 1 + L * S * Z), 1 / L) * 10) / 10;
    };

    return {
      months: table.map((r) => r.m),
      p3: table.map((r) => r.p3 !== undefined ? r.p3 : calcLmsP(r.L || 1.0, r.M, r.S, -1.88079)),
      p10: table.map((r) => calcLmsP(r.L || 1.0, r.M, r.S, z10)),
      p50: table.map((r) => r.p50 !== undefined ? r.p50 : r.M),
      p90: table.map((r) => calcLmsP(r.L || 1.0, r.M, r.S, z90)),
      p97: table.map((r) => r.p97 !== undefined ? r.p97 : calcLmsP(r.L || 1.0, r.M, r.S, 1.88079))
    };
  }

  // 10. High-Resolution Interactive Multi-Curve SVG Chart (CDC Corridors P3-P97, Tanner PHV, Crosshairs)
  function renderSvgGrowthCurve(sex, currentAgeMonths, currentHeight, options = {}) {
    const width = 600;
    const height = 320;
    const padding = { top: 28, right: 175, bottom: 40, left: 50 };

    const cmToFtInStr = (cm) => {
      if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return '';
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inVal = Math.round(totalIn % 12);
      return `${ft}'${inVal}"`;
    };

    const isBoy = normalizeSex(sex) === 'boy';
    const normData = getGrowthCurveData(sex, options.standard || 'KDCA');
    const minM = 12;
    const maxM = 240;
    const minH = 65;
    const maxH = 195;

    const scaleX = (m) => padding.left + ((Math.max(minM, Math.min(maxM, Number(m) || 120)) - minM) / (maxM - minM)) * (width - padding.left - padding.right);
    const scaleY = (h) => height - padding.bottom - ((Math.max(minH, Math.min(maxH, Number(h) || 137.0)) - minH) / (maxH - minH)) * (height - padding.top - padding.bottom);

    // Build normative reference paths (P3, P10, P50, P90, P97)
    const makeNormPath = (values) => {
      return values.map((val, idx) => {
        const x = scaleX(normData.months[idx]);
        const y = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const pathP97 = makeNormPath(normData.p97);
    const pathP90 = makeNormPath(normData.p90);
    const pathP50 = makeNormPath(normData.p50);
    const pathP10 = makeNormPath(normData.p10);
    const pathP3 = makeNormPath(normData.p3);

    // Outer Percentile Corridor (P3 to P97) & Inner Corridor (P10 to P90)
    let shadedBandP3P97 = '';
    let shadedBandP10P90 = '';
    if (normData.months.length > 1) {
      const top97 = normData.months.map((m, idx) => `${scaleX(m).toFixed(1)},${scaleY(normData.p97[idx]).toFixed(1)}`);
      const bot3 = normData.months.map((m, idx) => `${scaleX(m).toFixed(1)},${scaleY(normData.p3[idx]).toFixed(1)}`).reverse();
      shadedBandP3P97 = `M${top97.join(' L')} L${bot3.join(' L')} Z`;

      const top90 = normData.months.map((m, idx) => `${scaleX(m).toFixed(1)},${scaleY(normData.p90[idx]).toFixed(1)}`);
      const bot10 = normData.months.map((m, idx) => `${scaleX(m).toFixed(1)},${scaleY(normData.p10[idx]).toFixed(1)}`).reverse();
      shadedBandP10P90 = `M${top90.join(' L')} L${bot10.join(' L')} Z`;
    }

    // Trajectory curves from current age to 20 years (240m)
    const curM = Math.max(12, Math.min(240, Number(currentAgeMonths) || 120));
    const curH = Math.max(minH, Math.min(maxH, Number(currentHeight) || 137.0));
    const curAgeYears = Math.round(curM / 12);

    const traj = predictAdultHeightTrajectories({
      mph: options.mph || 175.0,
      habits: options.habits || [],
      tannerPhase: options.tannerPhase || 'phase_2',
      ageYears: curAgeYears,
      currentHeight: curH
    });

    const cp = traj.curvePoints;
    const makeTrajPath = (curveVals) => {
      return cp.ageArray.map((ageYr, idx) => {
        const x = scaleX(ageYr * 12);
        const y = scaleY(curveVals[idx]);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const pathOptimized = makeTrajPath(cp.optimizedCurve);
    const pathBaseline = makeTrajPath(cp.baselineCurve);
    const pathUnmanaged = makeTrajPath(cp.unmanagedCurve);

    // Shaded target intervention zone between unmanaged and optimized
    let shadedAreaPath = '';
    if (cp.ageArray.length > 1) {
      const topPoints = cp.ageArray.map((ageYr, idx) => `${scaleX(ageYr * 12).toFixed(1)},${scaleY(cp.optimizedCurve[idx]).toFixed(1)}`);
      const bottomPoints = cp.ageArray.map((ageYr, idx) => `${scaleX(ageYr * 12).toFixed(1)},${scaleY(cp.unmanagedCurve[idx]).toFixed(1)}`).reverse();
      shadedAreaPath = `M${topPoints.join(' L')} L${bottomPoints.join(' L')} Z`;
    }

    const curX = scaleX(curM);
    const curY = scaleY(curH);

    // Current percentile
    const curLms = getLmsForMonth(sex, curM, options.standard || 'KDCA');
    const curZ = calculateKdcaPercentile(curH, curLms.L, curLms.M, curLms.S);

    // Anti-collision right-hand label Y coordinates (minimum 24px vertical gap)
    const endX = scaleX(240);
    const rawYOpt = scaleY(traj.optimized.height);
    const rawYBase = scaleY(traj.baselineMPH.height);
    const rawYUnm = scaleY(traj.unmanaged.height);
    const labelYBase = Math.max(padding.top + 28, Math.min(height - padding.bottom - 28, rawYBase));
    const labelYOpt = Math.max(padding.top + 4, Math.min(labelYBase - 24, rawYOpt));
    const labelYUnm = Math.min(height - padding.bottom - 4, Math.max(labelYBase + 24, rawYUnm));

    // Mid-chart reference index (~144 months = 12 yrs) for P97/P50/P3 badges
    const refIdx = Math.max(0, normData.months.findIndex((m) => m >= 144));
    const refX = scaleX(normData.months[refIdx] || 144);
    const refYP97 = scaleY(normData.p97[refIdx] || 162);
    const refYP50 = scaleY(normData.p50[refIdx] || 150);
    const refYP3 = scaleY(normData.p3[refIdx] || 138);

    // Tanner Stage Peak Height Velocity (PHV) Inflection Marker (~13.5y boys / ~11.5y girls)
    const phvMonths = isBoy ? 162 : 138;
    const phvX = scaleX(phvMonths);
    const phvBadgeText = isBoy ? 'PHV Peak (~13.5y)' : 'PHV Peak (~11.5y)';

    return `
      <svg viewBox="0 0 ${width} ${height}" class="growth-curve-svg" style="width: 100%; height: auto; max-height: 360px;" aria-label="3-Tier Interactive Pediatric Growth Trajectory Chart">
        <defs>
          <linearGradient id="optZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#93C5FD" stop-opacity="0.08" />
          </linearGradient>
          <filter id="glowPulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- CDC LMS Percentile Shaded Corridors (P3-P97 outer, P10-P90 inner) -->
        ${shadedBandP3P97 ? `<path d="${shadedBandP3P97}" fill="#F8FAFC" opacity="0.8" class="cdc-corridor-p3-p97" />` : ''}
        ${shadedBandP10P90 ? `<path d="${shadedBandP10P90}" fill="#F1F5F9" opacity="0.65" class="cdc-corridor-p10-p90" />` : ''}

        <!-- Grid Lines & Shaded Area -->
        <line x1="${padding.left}" y1="${scaleY(80)}" x2="${width - padding.right}" y2="${scaleY(80)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(100)}" x2="${width - padding.right}" y2="${scaleY(100)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(120)}" x2="${width - padding.right}" y2="${scaleY(120)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(140)}" x2="${width - padding.right}" y2="${scaleY(140)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(160)}" x2="${width - padding.right}" y2="${scaleY(160)}" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${scaleY(180)}" x2="${width - padding.right}" y2="${scaleY(180)}" stroke="#E2E8F0" stroke-dasharray="3,3" />

        ${shadedAreaPath ? `<path d="${shadedAreaPath}" fill="url(#optZoneGrad)" class="trajectory-target-zone" />` : ''}

        <!-- Tanner Stage Peak Height Velocity (PHV) Inflection Reference Marker -->
        <line x1="${phvX.toFixed(1)}" y1="${padding.top}" x2="${phvX.toFixed(1)}" y2="${height - padding.bottom}" stroke="#7C3AED" stroke-width="1.3" stroke-dasharray="4,4" class="tanner-phv-marker" />
        <rect x="${(phvX - 48).toFixed(1)}" y="${padding.top - 12}" width="96" height="15" rx="4" fill="#F5F3FF" stroke="#C4B5FD" stroke-width="1" />
        <text x="${phvX.toFixed(1)}" y="${padding.top - 2}" font-size="8.5" fill="#6D28D9" font-weight="800" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${phvBadgeText}</text>

        <!-- Normative Reference Background Curves (P3, P10, P50, P90, P97) -->
        <path d="${pathP97}" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4,4" id="curve-p97" />
        <rect x="${(refX - 28).toFixed(1)}" y="${(refYP97 - 15).toFixed(1)}" width="56" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP97 - 4).toFixed(1)}" font-size="9.5" fill="#334155" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', monospace">P97 (97%)</text>

        <path d="${pathP90}" fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="2,3" id="curve-p90" opacity="0.75" />

        <path d="${pathP50}" fill="none" stroke="#475569" stroke-width="1.8" id="curve-p50" />
        <rect x="${(refX - 28).toFixed(1)}" y="${(refYP50 - 7).toFixed(1)}" width="56" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP50 + 4).toFixed(1)}" font-size="9.5" fill="#0F172A" font-weight="800" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', monospace">P50 (50%)</text>

        <path d="${pathP10}" fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="2,3" id="curve-p10" opacity="0.75" />

        <path d="${pathP3}" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4,4" id="curve-p3" />
        <rect x="${(refX - 26).toFixed(1)}" y="${(refYP3 + 2).toFixed(1)}" width="52" height="15" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
        <text x="${refX.toFixed(1)}" y="${(refYP3 + 13).toFixed(1)}" font-size="9.5" fill="#334155" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', monospace">P3 (3%)</text>

        <!-- 3 Color-Coded Trajectory Path Lines & Anti-Collision Right Badges -->
        <!-- 1. Optimized Intervention Trajectory -->
        <path d="${pathOptimized}" fill="none" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" id="curve-optimized" />
        <line x1="${endX.toFixed(1)}" y1="${rawYOpt.toFixed(1)}" x2="${(endX + 6).toFixed(1)}" y2="${labelYOpt.toFixed(1)}" stroke="#1D4ED8" stroke-width="1.2" />
        <rect x="${(endX + 6).toFixed(1)}" y="${(labelYOpt - 11).toFixed(1)}" width="170" height="22" rx="6" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.2" />
        <text x="${(endX + 91).toFixed(1)}" y="${(labelYOpt + 4).toFixed(1)}" font-size="8.8" fill="#1D4ED8" font-weight="800" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif">Optimized Potential (${traj.optimized.height} cm / ${cmToFtInStr(traj.optimized.height)})</text>

        <!-- 2. Genetic Baseline Trajectory -->
        <path d="${pathBaseline}" fill="none" stroke="#94A3B8" stroke-width="2.4" stroke-dasharray="5,3" stroke-linecap="round" id="curve-baseline" />
        <line x1="${endX.toFixed(1)}" y1="${rawYBase.toFixed(1)}" x2="${(endX + 6).toFixed(1)}" y2="${labelYBase.toFixed(1)}" stroke="#94A3B8" stroke-width="1.2" />
        <rect x="${(endX + 6).toFixed(1)}" y="${(labelYBase - 11).toFixed(1)}" width="170" height="22" rx="6" fill="#EFF6FF" stroke="#94A3B8" stroke-width="1.2" />
        <text x="${(endX + 91).toFixed(1)}" y="${(labelYBase + 4).toFixed(1)}" font-size="8.8" fill="#1D4ED8" font-weight="800" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif">Genetic Target (${traj.baselineMPH.height} cm / ${cmToFtInStr(traj.baselineMPH.height)})</text>

        <!-- 3. Current Unmanaged Trajectory -->
        <path d="${pathUnmanaged}" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" id="curve-unmanaged" />
        <line x1="${endX.toFixed(1)}" y1="${rawYUnm.toFixed(1)}" x2="${(endX + 6).toFixed(1)}" y2="${labelYUnm.toFixed(1)}" stroke="#94A3B8" stroke-width="1.2" />
        <rect x="${(endX + 6).toFixed(1)}" y="${(labelYUnm - 11).toFixed(1)}" width="170" height="22" rx="6" fill="#EFF6FF" stroke="#94A3B8" stroke-width="1.2" />
        <text x="${(endX + 91).toFixed(1)}" y="${(labelYUnm + 4).toFixed(1)}" font-size="8.8" fill="#1D4ED8" font-weight="800" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif">Unmanaged Baseline (${traj.unmanaged.height} cm / ${cmToFtInStr(traj.unmanaged.height)})</text>

        <!-- Interactive Crosshairs Overlay (Responsive Hover Tracking) -->
        <g id="chart-crosshair-group" style="pointer-events: none;" opacity="0.85">
          <line id="growth-crosshair-v" x1="${curX.toFixed(1)}" y1="${padding.top}" x2="${curX.toFixed(1)}" y2="${height - padding.bottom}" stroke="#1D4ED8" stroke-width="1" stroke-dasharray="2,2" />
          <line id="growth-crosshair-h" x1="${padding.left}" y1="${curY.toFixed(1)}" x2="${width - padding.right}" y2="${curY.toFixed(1)}" stroke="#1D4ED8" stroke-width="1" stroke-dasharray="2,2" />
        </g>

        <!-- Axes -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1.5" />

        <!-- X-Axis Age Ticks (1 to 20 yrs) -->
        <text x="${scaleX(24)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 2</text>
        <text x="${scaleX(72)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 6</text>
        <text x="${scaleX(120)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 10</text>
        <text x="${scaleX(168)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 14</text>
        <text x="${scaleX(216)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 18</text>
        <text x="${scaleX(240)}" y="${height - 14}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Age 20</text>

        <!-- Y-Axis Height Ticks -->
        <text x="${padding.left - 8}" y="${scaleY(80) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">80cm</text>
        <text x="${padding.left - 8}" y="${scaleY(100) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">100cm</text>
        <text x="${padding.left - 8}" y="${scaleY(120) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">120cm</text>
        <text x="${padding.left - 8}" y="${scaleY(140) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">140cm</text>
        <text x="${padding.left - 8}" y="${scaleY(160) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">160cm</text>
        <text x="${padding.left - 8}" y="${scaleY(180) + 4}" font-size="10.5" font-weight="700" fill="#0F172A" text-anchor="end">180cm</text>

        <!-- Current Child Coordinate: Pulsing Bio-Emerald Point (#10B981) -->
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="14" fill="#1D4ED8" fill-opacity="0.25">
          <animate attributeName="r" values="7;15;7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="6" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2.5" filter="url(#glowPulse)" />

        <!-- Tooltip Badge -->
        <g transform="translate(${Math.max(padding.left + 6, Math.min(width - padding.right - 160, curX - 78))}, ${Math.max(padding.top + 4, curY - 38)})" class="growth-hover-tooltip">
          <rect x="0" y="0" width="156" height="26" rx="6" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.4" />
          <text x="78" y="17" font-size="10.5" font-weight="900" fill="#1D4ED8" text-anchor="middle">
            ${options && options.mph !== undefined ? `Current: ${curH}cm (${cmToFtInStr(curH)}) · ${curZ.percentile}th Pct` : `Current: ${curH}cm (${cmToFtInStr(curH)})`}
          </text>
        </g>
      </svg>
    `;
  }

  // 11. Generate 3-Tier Predicted Height Bar Chart HTML
  function render3TierBarChart(pred) {
    const isKo = Boolean(pred && pred._legacyKorean && !pred.isGlobal);
    const minScale = 140;
    const maxScale = 190;
    const calcWidthPct = (val) => Math.max(15, Math.min(100, Math.round(((val - minScale) / (maxScale - minScale)) * 100)));

    const wMph = calcWidthPct(pred.geneticMph);
    const wUnmanaged = calcWidthPct(pred.unmanagedHeight);
    const wPotential = calcWidthPct(pred.potentialHeight);

    const cmToFtInStr = (cm) => {
      if (typeof cm !== 'number' || isNaN(cm) || cm <= 0) return '';
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inVal = Math.round(totalIn % 12);
      return `${ft}'${inVal}"`;
    };

    const title1 = '① Genetic Target Height (Mid-Parental MPH)';
    const title2 = '② Unmanaged Habits Trajectory';
    const title3 = '③ Clinical Intervention Target Window';

    return `
      <div class="predicted-bars-container">
        <!-- Bar 1: Genetic MPH -->
        <div class="predicted-bar-row">
          <div class="predicted-bar-header">
            <span class="bar-title">${title1}</span>
            <span class="bar-val">${pred.geneticMph}cm <small style="color: #64748B; font-size: 0.82rem; font-weight: 700;">(${cmToFtInStr(pred.geneticMph)})</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-mph" style="width: ${wMph}%;"></div>
          </div>
          <div class="predicted-bar-caption">Tanner / Khamis-Roche clinical formula expectation (±3.3 in / ±8.5 cm)</div>
        </div>

        <!-- Bar 2: Unmanaged Loss -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">${title2}</span>
            <span class="bar-val bar-val-alert">${pred.unmanagedHeight}cm <small style="color: var(--rose-alert, #F43F5E); font-size: 0.85rem;">(-${pred.unmanagedLoss}cm / -${(pred.unmanagedLoss / 2.54).toFixed(1)}in loss)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-alert" style="width: ${wUnmanaged}%;"></div>
          </div>
          <div class="predicted-bar-caption">Cumulative growth velocity loss from disrupted sleep and postural strain (capped at -2.0 in / -5.0 cm)</div>
        </div>

        <!-- Bar 3: Golden Time Max Potential -->
        <div class="predicted-bar-row" style="margin-top: 1rem;">
          <div class="predicted-bar-header">
            <span class="bar-title">${title3}</span>
            <span class="bar-val bar-val-mint">${pred.potentialHeight}cm <small style="color: var(--cyan-pulse, #38BDF8); font-size: 0.9rem; font-weight: 800;">(+${pred.goldenTimeGain}cm / +${(pred.goldenTimeGain / 2.54).toFixed(1)}in potential)</small></span>
          </div>
          <div class="predicted-bar-track">
            <div class="predicted-bar-fill bar-fill-mint" style="width: ${wPotential}%;"></div>
          </div>
          <div class="predicted-bar-caption">Optimal trajectory achievable through deep slow-wave sleep GH release and targeted bio-nutrition (+${pred.goldenTimeGain} cm / +${(pred.goldenTimeGain / 2.54).toFixed(1)} in)</div>
        </div>
      </div>
    `;
  }

  // 12. Render 3 Habit Coaching Cards (Concise 1-Line Bullet Style)
  function renderCoachingCards(habits = []) {
    const hasMilk = habits.includes('milk_trouble') || habits.includes('picky_eater');
    const hasLateSleep = habits.includes('late_sleep');
    const hasPosture = habits.includes('poor_posture');

    return `
      <div class="coaching-cards-grid" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
        <!-- Card 1: Nutrition -->
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">① Diet &amp; Skeletal Growth Nutrition Core</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
            ${hasMilk 
              ? '• <strong>Calcium Citrate · Ossein Hydroxyapatite (45% Absorption)</strong> + Vitamin D3·K2 morning/evening to build bone matrix without lactose discomfort.' 
              : '• <strong>Calcium Citrate · Vitamin D3 (1,000–2,000 IU) · Zinc · Colostrum</strong> morning/evening to stimulate epiphyseal chondrocyte proliferation.'}
          </div>
        </div>

        <!-- Card 2: Sleep -->
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">② 10:00 PM Sleep Golden Window</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
            ${hasLateSleep 
              ? '• <strong>65% of daily human growth hormone (GH)</strong> is pulsed between 10:00 PM and 2:00 AM. Ensure lights off by 9:45 PM and fast 2 hours prior.' 
              : '• Growth hormone surges during the first 90-minute slow-wave sleep (SWS). A 5-minute pre-bed leg stretch promotes deep restorative sleep.'}
          </div>
        </div>

        <!-- Card 3: Posture -->
        <div class="bento-card-sub" style="background: #FFFFFF; border-left: 4px solid #93C5FD; border-radius: 14px; padding: 1.05rem 1.15rem;">
          <div style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8; margin-bottom: 0.35rem;">③ Hidden Height 0.8 in (2 cm) Decompression &amp; Jumping</div>
          <div style="font-size: 0.92rem; color: #0F172A; line-height: 1.55;">
            ${hasPosture 
              ? '• Evening <strong>doorway bar dead-hang (30s × 3 sets)</strong> unloads compressed spinal discs to restore <strong>+0.8 in (1.5–2.2 cm) of hidden stature</strong>.' 
              : '• 15 minutes of daily <strong>indoor trampoline or jump rope</strong> stimulates epiphyseal growth plates for skeletal accrual and posture recovery.'}
          </div>
        </div>
      </div>
    `;
  }

  // 13. Official Clinical Velocity, Sleep & Nutrition Box (Concise Summary)
  function renderOfficialClinicalAndNutritionBox(ageMonths, bmiInfo) {
    const clampedM = Math.max(12, Math.min(240, ageMonths || 120));

    const velocityList = (authoritiesData && authoritiesData.growthVelocityAndRedFlags) || [];
    const velocityGuide = velocityList.find((v) => clampedM >= v.minMonths && clampedM <= v.maxMonths) || {
      ageRangeLabel: 'Pediatric & School-Age Standard',
      normalVelocityCmPerYear: 'Annual Growth: 5.0 – 7.0 cm/yr (2.0 – 2.8 in/yr)',
      sleepRecommendation: '9 – 12 Hours Daily (Bedtime before 10:00 PM)'
    };

    return `
      <div style="background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 18px; padding: 1.2rem; margin-top: 1.15rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.02rem; font-weight: 900; color: #0F172A; margin: 0;">
            AAP Pediatric Endocrinology &amp; National Sleep Foundation Core Standards
          </h4>
          <span style="background: #EFF6FF; color: #1D4ED8; font-size: 0.78rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 9999px;">
            ${velocityGuide.ageRangeLabel}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">Normal Growth Velocity</span>
            <span style="font-size: 0.98rem; font-weight: 900; color: #1D4ED8;">${velocityGuide.normalVelocityCmPerYear}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">Recommended Sleep Duration</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: #1D4ED8;">${velocityGuide.sleepRecommendation}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.84rem; color: #475569; font-weight: 800;">Body Mass Index (BMI ${bmiInfo.bmi})</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: ${bmiInfo.bmiBadgeColor};">${bmiInfo.bmiStatus} (Clinical consult recommended if &lt; 4 cm/yr)</span>
          </div>
        </div>
      </div>
    `;
  }

  // 14. Age-Appropriate Recommended Products & Compact Reference Section for Tab 1 (Physical Growth)
  function renderAcademicEvidenceSection(profile = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));

    let ageBandTitle = `Age ${ageYears} Specialized`;
    let prod1, prod2, prod3;

    if (ageYears <= 3) {
      ageBandTitle = `Ages 1–3 (Toddler &amp; Infant)`;
      prod1 = {
        badge: `Age ${ageYears} Top Pick · Liquid Calcium &amp; D3`,
        title: 'ChildLife Essentials Liquid Calcium &amp; Magnesium with Vitamin D3 Drops',
        desc: `For toddlers at ${ageMonths} months, non-acidic liquid calcium citrate and vitamin D3 drops provide gentle, highly bioavailable bone mineralization.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%B0%A8%EC%9D%BC%EB%93%9C%EB%9D%BC%EC%9D%B4%ED%94%84+%EC%95%A1%EC%83%81+%EC%B9%BC%EC%8A%98+%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD+%EC%9C%A0%EC%95%84',
        btnText: `View Age ${ageYears} Liquid Calcium &amp; D3 ↗`
      };
      prod2 = {
        badge: `Age ${ageYears} Top Pick · Colostrum &amp; Zinc`,
        title: 'Pediatric Colostrum Powder &amp; Bioavailable Zinc Glycinate Sticks',
        desc: 'Supports healthy appetite, early mucosal immune barrier, and stimulates IGF-1 receptor sensitivity for continuous stature accrual.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%9C%A0%EC%95%84+%EC%B4%88%EC%9C%A0+%EB%B6%84%EB%A7%90+%EC%95%84%EC%97%B0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%98%81%EC%96%91%EC%A0%9C',
        btnText: `View Toddler Colostrum &amp; Zinc ↗`
      };
      prod3 = {
        badge: `Age ${ageYears} Top Pick · Safe Handle Trampoline`,
        title: 'Low-Impact Indoor Padded Trampoline with Handle &amp; Stature Gauge',
        desc: 'Stimulates vestibular equilibrium, cerebellar coordination, and provides micro-mechanical epiphyseal loading safely.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%A9%9C%ED%82%88+%EC%9C%A0%EC%95%84+%EC%95%88%EC%A0%84+%EC%86%90%EC%9E%A1%EC%9D%B4+%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%A4%EB%82%B4+%ED%8A%B8%EB%9E%A8%ED%8F%B4%EB%A6%B0',
        btnText: `View Toddler Handle Trampoline ↗`
      };
    } else if (ageYears <= 6) {
      ageBandTitle = `Ages 4–6 (Preschool &amp; Kindergarten)`;
      prod1 = {
        badge: `Age ${ageYears} Top Pick · Linear Growth Nutrients`,
        title: 'Clinical Botanical Complex (Astragalus Extract) + Calcium &amp; Vitamin D3/Zinc',
        desc: `Standardized botanical extract clinically documented to promote IGF-1 and IGFBP-3 synthesis without premature epiphyseal maturation.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `View Age ${ageYears} Botanical Growth Nutrients ↗`
      };
      prod2 = {
        badge: `Age ${ageYears} Top Pick · Chewable Calcium All-in-One`,
        title: 'Ossein Hydroxyapatite &amp; Colostrum Chewable with Vitamin D3 &amp; Zinc',
        desc: 'Gentle, chewable formulation providing 45% bioavailable calcium matrix for rapid early childhood skeletal expansion.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%89%B4%EC%A7%88%EB%9E%9C%EB%93%9C+%EC%B4%88%EC%9C%A0+%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD+%EC%95%84%EC%97%B0+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%B8%84%EC%96%B4%EB%B8%94',
        btnText: `View Pediatric Chewable Calcium ↗`
      };
      prod3 = {
        badge: `Age ${ageYears} Top Pick · Silent Jumping Trampoline`,
        title: 'Silent Shock-Absorption Rebounder &amp; Precision Digital Stadiometer',
        desc: '15 minutes of daily vertical bouncing triggers Wolff law epiphyseal loading across distal femur and proximal tibia growth plates.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%AC%B4%EC%86%8C%EC%9D%8C+%EC%8B%A4%EB%82%B4+%ED%8A%B8%EB%9E%A8%ED%8F%B4%EB%A6%B0+%EC%A0%90%ED%95%91%EB%A7%A4%ED%8A%B8',
        btnText: `View Silent Children Rebounder ↗`
      };
    } else if (ageYears <= 10) {
      ageBandTitle = `Ages 7–10 (Elementary School Phase)`;
      prod1 = {
        badge: `Age ${ageYears} Top Pick · Pre-Pubertal Linear Accrual`,
        title: 'Standardized Botanical Epiphyseal Activator + High-Bioavailability Calcium &amp; D3',
        desc: `Maximizes baseline stature accumulation before the pubertal growth spurt during critical ages 7–10.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `View Pre-Pubertal Growth Nutrients ↗`
      };
      prod2 = {
        badge: `Age ${ageYears} Top Pick · Bioavailable Microcrystalline Calcium`,
        title: 'Microcrystalline Ossein Hydroxyapatite (800mg) + Vitamin D3/K2 &amp; Zinc',
        desc: 'Provides 45% bioavailable calcium matrix to reinforce bone mineral content alongside rapid linear elongation.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%96%B4%EB%A6%B0%EC%9D%B4+%EC%96%B4%EA%B3%A8%EC%B9%BC%EC%8A%98+%EC%97%B0%EA%B3%A8%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD3+K2+%EC%95%84%EC%97%B0',
        btnText: `View Microcrystalline Calcium ↗`
      };
      prod3 = {
        badge: `Age ${ageYears} Top Pick · Digital Stadiometer &amp; Counter Jump Rope`,
        title: 'Ultrasonic Digital Stadiometer (1s Precision) &amp; Digital Counter Jump Rope',
        desc: 'Stimulates epiphyseal plates with 500 rhythmic daily jumps while tracking precise monthly stature velocity (cm/yr).',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%9D%B8%EB%B0%94%EB%94%94+%EC%B4%88%EC%9D%8C%ED%8C%8C+%EC%8B%A0%EC%9E%A5%EA%B3%84+%EC%96%B4%EB%A6%B0%EC%9D%B4+%EB%94%94%EC%A7%80%ED%84%B8+%ED%82%A4%EC%9E%AC%EA%B8%B0',
        btnText: `View Stadiometer &amp; Jump Rope ↗`
      };
    } else {
      ageBandTitle = `Ages 11–18 (Adolescent Growth Spurt &amp; Peak Height Velocity)`;
      prod1 = {
        badge: `Age ${ageYears} Top Pick · Peak Velocity Intensive Calcium &amp; Botanicals`,
        title: 'Adolescent High-Strength Calcium (1,100mg) + Vitamin D3/K2 &amp; Botanical Extract',
        desc: `Meets intense skeletal mineral demand during the final golden window before epiphyseal fusion.`,
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%A2%85%EA%B7%BC%EB%8B%B9%EA%B1%B4%EA%B0%95+%EC%95%84%EC%9D%B4%EC%BB%A4+HT042+%ED%99%A9%EA%B8%B0%EC%B6%94%EC%B6%9C%EB%AC%BC+%ED%82%A4%EC%84%B1%EC%9E%A5',
        btnText: `View Adolescent Growth Formulation ↗`
      };
      prod2 = {
        badge: `Age ${ageYears} Top Pick · Deep Sleep &amp; Growth Ache Magnesium`,
        title: 'Chelated Magnesium Glycinate &amp; Tart Cherry Restorative Sleep Complex',
        desc: 'Restores slow-wave sleep (SWS) growth hormone pulses and relieves nocturnal leg growing pains in active adolescents.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EC%B2%AD%EC%86%8C%EB%85%84+%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%ED%83%80%ED%8A%B8%EC%B2%B4%EB%A6%AC+%EC%96%B4%EA%B3%A8%EC%B9%BC%EC%8A%98+%EB%B9%84%ED%83%80%EB%AF%BCD',
        btnText: `View Adolescent Sleep &amp; Magnesium ↗`
      };
      prod3 = {
        badge: `Age ${ageYears} Top Pick · Hidden Height +0.8 in (+2 cm) Doorway Bar`,
        title: 'Doorway Decompression Dead-Hang Bar &amp; High-Density Spinal Foam Roller',
        desc: 'Evening 90-second spinal decompression unloads intervertebral discs to recover +0.8 in (1.8–2.2 cm) of compressed posture stature.',
        url: 'https://link.coupang.com/re/AFFSRP?lptag=AF7865143&subid=kidsfit&pageKey=%EB%AC%B4%ED%83%80%EA%B3%B5+%EC%95%84%EC%A0%84+%EC%9E%A0%EA%B8%88+%EB%AC%B8%ED%8B%80+%EC%B2%A0%EB%B4%89+%EC%8B%A4%EB%82%B4+%ED%84%B1%EA%B1%B8%EC%9D%B4%EB%B4%89+%ED%8F%BC%EB%A1%A4%EB%9F%AC',
        btnText: `View Doorway Bar &amp; Foam Roller ↗`
      };
    }

    return `
      <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.85rem 1.1rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.86rem; font-weight: 800; color: #1D4ED8;">Peer-Reviewed Academic Clinical Evidence: CDC / KDCA Reference Standards &amp; Pediatric Trials</span>
        <a href="https://pubmed.ncbi.nlm.nih.gov/25374566/" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: #1D4ED8; font-weight: 800; text-decoration: none;">PMID:25374566 Original Article ↗</a>
      </div>

      <!-- Bottom Recommended Products for Core 1 (Age-Tailored & Hidden by default so pure report shows first) -->
      <div id="core-1-recommended-products" class="curated-product-recommendation-section growth-product-section" style="display: none; background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 18px; padding: 1.25rem; margin-top: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h4 style="font-size: 1.1rem; font-weight: 900; color: #1D4ED8; margin: 0;">
            [${ageBandTitle}] Skeletal Growth &amp; Hidden Stature Curated Recommendations TOP 3
          </h4>
          <span style="font-size: 0.8rem; color: #1D4ED8; font-weight: 800;">Age ${ageYears} (${ageMonths} Months) Developmental Stage 1:1 Curation</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <!-- Product 1 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod1.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod1.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod1.desc}</p>
            </div>
            <a href="${prod1.url}" target="_blank" rel="noopener noreferrer" id="ref-chip-growth" class="reference-chip mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod1.btnText}
            </a>
          </div>

          <!-- Product 2 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod2.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod2.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod2.desc}</p>
            </div>
            <a href="${prod2.url}" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #EFF6FF; border: 1px solid #93C5FD; color: #1D4ED8; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod2.btnText}
            </a>
          </div>

          <!-- Product 3 -->
          <div style="background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 14px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.76rem; font-weight: 900; color: #1D4ED8; background: #EFF6FF; padding: 0.18rem 0.55rem; border-radius: 9999px;">${prod3.badge}</span>
              <div style="font-size: 1.0rem; font-weight: 900; color: #0F172A; margin: 0.45rem 0 0.35rem; line-height: 1.4;">${prod3.title}</div>
              <p style="font-size: 0.86rem; color: #0F172A; line-height: 1.5; margin: 0 0 0.75rem 0;">${prod3.desc}</p>
            </div>
            <a href="${prod3.url}" target="_blank" rel="noopener noreferrer" class="mobile-touch-btn" style="display: flex; min-height: 44px; align-items: center; justify-content: center; background: #EFF6FF; border: 1px solid #93C5FD; color: #1D4ED8; font-size: 0.88rem; font-weight: 900; padding: 0.55rem 0.85rem; border-radius: 10px; text-decoration: none;">
              ${prod3.btnText}
            </a>
          </div>
        </div>
        <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px dashed #BFDBFE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; font-size: 0.76rem; color: #475569;">
          <span>Academic References: Kim JH et al. (2018) Growth Charts · Lee D et al. Pediatric Clinical Trial</span>
          <a href="https://pubmed.ncbi.nlm.nih.gov/29628905/" target="_blank" rel="noopener noreferrer" style="color: #1D4ED8; text-decoration: underline;">PubMed PMID: 29628905 ↗</a>
        </div>
      </div>
    `;
  }

  // 14-B. 3-Tier Weight & Body Composition Balance Card (Matches Height 3-Tier Card)
  function render3TierWeightCard(profile, bmiInfo, pred, gender) {
    const curW = bmiInfo.currentWeight || Number(profile.currentWeight) || 35.5;
    const stdW = bmiInfo.standardWeight || 35.5;
    const optW = bmiInfo.optimalWeightForHeight || stdW;
    const target6mW = bmiInfo.targetWeight6m || Math.round((optW + 1.5) * 10) / 10;
    const curH = Number(profile.currentHeight) || 137.0;
    const wTop = bmiInfo.weightTopPercent !== undefined ? bmiInfo.weightTopPercent : 50.0;
    const wPct = bmiInfo.weightPercentile !== undefined ? bmiInfo.weightPercentile : 50.0;
    const wDelta = bmiInfo.weightDelta !== undefined ? bmiInfo.weightDelta : 0.0;
    const wDeltaStr = wDelta >= 0 ? `+${wDelta}kg` : `${wDelta}kg`;
    const optDelta = bmiInfo.weightVsHeightDelta !== undefined ? bmiInfo.weightVsHeightDelta : 0.0;
    const optDeltaStr = optDelta >= 0 ? `+${optDelta}kg` : `${optDelta}kg`;

    const maxRefW = Math.max(curW, stdW, optW, target6mW) * 1.18;
    const minRefW = Math.max(2.0, Math.min(curW, stdW, optW) * 0.65);
    const calcWWidth = (val) => Math.max(18, Math.min(100, Math.round(((val - minRefW) / Math.max(4, maxRefW - minRefW)) * 100)));

    const wStdPct = calcWWidth(stdW);
    const wCurPct = calcWWidth(curW);
    const wOptPct = calcWWidth(optW);
    const wTargetPct = calcWWidth(target6mW);

    return `
      <div id="weight-3tier-analysis-card" style="background: #FFFFFF; border: 1.5px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: #0F172A;">
              Child Weight &amp; Body Mass Index (BMI) 3-Tier Balance Comparison
            </h4>
            <p style="font-size: 0.82rem; color: #334155; margin: 0.2rem 0 0 0;">
              Pediatric Standard Median · Current Height (${curH}cm) Optimal Weight · 6-Month Target
            </p>
          </div>
          <span style="background: #EFF6FF; border: 1px solid ${bmiInfo.bmiBadgeColor}; color: ${bmiInfo.bmiBadgeColor}; font-size: 0.8rem; font-weight: 900; padding: 0.28rem 0.75rem; border-radius: 9999px;">
            BMI ${bmiInfo.bmi} · ${bmiInfo.bmiShortStatus || bmiInfo.bmiStatus}
          </span>
        </div>

        <div class="predicted-bars-container">
          <!-- Weight Bar 1: KDCA Peer Standard Weight -->
          <div class="predicted-bar-row">
            <div class="predicted-bar-header">
              <span class="bar-title">① Same-Age Peer Standard Median Weight (CDC / KDCA 50th Percentile)</span>
              <span class="bar-val">${stdW}kg</span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill bar-fill-mph" style="width: ${wStdPct}%;"></div>
            </div>
            <div class="predicted-bar-caption">Standard median reference weight for same-age ${gender === 'boy' ? 'boys' : 'girls'}</div>
          </div>

          <!-- Weight Bar 2: Current Child Weight -->
          <div class="predicted-bar-row" style="margin-top: 1rem;">
            <div class="predicted-bar-header">
              <span class="bar-title">② Current Child Weight (Top ${wTop}% · ${wPct}th Percentile)</span>
              <span class="bar-val" style="color: ${bmiInfo.bmiBadgeColor};">${curW}kg <small style="font-size: 0.84rem;">(vs Peer Median: ${wDeltaStr} / vs Optimal for Height: ${optDeltaStr})</small></span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill" style="width: ${wCurPct}%; background: ${bmiInfo.bmiBadgeColor};"></div>
            </div>
            <div class="predicted-bar-caption">${bmiInfo.bmiNote}</div>
          </div>

          <!-- Weight Bar 3: Optimal Weight for Current Height & 6-Month Goal -->
          <div class="predicted-bar-row" style="margin-top: 1rem;">
            <div class="predicted-bar-header">
              <span class="bar-title">③ Optimal Weight for Current Height (${curH}cm) → 6-Month Target</span>
              <span class="bar-val bar-val-mint">Optimal ${optW}kg <small style="color: #1D4ED8; font-size: 0.88rem; font-weight: 800;">→ 6-Month Goal: ${target6mW}kg</small></span>
            </div>
            <div class="predicted-bar-track">
              <div class="predicted-bar-fill bar-fill-mint" style="width: ${Math.max(wOptPct, wTargetPct)}%;"></div>
            </div>
            <div class="predicted-bar-caption">Balanced trajectory to reach maximum potential height (${pred.potentialHeight}cm) without excess adiposity or under-nutrition</div>
          </div>
        </div>
      </div>
    `;
  }

  // 15. Master Tab 1 Report Renderer
  function renderTab1Report(profile) {
    const ageMonths = profile.ageMonths || ((profile.ageYears || 10) * 12);
    const gender = normalizeSex(profile.gender);
    const standard = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en') ? 'CDC' : 'KDCA';

    const lms = getLmsForMonth(gender, ageMonths, standard);
    const kdca = calculateKdcaPercentile(profile.currentHeight, lms.L, lms.M, lms.S);
    const bmiInfo = evaluateWeightAndBmi(profile.currentHeight, profile.currentWeight, lms);
    const mphObj = calculateMPH(profile.fatherHeight, profile.motherHeight, gender);
    const pred = calculateHeightPrediction(mphObj.mph, profile.habits, profile.tannerPhase || profile.pubertyStage, ageMonths, gender);

    const deltaSign = kdca.deltaMedian >= 0 ? `+${kdca.deltaMedian}` : `${kdca.deltaMedian}`;
    const wDeltaSign = bmiInfo.weightDelta >= 0 ? `+${bmiInfo.weightDelta}` : `${bmiInfo.weightDelta}`;
    const genderLabel = gender === 'boy' ? 'Boy' : 'Girl';
    const vel = calculateVelocity(profile.recentGrowth6m || 3.0, Math.round(ageMonths / 12));

    return `
      <!-- Core 1 Container -->
      <div id="core-1-container" class="core-module-container">

        <!-- Big Stats Bento Header (2x2 Grid — 2 Cards Per Row Filling the Screen Cleanly) -->
        <div class="growth-stats-grid" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.85rem;">
          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--cyan-pulse, #38BDF8);">Stature &amp; Weight Percentiles</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: var(--cyan-pulse, #38BDF8); margin: 0.3rem 0;">Height Top ${kdca.topPercent}%</div>
            <span style="font-size: 0.8rem; color: #0F172A; font-weight: 700; display: block;">Weight Top ${bmiInfo.weightTopPercent}% (${bmiInfo.currentWeight}kg)</span>
            <span style="font-size: 0.75rem; color: #334155;">Height ${kdca.percentile}th · Weight ${bmiInfo.weightPercentile}th Pct</span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--growth-mint, #10B981);">Annual Growth Velocity</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: ${vel.alert ? '#1D4ED8' : 'var(--growth-mint, #10B981)'}; margin: 0.3rem 0;">
              ${vel.velocityCmPerYear} cm/yr
            </div>
            <span style="font-size: 0.8rem; color: #0F172A; font-weight: 700; display: block;">Based on Optimal ${bmiInfo.optimalWeightForHeight}kg</span>
            <span style="font-size: 0.75rem; color: ${vel.alert ? '#1D4ED8' : 'var(--text-secondary)'};">
              ${vel.alert ? 'Sub-Optimal Velocity (&lt;4.0cm/yr)' : vel.status === 'accelerated' ? 'Peak Growth Velocity' : 'Normal Growth Velocity'}
            </span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--amber-caution, #F59E0B);">Genetic Target Height (MPH)</span>
            <div style="font-size: 1.55rem; font-weight: 900; color: var(--amber-caution, #F59E0B); margin: 0.3rem 0;">${mphObj.mph}cm</div>
            <span style="font-size: 0.8rem; color: #1D4ED8; font-weight: 700; display: block;">Potential Stature Up to ${pred.potentialHeight}cm</span>
            <span style="font-size: 0.75rem; color: #334155;">${mphObj.rangeStr} (±8.5cm)</span>
          </div>

          <div class="stat-card" style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 1.15rem 0.9rem; text-align: center;">
            <span style="font-size: 0.84rem; font-weight: 800; color: var(--rose-alert, #F43F5E);">Growth Plate Remaining Window</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: var(--rose-alert, #F43F5E); margin: 0.35rem 0;">
              ${pred.windowHeadline || pred.monthsRemaining.split('(')[0].trim()}
            </div>
            <span style="font-size: 0.78rem; color: #1D4ED8; font-weight: 700; display: block;">${pred.windowSubLabel || ''}</span>
          </div>
        </div>

        <!-- Clear Clinical Explanation of Growth Plate Remaining Window -->
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 0.8rem 1rem; margin-bottom: 1.25rem; font-size: 0.84rem; color: #0F172A; line-height: 1.55;">
          <strong style="color: #1D4ED8;">[What is the Epiphyseal Growth Window?]</strong> The remaining period until distal epiphyseal cartilages fuse (${gender === 'boy' ? 'boys average age 16.5–17.0' : 'girls average age 14.5–15.0'}), representing <strong>the remaining biological window for linear stature growth</strong>. ${pred.windowMeaningKo || ''}
        </div>

        <!-- High-Resolution Interactive 3-Curve SVG Chart Card -->
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #0F172A;">
                3-Tier Adult Stature Trajectory Curves (Auxology Trajectory)
              </h4>
              <p style="font-size: 0.82rem; color: #334155; margin: 0.2rem 0 0 0;">
                Simulating 3 distinct growth trajectories from current age (${Math.round(ageMonths / 12)}) to age 20
              </p>
            </div>
            <div style="display: flex; gap: 0.85rem; font-size: 0.78rem; font-weight: 700;">
              <span style="color: #1D4ED8;">● Optimized Potential Trajectory</span>
              <span style="color: #1D4ED8;">● Genetic Target (MPH)</span>
              <span style="color: #1D4ED8;">● Unmanaged Habit Trajectory</span>
            </div>
          </div>
          ${renderSvgGrowthCurve(gender, ageMonths, profile.currentHeight, {
            mph: mphObj.mph,
            habits: profile.habits,
            tannerPhase: profile.tannerPhase || profile.pubertyStage,
            standard
          })}
        </div>

        <!-- 3-Tier Predicted Height Bar Chart -->
        <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 1rem 0; color: #0F172A;">
            Adult Stature 3-Tier Comparison (Genetic MPH vs Unmanaged Habits vs Golden Window Optimized)
          </h4>
          ${render3TierBarChart(pred)}
        </div>

        <!-- 3-Tier Weight & BMI Balance Card (Same Depth as Height!) -->
        ${render3TierWeightCard(profile, bmiInfo, pred, gender)}

        <!-- Official Pediatric Authority Guidance -->
        ${renderOfficialClinicalAndNutritionBox(ageMonths, bmiInfo)}

        <!-- 3 Habit Prescriptive Coaching Cards -->
        <div style="margin-top: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0F172A;">
            Clinical Protocol by Growth Inhibitor Factor
          </h4>
          ${renderCoachingCards(profile.habits)}
        </div>

        ${renderAcademicEvidenceSection(profile)}

      </div>
    `;
  }

  // Master Export Interface
  const GrowthEngine = {
    erf,
    normalCDF,
    getLmsForMonth,
    calculateLMSZScore,
    calculateKdcaPercentile,
    evaluateWeightAndBmi,
    calculateMPH,
    calculateMph,
    KHAMIS_ROCHE_COEFFICIENTS,
    calculateKhamisRoche,
    calculateCircadianSleepSchedule,
    calculateVelocity,
    predictAdultHeightTrajectories,
    calculateRemainingGrowthWindow,
    calculateHeightPrediction,
    calculateInterventionGains,
    getGrowthCurveData,
    renderSvgGrowthCurve,
    render3TierBarChart,
    render3TierWeightCard,
    renderCoachingCards,
    renderOfficialClinicalAndNutritionBox,
    renderAcademicEvidenceSection,
    renderTab1Report
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GrowthEngine;
  }
  if (typeof window !== 'undefined') {
    window.KidsFitGrowthEngine = GrowthEngine;
    window.TallerGrowthEngine = GrowthEngine;
  }
  if (typeof global !== 'undefined' && typeof window === 'undefined') {
    global.KidsFitGrowthEngine = GrowthEngine;
    global.TallerGrowthEngine = GrowthEngine;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
