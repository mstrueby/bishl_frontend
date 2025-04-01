
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { RosterPlayer } from '../../types/MatchValues';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    height: 24,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    width: '25%',
    padding: 5,
  },
});

interface RosterPDFProps {
  teamName: string;
  matchDate: string;
  venue: string;
  roster: RosterPlayer[];
}

const RosterPDF = ({ teamName, matchDate, venue, roster }: RosterPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{teamName}</Text>
        <Text>{matchDate} - {venue}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Nr.</Text>
          <Text style={styles.tableCell}>Position</Text>
          <Text style={styles.tableCell}>Name</Text>
          <Text style={styles.tableCell}>Pass-Nr.</Text>
        </View>
        
        {roster.map((player) => (
          <View key={player.player.playerId} style={styles.tableRow}>
            <Text style={styles.tableCell}>{player.player.jerseyNumber}</Text>
            <Text style={styles.tableCell}>{player.playerPosition.key}</Text>
            <Text style={styles.tableCell}>
              {player.player.lastName}, {player.player.firstName}
              {player.called && ' (H)'}
            </Text>
            <Text style={styles.tableCell}>{player.passNumber}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default RosterPDF;
