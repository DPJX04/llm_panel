/*
 * Redraws a view without losing the user's place: re-rendering replaces inputs, so focus goes back to the field
 * with the same data-focus-key, and Tab-through editing keeps working.
 */
BenchPanel.define('components/renderKeepingFocus', ['components/dom'], (dom) => {
  'use strict';

  /** @param {HTMLElement} container  @param {() => Node} build */
  function renderKeepingFocus(container, build) {
    const active = document.activeElement;
    const focusKey = active && container.contains(active) ? active.getAttribute('data-focus-key') : null;
    dom.clear(container);
    container.appendChild(build());
    if (focusKey) {
      const target = Array.from(container.querySelectorAll('[data-focus-key]')).find((node) => node.getAttribute('data-focus-key') === focusKey);
      if (target) target.focus();
    }
  }

  return { renderKeepingFocus };
});
