import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore, LANGUAGES } from '@/store/languageStore';
import { Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/for-sale', { replace: true });
    } catch {
      toast.error(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              title={l.label}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                language === l.code
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {l.flag}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
          aria-label={t('common.changeTheme')}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">
            {t('app.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{t('app.subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-[var(--accent-foreground)] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
