'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/sessions')
      .then((res) => setSessions(res.data))
      .catch((err) => console.error("API Error:", err));
  }, []);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <Link href="/heatmap" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          View Heatmaps →
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 border-b font-semibold text-gray-600">Session ID</th>
              <th className="p-4 border-b font-semibold text-gray-600">Start Time</th>
              <th className="p-4 border-b font-semibold text-gray-600">Events</th>
              <th className="p-4 border-b font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id} className="hover:bg-gray-50 transition">
                <td className="p-4 border-b text-sm font-mono text-blue-600">
                  {session._id.substring(0, 18)}...
                </td>
                <td className="p-4 border-b text-gray-700">
                  {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                </td>
                <td className="p-4 border-b font-medium">{session.eventCount}</td>
                <td className="p-4 border-b">
                  <Link
                    href={`/sessions/${session._id}`}
                    className="text-indigo-600 hover:underline text-sm font-semibold"
                  >
                    View Journey
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No sessions found. Try clicking around on your tracker test page!
          </div>
        )}
      </div>
    </main>
  );
}