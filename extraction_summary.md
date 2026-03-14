# Extraction Summary

## Files read
- extracted_text/Insurance Agents - Model QB (Eng)_pagewise.txt
- extracted_text/Life-Question Bank_28032023_pagewise.txt
- extracted_text/lic question bank_pagewise.txt

## Counts
- Parsed question count from `Insurance Agents - Model QB (Eng)_pagewise.txt`: 147
- Parsed question count from `Life-Question Bank_28032023_pagewise.txt`: 310
- Parsed question count from `lic question bank_pagewise.txt`: 314
- Total raw count: 771
- Verified count: 344
- Correctable count: 0
- Flagged count: 427
- Duplicates removed: 0
- Final cleaned count: 344

## Parsing limitations
- Table-style extraction in the two "Correct Alternative" files causes line-wrap ambiguity between question and option boundaries; segmentation is heuristic and conservative.
- `lic question bank_pagewise.txt` does not consistently expose answer keys in machine-reliable form; questions without reliable answers were flagged instead of guessed.
- OCR and layout noise produced merged fragments in several rows; these were flagged when quality checks failed.

## Data integrity statement
- No placeholder, demo, mock, fallback, or sample questions were added.
- No direct PDF parsing was used in this run; only the three extracted text files above were used.

### Sample parsed questions from `extracted_text/Insurance Agents - Model QB (Eng)_pagewise.txt`
- Q10 (PAGE 1): 
- Q12 (PAGE 1): Gives us, an Example of a Standard Policy- Provision. A Clause, Precluding the Death Due to Pregnancy, for a Lady, Who i
- Q15 (PAGE 2): 4 16 17 18 A Which One of the Following Documents, will be issued by the Insurance Company, on Receipt of Subsequent Pre
- Q2 (PAGE 2): 
- Q3 (PAGE 2): 22 La ointee. Insured is a MinorNominee is a Minor Policy-Holder is Not of Sound Mind Policy-Holder is Not Married 19Ill

### Sample parsed questions from `extracted_text/Life-Question Bank_28032023_pagewise.txt`
- Q1 (PAGE 1): In the olden days, Chinese traders used to keep their goods in different boats while sailing through treacherous waters.
- Q2 (PAGE 1): What is the cost of risk directly proportional to?
- Q3 (PAGE 1): Which of the below statement is incorrect?
- Q4 (PAGE 1): The earliest type of modern insurance was in the form of
- Q5 (PAGE 1): In terms of Breach of Utmost Good Faith, which of the

### Sample parsed questions from `extracted_text/lic question bank_pagewise.txt`
- Q2 (PAGE 1): Chapter 1 - Introduction to Insurance Top 1. Which among the following is the regulator for the insurance industry in In
- Q2 (PAGE 1): Which among the following is a secondary burden of risk?
- Q3 (PAGE 1): Which among the following is a method of risk transfer?
- Q5 (PAGE 1): Which of the below insurance scheme is run by an insurer and not sponsored by th e Government?
- Q6 (PAGE 1): Risk transfer through risk pooling is called ________.

