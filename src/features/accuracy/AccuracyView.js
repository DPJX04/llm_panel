/* The Accuracy tab: run a question set against a model server, then compare models on accuracy and answer speed. */
BenchPanel.define('features/accuracy/AccuracyView', [
  'components/dom', 'components/Section/Section', 'components/SelectField/SelectField', 'components/Callout/Callout',
  'components/renderKeepingFocus', 'store/workspaceStore', 'utils/evalReportCollection',
  'features/accuracy/questionSetLibrary', 'features/accuracy/runController', 'features/accuracy/resultRows',
  'features/accuracy/RunPanel', 'features/accuracy/QualityTable', 'features/accuracy/AccuracySpeedChart',
  'features/accuracy/CategoryTable', 'features/accuracy/QuestionMatrix', 'features/accuracy/CaseAnswersTable',
], (dom, section, selectField, callout, focus, workspaceStore, evalReportCollection, questionSetLibrary, runController,
  resultRows, runPanel, qualityTable, accuracySpeedChart, categoryTable, questionMatrix, caseAnswersTable) => {
  'use strict';

  function mountAccuracy(container) {
    const library = questionSetLibrary.createQuestionSetLibrary();
    const run = runController.createRunController(render);
    let runSetId = library.list()[0].id;
    let resultsSetId = null;
    let answersKey = null;
    let libraryNotice = null;
    let previewOpen = false;

    async function handleLoadSet(file) {
      const loaded = await library.load(file);
      libraryNotice = loaded.ok
        ? { tone: 'success', title: `Loaded "${loaded.data.title}" (${loaded.data.questions.length} questions).`, lines: [] }
        : { tone: 'error', title: 'The question set could not be loaded', lines: [loaded.error] };
      if (loaded.ok) { runSetId = loaded.data.id; run.resetQuestionFilter(); }
      render();
    }

    async function handleStart() {
      const questionSet = library.find(runSetId);
      if (!questionSet) return;
      libraryNotice = null;
      await run.start(questionSet);
      // Show the most recent run, which may be filed under part of the set.
      resultsSetId = null;
      answersKey = null;
      render();
    }

    function Results(state) {
      const sets = evalReportCollection.questionSetsOf(state.evalReports);
      if (!sets.some((set) => set.id === resultsSetId)) resultsSetId = sets.length > 0 ? sets[0].id : null;
      if (!resultsSetId) {
        return dom.h('p', { className: 'hint', text: 'No accuracy results yet. Check a server above and start a run; each run adds one row per model here.' });
      }
      const { rows, levels } = resultRows.buildResultRows(state.evalReports, resultsSetId, workspaceStore.getAllModels(), state.runs);
      const answersRow = rows.find((row) => row.model.key === answersKey) || rows[0];
      answersKey = answersRow ? answersRow.model.key : null;
      const truncated = rows.filter((row) => row.summary.truncated > 0).map((row) => row.model.name);

      return [
        dom.h('div', { className: 'filter-bar' }, selectField.SelectField({
          label: 'Results for',
          value: resultsSetId,
          options: sets.map((set) => ({ value: set.id, label: set.title })),
          onChange: (id) => { resultsSetId = id; answersKey = null; render(); },
        })),
        section.Section({
          title: 'Accuracy and answer speed',
          description: 'One row per model, best first. Rates leave out questions that got no reply. Time and tokens are per question, asked one at a time. Hover a column header for its meaning.',
          footnote: levels.peak !== undefined ? 'Output TPS and Decode tok/s come from the loaded benchmark runs, for models that have them.' : null,
        },
        qualityTable.QualityTable({ rows, levels }),
        truncated.length > 0 ? dom.h('div', { className: 'accuracy-notice' }, callout.Callout({
          tone: 'warning',
          title: `Some replies were cut off at the token limit (${truncated.join(', ')}).`,
          lines: ['A cut-off reply usually loses its final answer. Re-run with a higher "Max tokens".'],
        })) : null),
        dom.h('div', { className: 'accuracy-two-up' },
          section.Section({ title: 'Accuracy against time per question', description: 'Top left is best: accurate and quick. Hover a dot for its values.' },
            accuracySpeedChart.AccuracySpeedChart({ rows })),
          section.Section({ title: 'Accuracy by category', description: 'Where each model is strong or weak. Hover a category for its question count.' },
            categoryTable.CategoryTable({ rows }))),
        section.Section({ title: 'Question by question', description: '"Solved by" shows which questions every model misses and which ones separate them.' },
          questionMatrix.QuestionMatrix({ rows })),
        answersRow ? section.Section({
          title: 'Answers',
          description: 'Each reply beside the expected answer. Open a reply to read it in full.',
          actions: [selectField.SelectField({
            label: 'Model',
            value: answersKey,
            options: rows.map((row) => ({ value: row.model.key, label: row.model.name })),
            onChange: (key) => { answersKey = key; render(); },
          })],
        }, caseAnswersTable.CaseAnswersTable({ report: answersRow.report })) : null,
      ];
    }

    function build() {
      const state = workspaceStore.getState();
      const selectedSet = library.find(runSetId) || library.list()[0];
      return dom.h('div', { className: 'view-stack' },
        runPanel.RunPanel({
          state: run.getState(),
          questionSets: library.list(),
          selectedSet,
          plan: run.plan(selectedSet),
          onField: run.setField,
          onToggle: run.toggleExcluded,
          onCheck: run.checkEndpoint,
          onServed: run.selectServed,
          onSetChange: (id) => { runSetId = id; run.resetQuestionFilter(); render(); },
          onLoadSet: handleLoadSet,
          onStart: handleStart,
          onStop: run.stop,
          previewOpen,
          onTogglePreview: () => { previewOpen = !previewOpen; render(); },
        }),
        libraryNotice ? dom.h('div', { className: 'accuracy-notice' }, callout.Callout(libraryNotice)) : null,
        Results(state));
    }

    function render() {
      focus.renderKeepingFocus(container, build);
    }

    render();
    return workspaceStore.subscribe(render);
  }

  return { mountAccuracy };
});
