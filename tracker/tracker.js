/**
 * Causal Funnel - User Analytics Tracker
 * Requirement: Track page_view and click events with session persistence.
 */

(function () {
    // Configuration
    const API_ENDPOINT = 'http://localhost:5000/api/events';
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
        const clickData = {
            position_x: event.pageX, 
            position_y: event.pageY  
        };
        sendEvent('click', clickData);
    });

    console.log(`Tracker initialized. Session ID: ${sessionId}`);

})();