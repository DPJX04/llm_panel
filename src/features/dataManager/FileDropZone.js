/* Where results come in: drag and drop, pick files, or pick a whole folder. */
BenchPanel.define('features/dataManager/FileDropZone', ['components/dom'], (dom) => {
  'use strict';

  /** @param {{ onFiles: (files: File[], options: { fromFolder: boolean }) => void }} props */
  function FileDropZone(props) {
    const fileInput = dom.h('input', { type: 'file', multiple: true, hidden: true, accept: '.json,.jsonl,.md,.txt,.log,application/json',
      on: { change: (event) => { props.onFiles(Array.from(event.target.files), { fromFolder: false }); event.target.value = ''; } } });
    const folderInput = dom.h('input', { type: 'file', multiple: true, hidden: true, webkitdirectory: true,
      on: { change: (event) => { props.onFiles(Array.from(event.target.files), { fromFolder: true }); event.target.value = ''; } } });

    const zone = dom.h('div', { className: 'drop-zone' },
      dom.h('div', { className: 'drop-zone__title', text: 'Drop benchmark result files here' }),
      dom.h('p', { className: 'drop-zone__hint', text: 'vLLM bench serve JSON results (one run per file, or many runs in one file), vllm serve logs (.log), or a saved workspace file.' }),
      dom.h('div', { className: 'drop-zone__buttons' },
        dom.h('button', { type: 'button', className: 'button button--primary', text: 'Choose files', on: { click: () => fileInput.click() } }),
        dom.h('button', { type: 'button', className: 'button', text: 'Choose folder', on: { click: () => folderInput.click() } })),
      fileInput, folderInput);

    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('is-dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('is-dragging');
      props.onFiles(Array.from(event.dataTransfer.files), { fromFolder: false });
    });
    return zone;
  }

  return { FileDropZone };
});
