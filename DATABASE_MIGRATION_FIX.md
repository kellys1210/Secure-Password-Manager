# Database Schema Migration Fix

## Problem

Production application failing with `column users.encryption_salt does not exist` error during user registration.

## Root Cause

Production Cloud SQL database missing `encryption_salt` column that exists in:

- Application code (SQLAlchemy User model)
- Local SQLite database (correct schema)
- Production Cloud SQL database (missing column)

## Solution

1. **Added Flask-Migrate support** for proper schema management
2. **Created migration script** (`scripts/fix_encryption_salt_migration.py`) for automated fixes
3. **Generated production SQL** for manual Cloud SQL execution

## Files Modified

- `backend/requirements.txt` - Added `Flask-Migrate==4.0.7`
- `backend/app/__init__.py` - Initialized Flask-Migrate

## Immediate Action Required

Apply production migration:

```bash
gcloud sql connect [INSTANCE_NAME] --user=postgres
ALTER TABLE users ADD COLUMN IF NOT EXISTS encryption_salt VARCHAR(64);
\d users
```

## Environment Impact

- **Local Development**: Already working (SQLite has correct schema)
- **Production**: Requires manual migration (Cloud SQL missing column)
