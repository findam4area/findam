# Location Seed Data Generation

This directory contains scripts for generating Nigerian location data (states, LGAs, and wards) for the FindAm platform.

## Overview

The location data is sourced from the `geo-ng` npm package, which provides:

- 37 Nigerian states (36 states + FCT)
- 786 Local Government Areas (LGAs)
- 8,782 wards (sub-areas within LGAs)

## Files

- `generate-location-seed.ts` - TypeScript script that generates SQL seed data
- `location-seed.sql` - Generated SQL file with all location data (auto-generated, do not edit manually)

## Usage

### Regenerating Location Data

If you need to regenerate the location seed data (e.g., after updating the geo-ng package):

```bash
npx tsx scripts/generate-location-seed.ts
```

This will:

1. Read data from the `geo-ng` package
2. Generate SQL INSERT statements for states, LGAs, and wards
3. Write the output to `scripts/location-seed.sql`
4. Display statistics (total states, LGAs, and wards)

### Applying to Database

The location data is split across multiple migration files:

1. `supabase/migrations/001_initial_schema.sql` - Creates the tables:
   - `nigerian_states` - Stores state names
   - `nigerian_areas` - Stores LGA names (linked to states)
   - `nigerian_wards` - Stores ward names (linked to LGAs)

2. `supabase/migrations/006_update_location_data.sql` - Seeds states and LGAs

3. `supabase/migrations/005_seed_wards.sql` - Seeds all 8,782 wards

To apply migrations:

```bash
npx supabase db reset  # Resets database and applies all migrations
```

Or to apply specific migrations:

```bash
npx supabase migration up
```

## Data Structure

### States Table

```sql
CREATE TABLE nigerian_states (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
```

### LGAs Table (nigerian_areas)

```sql
CREATE TABLE nigerian_areas (
  id UUID PRIMARY KEY,
  state_id UUID REFERENCES nigerian_states(id),
  name TEXT NOT NULL,
  UNIQUE(state_id, name)
);
```

### Wards Table

```sql
CREATE TABLE nigerian_wards (
  id UUID PRIMARY KEY,
  area_id UUID REFERENCES nigerian_areas(id),
  name TEXT NOT NULL,
  UNIQUE(area_id, name)
);
```

## Data Source

The data comes from the `geo-ng` package (https://www.npmjs.com/package/geo-ng), which provides:

- Accurate Nigerian geographic data
- Sub-areas (wards) for each LGA
- Consistent naming conventions (uppercase)

## Notes

- All state and LGA names are stored in UPPERCASE for consistency
- Ward names use title case or as provided by the source data
- The `geo-ng` package is installed as a dependency in `package.json`
- Total data size: ~410KB for ward data alone
- The migration files are safe to run multiple times (they use TRUNCATE before inserting)

## Troubleshooting

### Missing wards for some LGAs

Some LGAs in the `geo-ng` package may not have ward data. This is expected and the script handles it gracefully by skipping those LGAs.

### Duplicate key errors

If you encounter duplicate key errors, ensure you're running the migrations in order:

1. Schema creation (001)
2. Category seed data (004)
3. Location data update (006)
4. Ward seed data (005)

### Performance

Seeding 8,782 wards may take a few seconds. This is normal for the initial database setup.
