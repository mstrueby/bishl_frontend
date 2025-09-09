import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';
import { RosterPlayer } from '../../types/MatchValues';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  bishlLogo: {
    width: 65,
    height: 60,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  matchInfo: {
    marginBottom: 20,
    borderBottom: 2,
    paddingBottom: 15,
    borderColor: '#333',
  },
  headerContent: {
    width: '100%',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  teamInfo: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 22,
    paddingVertical: 3,
  },
  tableHeader: {
    backgroundColor: '#E5E7EB',
    borderBottomColor: '#333',
    borderBottomWidth: 2,
    fontWeight: 'bold',
  },
  numberCell: {
    width: '12%',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  positionCell: {
    width: '15%',
    paddingHorizontal: 8,
  },
  nameCell: {
    width: '53%',
    paddingHorizontal: 8,
  },
  passCell: {
    width: '20%',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    borderTop: 1,
    borderColor: '#999',
    paddingTop: 10,
    fontSize: 10,
  }
});

interface RosterPDFProps {
  teamName: string;
  matchDate: string;
  venue: string;
  roster: RosterPlayer[];
  tournament: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  teamLogo?: string;
}

const RosterPDF = ({ teamName, matchDate, venue, roster, teamLogo, tournament, round, homeTeam, awayTeam }: RosterPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PDFImage
          style={styles.bishlLogo}
          src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.png"
        />
        <Text style={styles.pageTitle}>Mannschaftsaufstellung</Text>
      </View>
      <View style={styles.matchInfo}>
        <View style={[styles.headerContent, { flexDirection: 'row', alignItems: 'center' }]}>
          {teamLogo && (
            <View style={{ width: 80, marginRight: 20 }}>
              <PDFImage
                style={styles.logo}
                src={teamLogo}
              />
            </View>
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.title}>{homeTeam} - {awayTeam}</Text>
            {tournament && <Text style={styles.subtitle}>{tournament} / {round} / {matchDate}</Text>}
            <Text style={styles.subtitle}>{venue}</Text>
          </View>
        </View>
      </View>

      {/* Team Name Section */}
      <View style={{ marginBottom: 20, paddingVertical: 15, borderBottom: 1, borderColor: '#DDDDDD' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {teamLogo && (
            <View style={{ marginRight: 15 }}>
              <PDFImage
                style={{ width: 60, height: 60, objectFit: 'contain' }}
                src={teamLogo}
              />
            </View>
          )}
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
            {teamName}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.numberCell}>Nr.</Text>
          <Text style={styles.positionCell}>Position</Text>
          <Text style={styles.nameCell}>Name</Text>
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

          // Separate goalies and other players
          const goalies = sortedRoster.filter(p => p.playerPosition.key === 'G');
          const otherPlayers = sortedRoster.filter(p => p.playerPosition.key !== 'G');

          // Create 18 rows total: 2 for goalies, 16 for other players
          const rows = [];

          // Add 2 goalie rows
          for (let i = 0; i < 2; i++) {
            const goalie = goalies[i];
            rows.push(
              <View key={`goalie-${i}`} style={styles.tableRow}>
                <Text style={styles.numberCell}>{goalie ? (goalie.player.jerseyNumber || '-') : '-'}</Text>
                <Text style={styles.positionCell}>{goalie ? 'G' : 'G'}</Text>
                <Text style={styles.nameCell}>
                  {goalie ? `${goalie.player.lastName}, ${goalie.player.firstName}${goalie.called ? ' (H)' : ''}` : ''}
                </Text>
                <Text style={styles.passCell}>{goalie ? (goalie.passNumber || '-') : '-'}</Text>
              </View>
            );
          }

          // Add 16 rows for other players
          for (let i = 0; i < 16; i++) {
            const player = otherPlayers[i];
            rows.push(
              <View key={`player-${i}`} style={styles.tableRow}>
                <Text style={styles.numberCell}>{player ? (player.player.jerseyNumber || '-') : '-'}</Text>
                <Text style={styles.positionCell}>{player ? player.playerPosition.key : ''}</Text>
                <Text style={styles.nameCell}>
                  {player ? `${player.player.lastName}, ${player.player.firstName}${player.called ? ' (H)' : ''}` : ''}
                </Text>
                <Text style={styles.passCell}>{player ? (player.passNumber || '-') : '-'}</Text>
              </View>
            );
          }

          return rows;
        })()}
      </View>

      <View style={styles.footer}>
        <Text>Erstellt am {new Date().toLocaleDateString('de-DE')}</Text>
      </View>
    </Page>
  </Document>
);

export default RosterPDF;
