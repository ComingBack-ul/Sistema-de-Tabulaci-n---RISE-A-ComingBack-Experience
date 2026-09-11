const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(\!canEvaluateTeam\(currentUser, teamId, rawEvaluation\.stationKey\)\) \{/,
  `if (!canEvaluateTeam(currentUser, teamId, teams)) {`
);

fs.writeFileSync('src/App.tsx', code);
