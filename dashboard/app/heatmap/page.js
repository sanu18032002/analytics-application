'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Heatmap() {
    const [urlInput, setUrlInput] = useState('');
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const fetchHeatmap = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsLoaded(false);
        try {
            const encodedUrl = encodeURIComponent(urlInput);
            const res = await axios.get(`http://localhost:5000/api/events/heatmap?url=${encodedUrl}`);
            setPoints(res.data);
            setIsLoaded(true);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch data');
        }
        setLoading(false);
    };

    return (
        <main className="h-screen flex flex-col bg-gray-100">
            {/* Top Bar */}
            <div className="p-4 bg-white shadow-sm z-10 flex justify-between items-center">
                <div className="flex items-center gap-4 w-full max-w-4xl">
                    <Link href="/" className="text-gray-500 hover:text-gray-800 font-medium">
                        ← Dashboard
                    </Link>
                    <input
                        type="text"
                        placeholder="Enter URL (e.g., http://localhost:8080/test.html)"
                        className="border p-2 rounded flex-grow text-black"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button
                        onClick={fetchHeatmap}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
                    >
                        {loading ? 'Loading...' : 'Visualize'}
                    </button>
                </div>
            </div>

            {/* Heatmap Viewer Area */}
            <div className="flex-grow overflow-auto relative bg-gray-200">

                {!isLoaded && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Enter a URL above to load the website and overlay click data.</p>
                    </div>
                )}

                {isLoaded && (
                    // We create a container that mimics a desktop viewport width
                    // We force height to be large so the iframe doesn't scroll internally, 
                    // but the DIV scrolls, keeping dots and iframe synced.
                    <div
                        className="relative mx-auto bg-white shadow-xl"
                        style={{ width: '1280px', height: '2000px' }}
                    >
                        {/* Layer 1: The Website (Iframe) */}
                        <iframe
                            src={urlInput}
                            title="Target Website"
                            className="w-full h-full border-none"
                            style={{ pointerEvents: 'none' }} // Disables clicking on the iframe so we can see dots clearly
                        />

                        {/* Layer 2: The Heatmap Dots */}
                        {points.map((pt, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-white/20"
                                style={{
                                    left: `${pt.position_x}px`,
                                    top: `${pt.position_y}px`,
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: 'rgba(255, 0, 0, 0.6)', // Semi-transparent red
                                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.8)', // Glow effect
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 50
                                }}
                                title={`x: ${pt.position_x}, y: ${pt.position_y}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}