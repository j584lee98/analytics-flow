'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');
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
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data.message);
        setUser(data.user);
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
        <h1 className="text-4xl font-bold mb-8">Home Page</h1>
        <p className="text-xl mb-4">{message}</p>
        <p className="text-lg mb-8">Logged in as: {user}</p>
      </main>
    </div>
  );
}
