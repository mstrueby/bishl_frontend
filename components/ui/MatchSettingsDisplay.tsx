import { MatchSettings } from "../../types/TournamentValues";

interface MatchSettingsDisplayProps {
  matchSettings: MatchSettings;
  matchSettingsSource?: string;
}

const MatchSettingsDisplay: React.FC<MatchSettingsDisplayProps> = ({
  matchSettings,
  matchSettingsSource,
}) => {
  return (
    <div className="py-6 mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4 px-2">
        Spieleinstellungen
      </h3>
      <div className="bg-white rounded-md shadow-md border overflow-hidden">
        <div className="divide-y divide-gray-100">
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Anzahl Perioden</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.numOfPeriods}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Periodenlänge</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.periodLengthMin} Minuten
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Pause</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.breakLengthMin} Minuten
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Verlängerung</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.overtime ? "Ja" : "Nein"}
            </span>
          </div>

          {matchSettings.overtime && (
            <div className="bg-gray-50 border-y border-gray-100 divide-y divide-gray-100">
              <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Anzahl Perioden (OT)
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {matchSettings.numOfPeriodsOvertime}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Periodenlänge (OT)
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {matchSettings.periodLengthMinOvertime} Minuten
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Spieleranzahl (OT)
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {matchSettings.regularStrengthOvertime} gegen{" "}
                  {matchSettings.regularStrengthOvertime}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Sudden Death
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {matchSettings.suddenDeath ? "Ja" : "Nein"}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Penalty-Schießen</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.shootout ? "Ja" : "Nein"}
            </span>
          </div>

          <div className="bg-gray-50 border-y border-gray-100 divide-y divide-gray-100">
            <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Dauer kleine Strafe
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {Math.floor(matchSettings.minorPenaltySec / 60)}:
                {(matchSettings.minorPenaltySec % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Dauer große Strafe
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {Math.floor(matchSettings.majorPenaltySec / 60)}:
                {(matchSettings.majorPenaltySec % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-6 sm:px-10 transition-colors">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Dauer Disziplinarstrafe
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {Math.floor(matchSettings.gameMisconductPenaltySec / 60)}:
                {(matchSettings.gameMisconductPenaltySec % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Schiedsrichterpunkte</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.refereePoints}
            </span>
          </div>
          {matchSettingsSource && (
            <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
              <span className="text-sm text-gray-600">Quelle</span>
              <span className="text-sm font-bold text-gray-900">
                {matchSettingsSource}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSettingsDisplay;
