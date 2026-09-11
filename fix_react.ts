import fs from 'fs';

// 1. Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/if \(currentUser\?\.role === 'admin' \|\| currentUser\?\.role === 'judge'\) \{\s*const data = await api\.get\('\/api\/teams'\);\s*setTeams\(data as any\);\s*\}/, `if (currentUser?.role === 'admin' || currentUser?.role === 'judge') {
          const data = await api.get('/api/teams');
          setTeams(data as any);
        } else {
          setTeams(loadTeamsFromStorage());
        }`);

appCode = appCode.replace(/setTeams\(data as any\);\n\s*\} else \{\n\s*setTeams\(loadTeamsFromStorage\(\)\);\n\s*\}/g, `setTeams(data as any);
        }`);

fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix LoginScreen.tsx
let loginCode = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');
loginCode = loginCode.replace(/const handleLogin = \(\) => \{[\s\S]*?const res = authenticate\(username, password\);[\s\S]*?setErrorMsg\(res\.error \|\| 'Credenciales inválidas'\);\n\s*\}\n\s*\};/, `const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor, complete ambos campos');
      return;
    }
    setErrorMsg(null);
    const res = await authenticate(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Credenciales inválidas');
    }
  };`);
fs.writeFileSync('src/components/LoginScreen.tsx', loginCode);

