import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the CSV file
const csvPath = '/Users/scs/Downloads/UpdatedPub150.csv';
const csvContent = readFileSync(csvPath, 'utf-8');

// Parse CSV (simple parser for this use case)
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

// Find column indices
const portNameIdx = headers.findIndex(h => h.includes('Main Port Name'));
const countryIdx = headers.findIndex(h => h.includes('Country Code'));
const latIdx = headers.findIndex(h => h.trim() === 'Latitude');
const lonIdx = headers.findIndex(h => h.trim() === 'Longitude');
const regionIdx = headers.findIndex(h => h.includes('Region Name'));

console.log('Column indices:', { portNameIdx, countryIdx, latIdx, lonIdx, regionIdx });

// Ports we're looking for
const missingPorts = [
  'Sepetiba',
  'Tubarao',
  'Tubarão',
  'Churchill',
  'Valparaiso',
  'Valparaíso',
  'Puerto Bolivar',
  'Bandar Khomeini',
  'San Nicolas',
  'LOOP',
  'Louisiana Offshore Oil Port'
];

const foundPorts = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  // Simple CSV split (doesn't handle quoted commas perfectly, but should work for this)
  const cols = line.split(',');

  const portName = cols[portNameIdx]?.trim();
  const country = cols[countryIdx]?.trim();
  const lat = cols[latIdx]?.trim();
  const lon = cols[lonIdx]?.trim();
  const region = cols[regionIdx]?.trim();

  // Check if this is one of our missing ports
  for (const searchPort of missingPorts) {
    if (portName && portName.toLowerCase().includes(searchPort.toLowerCase())) {
      foundPorts.push({
        portName,
        country,
        region,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        line: i
      });
      break;
    }
  }
}

console.log('\nFound ports:');
foundPorts.forEach(port => {
  console.log(`\n${port.portName}, ${port.country}`);
  console.log(`  Region: ${port.region}`);
  console.log(`  Lat: ${port.lat}, Lon: ${port.lon}`);
  console.log(`  Line: ${port.line}`);
});

console.log(`\nTotal found: ${foundPorts.length}`);
