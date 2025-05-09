
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { RosterPlayer } from '../../types/MatchValues';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    paddingBottom: 15,
    borderColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  teamInfo: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
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
    minHeight: 35,
    paddingVertical: 8,
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
  teamLogo?: string;
}

const RosterPDF = ({ teamName, matchDate, venue, roster, teamLogo }: RosterPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {teamLogo && (
            <Image
              style={styles.logo}
              src={teamLogo}
            />
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.title}>{teamName}</Text>
            <Text style={styles.subtitle}>Spieltag: {matchDate}</Text>
            <Text style={styles.subtitle}>Spielort: {venue}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.numberCell}>Nr.</Text>
          <Text style={styles.positionCell}>Position</Text>
          <Text style={styles.nameCell}>Name</Text>
          <Text style={styles.passCell}>Pass-Nr.</Text>
        </View>
        
        {roster
          .sort((a, b) => (a.player.jerseyNumber || 0) - (b.player.jerseyNumber || 0))
          .map((player) => (
            <View key={player.player.playerId} style={styles.tableRow}>
              <Text style={styles.numberCell}>{player.player.jerseyNumber || '-'}</Text>
              <Text style={styles.positionCell}>{player.playerPosition.key}</Text>
              <Text style={styles.nameCell}>
                {`${player.player.lastName}, ${player.player.firstName}`}
                {player.called && ' (H)'}
              </Text>
              <Text style={styles.passCell}>{player.passNumber || '-'}</Text>
            </View>
          ))}
      </View>

      <View style={styles.footer}>
        <Text>Erstellt am {new Date().toLocaleDateString('de-DE')}</Text>
      </View>
    </Page>
  </Document>
);

export default RosterPDF;
