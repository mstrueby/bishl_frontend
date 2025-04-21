import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import Footer from '../components/Footer'
import { CldImage } from 'next-cloudinary'
import Image from 'next/image'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect any non-root paths to home
    if (router.pathname !== '/') {
      router.push('/');
    }
  }, [router.pathname]);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Head>
          <meta name="robots" content="index, follow" />
          <title>BISHL - Berliner Inline-Skaterhockey</title>
        </Head>
        <main className="flex-grow w-full mx-auto max-w-7xl my-6 px-4 sm:px-6 lg:px-8">        
          <div className="bg-white">
            <div className="relative isolate">
              <div className="mx-auto max-w-2xl ">
                <div className="text-center text-md sm:text-lg  py-12 sm:py-24 lg:py-24 px-4 sm:px-8 border-4 border-black">
                  <div className="bg-transparent mb-14">
                    <CldImage
                      src="https://res.cloudinary.com/dajtykxvp/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1744883924/Matze.jpg"
                      alt="Matze"
                      width={400}
                      height={400} // Maintain aspect ratio
                      gravity="face"
                      crop="fill"
                      grayscale
                      className="bg-transparent	rounded-full shadow-md"
                    />
                  </div>
                  <h1 className="text-4xl font-base tracking-tight text-gray-900 sm:text-6xl uppercase mb-16 font-serif">
                    Lieber Matze
                  </h1>
                  <p className="mt-6 leading-8 text-gray-600">
                    Mit dir verlieren wir eine prägende Persönlichkeit der ersten Stunde.
                    Deine besondere Herzenswärme war für jeden spürbar, der dich umgab.
                    Danke für deinen Einsatz als Spieler, Trainer, Schiedsrichter,
                    Schiedsrichter-Obmann und Vereinsvorsitzenden.
                  </p>
                  <p className="mt-6 leading-8 text-gray-600">
                    Du fehlst, und wir wünschen deiner Familie, Freunden,
                    und dem Verein Red Devils Berlin viel Kraft und alles erdenklich Gute.
                  </p>
                  <p className="mt-6 leading-8 text-gray-600">
                    Wir trauern um einen großen Pionier des Sports
                  </p>
                  <p className="mt-16 sm:mt-32 leading-8 text-gray-600 text-left">
                    Traueranzeige für Matthias Pipke,<br />
                    Red Devils Berlin, im Namen der
                  </p>
                  <div className="mt-6 text-gray-600 text-left flex flex-col">
                    <div className="flex flex-row">
                    <div className="flex-shrink-0 w-16">BISHL</div>
                    <div className="flex-grow">Berliner Inline Skaterhockey Liga</div>
                    </div>
                    <div className="flex flex-row">
                    <div className="flex-shrink-0 w-16">ISHD</div>
                    <div className="flex-grow">Inline-Skaterhockey Deutschland</div>
                    </div>
                    <div className="flex flex-row">
                    <div className="flex-shrink-0 w-16">IRVB</div>
                    <div className="flex-grow">Inline- und Rollsport-Verband Berlin</div>
                    </div>
                    <div className="flex flex-row">
                    <div className="flex-shrink-0 w-16">DRIV</div>
                    <div className="flex-grow">Deutscher Rollsport- und Inline-Verband</div>
                    </div>
                  </div>
                  <div className="mt-32 flex items-center justify-center gap-x-6">
                    <div className="hover:cursor-pointer flex justify-center items-center">
                      <Image
                        src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo_mono.svg"
                        alt="BISHL"
                        width={96}
                        height={96}
                        layout="fixed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}