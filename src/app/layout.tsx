import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'NewsWright Investor Package',
  description: 'Interactive investor package explorer and editor',
};

function Nav() {
  return (
    <nav className="bg-nw-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">NEWSWRIGHT</span>
            <span className="text-xs text-blue-300 border border-blue-400 rounded px-1.5 py-0.5">
              INVESTOR
            </span>
          </Link>
          <div className="flex items-center space-x-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/explorer">Explorer</NavLink>
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/timeline">Timeline</NavLink>
            <span className="mx-2 h-5 w-px bg-blue-400/30" />
            <NavLink href="/edit" accent>
              Partner Mode
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        accent
          ? 'bg-blue-600 hover:bg-blue-500 text-white'
          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
