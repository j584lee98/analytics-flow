'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';

interface FileData {
  id: string;
  filename: string;
  upload_date: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const router = useRouter();

  const fetchFiles = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch files');

      const data = await res.json();
      setFiles(data);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      setMessage('File uploaded successfully');
      setError('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchFiles();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setMessage('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Delete failed');

      setFiles(files.filter((f) => f.id !== id));
      setMessage('File deleted successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const startEditing = (file: FileData) => {
    setEditingFileId(file.id);
    setNewFilename(file.filename.replace(/\.csv$/, ''));
  };

  const cancelEditing = () => {
    setEditingFileId(null);
    setNewFilename('');
  };

  const handleRename = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const finalFilename = newFilename.endsWith('.csv') ? newFilename : `${newFilename}.csv`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename: finalFilename }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Rename failed');
      }

      setFiles(files.map((f) => (f.id === id ? data : f)));
      setEditingFileId(null);
      setMessage('File renamed successfully');
      setError('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen flex-col items-center justify-center p-24">Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Manage Datasets</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Dataset</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Choose CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={!selectedFile}
              className="self-start bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Upload
            </button>
          </form>
          {message && <p className="mt-4 text-green-600">{message}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Datasets</h2>
          {files.length === 0 ? (
            <p className="text-gray-500">No datasets uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {files.map((file) => (
                <li key={file.id} className="py-4 flex items-center justify-between">
                  {editingFileId === file.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex flex-1 items-center">
                        <input
                          type="text"
                          value={newFilename}
                          onChange={(e) => setNewFilename(e.target.value)}
                          className="border rounded-l px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="bg-gray-100 border border-l-0 rounded-r px-2 py-1 text-gray-500">.csv</span>
                      </div>
                      <button
                        onClick={() => handleRename(file.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.filename}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(file.upload_date).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  
                  {editingFileId !== file.id && (
                    <div className="flex gap-4 ml-4">
                      <Link
                        href={`/analytics/${file.id}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => startEditing(file)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
