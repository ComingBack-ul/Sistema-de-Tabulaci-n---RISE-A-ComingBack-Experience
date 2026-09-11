import fs from 'fs';

const state = JSON.parse(fs.readFileSync('event_state.json', 'utf8'));
state.assignments.rotation_1.teamAssignments['1'] = {
  rotationId: 'rotation_1',
  room: 'sala_a',
  title: 'Test',
  oratory: {
    keyword: 'SECRET_KEYWORD',
    organization: 'AOSIS',
  },
  keywordChallenge: {
    keyword: 'SECRET_CHALLENGE'
  }
};
fs.writeFileSync('event_state.json', JSON.stringify(state));
