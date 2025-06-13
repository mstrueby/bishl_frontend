
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { RosterPlayer } from '../../types/MatchValues';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
  },
  header: {
    marginBottom: 30,
    borderBottom: 1,
    paddingBottom: 10,
    borderColor: '#666',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  teamInfo: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 30,
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    borderBottomColor: '#666',
    borderBottomWidth: 2,
  },
  numberCell: {
    width: '15%',
    paddingHorizontal: 8,
  },
  positionCell: {
    width: '20%',
    paddingHorizontal: 8,
  },
  nameCell: {
    width: '45%',
    paddingHorizontal: 8,
  },
  passCell: {
    width: '20%',
    paddingHorizontal: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    borderTop: 1,
    borderColor: '#666',
    paddingTop: 10,
  },
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
            <Text style={styles.subtitle}>{matchDate} - {venue}</Text>
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
        
        {roster.map((player) => (
          <View key={player.player.playerId} style={styles.tableRow}>
            <Text style={styles.numberCell}>{player.player.jerseyNumber}</Text>
            <Text style={styles.positionCell}>{player.playerPosition.key}</Text>
            <Text style={styles.nameCell}>
              {player.player.lastName}, {player.player.firstName}
              {player.called && ' (H)'}
            </Text>
            <Text style={styles.passCell}>{player.passNumber}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

export default RosterPDF;
