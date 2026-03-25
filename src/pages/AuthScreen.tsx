import { useState } from 'react';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/a34ad981-816c-49f6-8611-4a4f2b9cfb67';

interface User {
  id: number;
  username: string;
  display_name: string;
}

interface AuthScreenProps {
  onAuth: (token: string, user: User) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body: Record<string, string> = { username, password, action: mode };
    if (mode === 'register') body.display_name = displayName || username;

    const res = await fetch(`${AUTH_URL}?action=${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    setLoading(false);

    if (!res.ok) {
      setError(parsed.error || 'Ошибка. Попробуйте снова.');
      return;
    }

    localStorage.setItem('ct_token', parsed.token);
    localStorage.setItem('ct_user', JSON.stringify(parsed.user));
    onAuth(parsed.token, parsed.user);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark-bg grid-bg overflow-hidden">
      <div className="scanline" />

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-green/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-purple/4 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-4 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border border-neon-green/40 flex items-center justify-center animate-pulse-glow">
            <Icon name="Zap" size={28} className="text-neon-green" />
          </div>
          <div className="text-center">
            <p className="font-display text-3xl text-white uppercase tracking-widest">CipherTalk</p>
            <p className="text-xs font-mono text-neon-green/60 mt-1">Защищённый мессенджер</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark-panel border border-dark-border rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-dark-bg rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-neon-green text-dark-bg'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 block">Имя</label>
                <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-neon-green/40 transition-colors">
                  <Icon name="User" size={14} className="text-gray-600" />
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Ваше имя"
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 block">Логин</label>
              <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-neon-green/40 transition-colors">
                <Icon name="AtSign" size={14} className="text-gray-600" />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 block">Пароль</label>
              <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-neon-green/40 transition-colors">
                <Icon name="Lock" size={14} className="text-gray-600" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2.5 animate-fade-in">
                <Icon name="AlertCircle" size={14} className="text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 rounded-xl bg-neon-green hover:bg-neon-green/80 text-dark-bg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  <span>Подождите...</span>
                </>
              ) : (
                <>
                  <Icon name="ShieldCheck" size={16} />
                  <span>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* E2E note */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Icon name="Lock" size={11} className="text-neon-green/40 encrypt-spin" />
          <span className="text-[10px] font-mono text-gray-700">Данные защищены сквозным шифрованием</span>
        </div>
      </div>
    </div>
  );
}