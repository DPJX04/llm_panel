/*
 * Changes a model's profile: single field edits, adding or removing a GPU, filling from a vLLM log,
 * and filling GPU usage from a pasted table. Every change goes through the same validation gate as loaded files.
 */
BenchPanel.define('features/dataManager/profileController', [
  'types/benchmarkRun', 'services/resultParser', 'services/gpuTableParser', 'services/resultFileService', 'store/workspaceStore',
], (benchmarkRun, resultParser, gpuTableParser, resultFileService, workspaceStore) => {
  'use strict';

  function copyOf(profile) {
    return JSON.parse(JSON.stringify(profile));
  }

  function save(model, candidate) {
    workspaceStore.setProfile(model.key, resultParser.toProfile(candidate));
  }

  function setAtPath(target, path, value) {
    const keys = path.split('.');
    const parent = keys.slice(0, -1).reduce((node, key) => node[key], target);
    parent[keys[keys.length - 1]] = value;
  }

  /**
   * @param {Object} model   a model from workspaceStore.getModels()
   * @param {string} path    e.g. 'shortName', 'modelSizeGb', 'gpus.1.powerW', 'kvCache.sizeTokens'
   * @param {string} text    what the user typed; empty clears the value
   */
  function updateProfileField(model, path, text) {
    const trimmed = text.trim();
    const candidate = copyOf(model.profile);
    setAtPath(candidate, path, path === 'shortName' ? trimmed : trimmed === '' ? null : Number(trimmed));
    save(model, candidate);
  }

  function addGpu(model) {
    if (model.profile.gpus.length >= benchmarkRun.MAX_GPUS) return;
    const candidate = copyOf(model.profile);
    candidate.gpus.push(benchmarkRun.createGpuUsage());
    save(model, candidate);
  }

  function removeGpu(model, index) {
    if (model.profile.gpus.length <= 1) return;
    const candidate = copyOf(model.profile);
    candidate.gpus.splice(index, 1);
    save(model, candidate);
  }

  /**
   * Copies what a vLLM log revealed into the profile, leaving fields the log did not mention untouched.
   * @returns {string[]}  what was filled, in words
   */
  function applyLogStats(model, stats) {
    const candidate = copyOf(model.profile);
    const filled = [];
    if (stats.modelSizeGb !== null) { candidate.modelSizeGb = stats.modelSizeGb; filled.push('model weights'); }
    if (stats.gpuMemoryTotalGb !== null) { candidate.gpuMemoryTotalGb = stats.gpuMemoryTotalGb; filled.push('GPU capacity'); }
    const kvFields = benchmarkRun.KV_CACHE_FIELDS.filter((field) => stats.kvCache[field] !== null);
    kvFields.forEach((field) => { candidate.kvCache[field] = stats.kvCache[field]; });
    if (kvFields.length > 0) filled.push('KV cache');
    const gpuCount = Math.min(stats.tensorParallelSize || 0, benchmarkRun.MAX_GPUS);
    while (candidate.gpus.length < gpuCount) candidate.gpus.push(benchmarkRun.createGpuUsage());
    if (gpuCount > 1) filled.push(`${gpuCount} GPUs (tensor parallel)`);
    save(model, candidate);
    return filled;
  }

  /** @returns {Promise<{ tone: string, title: string, lines: string[] }>}  what happened, for a notice */
  async function fillFromLogFile(model, file) {
    const read = await resultFileService.readLogFile(file);
    if (!read.ok) return { tone: 'error', title: 'Nothing filled from the log', lines: [read.error] };
    const filled = applyLogStats(model, read.data);
    const lines = read.data.modelId && read.data.modelId !== model.modelId
      ? [`The log is for "${read.data.modelId}", not "${model.modelId}". Check that you picked the right file.`]
      : [];
    return { tone: lines.length > 0 ? 'warning' : 'success', title: `Filled ${filled.join(', ')} for ${model.name} from ${file.name}.`, lines };
  }

  /** @returns {{ tone: string, title: string, lines: string[] }}  what happened, for a notice */
  function applyGpuTable(model, text) {
    const parsed = gpuTableParser.parseGpuUsageTable(text);
    if (!parsed.ok) return { tone: 'error', title: 'GPU usage not filled', lines: [parsed.error] };
    const candidate = copyOf(model.profile);
    candidate.gpus = parsed.data;
    save(model, candidate);
    const count = parsed.data.length;
    return { tone: 'success', title: `Filled GPU usage for ${model.name} (${count} GPU${count === 1 ? '' : 's'}).`, lines: [] };
  }

  return { updateProfileField, addGpu, removeGpu, applyLogStats, fillFromLogFile, applyGpuTable };
});
