
// Edo State Local Government Areas (18 LGAs) & Educational Zonal Data

export interface LgaInfo {
  name: string;
  code: string;
  zone: 'Edo South' | 'Edo Central' | 'Edo North';
  headquarters: string;
  schoolsCount?: number;
}

export const EDO_LGAS: LgaInfo[] = [
  // Edo South Senatorial District
  { name: 'Oredo', code: 'ORD', zone: 'Edo South', headquarters: 'Benin City' },
  { name: 'Egor', code: 'EGR', zone: 'Edo South', headquarters: 'Uselu' },
  { name: 'Ikpoba-Okha', code: 'IKP', zone: 'Edo South', headquarters: 'Idogbo' },
  { name: 'Ovia North-East', code: 'ONE', zone: 'Edo South', headquarters: 'Okada' },
  { name: 'Ovia South-West', code: 'OSW', zone: 'Edo South', headquarters: 'Iguobazuwa' },
  { name: 'Orhionmwon', code: 'ORH', zone: 'Edo South', headquarters: 'Abudu' },
  { name: 'Uhunmwonde', code: 'UHN', zone: 'Edo South', headquarters: 'Ehor' },

  // Edo Central Senatorial District
  { name: 'Esan Central', code: 'ESC', zone: 'Edo Central', headquarters: 'Irrua' },
  { name: 'Esan North-East', code: 'ENE', zone: 'Edo Central', headquarters: 'Uromi' },
  { name: 'Esan South-East', code: 'ESE', zone: 'Edo Central', headquarters: 'Ubiaja' },
  { name: 'Esan West', code: 'ESW', zone: 'Edo Central', headquarters: 'Ekpoma' },
  { name: 'Igueben', code: 'IGB', zone: 'Edo Central', headquarters: 'Igueben' },

  // Edo North Senatorial District
  { name: 'Etsako Central', code: 'ETC', zone: 'Edo North', headquarters: 'Fugar' },
  { name: 'Etsako East', code: 'ETE', zone: 'Edo North', headquarters: 'Agenebode' },
  { name: 'Etsako West', code: 'ETW', zone: 'Edo North', headquarters: 'Auchi' },
  { name: 'Akoko-Edo', code: 'AKE', zone: 'Edo North', headquarters: 'Igarra' },
  { name: 'Owan East', code: 'OWE', zone: 'Edo North', headquarters: 'Afuze' },
  { name: 'Owan West', code: 'OWW', zone: 'Edo North', headquarters: 'Sabongida-Ora' }
];

export const EDO_LGA_NAMES = EDO_LGAS.map(l => l.name);
