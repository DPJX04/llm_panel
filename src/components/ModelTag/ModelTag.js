/* A model's name with its colour swatch, so a model reads the same in every table and chart. */
BenchPanel.define('components/ModelTag/ModelTag', ['components/dom'], (dom) => {
  'use strict';

  /** @param {{ name: string, colorSlot: number, modelId?: string }} model */
  function ModelTag(model) {
    return dom.h('span', { className: 'model-tag', title: model.modelId || model.name },
      dom.h('span', { className: 'model-tag__swatch', 'aria-hidden': 'true', style: { '--swatch': dom.seriesColor(model.colorSlot) } }),
      dom.h('span', { className: 'model-tag__name', text: model.name }));
  }

  return { ModelTag };
});
