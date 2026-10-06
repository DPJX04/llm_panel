/* Accuracy per question category, one row per model, so a model weak at math but strong at facts shows up. */
BenchPanel.define('features/accuracy/CategoryTable', [
  'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'constants/metricCatalog', 'utils/numberFormat',
], (dataTable, modelTag, metricCatalog, numberFormat) => {
  'use strict';

  const PERCENT = { format: 'percent', decimals: 0 };

  /** @param {{ rows: Object[] }} props  rows from resultRows */
  function CategoryTable(props) {
    const categories = [];
    props.rows.forEach((row) => row.summary.categories.forEach((entry) => {
      if (!categories.some((known) => known.category === entry.category)) categories.push(entry);
    }));

    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      ...categories.map(({ category, cases }) => {
        const value = (row) => {
          const entry = row.summary.categories.find((candidate) => candidate.category === category);
          return entry ? entry.accuracy : null;
        };
        return {
          label: category,
          title: `${cases} question${cases === 1 ? '' : 's'}`,
          align: 'right',
          value,
          better: metricCatalog.HIGHER,
          render: (row) => numberFormat.formatMetric(value(row), PERCENT),
        };
      }),
    ];
    return dataTable.DataTable({ columns, rows: props.rows, caption: 'Accuracy by category' });
  }

  return { CategoryTable };
});
