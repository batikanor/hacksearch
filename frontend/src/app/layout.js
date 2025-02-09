import localFont from 'next/font/local';
import './globals.css';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'Hackathon winner project',
  description: 'With this project, we will win the hackathon.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        {/* Header */}

        <div > {/* Adjust the top margin */}

          {/* Main Content */}
          {/* <main className="flex-1 p-6 sm:p-12 bg-white dark:bg-gray-800"
                        style={{ 
                          // backgroundImage: "url('/night-sky.png')",
                          // backgroundSize: "150%", // Increase or decrease to rescale
                          // backgroundPosition: "center"
                        }}> */}
            {children}
          {/* </main> */}


        </div>

        {/* Footer */}
        {/* <footer className="bg-white dark:bg-gray-800 shadow">
          <Footer />
        </footer> */}
        <br/>
      </body>
    </html>
  );
}