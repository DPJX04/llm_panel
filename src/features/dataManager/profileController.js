/* Applies one edited model-profile field, validated by the same gate as loaded files. */
BenchPanel.define('features/dataManager/profileController', [
  'services/resultParser', 'store/workspaceStore',
], (resultParser, workspaceStore) => {
  'use strict';

  /**
   * @param {Object} model      a model from workspaceStore.getModels()
   * @param {string} field      'shortName' or a numeric profile field
   * @param {string} text       what the user typed; empty clears the value
   */
  function updateProfileField(model, field, text) {
    const trimmed = text.trim();
    const raw = field === 'shortName' ? trimmed : trimmed === '' ? null : Number(trimmed);
    const profile = resultParser.toProfile({ ...model.profile, [field]: raw });
    workspaceStore.updateProfile(model.key, { [field]: profile[field] });
  }

  return { updateProfileField };
});
