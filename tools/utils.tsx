export function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)).toString().replace('.', ',') + ' ' + sizes[i];
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface MatchButtonPermissions {
  showButtonEdit?: boolean;
  showButtonStatus?: boolean;
  showButtonRosterHome?: boolean;
  showButtonRosterAway?: boolean;
  showButtonScoresHome?: boolean;
  showButtonScoresAway?: boolean;
  showButtonPenaltiesHome?: boolean;
  showButtonPenaltiesAway?: boolean;
  showButtonEvents?: boolean;
  showMatchCenter?: boolean;
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

export function calculateMatchButtonPermissions(
  user: User | null,
  match: Match,
  matchdayOwner?: MatchdayOwner,
  isMatchCenter: boolean = false
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
    showMatchCenter: true,
  };

  if (!user) return permissions;

  const now = Date.now();
  const matchStartTime = new Date(match.startDate).getTime();
  const thirtyMinutesFromNow = now + 30 * 60 * 1000;
  const isMatchToday = new Date(match.startDate).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0);

  // LEAGUE_ADMIN permissions
  if (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN')) {
    permissions.showButtonEdit = true;
    permissions.showButtonStatus = true;
    
    if (isMatchCenter) {
      permissions.showButtonEvents = true;
    }

    // Roster permissions for starting soon or in progress matches
    if (matchStartTime < thirtyMinutesFromNow) {
      permissions.showButtonRosterHome = true;
      permissions.showButtonRosterAway = true;
    }

    if (match.matchStatus.key === 'INPROGRESS') {
      permissions.showButtonRosterHome = true;
      permissions.showButtonRosterAway = true;
    }
  }

  // Home team club admin permissions
  if (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN')) {
    permissions.showButtonRosterHome = true;

    // Additional permissions when match starts soon
    if (matchStartTime < thirtyMinutesFromNow) {
      permissions.showButtonRosterAway = true;
      permissions.showButtonStatus = true;
      
      if (isMatchCenter) {
        permissions.showButtonEvents = true;
      }
    }
  }

  // Away team club admin permissions
  if (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) {
    // Can edit away roster if match is more than 30 minutes away
    if (matchStartTime > thirtyMinutesFromNow) {
      permissions.showButtonRosterAway = true;
    }

    // Can edit away roster if match starts soon
    if (matchStartTime < thirtyMinutesFromNow) {
      permissions.showButtonRosterAway = true;
    }

    // Cannot edit roster when match is in progress
    if (match.matchStatus.key === 'INPROGRESS') {
      permissions.showButtonRosterAway = false;
    }
  }

  // Matchday owner permissions
  if (user.club && user.club.clubId === matchdayOwner?.clubId && isMatchToday) {
    permissions.showButtonRosterHome = true;
    permissions.showButtonRosterAway = true;
    permissions.showButtonStatus = true;
    
    if (isMatchCenter) {
      permissions.showButtonEvents = true;
    }
  }

  // Finished match restrictions
  if (match.matchStatus.key !== 'INPROGRESS' && match.matchStatus.key !== 'SCHEDULED') {
    permissions.showButtonEdit = false;
    permissions.showButtonRosterHome = false;
    permissions.showButtonRosterAway = false;
    permissions.showButtonStatus = false;
    
    if (isMatchCenter) {
      permissions.showButtonEvents = false;
    }
  }

  // ADMIN/LEAGUE_ADMIN can edit finished matches
  if ((user.roles.includes('ADMIN') || user.roles.includes('LEAGUE_ADMIN')) && 
      (match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'INPROGRESS')) {
    permissions.showButtonEdit = true;
    permissions.showButtonStatus = true;
    
    if (isMatchCenter) {
      permissions.showButtonRosterHome = true;
      permissions.showButtonRosterAway = true;
      permissions.showButtonScoresHome = true;
      permissions.showButtonScoresAway = true;
      permissions.showButtonPenaltiesHome = true;
      permissions.showButtonPenaltiesAway = true;
    }
  }

  // Season restrictions
  if (match.season.alias !== process.env['NEXT_PUBLIC_CURRENT_SEASON']) {
    permissions.showButtonEdit = false;
    permissions.showButtonStatus = false;
    permissions.showButtonRosterHome = false;
    permissions.showButtonRosterAway = false;
    
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