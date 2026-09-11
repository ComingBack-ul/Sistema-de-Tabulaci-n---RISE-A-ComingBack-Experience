import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

export const DATA_FILE = path.join(DB_DIR, 'event_state.json');
export const USERS_FILE = path.join(DB_DIR, 'users.json');
export const TEAMS_FILE = path.join(DB_DIR, 'teams.json');

// We will implement read/write helper functions here
