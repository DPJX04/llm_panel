/*
 * Builds DOM nodes. All text goes in as text nodes, never as HTML,
 * because model names and file names come from files the user loads.
 */
BenchPanel.define('components/dom', [], () => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function append(parent, children) {
    children.flat(Infinity).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return parent;
  }

  function applyProps(node, props) {
    if (!props) return node;
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'className') node.setAttribute('class', value);
      else if (key === 'text') node.textContent = String(value);
      else if (key === 'on') Object.keys(value).forEach((event) => node.addEventListener(event, value[event]));
      else if (key === 'style') Object.keys(value).forEach((name) => node.style.setProperty(name, value[name]));
      else if (key === 'hidden') node.hidden = Boolean(value);
      else if (key === 'value' || key === 'checked' || key === 'disabled' || key === 'selected') node[key] = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    return node;
  }

  /** h('div', { className: 'x', on: { click } }, 'text', childNode, [more]) */
  function h(tag, props, ...children) {
    return append(applyProps(document.createElement(tag), props), children);
  }

  function svg(tag, props, ...children) {
    return append(applyProps(document.createElementNS(SVG_NS, tag), props), children);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  /** CSS colour for a model's series slot (1-8), or the neutral colour for overflow models. */
  function seriesColor(colorSlot) {
    return colorSlot > 0 ? `var(--series-${colorSlot})` : 'var(--series-other)';
  }

  return { h, svg, clear, append, seriesColor };
});
