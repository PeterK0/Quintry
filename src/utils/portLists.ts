import type { Port, PortList, PortListItem } from '../types/quiz.types';
import top150Data from '../data/top-150-ports.json';
import portsData from '../data/ports.json';
import { portNameMappings } from '../data/portNameMappings';

// Normalize port and country names for matching
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
};

// Normalize country names to fix inconsistencies (same as in MapQuiz.tsx)
const normalizeCountryName = (country: string): string => {
  const normalized = country.trim();
  // Consolidate USA variations to match Top 150 Ports list
  if (normalized === 'United States' || normalized === 'U.S.A.') {
    return 'USA';
  }
  return normalized;
};

// Apply manual mappings
const applyMapping = (portName: string, country: string): { portName: string; country: string } => {
  const key = `${normalize(portName)}|${normalize(country)}`;
  const mapping = portNameMappings[key];

  if (mapping) {
    const [mappedPort, mappedCountry] = mapping.split('|');
    return { portName: mappedPort, country: mappedCountry };
  }

  return { portName: normalize(portName), country: normalize(country) };
};

// Create a map of normalized ports from the database
// Using Map<string, Port[]> to handle multiple ports with the same name
const createPortMap = (): Map<string, Port[]> => {
  const portMap = new Map<string, Port[]>();
  (portsData as any[]).forEach((port: any, index: number) => {
    const normalizedCountry = normalizeCountryName(port.COUNTRY);
    const normalizedKey = `${normalize(port.CITY)}-${normalize(normalizedCountry)}`;

    const portData: Port = {
      id: index + 1,
      name: port.CITY,
      country: normalizedCountry,
      region: port.STATE || normalizedCountry,
      lat: port.LATITUDE,
      lng: port.LONGITUDE,
    };

    if (!portMap.has(normalizedKey)) {
      portMap.set(normalizedKey, [portData]);
    } else {
      // Check if this exact port (same coordinates) already exists
      const existingPorts = portMap.get(normalizedKey)!;
      const isDuplicate = existingPorts.some(
        p => p.lat === portData.lat && p.lng === portData.lng
      );
      if (!isDuplicate) {
        existingPorts.push(portData);
      }
    }
  });
  return portMap;
};

// Match Excel port names with database ports
export const matchPortListWithDatabase = (listItems: PortListItem[]): string[] => {
  const portMap = createPortMap();
  const matchedKeys: string[] = [];
  const unmatchedPorts: string[] = [];

  listItems.forEach((item) => {
    // Apply manual mappings first
    const mapped = applyMapping(item["Port Name"], item.Country);
    const normalizedKey = `${mapped.portName}-${mapped.country}`;

    if (portMap.has(normalizedKey)) {
      const ports = portMap.get(normalizedKey)!;
      // Only add the first matching port for each list item
      const port = ports[0];
      matchedKeys.push(`${port.name}-${port.country}`);
    } else {
      // Try to find a close match with original names
      const normalizedCountry = normalizeCountryName(item.Country);
      const originalKey = `${normalize(item["Port Name"])}-${normalize(normalizedCountry)}`;
      if (portMap.has(originalKey)) {
        const ports = portMap.get(originalKey)!;
        const port = ports[0];
        matchedKeys.push(`${port.name}-${port.country}`);
      } else {
        // Try partial matching as last resort
        let found = false;
        for (const [key, ports] of portMap.entries()) {
          const searchName = normalize(item["Port Name"]);
          const searchCountry = normalize(normalizedCountry);
          if (key.includes(searchName) && key.includes(searchCountry)) {
            const port = ports[0];
            matchedKeys.push(`${port.name}-${port.country}`);
            found = true;
            break;
          }
        }
        if (!found) {
          unmatchedPorts.push(`${item["Port Name"]}, ${item.Country}`);
        }
      }
    }
  });

  if (unmatchedPorts.length > 0) {
    console.warn(`Could not match ${unmatchedPorts.length} ports from list:`, unmatchedPorts);
  }

  return matchedKeys;
};

// Create the built-in "150 Top Ports" list
export const createTop150List = (): PortList => {
  const portKeys = matchPortListWithDatabase(top150Data as PortListItem[]);
  return {
    id: 'top-150',
    name: '150 Top Ports',
    portKeys,
    isBuiltIn: true,
  };
};

// Get all available lists
export const getAllLists = (): PortList[] => {
  const lists: PortList[] = [createTop150List()];

  // Load custom lists from localStorage
  const savedLists = localStorage.getItem('customPortLists');
  if (savedLists) {
    try {
      const customLists = JSON.parse(savedLists) as PortList[];
      lists.push(...customLists);
    } catch (e) {
      console.error('Failed to load custom lists:', e);
    }
  }

  return lists;
};

// Save a custom list
export const saveCustomList = (list: PortList): void => {
  const savedLists = localStorage.getItem('customPortLists');
  let lists: PortList[] = [];

  if (savedLists) {
    try {
      lists = JSON.parse(savedLists);
    } catch (e) {
      console.error('Failed to parse custom lists:', e);
    }
  }

  // Update or add the list
  const index = lists.findIndex(l => l.id === list.id);
  if (index >= 0) {
    lists[index] = list;
  } else {
    lists.push(list);
  }

  localStorage.setItem('customPortLists', JSON.stringify(lists));
};

// Delete a custom list
export const deleteCustomList = (listId: string): void => {
  const savedLists = localStorage.getItem('customPortLists');
  if (!savedLists) return;

  try {
    let lists = JSON.parse(savedLists) as PortList[];
    lists = lists.filter(l => l.id !== listId);
    localStorage.setItem('customPortLists', JSON.stringify(lists));
  } catch (e) {
    console.error('Failed to delete custom list:', e);
  }
};

// Filter ports by a port list
export const filterPortsByList = (allPorts: Port[], list: PortList): Port[] => {
  const keySet = new Set(list.portKeys);
  const matchedPorts: Port[] = [];
  const seenKeys = new Set<string>();

  // Only add the first port for each unique name-country combination
  allPorts.forEach(port => {
    const key = `${port.name}-${port.country}`;
    if (keySet.has(key) && !seenKeys.has(key)) {
      matchedPorts.push(port);
      seenKeys.add(key);
    }
  });

  return matchedPorts;
};
