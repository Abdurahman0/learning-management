# Admin Backend Changes

This file summarizes the backend-only admin changes implemented for the new IELTS Master admin dashboard scope.

## What Changed

- Added reusable Content Bank support on top of the existing Reading and Listening models
- Added admin dashboard and analytics APIs under `/api/v1/admin/`
- Added richer admin user-management APIs under `/api/v1/admin/`
- Updated legacy `/api/auth/admin/users/` delete behavior to soft deactivate instead of hard delete
- Updated admin documentation and the admin Postman collection

## Model Changes

### `ListeningPart`

Added:

- `difficulty_level`
- `topic`
- `source`
- `preview_text`
- `estimated_time_minutes`
- `bank_origin`

Changed:

- `practice_test` is now nullable for bank items
- `part_number` is now nullable for bank items
- conditional uniqueness enforces `practice_test + part_number` only for test-attached rows

### `ReadingPassage`

Added:

- `difficulty_level`
- `topic`
- `source`
- `preview_text`
- `estimated_time_minutes`
- `bank_origin`

Changed:

- `practice_test` is now nullable for bank items
- `passage_number` is now nullable for bank items
- conditional uniqueness enforces `practice_test + passage_number` only for test-attached rows

### `QuestionVariantSet`

New model for reusable and cloned question variants.

Fields:

- `listening_part`
- `reading_passage`
- `name`
- `status`
- `origin_variant_set`
- `is_active`
- timestamps

### `QuestionGroup`

Added:

- `variant_set`

Validation now enforces:

- exactly one parent (`listening_part` xor `reading_passage`)
- `variant_set` is required
- `variant_set` must belong to the same parent content item

## Migrations

Added:

- `0007_admin_content_bank.py`
- `0008_admin_content_bank_tidy.py`

Backfill behavior in `0007_admin_content_bank.py`:

- copies `difficulty_level` from the owning `PracticeTest`
- defaults `source` to `CUSTOM_PRACTICE`
- generates `preview_text` from passage/transcript text
- derives `estimated_time_minutes` from `time_limit_seconds`
- creates one `Variant Set A` for each existing passage/part
- assigns existing `QuestionGroup` rows to the created variant set

## New Routes

### Dashboard and Analytics

- `GET /api/v1/admin/dashboard/`
- `GET /api/v1/admin/analytics/`

### Admin Users

- `GET, POST /api/v1/admin/users/`
- `GET, PATCH, DELETE /api/v1/admin/users/<uuid>/`
- `POST /api/v1/admin/users/<uuid>/reset-password/`
- `POST /api/v1/admin/users/<uuid>/send-message/`

### Content Bank

- `GET, POST /api/v1/admin/content-bank/passages/`
- `GET, PATCH, DELETE /api/v1/admin/content-bank/passages/<module>/<uuid>/`
- `POST /api/v1/admin/content-bank/passages/<module>/<uuid>/attach/`
- `GET, POST /api/v1/admin/content-bank/variant-sets/`
- `GET, PATCH, DELETE /api/v1/admin/content-bank/variant-sets/<uuid>/`

## Existing Route Updates

- `POST /api/v1/admin/question-groups/` now requires `variant_set`
- `POST /api/v1/admin/practice-tests/import/` now auto-creates `Variant Set A` per imported passage/part
- `DELETE /api/auth/admin/users/<uuid>/` now soft deactivates the user

## Deliverables Updated

- Updated [admin_api_guide.md](/home/hoopakid/ieltsmaster/ielts_master/admin_api_guide.md)
- Updated [ielts_master_admin.postman_collection.json](/home/hoopakid/ieltsmaster/ielts_master/ielts_master_admin.postman_collection.json)
- Added [new_changed_for_admin.md](/home/hoopakid/ieltsmaster/ielts_master/new_changed_for_admin.md)

## Test Coverage Added

- migration backfill coverage for Content Bank data
- content-bank API coverage
- `/api/v1/admin/users/` coverage
- `/api/v1/admin/dashboard/` coverage
- `/api/v1/admin/analytics/` coverage

## Verification

Ran:

```bash
pytest apps/users/tests -q
python manage.py makemigrations --check --dry-run --noinput --settings=config.settings.test
```
