import { useEffect, useState } from 'react';
import { Combobox, Dialog } from '@headlessui/react';
import { CheckIcon, MagnifyingGlassIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import apiClient from '../../lib/apiClient';
import { getErrorMessage } from '../../lib/errorHandler';
import { addPlayerTeamAssignment } from '../../lib/addPlayerTeamAssignment';
import type { ClubValues, TeamValues } from '../../types/ClubValues';
import type { PlayerValues } from '../../types/PlayerValues';
import { classNames } from '../../tools/utils';

interface Props {
  club: ClubValues;
  team: TeamValues;
  onClose: () => void;
  onAdded: (player: PlayerValues) => Promise<void>;
}

export default function AddTeamPlayerDialog({ club, team, onClose, onAdded }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerValues[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerValues | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const search = query.trim();
    setResults([]);
    setSearchError('');
    if (!search) {
      setSearching(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get('/players', {
          params: { search, limit: 100 },
          signal: controller.signal,
        });
        const data = response.data?.data || response.data?.results || response.data;
        if (!Array.isArray(data)) throw new Error('Ungültige Antwort bei der Spielersuche.');
        if (!cancelled) setResults(data);
      } catch (error) {
        if (!cancelled) setSearchError(getErrorMessage(error));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const alreadyAssigned = selectedPlayer?.assignedTeams?.some(
    assignment => assignment.teams.some(item => item.teamId === team._id),
  );

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedPlayer || saving || alreadyAssigned) return;
    setSaving(true);
    setSaveError('');
    try {
      const player = await addPlayerTeamAssignment(selectedPlayer._id, club, team);
      await onAdded(player);
      onClose();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={() => { if (!saving) onClose(); }} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Spieler hinzufügen
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Spieler der Mannschaft {team.name} zuordnen. Andere Zuordnungen bleiben unverändert.
            </Dialog.Description>
            <form onSubmit={handleAdd}>
              <div className="mt-6">
                <Combobox value={selectedPlayer} by="_id" disabled={saving}
                  onChange={(player: PlayerValues | null) => {
                    setSelectedPlayer(player);
                    setQuery('');
                    setSaveError('');
                  }}>
                  <Combobox.Label className="mb-2 block text-sm font-medium text-gray-900">
                    Spieler suchen
                  </Combobox.Label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <Combobox.Input
                      className="w-full rounded-md border-0 py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      placeholder="Name eingeben"
                      autoComplete="off"
                      displayValue={(player: PlayerValues | null) => player ? `${player.lastName}, ${player.firstName}` : ''}
                      onChange={event => {
                        setSelectedPlayer(null);
                        setQuery(event.target.value);
                        setSaveError('');
                      }}
                    />
                    <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {results.map(player => (
                        <Combobox.Option key={player._id} value={player}
                          className={({ active }) => classNames(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          )}>
                          {({ selected }) => (
                            <>
                              <span className={selected ? 'font-semibold' : 'font-normal'}>
                                {player.lastName}, {player.firstName}
                              </span>
                              {selected && <CheckIcon className="absolute right-3 top-2 h-5 w-5" aria-hidden="true" />}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                      {query.trim() && results.length === 0 && (
                        <div className="px-3 py-2 text-gray-500">
                          {searching ? 'Spieler werden gesucht …' : searchError ? 'Suche fehlgeschlagen.' : 'Kein Spieler gefunden.'}
                        </div>
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
                {alreadyAssigned && <p className="mt-2 text-sm text-gray-600">Dieser Spieler ist dieser Mannschaft bereits zugeordnet.</p>}
                {(searchError || saveError) && <p role="alert" className="mt-2 text-sm text-red-600">{saveError || searchError}</p>}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" disabled={saving} onClick={onClose}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                  Abbrechen
                </button>
                <button type="submit" disabled={!selectedPlayer || saving || !!alreadyAssigned}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
                  <PlusCircleIcon className="mr-1.5 h-5 w-5" aria-hidden="true" />
                  {saving ? 'Wird gespeichert …' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
