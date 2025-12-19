/**
 * Causal Funnel - User Analytics Tracker
 * Requirement: Track page_view and click events with session persistence.
 */

(function () {
    // Configuration
    // Prefer host-provided config so this script can run in any environment without rebuilds.
    // The host page may set: window.__ANALYTICS_API_BASE_URL__ = 'https://api.example.com'
    // Or: window.__ANALYTICS_API_ENDPOINT__ = 'https://api.example.com/api/events'
    const API_BASE_URL = (typeof window !== 'undefined' && window.__ANALYTICS_API_BASE_URL__) || null;
    const API_ENDPOINT =
        (typeof window !== 'undefined' && window.__ANALYTICS_API_ENDPOINT__) ||
        (API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api/events` : 'http://localhost:5000/api/events');
    const SESSION_KEY = 'analytics_session_id';

    // 1. Session Management 
    function getSessionId() {
        let sessionId = localStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            // Generate a simple UUID-like string if none exists
            sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    const sessionId = getSessionId();

    // 2. Helper to send data to the backend
    function sendEvent(eventType, extraData = {}) {
        const payload = {
            session_id: sessionId,
            event_type: eventType,      
            url: window.location.href,  
            timestamp: new Date().toISOString(), // 
            ...extraData
        };

        // Use fetch with keepalive to ensure request completes even if page unloads
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(err => console.error("Tracking Error:", err));
    }

    // 3. Track Page Views 
    // Triggered immediately when the script loads
    sendEvent('page_view');

    // 4. Track Clicks 
    window.addEventListener('click', (event) => {
        const docEl = document.documentElement;
        const docW = Math.max(docEl.scrollWidth, docEl.clientWidth, window.innerWidth || 0);
        const docH = Math.max(docEl.scrollHeight, docEl.clientHeight, window.innerHeight || 0);
        const pageX = event.pageX;
        const pageY = event.pageY;

        const clickData = {
            // Absolute document coordinates (useful when replaying against a known document size)
            position_x: pageX,
            position_y: pageY,

            // Normalized coordinates (stable across viewport sizes)
            rel_x: docW ? pageX / docW : null,
            rel_y: docH ? pageY / docH : null,

            // Capture environment to help render heatmaps correctly
            doc_w: docW,
            doc_h: docH,
            viewport_w: window.innerWidth,
            viewport_h: window.innerHeight,
            scroll_x: window.scrollX,
            scroll_y: window.scrollY,
            device_pixel_ratio: window.devicePixelRatio || 1,
        };
        sendEvent('click', clickData);
    });

    console.log(`Tracker initialized. Session ID: ${sessionId}`);

})();