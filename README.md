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
3. Optionally, also drop each model's `vllm serve` log (`.log`). The panel reads the model weights, KV cache memory and
   size, max model length, max concurrency and GPU count, and fills them in for the model the log names.
4. In **Data → Hardware and memory**, pick a model and add its GPU usage: paste your GPU usage table
   (`| Metric | GPU 1 | GPU 2 |` rows such as "Average GPU utilization", "Average memory used", "Average power"),
   or type it in the grid. Use **+ Add GPU** for tensor-parallel models. **Fill from vLLM log…** does step 3 for one model.
5. Present from **Overview**. Use **Compare models** and **Model detail** for questions. In Compare, the **Show**
   check boxes hide or show each section (the choice is remembered).

Everything is saved in this browser, so a refresh keeps your data.
**Export workspace** saves runs and model details in one file. Load that file on another PC to see the same panel.
**Export CSV** gives every run with every metric and the model's hardware details, for Excel. **Print / PDF** prints the tab that is open.

To share the panel itself as one file, run `bash scripts/build-single-file.sh`. It writes `dist/benchmark-panel.html`.

## What the views show

| View | Contents |
|---|---|
| Overview | Headline winners, an overall scorecard (percentage of the best on five criteria), capacity and single-user speed bars, throughput vs per-user speed charts, model line-up, and a warning if runs were measured differently |
| Compare models | Focus-metric chart and grid, a ranking table per concurrency level, latency best / second-best / main concern, scaling efficiency, GPU usage, memory breakdown and efficiency, KV cache |
| Model detail | One model: summary per level (incl. Req/s, Total TPS, TPOT), token generation speed, latency percentiles, run details |
| Data | Load files and logs, name models, enter hardware and memory, export, remove runs |

## Metrics

| Metric | Meaning | Better |
|---|---|---|
| Output TPS | Generated tokens per second across all users | higher |
| Tok/s per request | What one user sees, **≈ 1000 ÷ mean TPOT (ms)** | higher |
| TTFT | Time to first token (mean and P95) | lower |
| E2E | End-to-end time for the full answer (mean and P95) | lower |
| Success | Completed requests ÷ requests sent | higher |
| Scaling efficiency | Output TPS ÷ (concurrency × Output TPS at the lowest level) | higher |
| Req/s, Total TPS, TPOT | Model detail only: with a fixed output length they rank models exactly like Output TPS and tok/s per request | |
| TPS per GB | Output TPS at peak ÷ GPU memory used | higher |
| Tokens per joule | Output TPS at peak ÷ GPU power (W) | higher |
| KV cache size, tokens per GB | Tokens the KV cache holds, and per GB of KV cache memory | higher |
| Max concurrency | Full-length requests that fit in the KV cache at once (from the vLLM log) | higher |

"Peak" is the highest concurrency level every model was tested at. "Low" is the lowest one.

**Ties.** Each configuration is run once, and vLLM runs vary by about 1–3%. Values within 3% of each other are
shown as ties: they share a rank and are all marked best. Success rate is compared exactly.

**Scorecard.** On each criterion a model scores its value as a percentage of the best model's (100% = best);
the overall score is the plain average. A model 17× slower on one criterion loses far more than one 10% slower.

**Memory used** is not ranked: vLLM reserves a fixed share of GPU memory up front (`--gpu-memory-utilization`),
so it mostly reflects that setting. The split between weights and KV cache is what differs between models.
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
