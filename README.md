# LIC Agent Quiz Dashboard (Local, No Framework)

A polished single-page LIC exam preparation dashboard built with **HTML + CSS + vanilla JavaScript** and JSON datasets.

## Project purpose
This project turns LIC question-bank content into a study-safe quiz workflow:
1. Extract raw MCQs from source PDFs.
2. Validate each question quality.
3. Correct high-confidence issues (with audit logs).
4. Flag uncertain questions for manual review.
5. Deduplicate exact duplicates only.
6. Run a local quiz app using only cleaned, reliable questions.

## Data pipeline files
- `raw_questions.json`: initial extraction from PDF text blocks
- `corrected_questions.json`: validation status per item (`VERIFIED`, `CORRECTABLE`, `FLAGGED_FOR_REVIEW`)
- `corrections_log.json`: transparent per-question correction records
- `flagged_questions.json`: uncertain/ambiguous items excluded from live quiz
- `cleaned_questions.json`: final quiz-ready dataset (verified + confidently corrected only)

## Validation policy
Each raw question is classified as:
- `VERIFIED`: source appears reliable
- `CORRECTABLE`: source error fixed with high confidence and logged
- `FLAGGED_FOR_REVIEW`: ambiguous/corrupt/unsafe to include

Flagged items are **never** included in the live quiz.

## Correction logging policy
All corrections are explicit in `corrections_log.json` with:
- original vs corrected question/options/answer
- reason, confidence score, correction basis
- inclusion status in final quiz

No silent source overwrites are done.

## Deduplication policy
Deduplication is applied **after** validation/correction.

Removed only:
- exact duplicates
- formatting/casing/punctuation-only duplicates
- OCR-noise-only duplicates

Kept:
- similar but meaningfully different questions
- same concept tested with different wording/options

If both raw and corrected variants exist, final quiz keeps the corrected/clean representative only.

## Dashboard features
- Home dashboard with totals derived from `cleaned_questions.json` (live quiz pool), topic count inferred from available topic/source fields, verified vs corrected split, and flagged count from `flagged_questions.json`
- Topic filtering (`All`, source/topic-wise, `Mixed Practice`)
- Study Mode (immediate feedback + mnemonic tips when wrong)
- Exam Mode (feedback deferred to result screen)
- One-question-at-a-time flow with answer locking
- Progress bar and live scoring
- Final results with topic-wise performance
- Mistakes review screen
- Developer review panel (corrected + flagged transparency)
- Session persistence via `localStorage`

## Run locally
### Recommended
Use **VS Code Live Server**:
1. Open project folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. App loads JSON files and runs fully in browser.

### Directly opening `index.html`
Direct file-open (`file://`) may fail to load JSON because browsers often block local `fetch` from file origin.

So: **Live Server is recommended for reliable behavior**.

## Where cleaned questions are stored
Quiz-ready questions are in `cleaned_questions.json` and are loaded directly at runtime (no hardcoded fallback question set in the live quiz path).

## Count derivation notes
- **Total cleaned questions**: `cleaned_questions.json`.length after runtime compatibility normalization.
- **Verified/Corrected counts**: based on each cleaned question's `status` value.
- **Flagged count**: `flagged_questions.json`.length.
- **Topic count/filter**: uses `topic` when present; otherwise derives a stable label from `sourceTextFile`.

## Add more PDFs later
1. Extract new raw blocks from PDF text/OCR.
2. Append entries to `raw_questions.json` with source metadata.
3. Re-run validation to update `corrected_questions.json`.
4. Add explicit records in `corrections_log.json`.
5. Move uncertain items to `flagged_questions.json`.
6. Rebuild `cleaned_questions.json` excluding flagged and exact duplicates.

## Known limitations
- PDF parsing is not automated in-browser in this version (no backend, no framework).
- Current dataset is prepared from manually curated extraction artifacts.
- Confidence scores are review-oriented heuristics, not ML probabilities.

## Preview link in this environment
No persistent public preview URL is guaranteed in this execution environment.
Use local preview (Live Server) for full functionality.
