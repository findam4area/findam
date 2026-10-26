-- Update location data to use geo-ng package data
-- This migration replaces the old state/LGA data with data from geo-ng
-- which provides consistent formatting and includes ward data

-- First, clear existing location data (if any)
TRUNCATE TABLE nigerian_wards CASCADE;
TRUNCATE TABLE nigerian_areas CASCADE;
TRUNCATE TABLE nigerian_states CASCADE;

-- Insert Nigerian states (all 36 states + FCT)
INSERT INTO nigerian_states (name) VALUES
  ('ABIA'),
  ('ADAMAWA'),
  ('AKWA IBOM'),
  ('ANAMBRA'),
  ('BAUCHI'),
  ('BAYELSA'),
  ('BENUE'),
  ('BORNO'),
  ('CROSS RIVER'),
  ('DELTA'),
  ('EBONYI'),
  ('EDO'),
  ('EKITI'),
  ('ENUGU'),
  ('FCT'),
  ('GOMBE'),
  ('IMO'),
  ('JIGAWA'),
  ('KADUNA'),
  ('KANO'),
  ('KATSINA'),
  ('KEBBI'),
  ('KOGI'),
  ('KWARA'),
  ('LAGOS'),
  ('NASARAWA'),
  ('NIGER'),
  ('OGUN'),
  ('ONDO'),
  ('OSUN'),
  ('OYO'),
  ('PLATEAU'),
  ('RIVERS'),
  ('SOKOTO'),
  ('TARABA'),
  ('YOBE'),
  ('ZAMFARA');

-- Insert LGAs for ABIA
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'ABIA'
) s
CROSS JOIN (
  VALUES
    ('ABA NORTH'),
    ('ABA SOUTH'),
    ('AROCHUKWU'),
    ('BENDE'),
    ('IKWUANO'),
    ('ISIALA NGWA'),
    ('ISIALA NGWA SOUTH'),
    ('ISUIKWUATO'),
    ('OBINGWA'),
    ('OHAFIA'),
    ('OSISIOMA'),
    ('UGWUNABO'),
    ('UKWA EAST'),
    ('UKWA WEST'),
    ('UMU NNEOCHI'),
    ('UMUAHIA NORTH'),
    ('UMUAHIA SOUTH')
) AS l(lga);


