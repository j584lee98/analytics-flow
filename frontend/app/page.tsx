'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setMessage(data.message);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-24">Loading...</div>;
  }

  if (!message) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center p-24">
         <p className="mb-4">Error loading page.</p>
         <button onClick={() => router.push('/login')} className="text-blue-500 underline">Go to Login</button>
       </div>
     );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to AnalyticsFlow</h1>
        <p className="text-lg mb-8 text-gray-700">
          Your AI-powered platform for dataset analysis and insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">AI Analytics</h2>
            <p className="text-gray-600">
              Automatically generate comprehensive analytics pages for your uploaded datasets.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Dataset Chatbot</h2>
            <p className="text-gray-600">
              Ask questions about your data and get instant answers from our intelligent chatbot.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <p className="text-gray-600 mb-4">
            Upload your dataset to begin analyzing your data.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload Dataset
          </Link>
        </div>
      </main>
    </div>
  );
}
