'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';

interface FileData {
  id: string;
  filename: string;
  upload_date: string;
}

interface ColumnStats {
  name: string;
  type: string;
  stats: Record<string, number | string | null>;
}

interface AnalyticsData {
  filename: string;
  columns: ColumnStats[];
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const [file, setFile] = useState<FileData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const fileId = resolvedParams.id;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch file details
        const fileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (fileRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (!fileRes.ok) throw new Error('Failed to fetch file details');
        const fileData = await fileRes.json();
        setFile(fileData);

        // Fetch analytics
        const analyticsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
          
          // Set default selected type
          const types = Array.from(new Set(analyticsData.columns.map((c: ColumnStats) => c.type)));
          if (types.length > 0) {
            setSelectedType(types[0] as string);
          }
        }

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fileId, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-24">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.push('/upload')} className="text-blue-500 underline">
          Back to Datasets
        </button>
      </div>
    );
  }

  const uniqueTypes = analytics ? Array.from(new Set(analytics.columns.map(c => c.type))) : [];
  const filteredColumns = analytics ? analytics.columns.filter(c => c.type === selectedType) : [];

  // Get all unique stat keys for the current type to build table headers
  const statKeys = filteredColumns.length > 0 
    ? Array.from(new Set(filteredColumns.flatMap(c => Object.keys(c.stats))))
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <button 
            onClick={() => router.push('/upload')} 
            className="text-blue-600 hover:underline mb-2 inline-block hover:cursor-pointer"
          >
            &larr; Back to Datasets
          </button>
          <h1 className="text-3xl font-bold">Analytics for {file?.filename}</h1>
        </div>
        
        {analytics && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Column Statistics</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="type-select" className="text-sm font-medium text-gray-700">Filter by Type:</label>
                <select
                  id="type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Column Name
                    </th>
                    {statKeys.map(key => (
                      <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColumns.map((col) => (
                    <tr key={col.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {col.name}
                      </td>
                      {statKeys.map(key => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {col.stats[key] !== null && col.stats[key] !== undefined ? String(col.stats[key]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
