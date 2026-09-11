import fs from 'fs';

let code = fs.readFileSync('src/services/apiClient.ts', 'utf8');
code = code.replace(
  /const response = await fetch\(url, \{/,
  `const response = await fetch(url, {
    credentials: 'true', // actually we can omit it, but let's be safe. Wait, 'same-origin' is default.`
);

fs.writeFileSync('src/services/apiClient.ts', code);
