import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const \[teams, setTeams\] = useState<Team\[\]>\(\(\) => \{[\s\S]*?\}\);/,
  `const [teams, setTeams] = useState<Team[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    async function init() {
      try {
        const { api } = await import('./services/apiClient');
        const data = await api.get('/api/admin/teams'); // We'll just make /api/teams public or role-based later.
        setTeams(data as any);
      } catch (e) {
        setTeams(loadTeamsFromStorage());
      }
      setIsInitializing(false);
    }
    init();
  }, []);`
);

code = code.replace(/return \(\s*<div className="min-h-screen/m, `
  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#991B1B] border-t-transparent"></div></div>;
  }
  return (
    <div className="min-h-screen`);

fs.writeFileSync('src/App.tsx', code);
