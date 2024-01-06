import { cn, constructMetadata } from '@/lib/utils'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NavBar from '@/components/NavBar'
import Providers from '@/components/Providers';
import "react-loading-skeleton/dist/skeleton.css";
import { Toaster } from '@/components/ui/toaster'
import 'simplebar-react/dist/simplebar.min.css'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = constructMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='light'>
      <Providers>
        <body className={cn(
          'min-h-screen font-sans antialiased grainy',
          inter.className
        )}>
          <Toaster></Toaster>
          <NavBar></NavBar>
          {children}
        </body>
      </Providers>
    </html>
  )
}
