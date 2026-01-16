import { Fragment, useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../tools/utils";
import apiClient from "../../lib/apiClient";
import { ageGroupConfig } from "../../tools/consts";

interface PossibleTeam {
  teamId: string;
  teamName: string;
  teamAlias: string;
  teamAgeGroup: string;
  recommendedType: string;
  status: string;
  clubId: string;
  clubName: string;
}

interface TeamAssignmentSelectProps {
  playerId: string;
  clubId: string;
  selectedTeamId: string | null;
  onTeamChange: (team: PossibleTeam | null) => void;
  label?: string;
  disabled?: boolean;
  managedByISHD?: boolean;
  licenceSource?: string;
}

const licenceTypeBadgeColors: Record<string, string> = {
  PRIMARY: "bg-green-50 text-green-700 ring-green-600/20",
  SECONDARY: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  OVERAGE: "bg-pink-50 text-pink-700 ring-pink-600/20",
  LOAN: "bg-blue-50 text-blue-700 ring-blue-600/20",
  DEVELOPMENT: "bg-purple-50 text-purple-700 ring-purple-600/20",
  SPECIAL: "bg-red-50 text-red-700 ring-red-600/20",
};

const TeamAssignmentSelect: React.FC<TeamAssignmentSelectProps> = ({
  playerId,
  clubId,
  selectedTeamId,
  onTeamChange,
  label = "Mannschaft",
  disabled = false,
  managedByISHD = false,
  licenceSource = "",
}) => {
  const [teams, setTeams] = useState<PossibleTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowEnabled, setWindowEnabled] = useState(false);
  const [windowMessage, setWindowMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsResponse, configResponse] = await Promise.all([
          apiClient.get(`/players/${playerId}/possible-teams`),
          apiClient.get("/configs/player_assignment_window"),
        ]);

        const allTeams: PossibleTeam[] = teamsResponse.data || [];
        const sortedAllTeams = [...allTeams].sort((a, b) => {
          const orderA = ageGroupConfig.find(g => g.key === a.teamAgeGroup)?.sortOrder || 999;
          const orderB = ageGroupConfig.find(g => g.key === b.teamAgeGroup)?.sortOrder || 999;
          
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          
          return (a.teamAlias || "").localeCompare(b.teamAlias || "");
        });

        const filteredTeams = sortedAllTeams.filter((team) => team.clubId === clubId);
        setTeams(filteredTeams);

        const configItems = configResponse.data?.items || [];
        const enabledItem = configItems.find(
          (item: any) => item.key === "ENABLED",
        );
        const startMonthItem = configItems.find(
          (item: any) => item.key === "STARTMONTH",
        );
        const startDayItem = configItems.find(
          (item: any) => item.key === "STARTDAY",
        );
        const endMonthItem = configItems.find(
          (item: any) => item.key === "ENDMONTH",
        );
        const endDayItem = configItems.find(
          (item: any) => item.key === "ENDDAY",
        );

        const isEnabled =
          enabledItem?.value === "true" || enabledItem?.value === true;
        const startMonth = parseInt(startMonthItem?.value || "1", 10);
        const startDay = parseInt(startDayItem?.value || "1", 10);
        const endMonth = parseInt(endMonthItem?.value || "12", 10);
        const endDay = parseInt(endDayItem?.value || "31", 10);

        if (isEnabled) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentDay = now.getDate();

          const isAfterStart =
            currentMonth > startMonth ||
            (currentMonth === startMonth && currentDay >= startDay);
          const isBeforeEnd =
            currentMonth < endMonth ||
            (currentMonth === endMonth && currentDay <= endDay);

          const isInWindow = isAfterStart && isBeforeEnd;
          setWindowEnabled(isInWindow);

          if (!isInWindow) {
            setWindowMessage(
              `Passwechsel nur vom ${startDay}.${startMonth}. bis ${endDay}.${endMonth}. möglich`,
            );
          }
        } else {
          setWindowEnabled(true);
        }
      } catch (error) {
        console.error("Error fetching possible teams:", error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    if (playerId && clubId) {
      fetchData();
    }
  }, [playerId, clubId]);

  const selectedTeam = teams.find((team) => team.teamId === selectedTeamId);
  const isISHDManaged = managedByISHD && licenceSource === "ISHD";
  const isLoan = licenceSource === "LOAN";
  const isDisabled = disabled || !windowEnabled || loading || isISHDManaged || isLoan;

  const getStatusColor = (status: string) => {
    return status === "valid" || status === "VALID"
      ? "bg-green-500"
      : "bg-red-500";
  };

  return (
    <div className="mb-4">
      <Listbox
        value={selectedTeamId || ""}
        onChange={(teamId) => {
          const team = teams.find((t) => t.teamId === teamId) || null;
          onTeamChange(team);
        }}
        disabled={isDisabled}
      >
        {({ open }) => (
          <>
            {label && (
              <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
                {label}
              </Listbox.Label>
            )}
            <div className="relative mt-2">
              <Listbox.Button
                className={classNames(
                  "relative w-full cursor-default rounded-md py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6",
                  isDisabled
                    ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-900 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                )}
              >
                {loading ? (
                  <span className="block truncate text-gray-400">Laden...</span>
                ) : selectedTeam ? (
                  <span className="flex items-center gap-x-3">
                    <span
                      className={classNames(
                        "h-2 w-2 rounded-full flex-shrink-0",
                        getStatusColor(selectedTeam.status),
                      )}
                    />
                    <span className="block truncate">
                      {selectedTeam.teamName}
                    </span>
                  </span>
                ) : (
                  <span className="block truncate text-gray-400">
                    (auswählen)
                  </span>
                )}
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {teams.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-gray-500">
                      Keine Mannschaften verfügbar
                    </div>
                  ) : (
                    teams.map((team) => (
                      <Listbox.Option
                        key={team.teamId}
                        className={({ active }) =>
                          classNames(
                            active
                              ? "bg-indigo-600 text-white"
                              : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-3 pr-9",
                          )
                        }
                        value={team.teamId}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center gap-x-3">
                              <span
                                className={classNames(
                                  "h-2 w-2 rounded-full flex-shrink-0",
                                  getStatusColor(team.status),
                                )}
                              />
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {team.teamName}
                              </span>
                            </div>
                            {selected && (
                              <span
                                className={classNames(
                                  active ? "text-white" : "text-indigo-600",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))
                  )}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
      {windowMessage && !windowEnabled && (
        <p className="mt-1 text-sm text-amber-600">{windowMessage}</p>
      )}
    </div>
  );
};

export default TeamAssignmentSelect;
