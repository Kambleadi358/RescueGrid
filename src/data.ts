// ─── Types ───────────────────────────────────────────────────────────────────

export type Urgency = 'Critical' | 'High' | 'Medium' | 'Low';

export type TeamCapability = 'medical' | 'general' | 'flood';

export type LocationType =
  | 'hq'
  | 'medical'
  | 'shelter'
  | 'warehouse'
  | 'police'
  | 'school'
  | 'residential'
  | 'commercial'
  | 'transit'
  | 'landmark';

export type Location = {
  id: string;
  name: string;
  shortName: string;
  x: number;  // SVG coordinate 0-800
  y: number;  // SVG coordinate 0-600
  people: number;
  urgency: Urgency;
  accessible: boolean;
  type: LocationType;
};

export type Road = {
  id: string;
  a: string;
  b: string;
  cost: number;
  blocked: boolean;
  name: string;
};

export type Request = {
  id: string;
  name: string;
  location: string;
  urgency: Urgency;
  people: number;
  medical: boolean;
  waiting: number;
  travel: number;
  needCapability?: TeamCapability;
};

export type Incident = Request;

export type Package = {
  id: string;
  name: string;
  weight: number;
  value: number;       // people-supported benefit per unit
  category: string;
  location?: string;
  quantity?: number;
};

export type Team = {
  id: string;
  name: string;
  capability: TeamCapability;
  available: boolean;
  location: string;
};

// ─── Locations (town map nodes) ──────────────────────────────────────────────
// Coordinate space: 800 x 600 SVG units
// HQ is the rescue operations base (origin of all routes)

export const locations: Location[] = [
  { id: 'HQ',   name: 'Rescue Operations HQ',    shortName: 'HQ',      x: 100, y: 290, people: 0,  urgency: 'Low',      accessible: true, type: 'hq' },
  { id: 'RIV',  name: 'River Bank',               shortName: 'River',   x: 185, y: 110, people: 18, urgency: 'Critical', accessible: true, type: 'residential' },
  { id: 'MKT',  name: 'Central Market',           shortName: 'Market',  x: 370, y: 190, people: 45, urgency: 'High',     accessible: true, type: 'commercial' },
  { id: 'COL',  name: 'Govt. Medical College',    shortName: 'College', x: 590, y: 105, people: 9,  urgency: 'Critical', accessible: true, type: 'medical' },
  { id: 'SHL',  name: 'Public Relief Shelter',    shortName: 'Shelter', x: 665, y: 450, people: 30, urgency: 'Medium',   accessible: true, type: 'shelter' },
  { id: 'WH',   name: 'Flood Relief Warehouse',   shortName: 'Warehouse',x: 350, y: 490, people: 0,  urgency: 'Low',      accessible: true, type: 'warehouse' },
  { id: 'POL',  name: 'Police Station',           shortName: 'Police',  x: 145, y: 460, people: 7,  urgency: 'Low',      accessible: true, type: 'police' },
  { id: 'SCH',  name: 'Municipal School',         shortName: 'School',  x: 500, y: 310, people: 21, urgency: 'High',     accessible: true, type: 'school' },
  { id: 'HOT',  name: 'Riverside Hotel',          shortName: 'Hotel',   x: 250, y: 240, people: 12, urgency: 'Medium',   accessible: true, type: 'commercial' },
  { id: 'MAL',  name: 'City Mall',                shortName: 'Mall',    x: 465, y: 175, people: 16, urgency: 'High',     accessible: true, type: 'commercial' },
  { id: 'RAIL', name: 'Railway Station',          shortName: 'Station', x: 100, y: 490, people: 36, urgency: 'High',     accessible: true, type: 'transit' },
  { id: 'SOC',  name: 'Greenview Society',        shortName: 'Society', x: 580, y: 455, people: 24, urgency: 'Medium',   accessible: true, type: 'residential' },
  { id: 'GRD',  name: 'Central Garden',           shortName: 'Garden',  x: 430, y: 380, people: 5,  urgency: 'Low',      accessible: true, type: 'landmark' },
];

// ─── Roads (graph edges with stable IDs) ──────────────────────────────────────

export const roads: Road[] = [
  { id: 'RD-1',  a: 'HQ',   b: 'RIV',  cost: 5,  blocked: false, name: 'North River Rd' },
  { id: 'RD-2',  a: 'HQ',   b: 'POL',  cost: 4,  blocked: false, name: 'Station Link' },
  { id: 'RD-3',  a: 'HQ',   b: 'HOT',  cost: 3,  blocked: false, name: 'Central Ave' },
  { id: 'RD-4',  a: 'RIV',  b: 'HOT',  cost: 2,  blocked: false, name: 'Riverside Dr' },
  { id: 'RD-5',  a: 'RIV',  b: 'MKT',  cost: 3,  blocked: false, name: 'Market St' },
  { id: 'RD-6',  a: 'HOT',  b: 'MKT',  cost: 4,  blocked: false, name: 'Hotel Row' },
  { id: 'RD-7',  a: 'MKT',  b: 'MAL',  cost: 2,  blocked: false, name: 'Commerce Blvd' },
  { id: 'RD-8',  a: 'MAL',  b: 'COL',  cost: 4,  blocked: false, name: 'College Rd' },
  { id: 'RD-9',  a: 'MKT',  b: 'SCH',  cost: 5,  blocked: false, name: 'School Lane' },
  { id: 'RD-10', a: 'COL',  b: 'SCH',  cost: 4,  blocked: false, name: 'East Campus Rd' },
  { id: 'RD-11', a: 'SCH',  b: 'SHL',  cost: 4,  blocked: false, name: 'Shelter Rd' },
  { id: 'RD-12', a: 'SCH',  b: 'GRD',  cost: 2,  blocked: false, name: 'Park Ave' },
  { id: 'RD-13', a: 'GRD',  b: 'WH',   cost: 3,  blocked: false, name: 'Warehouse Lane' },
  { id: 'RD-14', a: 'WH',   b: 'POL',  cost: 4,  blocked: false, name: 'South Ring Rd' },
  { id: 'RD-15', a: 'WH',   b: 'SOC',  cost: 4,  blocked: true,  name: 'Society Bypass' },
  { id: 'RD-16', a: 'SOC',  b: 'SHL',  cost: 3,  blocked: false, name: 'Greenview Rd' },
  { id: 'RD-17', a: 'POL',  b: 'RAIL', cost: 3,  blocked: false, name: 'Station Rd' },
  { id: 'RD-18', a: 'RAIL', b: 'WH',   cost: 6,  blocked: true,  name: 'Flood Zone Rd' },
  { id: 'RD-19', a: 'MAL',  b: 'SHL',  cost: 8,  blocked: false, name: 'East Express' },
];

// ─── Requests (demo incidents) ────────────────────────────────────────────────

export const requests: Request[] = [
  { id: 'RQ-104', name: 'Riverside Ward Flood',   location: 'RIV', urgency: 'Critical', people: 46, medical: true,  waiting: 42, travel: 5, needCapability: 'medical' },
  { id: 'RQ-105', name: 'College Medical Crisis',  location: 'COL', urgency: 'Critical', people: 14, medical: true,  waiting: 17, travel: 13, needCapability: 'medical' },
  { id: 'RQ-102', name: 'Market Area Evacuation',  location: 'MKT', urgency: 'High',     people: 28, medical: false, waiting: 56, travel: 8, needCapability: 'general' },
  { id: 'RQ-107', name: 'School Rescue',           location: 'SCH', urgency: 'High',     people: 31, medical: true,  waiting: 22, travel: 7, needCapability: 'medical' },
  { id: 'RQ-103', name: 'East Shelter Supply',     location: 'SHL', urgency: 'Medium',   people: 65, medical: false, waiting: 75, travel: 10, needCapability: 'flood' },
];

// ─── Resource Packages ────────────────────────────────────────────────────────

export const packages: Package[] = [
  { id: 'PK-1', name: 'Trauma Kits',    weight: 4, value: 17, category: 'Medical', location: 'RIV', quantity: 1 },
  { id: 'PK-2', name: 'Water Crates',   weight: 6, value: 14, category: 'Water',   location: 'SHL', quantity: 1 },
  { id: 'PK-3', name: 'Food Boxes',     weight: 5, value: 12, category: 'Food',    location: 'SCH', quantity: 1 },
  { id: 'PK-4', name: 'Mobile Clinic',  weight: 8, value: 25, category: 'Medical', location: 'COL', quantity: 1 },
  { id: 'PK-5', name: 'Blankets',       weight: 3, value: 7,  category: 'Shelter', location: 'MKT', quantity: 1 },
];
