# AGENTS.md

## Project goal
Build a polished local LIC exam quiz dashboard from uploaded PDF question banks.

## Tech rules
- Use HTML, CSS, JavaScript only
- No React
- No framework
- No backend
- No database
- Use JSON files for data
- Use localStorage for persistence

## Data integrity rules
- Validate and correct before deduplication
- Remove only exact duplicates
- Keep similar-but-not-identical questions
- Never include ambiguous questions in the live quiz
- Never silently correct bad source data
- Always maintain correction logs

## Required data files
- raw_questions.json
- corrected_questions.json
- cleaned_questions.json
- flagged_questions.json
- corrections_log.json

## UX rules
- Professional exam-prep look
- Responsive on desktop and mobile
- One-question-at-a-time flow
- Immediate feedback in Study Mode
- Support Exam Mode
- LocalStorage persistence
- Include dashboard home, quiz, results, mistakes review, and developer review panel

## Local run requirement
- The app must be runnable in a browser using VS Code Live Server
- Mention clearly in README whether direct opening of index.html works
- Provide a preview link only if the execution environment supports it

## Deliverables
- index.html
- styles.css
- script.js
- raw_questions.json
- corrected_questions.json
- cleaned_questions.json
- flagged_questions.json
- corrections_log.json
- README.md
