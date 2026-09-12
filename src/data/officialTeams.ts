import { Participant, Team, Wave } from '../types';

export interface OfficialTeamDefinition {
  id: number;
  name: string;
  participants: string[];
}

export const OFFICIAL_TEAMS_DATA: readonly OfficialTeamDefinition[] = [
  {
    id: 1,
    name: 'Los Scooby Doo',
    participants: [
      'Sarah Villar',
      'Monserratt Payano',
      'María Jiménez',
      'Brittany Martínez',
    ],
  },
  {
    id: 2,
    name: 'Las tortugas ninja',
    participants: [
      'María Esther Villar Marte',
      'Laura Mari Martínez Taveras',
      'Wilton Rafael Paulino Florián',
      'Ruth Alejandra Montilla Castro',
    ],
  },
  {
    id: 3,
    name: 'Eclipse',
    participants: [
      'Sadiel Cuevas',
      'Elainy Díaz',
      'Cristian José',
      'Hillary Peña',
    ],
  },
  {
    id: 4,
    name: 'Invernalia',
    participants: [
      'Ashanti Diestch',
      'Shantal Diestch',
      'Abigail George',
      'Emely Peralta',
    ],
  },
  {
    id: 5,
    name: 'Los 4 fantásticos',
    participants: [
      'Yogeimy Cristina Suárez Robles',
      'Albethy Marie Castillo Brito',
      'Francisco César Ogando Montero',
      'Mia Yannelys Hernández Batista',
    ],
  },
  {
    id: 6,
    name: 'El cuarto poder',
    participants: [
      'Johangel González',
      'Sadiel Mejía',
      'Isabela Marte',
      'Johusen Marte',
    ],
  },
  {
    id: 7,
    name: '4 cerebros, 0 ideas',
    participants: [
      'Roberto Rosario',
      'Silvia Tavarez',
      'Diego Santos',
      'Luissanni Martínez',
    ],
  },
  {
    id: 8,
    name: 'Los fénix azules',
    participants: [
      'Ianna Adon',
      'Christopher Hernandez Sánchez',
      'Dariel ciprian',
      'Isaac Reynaldo Feliz',
    ],
  },
  {
    id: 9,
    name: 'Los Pilares Del Silencio',
    participants: [
      'Mezquita Grisleidy',
      'Dariel Prensa',
      'Karen Cruz',
      'Iliana Romero',
    ],
  },
  {
    id: 10,
    name: 'Los 4 elementos',
    participants: [
      'Jeremy Joel Batista Luciano',
      'Edrianny Reyes',
      'Rosmeiry',
      'Osvelison Oviedo Mendez',
    ],
  },
  {
    id: 11,
    name: 'El Equipito',
    participants: [
      'Gadiel De Los Santos',
      'Ensly Mejia',
      'Daifel Medina',
      'Yariel Moreno',
    ],
  },
  {
    id: 12,
    name: 'NEXO',
    participants: [
      'Dharianny Segura peguero',
      'Railyn Calderón Mejía',
      'Yaneisy Ramos',
    ],
  },
  {
    id: 13,
    name: 'Scooby-Doo',
    participants: [
      'Emanuel Tavarez Nuñez',
      'Anthony Bryant Amarante Fabian',
      'Meralis Lorenzo Ramírez',
      'Kate Mary Guilbe Vargas',
    ],
  },
  {
    id: 14,
    name: 'Club mapache (GARIMAJU)',
    participants: [
      'Gabriella Merejo',
      'María Gutiérrez',
      'Encarnación Junior',
      'Ricardo Javier',
    ],
  },
  {
    id: 15,
    name: 'Los mofios',
    participants: [
      'Edwin Fuente',
      'Analia Rosario',
      'Custodio Ashly',
      'Dinar de Jaspe',
    ],
  },
  {
    id: 16,
    name: 'Los 4 en oferta',
    participants: [
      'Aysha Alcántara Mejía',
      'Mara Isabella Pimentel Manzueta',
      'Antonella Lugo',
      'El remero Hochi Jaquez',
    ],
  },
  {
    id: 17,
    name: 'Águila americana',
    participants: [
      'Fanelyn Rosa Reyes',
      'Amaia González',
      'Emet Heredia',
    ],
  },
  {
    id: 18,
    name: 'Mentes bonitas',
    participants: [
      'Vismeidy Reyes',
      'Amaia González',
      'Judith Sosa',
    ],
  },
] as const;

export function buildOfficialTeams(): Team[] {
  return OFFICIAL_TEAMS_DATA.map((t) => {
    const wave: Wave = t.id <= 9 ? 'morning' : 'afternoon';
    const participantsList: Participant[] = t.participants.map((name, idx) => ({
      id: `p_${t.id}_${idx + 1}`,
      name,
      teamId: t.id,
    }));

    return {
      id: t.id,
      name: t.name,
      participants: participantsList,
      members: [...t.participants],
      wave,
      status: 'active',
      currentStationKey: null,
      scores: {
        salaA: { oratoriaPoints: 0, keywordSolved: false, isSubmitted: false },
        salaBE: { debatePoints: 0, codeDelivered: false, isSubmitted: false },
        salaF: { crisisPoints: 0, stampAwarded: false, isSubmitted: false },
      },
      judgeEvaluations: {},
      totalScore: 0,
      locksPassed: 0,
      allRoomsCompleted: false,
      rank: t.id,
      waveRank: wave === 'morning' ? t.id : t.id - 9,
      isBreakQualified: false,
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Validates that an array of teams adheres strictly to the official 18 teams definition
 */
export function validateOfficialTeamsIntegrity(teams: unknown[]): { valid: boolean; error?: string } {
  if (!Array.isArray(teams)) {
    return { valid: false, error: 'La estructura de equipos debe ser una lista' };
  }
  if (teams.length !== 18) {
    return { valid: false, error: `Se requieren exactamente 18 equipos (encontrados: ${teams.length})` };
  }

  const ids = new Set<number>();
  const names = new Set<string>();

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i] as any;
    if (!team || typeof team !== 'object') {
      return { valid: false, error: `Equipo en índice ${i} es inválido` };
    }
    if (typeof team.id !== 'number' || team.id < 1 || team.id > 18) {
      return { valid: false, error: `ID de equipo inválido en índice ${i}: ${team.id}` };
    }
    if (ids.has(team.id)) {
      return { valid: false, error: `ID de equipo duplicado: ${team.id}` };
    }
    ids.add(team.id);

    if (typeof team.name !== 'string' || !team.name.trim()) {
      return { valid: false, error: `Nombre inválido para equipo #${team.id}` };
    }
    if (names.has(team.name)) {
      return { valid: false, error: `Nombre de equipo duplicado: "${team.name}"` };
    }
    names.add(team.name);

    // Official data lookup
    const official = OFFICIAL_TEAMS_DATA.find((o) => o.id === team.id);
    if (!official) {
      return { valid: false, error: `Equipo con ID ${team.id} no coincide con ningún equipo oficial` };
    }
    if (team.name !== official.name) {
      return { valid: false, error: `Nombre de equipo #${team.id} no coincide. Esperado: "${official.name}", Recibido: "${team.name}"` };
    }

    // Check participants
    const parts = team.participants || team.members;
    if (!Array.isArray(parts)) {
      return { valid: false, error: `Participantes inválidos en equipo #${team.id}` };
    }

    if (parts.length !== official.participants.length) {
      return {
        valid: false,
        error: `Equipo "${team.name}" (#${team.id}) debe tener exactamente ${official.participants.length} participantes, pero tiene ${parts.length}`,
      };
    }
  }

  return { valid: true };
}
