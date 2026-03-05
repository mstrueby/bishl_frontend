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
            <span className="text-sm font-bold text-gray-900">{matchSettings.numOfPeriods}</span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Periodenlänge</span>
            <span className="text-sm font-bold text-gray-900">{matchSettings.periodLengthMin} Minuten</span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Verlängerung</span>
            <span className="text-sm font-bold text-gray-900">
              {matchSettings.overtime ? (
                <>
                  Ja ({matchSettings.numOfPeriodsOvertime} ×{" "}
                  {matchSettings.periodLengthMinOvertime} Minuten)
                </>
              ) : "Nein"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Penalty-Schießen</span>
            <span className="text-sm font-bold text-gray-900">{matchSettings.shootout ? "Ja" : "Nein"}</span>
          </div>
          <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
            <span className="text-sm text-gray-600">Schiedsrichterpunkte</span>
            <span className="text-sm font-bold text-gray-900">{matchSettings.refereePoints}</span>
          </div>
          {matchSettingsSource && (
            <div className="flex justify-between items-center py-3 px-4 sm:px-8 transition-colors">
              <span className="text-sm text-gray-600">Quelle</span>
              <span className="text-sm font-bold text-gray-900">{matchSettingsSource}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSettingsDisplay;
