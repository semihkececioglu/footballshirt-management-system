import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

let competitionsCache = null;
let teamsCache = null;

async function loadData() {
  if (competitionsCache && teamsCache) return { competitions: competitionsCache, teams: teamsCache };
  const results = await Promise.allSettled([
    fetch('/data/competitions.json').then((r) => r.json()),
    fetch('/data/teams.json').then((r) => r.json()),
  ]);
  competitionsCache = results[0].status === 'fulfilled' ? results[0].value : null;
  teamsCache = results[1].status === 'fulfilled' ? results[1].value : null;
  return { competitions: competitionsCache, teams: teamsCache };
}

/**
 * Cascade: Ülke/Kategori → Lig/Turnuva → Takım
 * onChange({ country, league, teamName })
 */
export function TeamSelector({ value = {}, onChange, disabled }) {
  const { t } = useTranslation();
  const [data, setData] = useState({ competitions: null, teams: null });

  useEffect(() => {
    loadData().then(setData);
  }, []);

  const { competitions, teams } = data;

  const countryOptions = useMemo(() => {
    if (!competitions) return [];
    return competitions.categories.map((c) => ({
      name: c.name,
      key: c.key,
      translated: t(`const.country.${c.key}`, { defaultValue: c.name }),
    }));
  }, [competitions, t]);

  const selectedCategory = useMemo(() => {
    if (!competitions || !value.country) return null;
    // Support both key format ("turkiye") and legacy name format ("Türkiye")
    return competitions.categories.find((c) => c.key === value.country || c.name === value.country) || null;
  }, [competitions, value.country]);

  const competitionOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.competitions;
  }, [selectedCategory]);

  const teamOptions = useMemo(() => {
    if (!teams || !value.league || !selectedCategory) return [];
    const league = teams.leagues.find(
      (l) => l.countryKey === selectedCategory.key && l.name === value.league,
    );
    return league ? league.teams : [];
  }, [teams, value.league, selectedCategory]);

  const hasTeamList = teamOptions.length > 0;

  function handleCountry(translatedCountry) {
    const selected = countryOptions.find((c) => c.translated === translatedCountry);
    onChange({ country: selected ? selected.key : translatedCountry, league: '', teamName: '' });
  }

  function handleLeague(league) {
    onChange({ ...value, league, teamName: '' });
  }

  function handleTeam(teamName) {
    onChange({ ...value, teamName });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label>{t('teamSelector.country')}</Label>
        <Combobox
          options={countryOptions.map((c) => c.translated)}
          value={selectedCategory ? t(`const.country.${selectedCategory.key}`, { defaultValue: selectedCategory.name }) : value.country}
          onChange={handleCountry}
          placeholder={t('teamSelector.countryPlaceholder')}
          clearable
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('teamSelector.league')}</Label>
        <Combobox
          options={competitionOptions}
          value={value.league}
          onChange={handleLeague}
          placeholder={t('teamSelector.leaguePlaceholder')}
          clearable
          disabled={disabled || !value.country}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('teamSelector.team')}</Label>
        {hasTeamList ? (
          <Combobox
            options={teamOptions}
            value={value.teamName}
            onChange={handleTeam}
            placeholder={t('teamSelector.teamPlaceholder')}
            allowCustom
            clearable
            disabled={disabled || !value.league}
          />
        ) : (
          <Input
            value={value.teamName || ''}
            onChange={(e) => handleTeam(e.target.value)}
            placeholder={t('teamSelector.teamInputPlaceholder')}
            disabled={disabled || !value.league}
          />
        )}
      </div>
    </div>
  );
}
