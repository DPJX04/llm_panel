/*
 * Where files come in: drop them on the dashed area, or pick them with the buttons.
 * Each tab that loads files gives it its own text and file types.
 */
BenchPanel.define('components/DropZone/DropZone', ['components/dom'], (dom) => {
  'use strict';

  /** A hidden file input that hands the picked files over, then clears itself so the same file can be picked again. */
  function FileInput(props, fromFolder) {
    return dom.h('input', { type: 'file', multiple: true, hidden: true, accept: fromFolder ? null : props.accept, webkitdirectory: fromFolder,
      on: { change: (event) => { props.onFiles(Array.from(event.target.files), { fromFolder }); event.target.value = ''; } } });
  }

  /**
   * @param {{ title: string, hint: string, accept: string, allowFolder?: boolean,
   *   onFiles: (files: File[], options: { fromFolder: boolean }) => void }} props
   *   accept: the file picker's filter, e.g. ".json,.csv"; allowFolder adds a "Choose folder" button
   */
  function DropZone(props) {
    const fileInput = FileInput(props, false);
    const folderInput = props.allowFolder ? FileInput(props, true) : null;

    const zone = dom.h('div', { className: 'drop-zone' },
      dom.h('div', { className: 'drop-zone__title', text: props.title }),
      dom.h('p', { className: 'drop-zone__hint', text: props.hint }),
      dom.h('div', { className: 'drop-zone__buttons' },
        dom.h('button', { type: 'button', className: 'button button--primary', text: 'Choose files', on: { click: () => fileInput.click() } }),
        folderInput ? dom.h('button', { type: 'button', className: 'button', text: 'Choose folder', on: { click: () => folderInput.click() } }) : null),
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

  return { DropZone };
});
