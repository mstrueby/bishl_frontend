import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { CldImage } from "next-cloudinary";
import {
  RefToolMatch,
  RefToolOptions,
  RefToolReferee,
} from "../../types/RefToolValues";
import {
  AssignmentStatus,
  AssignmentValues,
} from "../../types/AssignmentValues";
import { tournamentConfigs, refereeLevels } from "../../tools/consts";
import { classNames } from "../../tools/utils";
import apiClient from "../../lib/apiClient";
import LoadingState from "../ui/LoadingState";

const LEVEL_ORDER = Object.entries(refereeLevels)
  .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
  .map(([key]) => key);

const sortByLevel = (referees: RefToolReferee[]) =>
  [...referees].sort((a, b) => {
    const iA = LEVEL_ORDER.indexOf(a.level) ?? 999;
    const iB = LEVEL_ORDER.indexOf(b.level) ?? 999;
    if (iA !== iB) return iA - iB;
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

interface LevelBadgeProps {
  level: string;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level }) => {
  const config =
    refereeLevels[level as keyof typeof refereeLevels] ?? refereeLevels["n/a"];
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        config.background,
        config.text,
        config.ring,
      )}
    >
      {level}
    </span>
  );
};

interface RefereeItemProps {
  referee: RefToolReferee;
  pos1Taken: boolean;
  pos2Taken: boolean;
  matchId: string;
  onAssign: (referee: RefToolReferee, position: 1 | 2) => Promise<void>;
  showAssignButtons?: boolean;
}

const RefereeItem: React.FC<RefereeItemProps> = ({
  referee,
  pos1Taken,
  pos2Taken,
  matchId,
  onAssign,
  showAssignButtons = true,
}) => {
  const [loading, setLoading] = useState<1 | 2 | null>(null);
  const initials = `${referee.firstName.charAt(0)}${referee.lastName.charAt(0)}`;

  const handleAssign = async (pos: 1 | 2) => {
    setLoading(pos);
    await onAssign(referee, pos);
    setLoading(null);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-900 truncate">
              {referee.firstName} {referee.lastName}
            </span>
            <LevelBadge level={referee.level} />
          </div>
          {referee.clubName && (
            <p className="text-xs text-gray-500 truncate">{referee.clubName}</p>
          )}
        </div>
      </div>
      {showAssignButtons && (
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => handleAssign(1)}
            disabled={pos1Taken || loading !== null}
            className={classNames(
              "rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
              pos1Taken
                ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
                : "bg-white text-indigo-600 ring-indigo-300 hover:bg-indigo-50",
            )}
          >
            {loading === 1 ? "..." : "Pos 1"}
          </button>
          <button
            onClick={() => handleAssign(2)}
            disabled={pos2Taken || loading !== null}
            className={classNames(
              "rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
              pos2Taken
                ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
                : "bg-white text-indigo-600 ring-indigo-300 hover:bg-indigo-50",
            )}
          >
            {loading === 2 ? "..." : "Pos 2"}
          </button>
        </div>
      )}
    </div>
  );
};

interface AssignedSlotProps {
  label: string;
  referee: RefToolReferee | null;
  onRemove: (referee: RefToolReferee) => Promise<void>;
}

const AssignedSlot: React.FC<AssignedSlotProps> = ({
  label,
  referee,
  onRemove,
}) => {
  const [removing, setRemoving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleRemove = async () => {
    if (!referee) return;
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setRemoving(true);
    await onRemove(referee);
    setRemoving(false);
    setConfirm(false);
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
          {label}
        </span>
        {referee ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
              {referee.firstName.charAt(0)}
              {referee.lastName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-900 truncate">
              {referee.firstName} {referee.lastName}
            </span>
            <LevelBadge level={referee.level} />
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Nicht besetzt</span>
        )}
      </div>
      {referee && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className={classNames(
            "flex-shrink-0 ml-2 rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors",
            confirm
              ? "bg-red-50 text-red-700 ring-red-300 hover:bg-red-100"
              : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-100",
          )}
        >
          {removing ? "..." : confirm ? "Sicher?" : "Entfernen"}
        </button>
      )}
    </div>
  );
};

interface MatchDetailDrawerProps {
  match: RefToolMatch | null;
  open: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

const MatchDetailDrawer: React.FC<MatchDetailDrawerProps> = ({
  match,
  open,
  onClose,
  onDataChanged,
}) => {
  const [detailData, setDetailData] = useState<RefToolOptions | null>(null);
  const [existingAssignments, setExistingAssignments] = useState<
    AssignmentValues[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showRequested, setShowRequested] = useState(true);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDetail = useCallback(async (matchId: string) => {
    setLoading(true);
    try {
      const [detailRes, assignmentsRes] = await Promise.all([
        apiClient.get(`/reftool/matches/${matchId}`),
        apiClient.get(`/assignments/matches/${matchId}`, {
          params: {
            assignmentStatus: [
              AssignmentStatus.ASSIGNED,
              AssignmentStatus.ACCEPTED,
              AssignmentStatus.REQUESTED,
              AssignmentStatus.UNAVAILABLE,
            ],
          },
        }),
      ]);
      setDetailData(detailRes.data);
      setExistingAssignments(
        Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [],
      );
    } catch (err) {
      console.error("Error fetching match detail:", err);
      setDetailData(null);
      setExistingAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && match) {
      setDetailData(null);
      setExistingAssignments([]);
      setSearchQuery("");
      setShowUnavailable(false);
      fetchDetail(match._id);
    }
  }, [open, match, fetchDetail]);

  if (!match) return null;

  const tournamentConfig = tournamentConfigs[match.tournament.alias];
  const startDate = new Date(match.startDate);
  const formattedDate = startDate.toLocaleString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const assignedRef1 =
    detailData?.assigned.find((r) => r.position === 1) ?? null;
  const assignedRef2 =
    detailData?.assigned.find((r) => r.position === 2) ?? null;

  const pos1Taken = assignedRef1 !== null;
  const pos2Taken = assignedRef2 !== null;

  const handleAssign = async (referee: RefToolReferee, position: 1 | 2) => {
    try {
      const existing = existingAssignments.find(
        (a) => a.referee.userId === referee.userId,
      );
      if (existing) {
        await apiClient({
          method: "patch",
          url: `/assignments/${existing._id}`,
          data: { status: AssignmentStatus.ASSIGNED, position, refAdmin: true },
        });
      } else {
        await apiClient({
          method: "post",
          url: "/assignments",
          data: {
            matchId: match._id,
            userId: referee.userId,
            status: AssignmentStatus.ASSIGNED,
            position,
            refAdmin: true,
          },
        });
      }
      await fetchDetail(match._id);
      onDataChanged?.();
    } catch (err) {
      console.error("Error assigning referee:", err);
    }
  };

  const handleRemove = async (referee: RefToolReferee) => {
    try {
      const assignmentId = existingAssignments.find(
        (a) => a.referee.userId === referee.userId,
      )?._id;

      if (!assignmentId) {
        console.error("Assignment ID not found for referee:", referee.userId);
        return;
      }

      await apiClient.delete(`/assignments/${assignmentId}`);
      await fetchDetail(match._id);
      onDataChanged?.();
    } catch (err) {
      console.error("Error removing referee:", err);
    }
  };

  const matchesSearch = (ref: RefToolReferee): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ref.firstName.toLowerCase().includes(q) ||
      ref.lastName.toLowerCase().includes(q) ||
      (ref.clubName?.toLowerCase().includes(q) ?? false) ||
      ref.level.toLowerCase().includes(q)
    );
  };

  const isSearching = searchQuery.trim().length > 0;

  const filteredRequested = sortByLevel(
    detailData?.requested.filter(matchesSearch) ?? [],
  );
  const filteredAvailable = sortByLevel(
    detailData?.available.filter(matchesSearch) ?? [],
  );
  const filteredUnavailable = sortByLevel(
    detailData?.unavailable.filter(matchesSearch) ?? [],
  );

  // Expand sections when searching
  const shouldShowRequested = isSearching || showRequested;
  const shouldShowAvailable = isSearching || showAvailable;
  const shouldShowUnavailable = isSearching || showUnavailable;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
      unmount={false}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/60 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
            >
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Sticky dark header */}
                <div className="sticky top-0 z-10 bg-gray-900 px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      {tournamentConfig && (
                        <span
                          className={classNames(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset mb-2",
                            "bg-white/10 text-white ring-white/20",
                          )}
                        >
                          {tournamentConfig.tinyName}
                        </span>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-2">
                          <CldImage
                            src={
                              match.home.logo ||
                              "https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                            }
                            alt={match.home.tinyName}
                            width={28}
                            height={28}
                            crop="fit"
                            className="h-7 w-7 object-contain"
                          />
                          <span className="text-sm font-semibold text-white">
                            {match.home.shortName}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">vs</span>
                        <div className="flex items-center gap-2">
                          <CldImage
                            src={
                              match.away.logo ||
                              "https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                            }
                            alt={match.away.tinyName}
                            width={28}
                            height={28}
                            crop="fit"
                            className="h-7 w-7 object-contain"
                          />
                          <span className="text-sm font-semibold text-white">
                            {match.away.shortName}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-400">
                        {formattedDate} · {match.venue.name}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="ml-3 flex-shrink-0 rounded-md text-gray-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="py-8">
                      <LoadingState />
                    </div>
                  ) : detailData ? (
                    <div className="px-4 sm:px-6 py-4 space-y-6">
                      {/* Section 1: Assigned positions + Requested */}
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                          Positionen
                        </h3>
                        <div className="space-y-2">
                          <AssignedSlot
                            label="Pos 1"
                            referee={assignedRef1}
                            onRemove={handleRemove}
                          />
                          <AssignedSlot
                            label="Pos 2"
                            referee={assignedRef2}
                            onRemove={handleRemove}
                          />
                        </div>

                        {/* Search box */}
                        <div className="mt-4 pt-2 border-t border-gray-200">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Schiedsrichter suchen…"
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => setShowRequested((v) => !v)}
                            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                          >
                            <span className="flex items-center gap-2">
                              Angefragt
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
                                {filteredRequested.length}
                              </span>
                            </span>
                            {shouldShowRequested ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                          {shouldShowRequested && (
                            <div className="mt-2 divide-y divide-gray-100">
                              {filteredRequested.map((ref) => (
                                <RefereeItem
                                  key={ref.userId}
                                  referee={ref}
                                  pos1Taken={pos1Taken}
                                  pos2Taken={pos2Taken}
                                  matchId={match._id}
                                  onAssign={handleAssign}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Section 2: Available */}
                      <section>
                        <button
                          onClick={() => setShowAvailable((v) => !v)}
                          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            Verfügbar
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                              {filteredAvailable.length}
                            </span>
                          </span>
                          {shouldShowAvailable ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                        {shouldShowAvailable && (
                          <>
                            {filteredAvailable.length > 0 ? (
                              <div className="mt-2 divide-y divide-gray-100">
                                {filteredAvailable.map((ref) => (
                                  <RefereeItem
                                    key={ref.userId}
                                    referee={ref}
                                    pos1Taken={pos1Taken}
                                    pos2Taken={pos2Taken}
                                    matchId={match._id}
                                    onAssign={handleAssign}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400 italic">
                                Keine verfügbaren Schiedsrichter
                              </p>
                            )}
                          </>
                        )}
                      </section>

                      {/* Section 3: Unavailable (hidden by default) */}
                      <section>
                        <button
                          onClick={() => setShowUnavailable((v) => !v)}
                          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            Nicht verfügbar
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {filteredUnavailable.length}
                            </span>
                          </span>
                          {shouldShowUnavailable ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                        {shouldShowUnavailable && (
                          <>
                            {filteredUnavailable.length > 0 ? (
                              <div className="mt-2 divide-y divide-gray-100">
                                {filteredUnavailable.map((ref) => (
                                  <RefereeItem
                                    key={ref.userId}
                                    referee={ref}
                                    pos1Taken={pos1Taken}
                                    pos2Taken={pos2Taken}
                                    matchId={match._id}
                                    onAssign={handleAssign}
                                    showAssignButtons={false}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400 italic">
                                Keine Einträge
                              </p>
                            )}
                          </>
                        )}
                      </section>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      Daten konnten nicht geladen werden
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default MatchDetailDrawer;
