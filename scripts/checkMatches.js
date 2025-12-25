import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const top150Data = JSON.parse(readFileSync(join(__dirname, '../src/data/top-150-ports.json'), 'utf-8'));
const portsData = JSON.parse(readFileSync(join(__dirname, '../src/data/ports.json'), 'utf-8'));

const normalize = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
};

const createPortMap = () => {
  const portMap = new Map();
  portsData.forEach((port) => {
    const normalizedKey = `${normalize(port.CITY)}-${normalize(port.COUNTRY)}`;
    if (!portMap.has(normalizedKey)) {
      portMap.set(normalizedKey, { name: port.CITY, country: port.COUNTRY });
    }
  });
  return portMap;
};

const portMap = createPortMap();
const matched = [];
const unmatched = [];

top150Data.forEach((item) => {
  const normalizedKey = `${normalize(item["Port Name"])}-${normalize(item.Country)}`;

  if (portMap.has(normalizedKey)) {
    matched.push(`${item["Port Name"]}, ${item.Country}`);
  } else {
    // Try partial matching
    let found = false;
    for (const [key, port] of portMap.entries()) {
      if (key.includes(normalize(item["Port Name"])) && key.includes(normalize(item.Country))) {
        matched.push(`${item["Port Name"]}, ${item.Country} -> MATCHED: ${port.name}, ${port.country}`);
        found = true;
        break;
      }
    }
    if (!found) {
      unmatched.push({ excel: `${item["Port Name"]}, ${item.Country}`, normalized: normalizedKey });
    }
  }
});

console.log(`\n✅ Matched: ${matched.length} ports`);
console.log(`❌ Unmatched: ${unmatched.length} ports\n`);

if (unmatched.length > 0) {
  console.log('Unmatched ports:');
  unmatched.forEach((item, i) => {
    console.log(`${i + 1}. ${item.excel}`);
    console.log(`   Normalized: ${item.normalized}`);
  });
}
