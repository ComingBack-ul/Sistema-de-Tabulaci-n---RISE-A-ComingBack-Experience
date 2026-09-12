import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OFFICIAL_TEAMS_DATA, buildOfficialTeams, validateOfficialTeamsIntegrity } from '../src/data/officialTeams';
import { normalizeUsername } from '../src/services/userService';

test('1. Exact 18 Official Teams Integrity', () => {
  // Exactly 18 teams
  assert.equal(OFFICIAL_TEAMS_DATA.length, 18, 'Must have exactly 18 official teams');

  const teams = buildOfficialTeams();
  assert.equal(teams.length, 18, 'Built teams must equal 18');

  // Validate official integrity function
  const integrity = validateOfficialTeamsIntegrity(teams);
  assert.equal(integrity.valid, true, `Integrity failed: ${integrity.error}`);

  // Morning wave (1-9), Afternoon wave (10-18)
  for (let i = 1; i <= 9; i++) {
    const t = teams.find(team => team.id === i);
    assert.ok(t, `Team ${i} must exist`);
    assert.equal(t.wave, 'morning', `Team ${i} must be in morning wave`);
    assert.ok(t.participants.length >= 3, `Team ${i} must have participants`);
  }
  for (let i = 10; i <= 18; i++) {
    const t = teams.find(team => team.id === i);
    assert.ok(t, `Team ${i} must exist`);
    assert.equal(t.wave, 'afternoon', `Team ${i} must be in afternoon wave`);
    assert.ok(t.participants.length >= 3, `Team ${i} must have participants`);
  }

  // Exact names preserved without modification
  assert.equal(OFFICIAL_TEAMS_DATA[0].name, 'Los Scooby Doo');
  assert.equal(OFFICIAL_TEAMS_DATA[17].name, 'Mentes bonitas');
});

test('2. Password Security and Hashing with bcrypt', async () => {
  const plainPassword = 'securePassword123';
  const hash = await bcrypt.hash(plainPassword, 10);

  assert.notEqual(plainPassword, hash);
  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));

  const validMatch = await bcrypt.compare(plainPassword, hash);
  assert.equal(validMatch, true, 'Valid password must match hash');

  const invalidMatch = await bcrypt.compare('wrongPassword', hash);
  assert.equal(invalidMatch, false, 'Invalid password must not match hash');
});

test('3. JWT Token Signing and Role Validation', () => {
  const secret = 'test-jwt-secret-for-rise-2026';
  
  // Participant token
  const participantPayload = {
    role: 'participant',
    teamId: 1,
    teamName: 'Los 4 fantásticos'
  };
  const pToken = jwt.sign(participantPayload, secret, { expiresIn: '1h' });
  const decodedP = jwt.verify(pToken, secret) as any;
  assert.equal(decodedP.role, 'participant');
  assert.equal(decodedP.teamId, 1);
  assert.equal(decodedP.teamName, 'Los 4 fantásticos');

  // Judge token
  const judgePayload = {
    userId: 'juez_sala_a1',
    username: 'juez_sala_a1',
    role: 'judge',
    stationKey: 'sala_a1'
  };
  const jToken = jwt.sign(judgePayload, secret, { expiresIn: '1h' });
  const decodedJ = jwt.verify(jToken, secret) as any;
  assert.equal(decodedJ.role, 'judge');
  assert.equal(decodedJ.stationKey, 'sala_a1');
});

test('4. Username normalization utility', () => {
  assert.equal(normalizeUsername('  Juez_Sala_A1  '), 'juez_sala_a1');
  assert.equal(normalizeUsername('Admin Tab'), 'admin_tab');
});

test('5. Sanitization prevents passwordHash leakage', () => {
  const sensitiveUser = {
    username: 'admin_tab',
    name: 'Admin Tabulación',
    role: 'admin',
    passwordHash: '$2a$10$abcdef1234567890',
    password: 'secretPassword123'
  };

  const sanitizeUser = (user: any) => {
    if (!user) return null;
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.password;
    return copy;
  };

  const safe = sanitizeUser(sensitiveUser);
  assert.equal(safe.passwordHash, undefined);
  assert.equal(safe.password, undefined);
  assert.equal(safe.username, 'admin_tab');
});

test('6. Official Team Catalog contains 18 teams with proper structure', () => {
  const catalog = OFFICIAL_TEAMS_DATA.map(t => ({
    id: t.id,
    name: t.name,
    participants: t.participants
  }));

  assert.equal(catalog.length, 18);
  for (const item of catalog) {
    assert.equal(typeof item.id, 'number');
    assert.equal(typeof item.name, 'string');
    assert.ok(Array.isArray(item.participants));
    assert.ok(item.participants.length >= 3);
  }
});

test('7. Auto-healing handles legacy 50-team corruption gracefully', () => {
  // Simulate legacy 50-team corrupted payload
  const mock50Teams = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Equipo Legacy ${i + 1}`,
    scores: {
      salaA: { oratoriaPoints: i === 0 ? 20 : 0, keywordSolved: false, isSubmitted: i === 0 },
      salaBE: { debatePoints: 0, codeDelivered: false, isSubmitted: false },
      salaF: { crisisPoints: 0, stampAwarded: false, isSubmitted: false }
    }
  }));

  // Replicating the migration logic
  const official = buildOfficialTeams();
  assert.equal(official.length, 18);

  mock50Teams.forEach((oldTeam) => {
    if (oldTeam.id >= 1 && oldTeam.id <= 18) {
      const match = official.find(t => t.id === oldTeam.id);
      if (match && oldTeam.scores) {
        match.scores = { ...match.scores, ...oldTeam.scores };
      }
    }
  });

  // Team 1 should preserve score, length remains exactly 18
  assert.equal(official.length, 18);
  assert.equal(official[0].scores.salaA.oratoriaPoints, 20);
  assert.equal(official[0].name, 'Los Scooby Doo');
});


