/*
 * Builds the short names shown in tables. Hugging Face ids look like "org/repo":
 * when every org is different the org is the clearest name, otherwise the repo is.
 */
BenchPanel.define('utils/modelNaming', [], () => {
  'use strict';

  function splitId(modelId) {
    const slash = modelId.indexOf('/');
    return slash === -1 ? { org: '', repo: modelId } : { org: modelId.slice(0, slash), repo: modelId.slice(slash + 1) };
  }

  function allDistinct(values) {
    return values.every((value) => value !== '') && new Set(values).size === values.length;
  }

  /**
   * @param {Array<{ key: string, modelId: string, label: string|null }>} models
   * @returns {Object<string, string>}  short name by model key
   */
  function defaultShortNames(models) {
    const parts = models.map((model) => splitId(model.modelId));
    const orgs = parts.map((part) => part.org);
    const repos = parts.map((part) => part.repo);
    const base = allDistinct(orgs) ? orgs : allDistinct(repos) ? repos : models.map((model) => model.modelId);

    const names = {};
    models.forEach((model, index) => {
      names[model.key] = model.label ? `${base[index]} · ${model.label}` : base[index];
    });
    return names;
  }

  /** The key that groups runs of one model: the model id, plus the run label when one was given. */
  function modelKeyFor(modelId, label) {
    return label ? `${modelId} [${label}]` : modelId;
  }

  return { defaultShortNames, modelKeyFor };
});
