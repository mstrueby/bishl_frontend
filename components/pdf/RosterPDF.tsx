import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';
import { RosterPlayer } from '../../types/MatchValues';
import { Match, Team } from '../../types/MatchValues';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bishlLogo: {
    width: 50,
    height: 45,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  matchPanel: {
    marginBottom: 15,
    borderBottom: 1,
    paddingBottom: 10,
    borderColor: '#333',
    fontSize: 12,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  matchTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
  },
  matchInfo: {
    color: '#666',
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 18,
    paddingVertical: 2,
  },
  tableHeader: {
    backgroundColor: '#E5E7EB',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    fontWeight: 'bold',
  },
  numberCell: {
    width: '12%',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  positionCell: {
    width: '15%',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  nameCell: {
    width: '53%',
    paddingHorizontal: 4,
  },
  passCell: {
    width: '20%',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: '#666',
    borderTop: 1,
    borderColor: '#333',
    paddingTop: 8,
    fontSize: 8,
  },
  teamOfficials: {
    marginTop: 15,
    paddingTop: 10,
  },
  teamOfficialsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  officialsTable: {
    width: '100%',
    marginTop: 8,
  },
  officialsTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 18,
    paddingVertical: 2,
  },
  officialsTableHeader: {
    backgroundColor: '#E5E7EB',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    fontWeight: 'bold',
  },
  officialsRoleCell: {
    width: '20%',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  officialsNameCell: {
    width: '60%',
    paddingHorizontal: 4,
  },
  officialsLicenceCell: {
    width: '20%',
    paddingHorizontal: 4,
    textAlign: 'center',
  }
});

interface RosterPDFProps {
  teamFlag: string;

  matchDate: string;
  venue: string;
  roster: RosterPlayer[];
  tournament: string;
  round: string;
  homeTeam: Team;
  awayTeam: Team;
  teamLogo?: string;
  coach?: {
    firstName?: string;
    lastName?: string;
    licence?: string;
  };
  staff?: {
    firstName: string;
    lastName: string;
    role: string;
  }[];
}

const RosterPDF = ({ teamFlag, matchDate, venue, roster, teamLogo, tournament, round, homeTeam, awayTeam, coach, staff }: RosterPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PDFImage
          style={styles.bishlLogo}
          src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.png"
        />
        <Text style={styles.pageTitle}>Mannschaftsaufstellung</Text>
      </View>
      <View style={styles.matchPanel}>
        <View>
          <Text style={styles.matchTitle}>{homeTeam.fullName} - {awayTeam.fullName}</Text>
          {tournament && <Text style={styles.matchInfo}>{tournament} / {round} / {matchDate}</Text>}
          <Text style={styles.matchInfo}>{venue}</Text>
        </View>
      </View>

      {/* Team Name Section */}
      <View style={{ marginBottom: 8, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {teamLogo && (
            <View style={{ marginRight: 10 }}>
              <PDFImage
                style={{ width: 25, height: 25, objectFit: 'contain' }}
                src={teamLogo}
              />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'left' }}>
            {teamFlag === 'home' ? `${homeTeam.fullName} / ${homeTeam.name}` : `${awayTeam.fullName} / ${awayTeam.name}`}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.numberCell}>Nr.</Text>
          <Text style={styles.positionCell}>Pos.</Text>
          <Text style={styles.nameCell}>Name, Vorname</Text>
          <Text style={styles.passCell}>Pass-Nr.</Text>
        </View>

        {(() => {
          // Sort roster by position priority
          const sortedRoster = roster.sort((a, b) => {
            const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };
            const posA = positionPriority[a.playerPosition.key] || 99;
            const posB = positionPriority[b.playerPosition.key] || 99;

            if (posA !== posB) {
              return posA - posB;
            }

            const jerseyA = a.player.jerseyNumber || 999;
            const jerseyB = b.player.jerseyNumber || 999;
            return jerseyA - jerseyB;
          });

          // Separate players by position
          const captains = sortedRoster.filter(p => p.playerPosition.key === 'C');
          const assistants = sortedRoster.filter(p => p.playerPosition.key === 'A');
          const goalies = sortedRoster.filter(p => p.playerPosition.key === 'G');
          const forwards = sortedRoster.filter(p => p.playerPosition.key === 'F');

          // Create 18 rows total with specific positioning
          const rows = [];

          // Row 1: Captain (C) - always first
          const captain = captains[0];
          rows.push(
            <View key="row-1" style={styles.tableRow}>
              <Text style={styles.numberCell}>{captain ? (captain.player.jerseyNumber || '-') : '-'}</Text>
              <Text style={styles.positionCell}>{captain ? 'C' : ''}</Text>
              <Text style={styles.nameCell}>
                {captain ? `${captain.player.lastName}, ${captain.player.firstName}${captain.called ? ' (H)' : ''}` : ''}
              </Text>
              <Text style={styles.passCell}>{captain ? (captain.passNumber || '-') : '-'}</Text>
            </View>
          );

          // Row 2: Assistant (A) - always second
          const assistant = assistants[0];
          rows.push(
            <View key="row-2" style={styles.tableRow}>
              <Text style={styles.numberCell}>{assistant ? (assistant.player.jerseyNumber || '-') : '-'}</Text>
              <Text style={styles.positionCell}>{assistant ? 'A' : ''}</Text>
              <Text style={styles.nameCell}>
                {assistant ? `${assistant.player.lastName}, ${assistant.player.firstName}${assistant.called ? ' (H)' : ''}` : ''}
              </Text>
              <Text style={styles.passCell}>{assistant ? (assistant.passNumber || '-') : '-'}</Text>
            </View>
          );

          // Rows 3-4: Always two goalie rows
          for (let i = 0; i < 2; i++) {
            const goalie = goalies[i];

            rows.push(
              <View key={`row-goalie-${i}`} style={styles.tableRow}>
                <Text style={styles.numberCell}>{goalie ? (goalie.player.jerseyNumber || '-') : '-'}</Text>
                <Text style={styles.positionCell}>{goalie ? 'G' : 'G'}</Text>
                <Text style={styles.nameCell}>
                  {goalie ? `${goalie.player.lastName}, ${goalie.player.firstName}${goalie.called ? ' (H)' : ''}` : ''}
                </Text>
                <Text style={styles.passCell}>{goalie ? (goalie.passNumber || '-') : '-'}</Text>
              </View>
            );
          }

          // Rows 5-18: Forward players
          for (let i = 0; i < 14; i++) {
            const forward = forwards[i];

            rows.push(
              <View key={`row-forward-${i}`} style={styles.tableRow}>
                <Text style={styles.numberCell}>{forward ? (forward.player.jerseyNumber || '-') : '-'}</Text>
                <Text style={styles.positionCell}>{forward ? forward.playerPosition.key : ''}</Text>
                <Text style={styles.nameCell}>
                  {forward ? `${forward.player.lastName}, ${forward.player.firstName}${forward.called ? ' (H)' : ''}` : ''}
                </Text>
                <Text style={styles.passCell}>{forward ? (forward.passNumber || '-') : '-'}</Text>
              </View>
            );
          }

          return rows;
        })()}
      </View>

      {/* Team Officials Section */}
      <View style={styles.teamOfficials}>
        <Text style={styles.teamOfficialsTitle}>Teamoffizielle</Text>

        <View style={styles.officialsTable}>
          {/* Table Header */}
          <View style={[styles.officialsTableRow, styles.officialsTableHeader]}>
            <Text style={styles.officialsRoleCell}>Funktion</Text>
            <Text style={styles.officialsNameCell}>Name, Vorname</Text>
            <Text style={styles.officialsLicenceCell}>Lizenz</Text>
          </View>

          {/* Coach Row - Always first */}
          <View style={styles.officialsTableRow}>
            <Text style={styles.officialsRoleCell}>Trainer</Text>
            <Text style={styles.officialsNameCell}>
              {coach && (coach.firstName || coach.lastName)
                ? [coach.lastName, coach.firstName].filter(Boolean).join(', ')
                : ''
              }
            </Text>
            <Text style={styles.officialsLicenceCell}>
              {coach && coach.licence ? coach.licence : ''}
            </Text>
          </View>

          {/* Staff Rows - Always show exactly 4 rows */}
          {Array.from({ length: 4 }, (_, index) => {
            const staffMember = staff && staff[index];
            return (
              <View key={index} style={styles.officialsTableRow}>
                <Text style={styles.officialsRoleCell}>
                  {staffMember && staffMember.role ? staffMember.role : ''}
                </Text>
                <Text style={styles.officialsNameCell}>
                  {staffMember && (staffMember.lastName || staffMember.firstName)
                    ? [staffMember.lastName, staffMember.firstName].filter(Boolean).join(', ')
                    : ''
                  }
                </Text>
                <Text style={styles.officialsLicenceCell}></Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Erstellt am {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </Page>
  </Document>
);

export default RosterPDF;