import { useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

export default function Header({ onMenuToggle }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);

  const PAGE_TITLES = {
    '/for-sale': t('nav.forSale'),
    '/sold': t('nav.sold'),
    '/wishlist': t('nav.wishlist'),
    '/sellers': t('nav.sellers'),
    '/purchased': t('nav.purchased'),
    '/statistics': t('nav.statistics'),
    '/reports': t('nav.reports'),
    '/reminders': t('nav.reminders'),
    '/planner': t('nav.planner'),
  };

  const title = PAGE_TITLES[pathname] || t('app.title');

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
          aria-label={t('common.menu')}
        >
          <Menu size={20} />
        </button>
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
          aria-label={t('common.changeTheme')}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
          aria-label={t('common.logout')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
