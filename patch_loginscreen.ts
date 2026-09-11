import fs from 'fs';

let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');

code = code.replace(
  /const handleLogin = \(\) => \{[\s\S]*?setErrorMsg\(null\);\n\s*const res = authenticate\(username, password\);\n\s*if \(res\.success && res\.user\) \{[\s\S]*?\} else \{[\s\S]*?\}\n\s*\};/,
  `const handleLogin = async () => {
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
  };`
);

fs.writeFileSync('src/components/LoginScreen.tsx', code);
