# Notes for coding agents

Follow the coding-structure skill in `.agent/skills/coding-structure/SKILL.md` for any code change.

How it maps onto this project (plain browser JavaScript, no bundler, must open from `file://`):

- **Sealing and import lint:** every file registers with `BenchPanel.define('layer/path', [deps], factory)`.
  `src/platform/moduleRegistry.js` rejects any dependency that breaks the rules in `src/platform/layerRules.js`
  (wrong layer direction, sibling feature, reaching past a feature's `index.js`). The rule is live; its tests prove it.
- **Load order:** add every new file to `src/loadOrder.js`, in its layer's block. The app, the tests and the build all read it.
- **Naming:** PascalCase for UI components, camelCase for everything else, styles beside the component that uses them.
- **Tests:** beside the file as `*.test.js`, listed under `tests` in `src/loadOrder.js`. Run `bash scripts/run-tests.sh`.
- **Untrusted text:** model and file names come from user files. Build DOM with `components/dom.js` (text nodes), never `innerHTML`.
