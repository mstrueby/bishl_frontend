import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>BISHL</title>
      </Head>
      <Layout>
        <h1>Home</h1>
        <p>Startseite index.tsx</p>
      </Layout>
    </>
  )
}

export default Home