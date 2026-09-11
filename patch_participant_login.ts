import fs from 'fs';

let code = fs.readFileSync('src/components/ParticipantLogin.tsx', 'utf8');

code = code.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?if \(!isNaN\(id\) && id >= 1 && id <= 50\) \{[\s\S]*?onLogin\(id\);\n\s*\} else \{[\s\S]*?\}\n\s*\};/,
  `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(teamNumber);
    if (!isNaN(id) && id >= 1 && id <= 18) {
      const { authenticateParticipant } = await import('../utils/auth');
      const res = await authenticateParticipant(id);
      if (res.success) {
        onLogin(id);
      } else {
        alert(res.error || 'No autorizado');
      }
    } else {
      alert('Número de equipo inválido. Ingrese un valor entre 1 y 18.');
    }
  };`
);

code = code.replace(/max="50"/, 'max="18"');

fs.writeFileSync('src/components/ParticipantLogin.tsx', code);
