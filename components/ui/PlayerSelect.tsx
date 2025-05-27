
import React from 'react';
import { RosterPlayer } from '../../types/MatchValues';

interface PlayerSelectProps {
  name: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  roster: RosterPlayer[];
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({
  name,
  id,
  value,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  className = "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
  error
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 mb-2">
        {label} {required && '*'}
      </label>
      <select
        name={name}
        id={id}
        className={className}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="">{placeholder}</option>
        {roster.map((rosterPlayer) => (
          <option
            key={rosterPlayer.player.playerId}
            value={rosterPlayer.player.playerId}
          >
            #{rosterPlayer.player.jerseyNumber} {rosterPlayer.player.firstName} {rosterPlayer.player.lastName}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PlayerSelect;
