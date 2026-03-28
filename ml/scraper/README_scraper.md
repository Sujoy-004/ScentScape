# Fragrantica External Scraper Bundle

This bundle is intended to run on your local machine or VPS when this workspace environment is blocked.

## Files in this bundle
- `fragrantica.py` - standalone resumable scraper
- `requirements.txt` - pinned scraper-only dependencies
- `README_scraper.md` - execution and validation guide

## Output target
- Target records: `5000+`
- Incremental output file: `data/fragrantica_raw.json`
- Checkpoint file for resume: `scraper_checkpoint.json`

Each record includes these required fields:
- `name`
- `brand`
- `year`
- `concentration`
- `gender_label`
- `description`
- `top_notes`
- `middle_notes`
- `base_notes`
- `accords`

## Setup (exact commands)
From the folder containing this README:

```bash
python -m venv .venv_scraper
```

Windows PowerShell:
```powershell
.\.venv_scraper\Scripts\Activate.ps1
pip install -r requirements.txt
```

Linux/macOS:
```bash
source .venv_scraper/bin/activate
pip install -r requirements.txt
```

## Run (exact command)
Default run for 5000 records:

```bash
python fragrantica.py --target-records 5000 --min-delay 1 --max-delay 3
```

Optional stricter throttling:

```bash
python fragrantica.py --target-records 5000 --min-delay 2 --max-delay 4
```

## Runtime estimate
Runtime depends on site response and blockage risk.
- Typical estimate for 5000 records at 1-3s/request: around 6-14 hours
- If retries or blocks occur, runtime can be longer

## Resuming from checkpoint
No special command is required.
- Re-run the same command.
- The scraper automatically reads `scraper_checkpoint.json` and continues.
- Progress is saved periodically and also on interrupt (`Ctrl+C`).

## Validation against dataset gate
After scraping finishes:

1. Import/normalize to canonical format:

```bash
python import_licensed_feed.py --input data/fragrantica_raw.json
```

2. Run production-readiness gate:

```bash
python dataset_gate.py
```

Expected behavior:
- Exit code `0` means pass
- Exit code `1` means fail

## Notes
- Output is written incrementally per record into `data/fragrantica_raw.json`.
- Checkpoint + incremental write means you can safely stop and resume runs.
- Keep delays enabled to reduce block risk.
