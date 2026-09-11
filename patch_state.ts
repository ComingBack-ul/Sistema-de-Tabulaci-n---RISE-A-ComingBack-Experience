import fs from 'fs';
const state = JSON.parse(fs.readFileSync('event_state.json', 'utf8'));
state.assignments.rotation_1.teamAssignments = {};
fs.writeFileSync('event_state.json', JSON.stringify(state));
