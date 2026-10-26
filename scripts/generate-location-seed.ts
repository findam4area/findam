const geoNg = require("geo-ng");
import fs from "fs";

// Get all states and their data
const states = geoNg.getNigeriaStates();

// Generate SQL for Nigerian states, LGAs, and wards
function generateLocationSeedSQL() {
  let sql = "-- Insert Nigerian states (all 36 states + FCT)\n";
  sql += "INSERT INTO nigerian_states (name) VALUES\n";

  const stateValues = states.map((state: any, index: number) => {
    const isLast = index === states.length - 1;
    return `  ('${state.name.replace(/'/g, "''")}')${isLast ? ";" : ","}`;
  });

  sql += stateValues.join("\n") + "\n\n";

  let totalLGAs = 0;
  let totalWards = 0;

  // Generate LGAs and wards for each state
  states.forEach((state: any) => {
    const lgas = geoNg.getLGAs(state.code);
    totalLGAs += lgas.length;

    sql += `-- Insert LGAs for ${state.name}\n`;
    sql += `INSERT INTO nigerian_areas (state_id, name)\n`;
    sql += `SELECT id, lga FROM (\n`;
    sql += `  SELECT id FROM nigerian_states WHERE name = '${state.name.replace(/'/g, "''")}'\n`;
    sql += `) s\n`;
    sql += `CROSS JOIN (\n`;
    sql += `  VALUES\n`;

    const lgaValues = lgas.map((lga: string, index: number) => {
      const isLast = index === lgas.length - 1;
      return `    ('${lga.replace(/'/g, "''")}')${isLast ? "" : ","}`;
    });

    sql += lgaValues.join("\n") + "\n";
    sql += `) AS l(lga);\n\n`;

    // Generate wards for each LGA
    lgas.forEach((lga: string) => {
      const wards = geoNg.getLgaSubAreas(state.code, lga);

      if (wards && wards.length > 0) {
        totalWards += wards.length;
        sql += `-- Insert wards for ${lga}, ${state.name}\n`;
        sql += `INSERT INTO nigerian_wards (area_id, name)\n`;
        sql += `SELECT id, ward FROM (\n`;
        sql += `  SELECT na.id FROM nigerian_areas na\n`;
        sql += `  JOIN nigerian_states ns ON na.state_id = ns.id\n`;
        sql += `  WHERE ns.name = '${state.name.replace(/'/g, "''")}' AND na.name = '${lga.replace(/'/g, "''")}'\n`;
        sql += `) a\n`;
        sql += `CROSS JOIN (\n`;
        sql += `  VALUES\n`;

        const wardValues = wards.map((ward: string, index: number) => {
          const isLast = index === wards.length - 1;
          return `    ('${ward.replace(/'/g, "''")}')${isLast ? "" : ","}`;
        });

        sql += wardValues.join("\n") + "\n";
        sql += `) AS w(ward);\n\n`;
      }
    });
  });

  console.log(`Total states: ${states.length}`);
  console.log(`Total LGAs: ${totalLGAs}`);
  console.log(`Total wards: ${totalWards}`);

  return sql;
}

// Generate the SQL
const locationSQL = generateLocationSeedSQL();

// Write to file
fs.writeFileSync("scripts/location-seed.sql", locationSQL);

console.log("Location seed SQL generated successfully!");
