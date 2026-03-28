# Data Licensing Runbook

## Objective
Obtain legally authorized fragrance metadata at production scale and ingest it into the canonical ML schema.

## Current Status
- Fragrantica automated data URL access: blocked (HTTP 403)
- Basenotes automated data URL access: blocked (HTTP 403)
- Latest probe artifact: ml/logs/source_probe/

## Step 1: Probe and Record Source Accessibility
Run:

powershell
& "c:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/.venv2/Scripts/python.exe" -m ml.scraper.source_probe

Output:
- Audit artifact in ml/logs/source_probe/
- Updated source statuses in ml/scraper/source_registry.json

## Step 2: Request Licensing
Use template:
- ml/scraper/LICENSE_REQUEST_TEMPLATE.md

Track each source in:
- ml/scraper/source_registry.json

Set these fields when approved:
- license_status: approved
- approved_for_production: true

## Step 3: Ingest Licensed Feed
Supported inputs: JSON, JSONL, CSV

Run:

powershell
& "c:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/.venv2/Scripts/python.exe" -m ml.pipeline.import_licensed_feed <input_file> <output_file>

Example:

powershell
& "c:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/.venv2/Scripts/python.exe" -m ml.pipeline.import_licensed_feed "partner_feed.jsonl" "ml/data/partner_feed_canonical.json"

## Step 4: Enforce Dataset Readiness Gate
Run:

powershell
& "c:/Users/KIIT0001/Downloads/Telegram Desktop/ScentScapeAI/backend/.venv2/Scripts/python.exe" -m ml.pipeline.dataset_gate "ml/data/partner_feed_canonical.json"

Promotion criteria:
- Row count >= 10,000
- Unique brands >= 500
- Gender populated >= 80%
- Year recency lag <= 1 year
- Interaction coverage >= 30%
- Notes and accords list normalization = 100%

## Step 5: Launch Policy
- Synthetic data is test-only.
- Production recommendation quality gates require licensed real-world feeds.
