'use client';
import { useEffect, useState, use } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function SessionDetail({ params }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/sessions/${resolvedParams.id}`)
            .then((res) => setEvents(res.data))
            .catch((err) => console.error(err));
    }, [resolvedParams.id]);

    return (
        <main className="p-8 max-w-4xl mx-auto">
            <Link href="/" className="text-gray-500 hover:text-gray-800 mb-6 inline-block">
                ← Back to Dashboard
            </Link>

            <h1 className="text-2xl font-bold mb-6">User Journey Timeline</h1>
            <p className="text-sm text-gray-500 mb-8">Session: {resolvedParams.id}</p>

            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                {events.map((event, index) => (
                    <div key={index} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white 
              ${event.event_type === 'click' ? 'bg-green-500' : 'bg-blue-500'}`}
                        />

                        <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide
                  ${event.event_type === 'click' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {event.event_type}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="mt-2 text-sm text-gray-700">
                                <span className="font-semibold">Page:</span> {event.url}
                            </div>

                            {event.event_type === 'click' && (
                                <div className="mt-1 text-xs text-gray-500 font-mono">
                                    Coordinates: x:{event.position_x}, y:{event.position_y}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}