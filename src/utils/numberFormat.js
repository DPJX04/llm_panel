/* Turns raw numbers into display text. Missing values always render as an em dash. */
BenchPanel.define('utils/numberFormat', [], () => {
  'use strict';

  const MISSING = '—';

  function isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /** Fixed decimals with thousands separators, e.g. 1,234.5 */
  function formatNumber(value, decimals) {
    if (!isNumber(value)) return MISSING;
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  /** @param {number|null} value  @param {{format: string, decimals: number, unit?: string}} metric */
  function formatMetric(value, metric) {
    if (!isNumber(value)) return MISSING;
    switch (metric.format) {
      case 'ms': return `${formatNumber(value, metric.decimals)} ms`;
      case 'seconds': return `${formatNumber(value / 1000, metric.decimals)} s`;
      case 'percent': return `${formatNumber(value * 100, metric.decimals)}%`;
      default: return metric.unit ? `${formatNumber(value, metric.decimals)} ${metric.unit}` : formatNumber(value, metric.decimals);
    }
  }

  /** A number with its unit. "%" and "×" sit tight ("85.9%", "2.1×"); other units get a space ("21.3 GB"). */
  function formatWithUnit(value, decimals, unit) {
    if (!isNumber(value)) return MISSING;
    const number = formatNumber(value, decimals);
    if (!unit) return number;
    return unit === '%' || unit === '×' ? `${number}${unit}` : `${number} ${unit}`;
  }

  /** Short axis label: whole numbers stay whole, fractional steps keep the digits they need. */
  function formatTick(value, metric) {
    const scaled = metric.format === 'seconds' ? value / 1000 : metric.format === 'percent' ? value * 100 : value;
    const rounded = Number(scaled.toPrecision(6));
    const decimals = Number.isInteger(rounded) ? 0 : Math.min(2, (String(rounded).split('.')[1] || '').length);
    const text = formatNumber(rounded, decimals);
    if (metric.format === 'seconds') return `${text} s`;
    if (metric.format === 'percent') return `${text}%`;
    return text;
  }

  /** Signed relative difference, e.g. "+4.2%" for 1.042 and "−3.0%" for 0.97 */
  function formatRatioDelta(ratio) {
    if (!isNumber(ratio)) return MISSING;
    const pct = (ratio - 1) * 100;
    const sign = pct >= 0 ? '+' : '−';
    return `${sign}${formatNumber(Math.abs(pct), 1)}%`;
  }

  /** @param {number|null} concurrency */
  function formatConcurrency(concurrency) {
    return concurrency === null ? 'Uncapped' : String(concurrency);
  }

  function formatDuration(seconds) {
    if (!isNumber(seconds)) return MISSING;
    if (seconds < 60) return `${formatNumber(seconds, 1)} s`;
    return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
  }

  /** vLLM writes dates as "20260923-151902"; show them as "2026-09-23 15:19". */
  function formatRunDate(date) {
    const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(date || '');
    return match ? `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}` : date || MISSING;
  }

  return { MISSING, isNumber, formatNumber, formatWithUnit, formatMetric, formatTick, formatRatioDelta, formatConcurrency, formatDuration, formatRunDate };
});
