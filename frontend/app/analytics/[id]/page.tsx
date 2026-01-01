'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';

interface FileData {
  id: string;
  filename: string;
  upload_date: string;
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const [file, setFile] = useState<FileData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const fileId = resolvedParams.id;

  useEffect(() => {
    const fetchFile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch file details');

        const data = await res.json();
        setFile(data);
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

    fetchFile();
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
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">
            Analytics content for <strong>{file?.filename}</strong> will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
