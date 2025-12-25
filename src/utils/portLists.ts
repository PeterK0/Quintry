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
const createPortMap = (): Map<string, Port> => {
  const portMap = new Map<string, Port>();
  (portsData as any[]).forEach((port: any, index: number) => {
    const normalizedKey = `${normalize(port.CITY)}-${normalize(port.COUNTRY)}`;
    if (!portMap.has(normalizedKey)) {
      portMap.set(normalizedKey, {
        id: index + 1,
        name: port.CITY,
        country: port.COUNTRY,
        region: port.STATE || port.COUNTRY,
        lat: port.LATITUDE,
        lng: port.LONGITUDE,
      });
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
      const port = portMap.get(normalizedKey)!;
      matchedKeys.push(`${port.name}-${port.country}`);
    } else {
      // Try to find a close match with original names
      const originalKey = `${normalize(item["Port Name"])}-${normalize(item.Country)}`;
      if (portMap.has(originalKey)) {
        const port = portMap.get(originalKey)!;
        matchedKeys.push(`${port.name}-${port.country}`);
      } else {
        // Try partial matching as last resort
        let found = false;
        for (const [key, port] of portMap.entries()) {
          const searchName = normalize(item["Port Name"]);
          const searchCountry = normalize(item.Country);
          if (key.includes(searchName) && key.includes(searchCountry)) {
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
  return allPorts.filter(port => {
    const key = `${port.name}-${port.country}`;
    return keySet.has(key);
  });
};
