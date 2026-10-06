/*
 * The form that starts an accuracy run, in four steps: server, model, questions, and how to ask them.
 * Every setting is visible from the start; Start run unlocks once the server has been checked.
 */
BenchPanel.define('features/accuracy/RunPanel', [
  'components/dom', 'components/Section/Section', 'components/Callout/Callout', 'components/SelectField/SelectField',
  'utils/questionFilter', 'features/accuracy/QuestionPreview',
], (dom, section, callout, selectField, questionFilter, questionPreview) => {
  'use strict';

  const CURRENT_QUESTION_LENGTH = 140;

  function Field(label, control, help) {
    return dom.h('label', { className: 'accuracy-field', title: help || null },
      dom.h('span', { className: 'accuracy-field__label', text: label }), control);
  }

  /** A text or number box. `onCommit` fires on Enter or leaving the field, for values that change what the form shows. */
  function TextInput(props) {
    return dom.h('input', {
      type: props.type || 'text',
      className: `accuracy-field__input${props.size ? ` accuracy-field__input--${props.size}` : ''}`,
      value: props.value,
      placeholder: props.placeholder || null,
      disabled: props.disabled,
      autocomplete: 'off',
      spellcheck: 'false',
      'data-focus-key': props.focusKey,
      on: {
        input: (event) => props.onInput(event.target.value),
        change: (event) => { if (props.onCommit) props.onCommit(event.target.value); },
        keydown: (event) => { if (event.key === 'Enter' && props.onEnter) props.onEnter(); },
      },
    });
  }

  function Step(number, title, ...children) {
    return dom.h('fieldset', { className: 'accuracy-step' },
      dom.h('legend', { className: 'accuracy-step__title', text: `${number} · ${title}` }), children);
  }

  function Checkbox(props) {
    return dom.h('label', { className: `accuracy-chip${props.checked ? ' is-checked' : ''}` },
      dom.h('input', { type: 'checkbox', checked: props.checked, disabled: props.disabled, 'data-focus-key': props.focusKey,
        on: { change: props.onToggle } }),
      dom.h('span', { text: props.label }),
      dom.h('span', { className: 'muted', text: String(props.count) }));
  }

  function servedLabel(model) {
    return model.root && model.root !== model.servedName ? `${model.servedName} (${model.root})` : model.servedName;
  }

  function ServerStep(props, busy) {
    const { state } = props;
    const status = state.served.length > 0
      ? dom.h('span', { className: 'status-flag status-flag--good', text: `✓ Connected · ${state.served.length} model${state.served.length === 1 ? '' : 's'}` })
      : dom.h('span', { className: 'muted', text: 'Not checked yet' });
    return Step(1, 'Server', dom.h('div', { className: 'accuracy-form__row' },
      Field('Server URL', TextInput({ value: state.baseUrlText, placeholder: 'http://localhost:8003/v1', size: 'wide', focusKey: 'url',
        disabled: busy, onInput: (value) => props.onField('baseUrlText', value), onEnter: props.onCheck })),
      Field('API key', TextInput({ type: 'password', value: state.apiKey, placeholder: 'only if the server needs one', focusKey: 'key',
        disabled: busy, onInput: (value) => props.onField('apiKey', value), onEnter: props.onCheck }),
      'Sent with each request and never saved. Leave empty for a vLLM server started without --api-key.'),
      dom.h('button', { type: 'button', className: 'button', disabled: busy, text: state.checking ? 'Checking…' : 'Check server', on: { click: props.onCheck } }),
      status));
  }

  function ModelStep(props, busy) {
    const { state } = props;
    const picker = state.served.length > 0
      ? selectField.SelectField({
        label: 'Model',
        value: state.servedName,
        options: state.served.map((model) => ({ value: model.servedName, label: servedLabel(model) })),
        onChange: props.onServed,
      })
      : Field('Model', dom.h('select', { className: 'select-field__control', disabled: true },
        dom.h('option', { text: 'Check the server first' })));
    return Step(2, 'Model', dom.h('div', { className: 'accuracy-form__row' },
      picker,
      Field('Model id', TextInput({ value: state.modelId, placeholder: 'filled in after the check', focusKey: 'model-id', disabled: busy, size: 'wide',
        onInput: (value) => props.onField('modelId', value) }),
      'The name results are filed under. Keep it equal to the benchmark runs\' model_id so speed and accuracy line up.'),
      Field('Label', TextInput({ value: state.label, placeholder: 'optional', focusKey: 'label', disabled: busy,
        onInput: (value) => props.onField('label', value) }),
      'Matches a --label your benchmark runs used. Also use it to keep variants apart, e.g. "sysprompt-v2": each label gets its own row.')));
  }

  function QuestionsStep(props, busy) {
    const { state, selectedSet } = props;
    const fileInput = dom.h('input', { type: 'file', hidden: true, accept: '.json,application/json',
      on: { change: (event) => { if (event.target.files[0]) props.onLoadSet(event.target.files[0]); event.target.value = ''; } } });
    const kinds = questionFilter.kindsOf(selectedSet);
    const categories = questionFilter.categoriesOf(selectedSet);
    const picked = props.plan.questions.length;
    const repeats = Math.max(1, Math.round(Number(state.repeats)) || 1);

    return Step(3, 'Questions',
      dom.h('div', { className: 'accuracy-form__row' },
        selectField.SelectField({
          label: 'Question set',
          value: selectedSet.id,
          options: props.questionSets.map((set) => ({ value: set.id, label: `${set.title} · ${set.questions.length} questions` })),
          onChange: props.onSetChange,
        }),
        dom.h('button', { type: 'button', className: 'button button--quiet', disabled: busy, text: 'Load question set…', on: { click: () => fileInput.click() } }),
        fileInput),
      dom.h('div', { className: 'accuracy-chips' },
        dom.h('span', { className: 'accuracy-chips__label', text: 'Kinds' }),
        kinds.map(({ kind, count }) => Checkbox({ label: kind, count, checked: !state.excludedKinds.includes(kind), disabled: busy,
          focusKey: `kind-${kind}`, onToggle: () => props.onToggle('excludedKinds', kind) }))),
      dom.h('div', { className: 'accuracy-chips' },
        dom.h('span', { className: 'accuracy-chips__label', text: 'Categories' }),
        categories.map(({ category, count }) => Checkbox({ label: category, count, checked: !state.excludedCategories.includes(category), disabled: busy,
          focusKey: `category-${category}`, onToggle: () => props.onToggle('excludedCategories', category) }))),
      dom.h('div', { className: 'accuracy-form__row' },
        Field('First N questions', TextInput({ type: 'number', value: state.limit, placeholder: 'all', focusKey: 'limit', disabled: busy, size: 'narrow',
          onInput: (value) => props.onField('limit', value), onCommit: (value) => props.onField('limit', value, true) }),
        'Keep only the first N of the picked questions, for a quick check. A run on part of a set is filed apart from the full set.'),
        dom.h('span', { className: 'accuracy-plan', text: picked === 0
          ? 'No questions picked'
          : `Asks ${picked} question${picked === 1 ? '' : 's'}${repeats > 1 ? ` × ${repeats} repeats = ${picked * repeats} requests` : ''}`
            + `${props.plan.subset ? ` · filed as "${props.plan.subset.label}"` : ''}` }),
        picked > 0 ? dom.h('button', { type: 'button', className: 'button button--quiet', 'data-focus-key': 'preview',
          text: props.previewOpen ? 'Hide questions' : 'Preview questions', 'aria-expanded': String(Boolean(props.previewOpen)),
          on: { click: props.onTogglePreview } }) : null),
      props.previewOpen && picked > 0
        ? questionPreview.QuestionPreview({ questions: props.plan.questions, systemPrompt: state.systemPrompt.trim() })
        : null);
  }

  function warnings(state) {
    const lines = [];
    const repeats = Number(state.repeats);
    if (repeats > 1 && Number(state.temperature) === 0) {
      lines.push('Repeats at temperature 0 give near-identical answers. Set a temperature such as 0.7 to measure how much results vary.');
    }
    if (Number(state.concurrency) > 1) {
      lines.push('With several questions at once, each one waits on the others: compare time per question only between runs with the same setting.');
    }
    return lines;
  }

  function SettingsStep(props, busy) {
    const { state } = props;
    const number = (name, label, help, size) => Field(label, TextInput({
      type: 'number', value: state[name], focusKey: name, disabled: busy, size: size || 'narrow',
      onInput: (value) => props.onField(name, value), onCommit: (value) => props.onField(name, value, true),
    }), help);
    const notes = warnings(state);
    return Step(4, 'How to ask',
      dom.h('div', { className: 'accuracy-form__row' },
        number('temperature', 'Temperature', '0 always picks the most likely token, so runs repeat exactly. Higher values add variety; use them with repeats.'),
        number('maxTokens', 'Max tokens', 'Longest reply allowed per question. Reasoning models need room to think; raise it if replies are cut off.'),
        number('repeats', 'Repeats', 'Ask every question this many times. The results show the average and the range across repeats.'),
        number('concurrency', 'Parallel requests', 'Questions in flight at once. 1 measures single-user speed; more finishes sooner but slows each answer.'),
        number('timeoutS', 'Timeout (s)', 'Give up on a question after this many seconds; it then counts as "no reply".')),
      dom.h('details', { className: 'accuracy-system-prompt', open: state.systemPrompt ? true : null },
        dom.h('summary', { text: state.systemPrompt ? 'System prompt (set)' : 'System prompt (optional)' }),
        dom.h('textarea', {
          className: 'accuracy-system-prompt__text', rows: '4', disabled: busy, 'data-focus-key': 'system-prompt',
          placeholder: 'Sent before every question, e.g. the prompt the model runs with in production. Leave empty for none.',
          value: state.systemPrompt,
          on: { input: (event) => props.onField('systemPrompt', event.target.value) },
        })),
      notes.length > 0 ? dom.h('ul', { className: 'accuracy-warnings' }, notes.map((line) => dom.h('li', { text: line }))) : null);
  }

  function Progress(progress) {
    const current = progress.current.length > CURRENT_QUESTION_LENGTH
      ? `${progress.current.slice(0, CURRENT_QUESTION_LENGTH - 1)}…` : progress.current;
    return dom.h('div', { className: 'accuracy-progress', role: 'status' },
      dom.h('progress', { className: 'accuracy-progress__bar', max: String(progress.total), value: String(progress.done) }),
      dom.h('div', { className: 'accuracy-progress__text',
        text: `${progress.done} of ${progress.total} answered · ${progress.correct} correct so far${progress.errors ? ` · ${progress.errors} without reply` : ''}` }),
      current ? dom.h('div', { className: 'accuracy-progress__question muted', text: `Asking: ${current}` }) : null);
  }

  /**
   * @param {{ state: Object, questionSets: Object[], selectedSet: Object, plan: { questions: Object[], subset: Object|null },
   *   onField: (name: string, value: string, redraw?: boolean) => void, onToggle: (list: string, value: string) => void,
   *   onCheck: () => void, onServed: (name: string) => void, onSetChange: (id: string) => void, onLoadSet: (file: File) => void,
   *   onStart: () => void, onStop: () => void, previewOpen: boolean, onTogglePreview: () => void }} props
   */
  function RunPanel(props) {
    const { state } = props;
    const busy = state.running || state.checking;
    const ready = state.served.length > 0 && props.plan.questions.length > 0;
    const action = state.running
      ? dom.h('button', { type: 'button', className: 'button button--danger', text: 'Stop', on: { click: props.onStop } })
      : dom.h('button', { type: 'button', className: 'button button--primary', disabled: busy || !ready, text: 'Start run',
        title: state.served.length === 0 ? 'Check the server first' : null, on: { click: props.onStart } });

    return section.Section({
      title: 'Run an accuracy test',
      description: 'The panel asks each question, grades the answers in this browser, and saves a report. The model sees only the questions, never the answers. Hover a setting\'s name for what it does.',
      footnote: props.selectedSet.description || null,
    },
    dom.h('div', { className: 'accuracy-form' },
      ServerStep(props, busy),
      ModelStep(props, busy),
      QuestionsStep(props, busy),
      SettingsStep(props, busy),
      dom.h('div', { className: 'accuracy-form__actions' }, action,
        state.served.length === 0 ? dom.h('span', { className: 'muted', text: 'Check the server to start.' }) : null)),
    state.progress ? Progress(state.progress) : null,
    state.notice ? dom.h('div', { className: 'accuracy-notice' }, callout.Callout(state.notice)) : null);
  }

  return { RunPanel };
});
