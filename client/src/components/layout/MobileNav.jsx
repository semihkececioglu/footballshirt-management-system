import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  ShoppingBag, CheckSquare, Heart, Users, Package,
  BarChart2, FileText, Bell,
} from 'lucide-react';
import { statsService } from '@/services/api';

export default function MobileNav() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});

  const NAV_ITEMS = [
    { to: '/for-sale', label: t('nav.forSale'), icon: ShoppingBag, countKey: 'forSale' },
    { to: '/sold', label: t('nav.sold'), icon: CheckSquare, countKey: 'sold' },
    { to: '/wishlist', label: t('nav.wishlist'), icon: Heart, countKey: 'wishlist' },
    { to: '/sellers', label: t('nav.sellers'), icon: Users, countKey: 'sellers' },
    { to: '/purchased', label: t('nav.purchased'), icon: Package, countKey: 'purchased' },
    { to: '/statistics', label: t('nav.statistics'), icon: BarChart2 },
    { to: '/reports', label: t('nav.reports'), icon: FileText },
    { to: '/reminders', label: t('nav.reminders'), icon: Bell, countKey: 'remindersOpen' },
  ];

  useEffect(() => {
    statsService.counts()
      .then((res) => setCounts(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border)] px-2 pb-safe">
      <div className="flex justify-around overflow-x-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, countKey }) => {
          const count = countKey ? counts[countKey] : null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 py-2 px-2 text-xs min-w-[48px] transition-colors',
                  isActive
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)]'
                )
              }
            >
              <div className="relative">
                <Icon size={20} />
                {count != null && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[9px] font-bold">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
