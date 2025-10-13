
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, SupplementarySheet } from '../../types/MatchValues';
import Badge from '../ui/Badge';

interface Assignment {
  _id: string;
  matchId: string;
  status: string;
  referee: {
    userId: string;
    firstName: string;
    lastName: string;
    clubId: string;
    clubName: string;
    logoUrl: string;
    level: string;
  };
  position: number;
}

interface SupplementaryTabProps {
  match: Match;
  jwt: string;
  permissions: {
    showButtonSupplementary: boolean;
  };
}

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`overflow-hidden bg-white rounded-md shadow-md border ${className}`}>
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
};

const SupplementaryTab: React.FC<SupplementaryTabProps> = ({ match, jwt, permissions }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/assignments/matches/${match._id}?assignmentStatus=ASSIGNED&assignmentStatus=ACCEPTED`;
        console.log('Fetching assignments from URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched assignments:', data);
          console.log('Match referee1:', match.referee1);
          console.log('Match referee2:', match.referee2);
          setAssignments(data);
        } else {
          console.log('Response not ok, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, [match._id, jwt]);

  return (
    <div className="py-4">
      <div className="border-b mb-3 border-gray-200 pb-3 flex items-center justify-between mt-3 sm:mt-0 sm:mx-3 min-h-[2.5rem]">
        <h3 className="text-md font-semibold text-gray-900 py-1.5 truncate">Zusatzblatt</h3>
        {permissions.showButtonSupplementary && (
          <Link href={`/matches/${match._id}/supplementary`}>
            <a className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Bearbeiten
            </a>
          </Link>
        )}
      </div>

      <div className="space-y-12 md:px4">
        {/* Referee Attendance Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Schiedsrichter</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((refNumber) => {
              const passAvailableKey = `referee${refNumber}PassAvailable` as keyof SupplementarySheet;
              const passNoKey = `referee${refNumber}PassNo` as keyof SupplementarySheet;
              const delayMinKey = `referee${refNumber}DelayMin` as keyof SupplementarySheet;
              const refereePresentKey = `referee${refNumber}Present` as keyof SupplementarySheet;

              const passAvailable = match.supplementarySheet?.[passAvailableKey] as boolean | undefined;
              const passNo = match.supplementarySheet?.[passNoKey] as string | undefined;
              const delayMin = match.supplementarySheet?.[delayMinKey] as number | undefined;
              const refereePresent = match.supplementarySheet?.[refereePresentKey] as boolean | undefined;

              const referee = refNumber === 1 ? match.referee1 : match.referee2;
              const refereeTitle = referee 
                ? `SR ${refNumber} - ${referee.firstName} ${referee.lastName}`
                : `SR ${refNumber} - nicht eingeteilt`;

              const isSaved = match.supplementarySheet?.isSaved;

              // Find assignment for this position
              const assignment = assignments.find(a => a.position === refNumber);
              
              // Debug logging
              console.log(`=== Referee ${refNumber} Debug ===`);
              console.log('Referee object:', referee);
              console.log('Assignment object:', assignment);
              console.log('Assignment referee userId:', assignment?.referee?.userId);
              console.log('Match referee userId:', referee?.userId);
              console.log('Are they different?', assignment && referee && assignment.referee.userId !== referee.userId);
              
              const isDifferentReferee = assignment && referee && assignment.referee.userId !== referee.userId;

              return (
                <InfoCard 
                  key={refNumber} 
                  title={refereeTitle}
                  className={isDifferentReferee ? 'border-red-500 border-2' : ''}
                >
                  <div className="text-sm text-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Anwesend:</span>
                      {isSaved ? (
                        <Badge info={refereePresent ? 'Ja' : 'Nein'} />
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Pass liegt vor:</span>
                      {isSaved ? (
                        <Badge info={passAvailable ? 'Ja' : 'Nein'} />
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Pass-Nr.:</span>
                      <span>{passNo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verspätung:</span>
                      <span>{delayMin || 0} Min</span>
                    </div>
                  </div>
                  {isDifferentReferee && (
                    <div className="mt-4 pt-3 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-3">
                      <div className="text-xs text-gray-600">
                        <div className="font-medium text-gray-600 mb-2">
                          {assignment.status === 'ASSIGNED' ? 'Eingeteilt (nicht bestätigt)' : 'Eingeteilt (bestätigt)'}:
                        </div>
                        <div className='text-sm text-gray-800'>{assignment.referee.firstName} {assignment.referee.lastName}</div>
                        {assignment.referee.clubName && (
                          <div className="text-gray-500 pb-1">{assignment.referee.clubName}</div>
                        )}
                      </div>
                    </div>
                  )}
                </InfoCard>
              );
            })}
          </div>
        </div>

        {/* Officials Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Weitere Offizielle</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard title="Zeitnehmer 1">
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.timekeeper1?.firstName || match.supplementarySheet?.timekeeper1?.lastName
                      ? `${match.supplementarySheet?.timekeeper1?.firstName || ''} ${match.supplementarySheet?.timekeeper1?.lastName || ''}`.trim()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lizenz:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.timekeeper1?.licence || '-'}
                  </span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Zeitnehmer 2">
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.timekeeper2?.firstName || match.supplementarySheet?.timekeeper2?.lastName
                      ? `${match.supplementarySheet?.timekeeper2?.firstName || ''} ${match.supplementarySheet?.timekeeper2?.lastName || ''}`.trim()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lizenz:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.timekeeper2?.licence || '-'}
                  </span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Technischer Direktor">
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.technicalDirector?.firstName && match.supplementarySheet?.technicalDirector?.lastName
                      ? `${match.supplementarySheet.technicalDirector.firstName} ${match.supplementarySheet.technicalDirector.lastName}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lizenz:</span>
                  <span className="font-medium">
                    {match.supplementarySheet?.technicalDirector?.licence || '-'}
                  </span>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Crowd Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Zuschauer</h4>
          <div className="px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Anzahl Zuschauer:</span>
              <span className="text-sm font-semibold text-gray-900">
                {match.supplementarySheet?.crowd || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Equipment Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Dokumente / Ausrüstung</h4>
          <div className="overflow-hidden">
            <div className="px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { key: 'usageApproval', label: 'Nutzungserlaubnis' },
                  { key: 'ruleBook', label: 'Spielregeln/WKO' },
                  { key: 'goalDisplay', label: 'Manuelle Toranzeige' },
                  { key: 'soundSource', label: 'Ersatz-Tonquelle' },
                  { key: 'matchClock', label: 'Spieluhr' },
                  { key: 'matchBalls', label: '10 Spielbälle' },
                  { key: 'firstAidKit', label: 'Erste-Hilfe-Ausrüstung' },
                  { key: 'fieldLines', label: 'Pflichtlinien' },
                  { key: 'nets', label: 'Tornetze' },
                ].map((item) => {
                  const isChecked = match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet];
                  const isSaved = match.supplementarySheet?.isSaved;

                  return (
                    <div key={item.key} className="flex items-center space-x-3">
                      <div
                        className={`${
                          isChecked
                            ? 'text-green-500 bg-green-500/20'
                            : isSaved
                              ? 'text-red-500 bg-red-500/20'
                              : 'text-gray-500 bg-gray-800/10'
                        } flex-none rounded-full p-1`}
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Team Equipment Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Mannschaften</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard title={`Heimmannschaft - ${match.home.fullName}`}>
              <div className="text-sm text-gray-700 space-y-2">
                {[
                  { key: 'homeRoster', label: 'Aufstellung rechtzeitig' },
                  { key: 'homePlayerPasses', label: 'Spielerpässe vollständig' },
                  { key: 'homeUniformPlayerClothing', label: 'Einheitliche Spielerkleidung' },
                ].map((item) => {
                  const isChecked = match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet];
                  const isSaved = match.supplementarySheet?.isSaved;

                  return (
                    <div key={item.key} className="flex items-center space-x-3">
                      <div
                        className={`${
                          isChecked
                            ? 'text-green-500 bg-green-500/20'
                            : isSaved
                              ? 'text-red-500 bg-red-500/20'
                              : 'text-gray-500 bg-gray-800/10'
                        } flex-none rounded-full p-1`}
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </InfoCard>

            <InfoCard title={`Gastmannschaft - ${match.away.fullName}`}>
              <div className="text-sm text-gray-700 space-y-2">
                {[
                  { key: 'awayRoster', label: 'Aufstellung rechtzeitig' },
                  { key: 'awayPlayerPasses', label: 'Spielerpässe vollständig' },
                  { key: 'awayUniformPlayerClothing', label: 'Einheitliche Spielerkleidung' },
                  { key: 'awaySecondJerseySet', label: 'Zweiter Trikotsatz' },
                ].map((item) => {
                  const isChecked = match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet];
                  const isSaved = match.supplementarySheet?.isSaved;

                  return (
                    <div key={item.key} className="flex items-center space-x-3">
                      <div
                        className={`${
                          isChecked
                            ? 'text-green-500 bg-green-500/20'
                            : isSaved
                              ? 'text-red-500 bg-red-500/20'
                              : 'text-gray-500 bg-gray-800/10'
                        } flex-none rounded-full p-1`}
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Special Events Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Besondere Vorkommnisse</h4>
          <div className="space-y-4 px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <div
                className={`${
                  match.supplementarySheet?.specialEvents
                    ? 'text-red-500 bg-red-500/20'
                    : match.supplementarySheet?.isSaved
                      ? 'text-green-500 bg-green-500/20'
                      : 'text-gray-500 bg-gray-800/10'
                } flex-none rounded-full p-1`}
              >
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>
              <span className="text-sm text-gray-700">
                {match.supplementarySheet?.specialEvents
                  ? 'Besondere Vorkommnisse aufgetreten'
                  : 'Keine besonderen Vorkommnisse'}
              </span>
            </div>

            {match.supplementarySheet?.refereeComments && (
              <div>
                <h5 className="text-sm font-medium text-gray-800 mb-2">Schiedsrichter Kommentare:</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {match.supplementarySheet.refereeComments}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Referee Payment Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Schiedsrichtervergütung</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[1, 2].map((refNumber) => {
              const paymentData =
                match.supplementarySheet?.refereePayment?.[
                  `referee${refNumber}` as keyof typeof match.supplementarySheet.refereePayment
                ];
              const total =
                (paymentData?.travelExpenses || 0) +
                (paymentData?.expenseAllowance || 0) +
                (paymentData?.gameFees || 0);
              
              const referee = refNumber === 1 ? match.referee1 : match.referee2;
              const refereeTitle = referee 
                ? `SR ${refNumber} - ${referee.firstName} ${referee.lastName}`
                : `SR ${refNumber} - nicht eingeteilt`;

              return (
                <InfoCard key={refNumber} title={refereeTitle}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reisekosten:</span>
                      <span className="font-medium">
                        {(paymentData?.travelExpenses || 0).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aufwandsentschädigung:</span>
                      <span className="font-medium">
                        {(paymentData?.expenseAllowance || 0).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spielgebühren:</span>
                      <span className="font-medium">
                        {(paymentData?.gameFees || 0).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-900">Summe:</span>
                      <span className="font-semibold text-gray-900">
                        {total.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>
                </InfoCard>
              );
            })}
          </div>

          <div className="mt-6 px-4">
            <div className="flex justify-end items-center space-x-8">
              <span className="hidden sm:block text-sm font-medium text-gray-900">
                Gesamtsumme Schiedsrichtervergütung:
              </span>
              <span className="sm:hidden text-sm font-medium text-gray-900">Gesamtsumme:</span>
              <span className="text-lg font-bold text-gray-900">
                {(
                  (match.supplementarySheet?.refereePayment?.referee1?.travelExpenses || 0) +
                  (match.supplementarySheet?.refereePayment?.referee1?.expenseAllowance || 0) +
                  (match.supplementarySheet?.refereePayment?.referee1?.gameFees || 0) +
                  (match.supplementarySheet?.refereePayment?.referee2?.travelExpenses || 0) +
                  (match.supplementarySheet?.refereePayment?.referee2?.expenseAllowance || 0) +
                  (match.supplementarySheet?.refereePayment?.referee2?.gameFees || 0)
                )
                  .toFixed(2)
                  .replace('.', ',')}{' '}
                €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplementaryTab;
