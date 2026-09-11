const fs = require('fs');

let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');

code = code.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*setErrorMsg\(null\);\n\s*const res = authenticate\(username, password\);\n\s*if \(res\.success && res\.user\) \{\n\s*onLoginSuccess\(res\.user\);\n\s*\} else \{\n\s*setErrorMsg\(res\.error \|\| 'Credenciales inválidas'\);\n\s*\}\n\s*\};/,
  `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
