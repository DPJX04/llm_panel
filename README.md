# LLM Benchmark Panel

Turns vLLM `bench serve` result files into easy-to-read comparison tables and charts.
It runs in any browser with nothing to install: **double-click `index.html`**.

## Using it

1. Run your benchmarks with `--save-result`. Each run writes one JSON file, for one model at one concurrency level.
   ```bash
   vllm bench serve --model <model> --max-concurrency 16 --num-prompts 160 --save-result
   ```
2. Open `index.html`, go to **Data**, and drop in every result file, or pick the whole folder.
   One file may also hold many runs, e.g. concurrency 1–16 together: a JSON array, one JSON object per line
   (`--append-result`), objects pasted back to back, a wrapper like `{"results": [...]}`, or an object keyed by
   concurrency like `{"c1": {...}, "c16": {...}}`. The file extension can be `.json`, `.jsonl`, `.md` or `.txt`.
   A newer run for the same model and level replaces the older one.
3. In **Data → Models**, optionally give each model a short name and add model size, VRAM, GPU utilisation and power
   (from `nvidia-smi` during the run). The result files do not record hardware, and these numbers unlock the GPU efficiency table.
4. Present from **Overview**. Use **Compare models** and **Model detail** for questions.

Everything is saved in this browser, so a refresh keeps your data.
**Export workspace** saves runs and model details in one file. Load that file on another PC to see the same panel.
**Export CSV** gives every run with every metric, for Excel. **Print / PDF** prints the tab that is open.

To share the panel itself as one file, run `bash scripts/build-single-file.sh`. It writes `dist/benchmark-panel.html`.

## What the views show

| View | Contents |
|---|---|
| Overview | Headline winners, an overall scorecard (average rank across five criteria), capacity and single-user speed bars, throughput vs per-user speed charts, model line-up |
| Compare models | Focus-metric chart and grid, a ranking table per concurrency level, latency best / second-best / main concern, scaling efficiency, GPU efficiency |
| Model detail | One model: summary per level, token generation speed, latency percentiles, run details |
| Data | Load files, name models, enter hardware, export, remove runs |

## Metrics

| Metric | Meaning | Better |
|---|---|---|
| Req/s | Completed requests per second | higher |
| Output TPS | Generated tokens per second across all users | higher |
| Total TPS | Prompt plus generated tokens per second | higher |
| Tok/s per request | What one user sees, **≈ 1000 ÷ mean TPOT (ms)** | higher |
| TTFT | Time to first token | lower |
| TPOT | Time per output token after the first | lower |
| E2E | End-to-end time for the full answer | lower |
| Scaling efficiency | Output TPS ÷ (concurrency × Output TPS at the lowest level) | higher |
| Speed kept | Tok/s per request ÷ the same at the lowest level | higher |
| TPS per GB | Output TPS at peak ÷ VRAM used | higher |
| Tokens per joule | Output TPS at peak ÷ GPU power (W) | higher |

"Peak" is the highest concurrency level every model was tested at. "Low" is the lowest one.

## Project layout

Plain JavaScript, no build step. Browsers block ES modules on `file://` pages, so each file registers itself with a small
module registry (`src/platform/moduleRegistry.js`). The registry also enforces the dependency rules: a file that imports
across a forbidden boundary fails to load with a clear message. The layering follows the coding-structure skill in `.agent/skills/`.

```
index.html                 open this
src/
  platform/                module registry, layer rules, loader, load-error banner
  loadOrder.js             the one list of files, bottom layer first
  types/                   Result shape, BenchmarkRun and ModelProfile shapes
  constants/               metric catalogue, concurrency notes, design tokens (theme.css)
  config/                  app settings (storage key, file kinds)
  utils/                   pure logic: metrics, ranking, run merging, formatting, CSV
  services/                file reading and validation, browser storage, downloads
  store/                   workspaceStore: loaded runs and model profiles
  components/              shared UI: DataTable, LineChart, BarList, StatTile, ...
  features/                overview, comparison, modelDetail, dataManager (index.js is each one's only public door)
  navigation/              app shell and tabs
  main.js                  entry point
tests/                     browser test runner (tests sit beside the code as *.test.js)
scripts/                   run-tests.sh, build-single-file.sh
```

Dependencies point one way: `types → constants/config → utils → services → store → components → features → navigation → main`.
Features never import each other.

**Adding a file:** register it with `BenchPanel.define('layer/path', [deps], factory)`, then add it to `src/loadOrder.js` in its layer's block.

## Tests

```bash
bash scripts/run-tests.sh      # headless Edge/Chrome; exits non-zero on failure
```
Or open `tests/index.html` in a browser.
