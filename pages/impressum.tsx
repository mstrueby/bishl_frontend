import React from 'react';
import Layout from '../components/Layout';

const Impressum = () => (
  <Layout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1>Impressum</h1>

      <p>Sportkommission Skaterhockey des IRVB<br />
      Luitpoldstra&szlig;e 47<br />
      10781 Berlin</p>

      <p>Vereinsregister: &#91;Nummer des Registereintrags&#93;<br />
      Registergericht: &#91;Name des Registergerichts&#93;</p>

      <p><strong>Vertreten durch:</strong><br />
      J&ouml;rg Ogilvie</p>

      <h2>Kontakt</h2>
      <p>Telefon: +49 176 63234918<br />
      E-Mail: j.ogilvie@gmx.de</p>

      <h2>EU-Streitschlichtung</h2>
      <p>Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br /> Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>

      <h2>Verbraucher&shy;streit&shy;beilegung/Universal&shy;schlichtungs&shy;stelle</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </div>
  </Layout>
);

export default Impressum;