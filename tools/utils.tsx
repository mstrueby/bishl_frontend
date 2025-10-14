export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (
    parseFloat((bytes / Math.pow(1024, i)).toFixed(2))
      .toString()
      .replace(".", ",") +
    " " +
    sizes[i]
  );
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export interface MatchButtonPermissions {
  showButtonEdit?: boolean;
  showButtonStatus?: boolean;
  showButtonRosterHome?: boolean;
  showButtonRosterAway?: boolean;
  showButtonScoresHome?: boolean;
  showButtonScoresAway?: boolean;
  showButtonPenaltiesHome?: boolean;
  showButtonPenaltiesAway?: boolean;
  showButtonEvents?: boolean;
  showButtonMatchCenter?: boolean;
  showButtonSupplementary?: boolean;
}

interface User {
  roles: string[];
  club?: {
    clubId: string;
  };
}

interface Match {
  _id: string;
  startDate: Date;
  matchStatus: { key: string };
  season: { alias: string };
  home: { clubId: string };
  away: { clubId: string };
}

interface MatchdayOwner {
  clubId?: string;
}

// Helper function to check if matchdayOwner is valid
function isValidMatchdayOwner(matchdayOwner?: MatchdayOwner): boolean {
  return (
    matchdayOwner != null &&
    typeof matchdayOwner === "object" &&
    "clubId" in matchdayOwner &&
    matchdayOwner.clubId != null &&
    matchdayOwner.clubId !== ""
  );
}

export function calculateMatchButtonPermissions(
  user: User | null,
  match: Match,
  matchdayOwner?: MatchdayOwner,
  isMatchCenter: boolean = false,
): MatchButtonPermissions {
  const permissions: MatchButtonPermissions = {
    showButtonEdit: false,
    showButtonStatus: false,
    showButtonRosterHome: false,
    showButtonRosterAway: false,
    showButtonScoresHome: false,
    showButtonScoresAway: false,
    showButtonPenaltiesHome: false,
    showButtonPenaltiesAway: false,
    showButtonEvents: false,
    showButtonMatchCenter: false,
    showButtonSupplementary: false,
  };
  if (!user) return permissions;

  // Early check: if match is in the past (before today), only ADMIN/LEAGUE_ADMIN can access
  const matchDate = new Date(match.startDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const isMatchInPast = matchDate < today;
  const isAdminOrLeagueAdmin = user.roles.includes("ADMIN") || user.roles.includes("LEAGUE_ADMIN");
  
  // For non-admins, deny all access to past matches
  if (isMatchInPast && !isAdminOrLeagueAdmin) {
    return permissions;
  }

  const now = Date.now();
  const matchStartTime = new Date(match.startDate).getTime();
  const thirtyMinutesFromNow = now + 30 * 60 * 1000;
  const isMatchDay = matchDate === today;

  // LEAGUE_ADMIN permissions (already verified as admin above)
  if (isAdminOrLeagueAdmin) {
    permissions.showButtonEdit = true;
    permissions.showButtonStatus = true;

    if (isMatchCenter) {
      permissions.showButtonEvents = true;
    }

    // Roster permissions for starting soon or in progress matches
    if (matchStartTime < thirtyMinutesFromNow) {
      permissions.showButtonRosterHome = true;
      permissions.showButtonRosterAway = true;
      permissions.showButtonMatchCenter = true;
      permissions.showButtonSupplementary = true;
    }
  }

  // Home team club admin permissions
  if (
    user.club &&
    user.club.clubId === match.home.clubId &&
    user.roles.includes("CLUB_ADMIN")
  ) {
    permissions.showButtonRosterHome = true;

    // Additional permissions when match starts soon
    if (
      matchStartTime < thirtyMinutesFromNow &&
      !isValidMatchdayOwner(matchdayOwner)
    ) {
      permissions.showButtonRosterAway = true;
      permissions.showButtonStatus = true;
      permissions.showButtonMatchCenter = true;
      permissions.showButtonSupplementary = true;

      if (isMatchCenter) {
        permissions.showButtonEvents = true;
      }
    }
  }

  // Away team club admin permissions
  if (
    user.club &&
    user.club.clubId === match.away.clubId &&
    user.roles.includes("CLUB_ADMIN")
  ) {
    // Can edit away roster if match is more than 30 minutes away
    if (matchStartTime > thirtyMinutesFromNow) {
      permissions.showButtonRosterAway = true;
    }

    // Can edit away roster if match starts soon
    if (matchStartTime < thirtyMinutesFromNow) {
      permissions.showButtonRosterAway = true;
    }

    // Cannot edit roster when match is in progress
    if (match.matchStatus.key === "INPROGRESS") {
      permissions.showButtonRosterAway = false;
    }
  }

  // Matchday owner permissions
  if (
    user.club &&
    isValidMatchdayOwner(matchdayOwner) &&
    matchdayOwner &&
    user.club.clubId === matchdayOwner.clubId &&
    user.roles.includes("CLUB_ADMIN") &&
    isMatchDay
  ) {
    permissions.showButtonRosterHome = true;
    permissions.showButtonRosterAway = true;
    permissions.showButtonStatus = true;
    permissions.showButtonMatchCenter = true;
    permissions.showButtonSupplementary = true;

    if (isMatchCenter) {
      permissions.showButtonEvents = true;
    }
  }

  // Finished match restrictions
  if (
    match.matchStatus.key !== "INPROGRESS" &&
    match.matchStatus.key !== "SCHEDULED"
  ) {
    // Allow home team club admin full access on match day
    const isHomeClubAdmin = user.club &&
      user.club.clubId === match.home.clubId &&
      user.roles.includes("CLUB_ADMIN");

    // Allow matchday owner full access on match day
    const isMatchdayOwnerAdmin = user.club &&
      isValidMatchdayOwner(matchdayOwner) &&
      matchdayOwner &&
      user.club.clubId === matchdayOwner.clubId &&
      user.roles.includes("CLUB_ADMIN");

    // If it's match day and user is home club admin or matchday owner, keep permissions
    // Or if user is ADMIN/LEAGUE_ADMIN, grant full permissions
    if ((isMatchDay && (isHomeClubAdmin || isMatchdayOwnerAdmin)) || isAdminOrLeagueAdmin) {
      // Don't restrict permissions - they keep what was granted earlier
      
      // Grant additional permissions for ADMIN/LEAGUE_ADMIN
      if (isAdminOrLeagueAdmin) {
        permissions.showButtonEdit = true;
        permissions.showButtonStatus = true;
        permissions.showButtonMatchCenter = true;

        if (isMatchCenter) {
          permissions.showButtonRosterHome = true;
          permissions.showButtonRosterAway = true;
          permissions.showButtonScoresHome = true;
          permissions.showButtonScoresAway = true;
          permissions.showButtonPenaltiesHome = true;
          permissions.showButtonPenaltiesAway = true;
          permissions.showButtonSupplementary = true;
        }
      }
    } else {
      // Apply finished match restrictions for everyone else
      permissions.showButtonEdit = false;
      permissions.showButtonRosterHome = false;
      permissions.showButtonRosterAway = false;
      permissions.showButtonStatus = false;
      permissions.showButtonMatchCenter = false;
      permissions.showButtonSupplementary = false;

      if (isMatchCenter) {
        permissions.showButtonEvents = false;
      }
    }
  }

  // Season restrictions
  if (match.season.alias !== process.env["NEXT_PUBLIC_CURRENT_SEASON"]) {
    permissions.showButtonEdit = false;
    permissions.showButtonStatus = false;
    permissions.showButtonRosterHome = false;
    permissions.showButtonRosterAway = false;
    permissions.showButtonMatchCenter = false;
    permissions.showButtonSupplementary = false;

    if (isMatchCenter) {
      permissions.showButtonScoresHome = false;
      permissions.showButtonScoresAway = false;
      permissions.showButtonPenaltiesHome = false;
      permissions.showButtonPenaltiesAway = false;
      permissions.showButtonEvents = false;
    }
  }

  return permissions;
}