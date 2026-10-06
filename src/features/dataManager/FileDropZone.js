/* Where LLM results come in: drag and drop, pick files, or pick a whole folder. */
BenchPanel.define('features/dataManager/FileDropZone', ['components/DropZone/DropZone'], (dropZone) => {
  'use strict';

  /** @param {{ onFiles: (files: File[], options: { fromFolder: boolean }) => void }} props */
  function FileDropZone(props) {
    return dropZone.DropZone({
      title: 'Drop benchmark result files here',
      hint: 'vLLM bench serve JSON results (one run per file, or many runs in one file), vllm serve logs (.log), accuracy report files, or a saved workspace file.',
      accept: '.json,.jsonl,.md,.txt,.log,application/json',
      allowFolder: true,
      onFiles: props.onFiles,
    });
  }

  return { FileDropZone };
});
