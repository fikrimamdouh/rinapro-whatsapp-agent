# Data Directory

This directory contains the SQLite database file for persistent data storage.

## Files

- `rinapro.db` - Main SQLite database file
- `rinapro.db-shm` - Shared memory file (temporary)
- `rinapro.db-wal` - Write-ahead log file (temporary)

## Important Notes

⚠️ **Railway Deployment**:
- This directory is stored in Railway's persistent file system
- Data persists across deployments and restarts
- Do NOT delete this directory or the database file

## Backup

To backup your data:
1. Download the `rinapro.db` file
2. Store it in a safe location
3. You can restore it by uploading it back to this directory

## Database Location

- **Development**: `./data/rinapro.db`
- **Production (Railway)**: `/app/data/rinapro.db`
