import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  CheckSquare,
  Heart,
  Users,
  Package,
  BarChart2,
  FileText,
  Bell,
  Eye,
  CalendarDays,
  Settings,
} from "lucide-react";
import { statsService } from "@/services/api";

export default function Sidebar({ onClose }) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});

  const NAV_ITEMS = [
    {
      to: "/for-sale",
      label: t("nav.forSale"),
      icon: ShoppingBag,
      countKey: "forSale",
    },
    { to: "/sold", label: t("nav.sold"), icon: CheckSquare, countKey: "sold" },
    {
      to: "/wishlist",
      label: t("nav.wishlist"),
      icon: Heart,
      countKey: "wishlist",
    },
    {
      to: "/sellers",
      label: t("nav.sellers"),
      icon: Users,
      countKey: "sellers",
    },
    {
      to: "/purchased",
      label: t("nav.purchased"),
      icon: Package,
      countKey: "purchased",
    },
    { to: "/statistics", label: t("nav.statistics"), icon: BarChart2 },
    { to: "/reports", label: t("nav.reports"), icon: FileText },
    {
      to: "/reminders",
      label: t("nav.reminders"),
      icon: Bell,
      countKey: "remindersOpen",
    },
    { to: "/planner", label: t("nav.planner"), icon: CalendarDays },
  ];

  useEffect(() => {
    statsService
      .counts()
      .then((res) => setCounts(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <nav className="flex flex-col w-full h-full border-r border-[var(--border)] bg-[var(--bg-secondary)] py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
          {t("app.title")}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {t("app.subtitle")}
        </p>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, countKey }) => {
          const count = countKey ? counts[countKey] : null;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        isActive
                          ? "bg-[var(--accent-foreground)] text-[var(--accent)]"
                          : "bg-[var(--bg-primary)] text-[var(--accent)] border border-[var(--accent)]",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom links */}
      <div className="px-3 pt-4 border-t border-[var(--border)] space-y-1">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]",
            )
          }
        >
          <Settings size={18} />
          <span>{t("nav.settings")}</span>
        </NavLink>
        <a
          href="/products"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Eye size={18} />
          <span>{t("nav.goToVitrin")}</span>
        </a>
      </div>
    </nav>
  );
}
