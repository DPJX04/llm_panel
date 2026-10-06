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

6. To test **accuracy**, open **Accuracy**, paste the model server's URL, and start a run (see [Accuracy tests](#accuracy-tests)).

7. To compare **vector databases**, open **Vector DB** and drop in VectorDBBench result files
   (`result_<date>_<label>_<db>.json`) or a CSV with one run per row, or use **Choose files**. This tab has its own
   drop zone and its own saved list, so database results never mix with the LLM results.
   A CSV needs a `db` column; it also reads `qps`, `recall` (0–1 or a percentage), `p99 latency (ms)` (or
   `serial_latency_p99` in seconds), the ef search under any name the JSON uses (`hnsw_ef`, `ef_search`, …), `case_id`
   (or `dataset`), `k`, `db_label`, `run_id`, `task_label` and `timestamp`/`date`. Column names ignore case, spaces and
   `_`. Any other column (`m`, `ef_construct`, …) counts as an index setting, and runs only average together when those
   match, so give CSV runs the same settings columns as the JSON runs they should average with. Results are grouped by dataset (named from the VectorDBBench case id, e.g. case 11 is
   OpenAI 5M · 1536D and case 5 is Cohere 1M · 768D) and by ef search (`hnsw_ef`, `ef_search`, `ef`, `ef_runtime`), each
   with its config below. Runs with the same database, index config and case are averaged into one row; loading the
   same file twice counts it once.

Everything is saved in this browser, so a refresh keeps your data.
**Export workspace** saves runs, accuracy reports and model details in one file. Load that file on another PC to see the same panel.
**Export CSV** gives every run with every metric and the model's hardware details, for Excel. **Print / PDF** prints the tab that is open.

To share the panel itself as one file, run `bash scripts/build-single-file.sh`. It writes `dist/benchmark-panel.html`.

## What the views show

| View | Contents |
|---|---|
| Overview | Headline winners, an overall scorecard (percentage of the best on five criteria), capacity and single-user speed bars, throughput vs per-user speed charts, model line-up, and a warning if runs were measured differently |
| Compare models | Focus-metric chart and grid, a ranking table per concurrency level, latency best / second-best / main concern, scaling efficiency, GPU usage, memory breakdown and efficiency, KV cache |
| Model detail | One model: summary per level (incl. Req/s, Total TPS, TPOT), token generation speed, latency percentiles, run details |
| Accuracy | Run a question set against a model server; accuracy, wrong and declined rates, format misses and answer speed per model, beside its benchmark speed; accuracy vs time chart, accuracy by category, every question for every model, and each answer |
| Data | Load files and logs, name models, enter hardware and memory, export, remove runs and accuracy reports |
| Vector DB | VectorDBBench results, one section per dataset: headline tiles (highest QPS, best recall, lowest p99), QPS vs recall (one line per database, one point per ef search, with the average QPS lead), QPS bars and recall dots at each ef search. Then one card per dataset and ef search with average QPS, recall and serial p99 per database config, QPS and p99 latency across concurrency, and the config; every loaded run at the end |

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

## Accuracy tests

The **Accuracy** tab asks a model a fixed set of questions with known answers and grades the replies in the browser.
The model sees only the questions; the answers never leave the panel. It needs nothing but the model server.

The form has four steps; every setting is visible from the start, and hovering a setting's name explains it.

1. **Server.** Paste the server URL, e.g. `http://localhost:8003/v1` (with or without `/v1`), and press **Check server**.
   This only lists the served models; nothing runs yet. The API key is only needed if vLLM runs with `--api-key`; it is never saved.
2. **Model.** Pick the model. **Model id** is filled with the model the server loaded (vLLM's `root`, such as
   `Qwen/Qwen3-4B-Instruct-2507`), which is what `vllm bench serve` records, so accuracy and speed line up per model.
   **Label** matches a `--label` your benchmark runs used; also use it to keep variants of one model apart (e.g. two system prompts).
3. **Questions.** The built-in **Starter set** (52 questions: math, multiple choice, short facts, classification, summarization, false premises), or **Load question set…** for a JSON file, such as
   [`question-sets/inference-engine-survey.json`](question-sets/inference-engine-survey.json). Untick kinds or categories,
   or fill **First N questions** for a quick check. A run on part of a set is filed apart from the full set, so it never replaces a full run.
   **Preview questions** lists the questions the run will ask: each question with its passage and options, the expected answer
   and what the grader checks (key facts, forbidden facts, word limit), and the exact prompt the model receives.
4. **How to ask.**

   | Setting | Default | What it does |
   |---|---|---|
   | Temperature | 0 | 0 repeats exactly. Raise it (e.g. 0.7) together with repeats to see how much results vary |
   | Max tokens | 2048 | Longest reply per question. Reasoning models need more; the tab warns when replies were cut off |
   | Repeats | 1 | Asks every question this many times; results show the average and the **range** across repeats |
   | Parallel requests | 1 | Questions in flight at once. 1 measures single-user speed; more finishes sooner but each answer is slower |
   | Timeout (s) | 300 | A question with no reply by then counts as **No reply** |
   | System prompt | none | Sent before every question, e.g. the prompt the model runs with in production |

**Start run** unlocks once the server is checked. **Stop** discards the run. A finished run saves one report per model and
question set (or part of a set); a newer run replaces the older one. The **Settings** column shows how each run asked.

Open the panel in a browser on a machine that can reach the server (for example inside the ThinLinc session).
vLLM accepts requests from any page by default. A server started with `--allowed-origins` must include `"null"`
(what a page opened from a file reports), or the browser blocks the requests.

**How answers are graded** (the approach of OpenAI simple-evals, lm-evaluation-harness and SimpleQA):

| Kind | The model is asked to | Correct when |
|---|---|---|
| `choice` | think step by step, then end with `Answer: LETTER` | the last `Answer: X` (or `\boxed{X}`) is the right letter |
| `number` | think step by step, then end with `Answer: NUMBER` | the final number equals the reference |
| `short` | answer in a sentence or two, or say it does not know | every key fact appears; for a false-premise question, it declines or rejects the premise |
| `label` | classify a passage: pick one label, then end with `Answer: LABEL` | the last `Answer:` line names the right label |
| `summary` | summarize a passage within a word limit, using only facts in it | every key fact appears and no **forbidden fact** (a planted wrong detail) does |

A reply that answers but skips the asked format still scores, and counts as a **format miss**; so does a summary over its word limit.
Summaries also get **summary facts** (the share of key facts mentioned, partial credit) and **ROUGE-L** (word overlap with the reference summary).
There is no judge model, so a summary that states the facts in very different words can be under-scored: check the Answers table.

| Accuracy metric | Meaning | Better |
|---|---|---|
| Accuracy | Correct ÷ questions that got a reply (with repeats, every try counts) | higher |
| Range | With repeats: lowest and highest accuracy of a single pass. Gaps between models smaller than this are luck | |
| Acc. if answered | Correct ÷ questions the model chose to answer | higher |
| Wrong | Answered and wrong: the confident mistakes | lower |
| Declined | Said it did not know. Right on a false premise, a miss otherwise | |
| Format misses | Replies that did not end with `Answer: ...` as asked, or summaries over their word limit | lower |
| Summary facts | Share of required facts the summaries mention, averaged (only for sets with summaries) | higher |
| ROUGE-L | Word overlap of summaries with the reference summary, 0 to 1 | higher |
| Mean TTFT, time / question, P95 time | One question at a time, request sent to first and last token; reasoning counts | lower |
| Decode tok/s | Output tokens per second after the first token | higher |
| Tokens / answer | Reasoning models spend many tokens before answering, which costs time | |

Questions that got no reply (timeout, server error) are left out of every rate and shown as **No reply**.
If replies hit the token limit, the tab warns you: raise **Max tokens** for models that reason at length.
With a few dozen questions, one question is worth several points, so small accuracy gaps are noise.

**Question set format.** A JSON file. Each question needs an `id`, a `kind` and the fields its kind uses; `category` is optional.

```json
{
  "kind": "llm-question-set",
  "id": "my-set-v1",
  "title": "My questions",
  "questions": [
    { "id": "m1", "kind": "number", "category": "math", "question": "What is 17 x 23?", "reference": "391" },
    { "id": "c1", "kind": "choice", "question": "Which is a prime number?", "choices": ["51", "57", "61", "63"], "reference": "C" },
    { "id": "s1", "kind": "short", "question": "What is the capital of Australia?", "reference": "Canberra",
      "keyFacts": [["canberra"]] },
    { "id": "u1", "kind": "short", "question": "Who won the Nobel Prize in Mathematics in 2019?", "answerable": false,
      "reference": "There is no such prize.", "declineFacts": [["there is no nobel", "fields medal"]] },
    { "id": "k1", "kind": "label", "question": "Which team should handle this ticket?", "labels": ["IT", "HR", "Facilities"],
      "text": "The lift in building 2 is stuck on floor 3.", "reference": "Facilities" },
    { "id": "x1", "kind": "summary", "question": "Summarize the following text.", "maxWords": 40,
      "text": "The cooling pump on bank B failed at 02:15; 18 lots moved to bank C; a worn bearing was the cause.",
      "reference": "Bank B's cooling pump failed from a worn bearing; 18 lots moved to bank C.",
      "keyFacts": [["pump"], ["bearing"], ["18", "eighteen"]], "forbiddenFacts": [["bank a", "bank d"]] }
  ]
}
```

A key fact is a list of spellings; any one counts. Matching ignores case and punctuation, so `"llama.cpp"` matches
"Llama-CPP". A spelling ending in a digit must match a whole number (`"4"` does not match "40"); others may be word
stems (`"scalab"` matches "scalability"). Keep the ground truth out of the question text.

## Project layout

Plain JavaScript, no build step. Browsers block ES modules on `file://` pages, so each file registers itself with a small
module registry (`src/platform/moduleRegistry.js`). The registry also enforces the dependency rules: a file that imports
across a forbidden boundary fails to load with a clear message. The layering follows the coding-structure skill in `.agent/skills/`.

```
index.html                 open this
src/
  platform/                module registry, layer rules, loader, load-error banner
  loadOrder.js             the one list of files, bottom layer first
  types/                   Result shape, BenchmarkRun, ModelProfile, QuestionSet, EvalReport and DbResult shapes
  constants/               metric catalogues, concurrency notes, starter question set, design tokens (theme.css)
  config/                  app settings (storage key, file kinds)
  utils/                   pure logic: metrics, ranking, run merging, formatting, CSV, answer grading
  services/                file reading and validation, browser storage, downloads, model server requests
  store/                   workspaceStore: loaded runs, accuracy reports and model profiles
  components/              shared UI: DataTable, LineChart, ScatterChart, BarList, StatTile, ...
  features/                overview, comparison, modelDetail, accuracy, dataManager, vectorDb (index.js is each one's only public door)
  navigation/              app shell and tabs
  main.js                  entry point
question-sets/             question sets to load in the Accuracy tab
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
