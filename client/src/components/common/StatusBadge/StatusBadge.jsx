import { useTranslateConstant } from "@/hooks/useTranslateConstant";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const CONDITION_VARIANT = {
  "Sıfır etiketli": "success",
  "Sıfır etiketli defolu": "warning",
  Sıfır: "success",
  "Sıfır defolu": "warning",
  Mükemmel: "blue",
  İyi: "blue",
  Orta: "warning",
  Kötü: "destructive",
};

const STATUS_VARIANT = {
  for_sale: "success",
  sold: "secondary",
  not_for_sale: "outline",
};

const REMINDER_VARIANT = {
  open: "warning",
  notified: "blue",
  closed: "secondary",
};

export function ConditionBadge({ condition, className }) {
  const translateCondition = useTranslateConstant("condition");
  if (!condition) return null;
  return (
    <Badge
      variant={CONDITION_VARIANT[condition] || "secondary"}
      className={`w-fit text-[10px] px-1.5 py-px ${className || ""}`}
    >
      {translateCondition(condition)}
    </Badge>
  );
}

export function StatusBadge({ status, className }) {
  const { t } = useTranslation();
  if (!status) return null;
  const label =
    {
      for_sale: t("status.forSale"),
      sold: t("status.sold"),
      not_for_sale: t("status.notForSale"),
    }[status] ?? status;
  return (
    <Badge
      variant={STATUS_VARIANT[status] || "secondary"}
      className={className}
    >
      {label}
    </Badge>
  );
}

export function ReminderStatusBadge({ status, className }) {
  const { t } = useTranslation();
  if (!status) return null;
  const label =
    {
      open: t("reminderStatus.open"),
      notified: t("reminderStatus.notified"),
      closed: t("reminderStatus.closed"),
    }[status] ?? status;
  return (
    <Badge
      variant={REMINDER_VARIANT[status] || "secondary"}
      className={className}
    >
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  const { t } = useTranslation();
  const map = {
    low: { label: t("priority.low"), variant: "blue" },
    medium: { label: t("priority.medium"), variant: "warning" },
    high: { label: t("priority.high"), variant: "destructive" },
  };
  const { label, variant } = map[priority] || {
    label: priority,
    variant: "secondary",
  };
  return <Badge variant={variant}>{label}</Badge>;
}
