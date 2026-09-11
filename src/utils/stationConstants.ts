import { StationKey, StationDefinition } from '../types';

export const STATION_DEFINITIONS: Record<StationKey, StationDefinition> = {
  sala_a1: {
    key: 'sala_a1',
    label: 'Sala A1',
    name: 'Sala A - Oratoria y Retórica (Mesa 1)',
    type: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
  },
  sala_a2: {
    key: 'sala_a2',
    label: 'Sala A2',
    name: 'Sala A - Oratoria y Retórica (Mesa 2)',
    type: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
  },
  sala_b: {
    key: 'sala_b',
    label: 'Sala B',
    name: 'Sala B - Debate World Schools',
    type: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
  },
  sala_c: {
    key: 'sala_c',
    label: 'Sala C',
    name: 'Sala C - Debate World Schools',
    type: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
  },
  sala_d: {
    key: 'sala_d',
    label: 'Sala D',
    name: 'Sala D - Debate World Schools',
    type: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
  },
  sala_e: {
    key: 'sala_e',
    label: 'Sala E',
    name: 'Sala E - Debate World Schools',
    type: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
  },
  sala_f1: {
    key: 'sala_f1',
    label: 'Sala F1',
    name: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 1)',
    type: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
  },
  sala_f2: {
    key: 'sala_f2',
    label: 'Sala F2',
    name: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 2)',
    type: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
  },
};

export const ALL_STATION_KEYS: StationKey[] = [
  'sala_a1',
  'sala_a2',
  'sala_b',
  'sala_c',
  'sala_d',
  'sala_e',
  'sala_f1',
  'sala_f2',
];

export function getStationDefinition(stationKey: StationKey): StationDefinition | undefined {
  return STATION_DEFINITIONS[stationKey];
}

export function getAllStationDefinitions(): StationDefinition[] {
  return ALL_STATION_KEYS.map((k) => STATION_DEFINITIONS[k]);
}

export const STATION_SPECS: StationDefinition[] = getAllStationDefinitions();

