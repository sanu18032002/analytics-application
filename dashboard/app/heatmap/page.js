'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function Heatmap() {
    const [urlInput, setUrlInput] = useState('');
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const CONTAINER_WIDTH = 1280;
    const docW = points.length ? Math.max(...points.map(p => p.doc_w || 0), 0) : 0;
    const docH = points.length ? Math.max(...points.map(p => p.doc_h || 0), 0) : 0;
    const scale = docW ? (CONTAINER_WIDTH / docW) : 1;
    const containerHeight = docH ? Math.max(600, Math.round(docH * scale)) : 2000;

    const fetchHeatmap = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsLoaded(false);
        try {
            const encodedUrl = encodeURIComponent(urlInput);
            const res = await axios.get(`${API_BASE_URL}/api/events/heatmap?url=${encodedUrl}`);
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
                        style={{ width: `${CONTAINER_WIDTH}px`, height: `${containerHeight}px` }}
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
                            (() => {
                                const left = (typeof pt.rel_x === 'number' && isFinite(pt.rel_x))
                                    ? pt.rel_x * CONTAINER_WIDTH
                                    : (typeof pt.position_x === 'number' ? pt.position_x * scale : 0);
                                const top = (typeof pt.rel_y === 'number' && isFinite(pt.rel_y))
                                    ? pt.rel_y * containerHeight
                                    : (typeof pt.position_y === 'number' ? pt.position_y * scale : 0);
                                return (
                            <div
                                key={i}
                                className="absolute rounded-full border border-white/20"
                                style={{
                                    left: `${left}px`,
                                    top: `${top}px`,
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: 'rgba(255, 0, 0, 0.6)', // Semi-transparent red
                                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.8)', // Glow effect
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 50
                                }}
                                title={
                                    typeof pt.rel_x === 'number' && typeof pt.rel_y === 'number'
                                        ? `rel_x: ${pt.rel_x.toFixed(3)}, rel_y: ${pt.rel_y.toFixed(3)}`
                                        : `x: ${pt.position_x}, y: ${pt.position_y}`
                                }
                            />
                                );
                            })()
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}