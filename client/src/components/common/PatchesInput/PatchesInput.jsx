import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { PATCH_TYPES } from "@/lib/constants";
import { useTranslateConstant } from "@/hooks/useTranslateConstant";

/**
 * Props:
 *  value: string[]   — current patches array
 *  onChange: (string[]) => void
 */
export function PatchesInput({ value = [], onChange }) {
  const { t } = useTranslation();
  const translatePatch = useTranslateConstant("patchType");
  const [enabled, setEnabled] = useState(value.length > 0);

  const translatedPatchTypes = PATCH_TYPES.map((p) => ({
    value: p,
    label: translatePatch(p),
  }));

  function handleToggle(on) {
    setEnabled(on);
    if (!on) onChange([]);
  }

  function addPatch(patch) {
    const key =
      translatedPatchTypes.find((p) => p.label === patch)?.value || patch;
    if (!key || value.includes(key)) return;
    onChange([...value, key]);
  }

  function removePatch(p) {
    onChange(value.filter((v) => v !== p));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          id="patch-toggle"
        />
        <Label htmlFor="patch-toggle">{t("form.hasPatches")}</Label>
      </div>

      {enabled && (
        <div className="space-y-2">
          <Combobox
            options={translatedPatchTypes.map((p) => p.label)}
            value=""
            onChange={addPatch}
            placeholder={t("form.patchesPlaceholder")}
            allowCustom
            clearable={false}
          />
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {value.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {translatePatch(p)}
                  <button
                    type="button"
                    onClick={() => removePatch(p)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
