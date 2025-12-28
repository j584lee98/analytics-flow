import Link from 'next/link';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">AnalyticsFlow</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-4">
          <li>
            <Link href="/" className="block rounded-md px-4 py-2 hover:bg-gray-800">
              Dashboard
            </Link>
          </li>
          <li>
            <span className="block rounded-md px-4 py-2 text-gray-500 cursor-not-allowed">
              Datasets
            </span>
          </li>
          <li>
            <span className="block rounded-md px-4 py-2 text-gray-500 cursor-not-allowed">
              Analytics
            </span>
          </li>
        </ul>
      </nav>
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={onLogout}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
