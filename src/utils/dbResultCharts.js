/*
 * Shapes averaged database rows into what the Vector DB charts draw. Each database setup is one line (or one bar colour),
 * with a name and a fixed colour that the tables share, so a database reads the same everywhere.
 */
BenchPanel.define('utils/dbResultCharts', ['utils/dbResultSummary'], (dbResultSummary) => {
  'use strict';

  const SERIES_SLOTS = 8;

  /** The item's value for the key, or null when the item or the value is missing. */
  function valueAt(item, key) {
    return item && typeof item[key] === 'number' ? item[key] : null;
  }

  /** Colour slots 1-8, then 0 (neutral) for any past eight. */
  function slotFor(index) {
    return index < SERIES_SLOTS ? index + 1 : 0;
  }

  /**
   * Gives every row its line name and colour. Each database keeps one colour everywhere, in the order first seen.
   * When one dataset holds two setups of the same database (say m=16 and m=32), the later one is "#2" with a colour
   * of its own, so two lines in one chart never look alike. A setup keeps its line across ef search values.
   * @returns {Object[]}  the rows, each with `name` and `colorSlot` set
   */
  function withLines(rows) {
    const databases = Array.from(new Set(rows.map((row) => row.name)));
    const extraSetups = [];
    const lines = new Map();
    dbResultSummary.groupByCase(rows).forEach((entry) => {
      const setupsPerDatabase = new Map();
      entry.rows.forEach((row) => {
        const lineKey = `${entry.caseKey}@@${row.seriesKey}`;
        if (lines.has(lineKey)) return;
        const setups = setupsPerDatabase.get(row.name) || [];
        if (!setups.includes(row.seriesKey)) setups.push(row.seriesKey);
        setupsPerDatabase.set(row.name, setups);
        const number = setups.indexOf(row.seriesKey) + 1;
        if (number === 1) {
          lines.set(lineKey, { name: row.name, colorSlot: slotFor(databases.indexOf(row.name)) });
          return;
        }
        if (!extraSetups.includes(row.seriesKey)) extraSetups.push(row.seriesKey);
        lines.set(lineKey, { name: `${row.name} #${number}`, colorSlot: slotFor(databases.length + extraSetups.indexOf(row.seriesKey)) });
      });
    });
    return rows.map((row) => ({ ...row, ...lines.get(`${dbResultSummary.caseKeyOf(row)}@@${row.seriesKey}`) }));
  }

  /** Every line among the rows, once each, in colour order. @returns {Array<{ key: string, name: string, colorSlot: number }>} */
  function linesOf(rows) {
    const lines = new Map(rows.map((row) => [row.seriesKey, { key: row.seriesKey, name: row.name, colorSlot: row.colorSlot }]));
    return Array.from(lines.values()).sort((a, b) => (a.colorSlot || SERIES_SLOTS + 1) - (b.colorSlot || SERIES_SLOTS + 1));
  }

  /**
   * QPS against recall for the rows of one test case: one line per database, its points in ef search order.
   * A row missing QPS or recall has no point.
   * @returns {Array<{ name: string, colorSlot: number, points: Array<{ efSearch: number|null, qps: number, recall: number }> }>}
   */
  function tradeoffLines(rows) {
    const measured = rows.filter((row) => row.qps !== null && row.recall !== null);
    return linesOf(measured).map((line) => ({
      name: line.name,
      colorSlot: line.colorSlot,
      points: measured
        .filter((row) => row.seriesKey === line.key)
        .sort((a, b) => dbResultSummary.compareEf(a.efSearch, b.efSearch))
        .map((row) => ({ efSearch: row.efSearch, qps: row.qps, recall: row.recall })),
    }));
  }

  /**
   * How much more QPS the fastest line has than the next one, averaged over the ef search values every line ran.
   * @returns {{ leader: string, runnerUp: string, ratio: number, efValues: number[] }|null}
   *   null with fewer than two lines, or when they share no ef search value
   */
  function qpsLead(lines) {
    if (lines.length < 2) return null;
    const efLists = lines.map((line) => line.points.map((point) => point.efSearch).filter((ef) => ef !== null));
    const shared = efLists[0].filter((ef) => efLists.every((list) => list.includes(ef)));
    if (shared.length === 0) return null;
    const averages = lines
      .map((line) => ({ name: line.name, qps: dbResultSummary.mean(shared.map((ef) => line.points.find((point) => point.efSearch === ef).qps)) }))
      .sort((a, b) => b.qps - a.qps);
    return { leader: averages[0].name, runnerUp: averages[1].name, ratio: averages[0].qps / averages[1].qps, efValues: shared };
  }

  /**
   * Values for a grouped column chart of one dataset: one group per ef search value, one value per database (null where
   * it was not run there), so each database keeps its place and colour in every group.
   * @returns {{ series: Array<{ name: string, colorSlot: number }>, groups: Array<{ label: string, values: Array<number|null> }> }}
   */
  function columnGroups(rows, metricKey) {
    const lines = linesOf(rows);
    const groups = dbResultSummary.groupByCaseAndEf(rows).map((group) => ({
      label: group.efSearch === null ? 'ef not set' : `ef=${group.efSearch}`,
      values: lines.map((line) => valueAt(group.rows.find((row) => row.seriesKey === line.key), metricKey)),
    }));
    return {
      series: lines.map((line) => ({ name: line.name, colorSlot: line.colorSlot })),
      groups: groups.filter((group) => group.values.some((value) => value !== null)),
    };
  }

  /**
   * One metric (qps, latencyP99Ms) against concurrency, one line per row; meant for the rows of one card.
   * @returns {{ xValues: number[], series: Array<{ name: string, colorSlot: number, values: Array<number|null> }> }}
   */
  function concurrencyTrend(rows, metricKey) {
    const xValues = Array.from(new Set(rows.flatMap((row) => row.concurrencyPoints.map((point) => point.level)))).sort((a, b) => a - b);
    return {
      xValues,
      series: rows.map((row) => ({
        name: row.name,
        colorSlot: row.colorSlot,
        values: xValues.map((level) => valueAt(row.concurrencyPoints.find((point) => point.level === level), metricKey)),
      })),
    };
  }

  return { withLines, tradeoffLines, qpsLead, columnGroups, concurrencyTrend };
});
