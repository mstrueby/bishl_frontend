import React from 'react';

interface SecondaryRule {
  targetAgeGroup: string;
  sex: string[];
  maxLicenses: number;
  requiresAdmin: boolean;
}

interface OverAgeRule {
  targetAgeGroup: string;
  sex: string[];
  maxLicenses: number;
  maxOverAgePlayersPerTeam: number;
}

interface WkoAgeGroupRule {
  ageGroup: string;
  label: string;
  sortOrder: number;
  altKey: string;
  sex: string[];
  secondaryRules: SecondaryRule[];
  overAgeRules: OverAgeRule[];
  maxTotalAgeClasses: Record<string, number>;
}

interface WkoRulesProps {
  rules: WkoAgeGroupRule[];
  dynamicRules: any;
}

const WkoRules: React.FC<WkoRulesProps> = ({ rules, dynamicRules }) => {
  // Ensure we are working with an array
  const rulesList = Array.isArray(rules) ? rules : [];
  
  if (rulesList.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-16 border-t border-gray-200 pt-10 pb-20">
      <div className="mb-8">
        <h3 className="text-base font-semibold leading-7 text-gray-900 uppercase">WKO-Regelwerk</h3>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Übersicht der Spielberechtigungen und Altersklassen-Regelungen gemäß WKO.
        </p>
      </div>

      <div className="space-y-12">
        {/* Age Group Rules Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Altersklasse</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Geschlecht</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Zweitspielrecht (Max)</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Over-Age (Ziel/Limit)</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">Max. Altersklassen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[...rulesList].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((rule) => (
                <tr key={rule.ageGroup}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {rule.label} <span className="text-xs text-gray-400 font-normal">({rule.altKey})</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex gap-1">
                      {rule.sex.map(s => (
                        <span key={s} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {s === 'männlich' ? 'M' : 'W'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {rule.secondaryRules && rule.secondaryRules.length > 0 ? (
                      <div className="space-y-1">
                        {rule.secondaryRules.map((sr, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-medium">{sr.targetAgeGroup}</span>
                            <span>({sr.maxLicenses === 99 ? '∞' : sr.maxLicenses})</span>
                            {sr.requiresAdmin && <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded border border-red-200">Admin</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {rule.overAgeRules && rule.overAgeRules.length > 0 ? (
                      <div className="space-y-1">
                        {rule.overAgeRules.map((or, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-medium">→ {or.targetAgeGroup}</span>
                            <span>(max. {or.maxOverAgePlayersPerTeam}/Team)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                    <div className="flex justify-center gap-2">
                       <span title="Männlich">M: {rule.maxTotalAgeClasses?.männlich || 0}</span>
                       <span className="text-gray-300">|</span>
                       <span title="Weiblich">W: {rule.maxTotalAgeClasses?.weiblich || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Rules Info */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dynamicRules?.fullFaceReq && (
            <div className="rounded-lg bg-gray-50 p-6 ring-1 ring-inset ring-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Vollvisier-Pflicht</h4>
              <p className="mt-2 text-xs text-gray-600">{dynamicRules.fullFaceReq.rule}</p>
            </div>
          )}
          {dynamicRules?.ageGroups && (
            <div className="rounded-lg bg-gray-50 p-6 ring-1 ring-inset ring-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Altersklassen-Logik</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {dynamicRules.ageGroups.logic?.map((l: any, idx: number) => (
                  <li key={idx}>
                    {l.max_age_diff ? `Max. Differenz ${l.max_age_diff} Jahre → ${l.group}` : l.default}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dynamicRules?.overAgeRules && (
            <div className="rounded-lg bg-gray-50 p-6 ring-1 ring-inset ring-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Over-Age (OA) Sonderregeln</h4>
              <p className="mt-2 text-xs text-gray-600">{dynamicRules.overAgeRules.details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WkoRules;
