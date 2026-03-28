# Kaggle to Canonical Schema Mapping

This document defines how Kaggle fragrance datasets are normalized into the canonical fragrance schema used by ScentScape.

Target output format: ml/data/seed_fragrances_canonical.json-compatible rows.

## Canonical output fields

Required canonical fields:
- id
- name
- brand
- year
- concentration
- gender_label
- description
- top_notes
- middle_notes
- base_notes
- accords

Optional interaction fields (used by dataset gates and ranking features):
- review_count
- rating_count
- view_count
- popularity_score

## Column alias mapping

- id:
  - id, fragrance_id, perfume_id, external_id, uuid
- name:
  - name, perfume, perfume_name, fragrance_name, title
- brand:
  - brand, house, maker, designer, company
- year:
  - year, release_year, launch_year, released, release_date
- concentration:
  - concentration, strength, concentration_type, perfume_concentration
- gender_label:
  - gender_label, gender, target_gender, sex, for_gender
- description:
  - description, summary, about, fragrance_description, notes_description
- top_notes:
  - top_notes, notes_top, top, top_note, head_notes
- middle_notes:
  - middle_notes, heart_notes, notes_middle, middle, heart
- base_notes:
  - base_notes, notes_base, base, base_note, drydown_notes
- all_notes (fallback source when top/middle/base are missing):
  - notes, note_list, fragrance_notes
- accords:
  - accords, main_accords, main_accord, accord, fragrance_family
- review_count:
  - review_count, reviews, num_reviews, review_total
- rating_count:
  - rating_count, ratings_count, votes, num_votes
- view_count:
  - view_count, views, view_total, page_views
- popularity_score:
  - popularity_score, popularity, rating, average_rating, rating_value

## Normalization rules

- id:
  - Use source ID if available.
  - Otherwise build deterministic fallback from name + brand + row index.
- year:
  - Extract first 4-digit year in range 1800-2100 from numeric or text values.
- concentration:
  - Normalize common labels: Extrait, EDP, EDT, EDC.
- gender_label:
  - Normalize to Male, Female, Unisex, or N/A.
- description:
  - Trim to max 500 chars.
- list fields:
  - top_notes, middle_notes, base_notes, accords are always lists.
  - Strings are split on |, ;, comma, and slash.
  - JSON-encoded lists in string form are parsed when possible.
- note pyramid fallback:
  - If top/middle/base are all empty but all_notes is present, partition all_notes into top/middle/base buckets.

## Canonical row example

{
  "id": "frag_001",
  "name": "Example Fragrance",
  "brand": "Example House",
  "year": 2020,
  "concentration": "Eau de Parfum",
  "gender_label": "Unisex",
  "description": "Short summary of scent profile.",
  "top_notes": ["Bergamot", "Grapefruit"],
  "middle_notes": ["Jasmine", "Rose"],
  "base_notes": ["Cedar", "Musk"],
  "accords": ["Citrus", "Floral", "Woody"],
  "review_count": 124.0,
  "rating_count": 311.0,
  "view_count": 5800.0,
  "popularity_score": 4.2
}

## Usage

Pipeline importer:
- python -m ml.pipeline.import_licensed_feed <input_file> <output_file>

Standalone scraper importer:
- cd ml/scraper
- python import_licensed_feed.py --input <input_file> --output data/fragrantica_canonical.json

Recommended output path for seed replacement:
- ml/data/seed_fragrances_canonical.json
