const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// 1. Middleware
const corsAllowlist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header) like curl/health checks.
        if (!origin) return callback(null, true);
        // If allowlist not configured, default to deny-by-default for safety.
        if (corsAllowlist.length === 0) return callback(new Error('CORS blocked: no allowlist configured'));
        if (corsAllowlist.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '64kb' }));

// 2. Database Connection (MongoDB)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/user_analytics';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Healthcheck (used by Docker Compose)
app.get('/health', (req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    res.status(mongoReady ? 200 : 503).json({ ok: mongoReady });
});

// 3. Schema & Model
const eventSchema = new mongoose.Schema({
    session_id: { type: String, required: true, index: true }, // [cite: 14]
    event_type: { type: String, required: true }, // 'page_view' or 'click' [cite: 15]
    url: { type: String, required: true }, // [cite: 16]
    timestamp: { type: Date, default: Date.now }, // [cite: 17]
    position_x: { type: Number }, // [cite: 18]
    position_y: { type: Number }, // [cite: 18]
    // Normalized + environment fields for better heatmap replay
    rel_x: { type: Number },
    rel_y: { type: Number },
    doc_w: { type: Number },
    doc_h: { type: Number },
    viewport_w: { type: Number },
    viewport_h: { type: Number },
    scroll_x: { type: Number },
    scroll_y: { type: Number },
    device_pixel_ratio: { type: Number },
});

// Query/index helpers
eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ url: 1, event_type: 1, timestamp: -1 });
eventSchema.index({ url: 1, event_type: 1 });

// Retention policy (TTL) - defaults to 30 days
const ttlSeconds = Number(process.env.EVENT_TTL_SECONDS) || 60 * 60 * 24 * 30;
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlSeconds });

const Event = mongoose.model('Event', eventSchema);

// 4. Routes

// --- Ingestion Endpoint (Used by Tracker) ---
app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        console.log(`[Event Saved] ${req.body.event_type} from ${req.body.session_id}`);
        res.status(201).send({ message: 'Event tracked successfully' });
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).send({ error: 'Failed to save event' });
    }
});

// --- Dashboard Endpoints (Used by Frontend) ---

// 1. Fetch list of sessions with event counts [cite: 25]
app.get('/api/sessions', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
        const skip = Math.max(parseInt(req.query.skip || '0', 10), 0);

        // Aggregate to group by session_id
        const sessions = await Event.aggregate([
            {
                $group: {
                    _id: "$session_id",
                    startTime: { $min: "$timestamp" },
                    endTime: { $max: "$timestamp" },
                    eventCount: { $sum: 1 }
                }
            },
            { $sort: { startTime: -1 } }, // Show newest sessions first
            { $skip: skip },
            { $limit: limit + 1 }, // lookahead for hasMore
        ]);

        const hasMore = sessions.length > limit;
        const data = hasMore ? sessions.slice(0, limit) : sessions;
        res.json({ data, page: Math.floor(skip / limit) + 1, limit, skip, hasMore });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Fetch all events for a specific session [cite: 26]
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit || '500', 10), 1), 5000);
        const skip = Math.max(parseInt(req.query.skip || '0', 10), 0);

        const events = await Event.find({ session_id: req.params.sessionId })
            .sort({ timestamp: 1 }) // Chronological order
            .skip(skip)
            .limit(limit + 1);

        const hasMore = events.length > limit;
        const data = hasMore ? events.slice(0, limit) : events;
        res.json({ data, limit, skip, hasMore });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Fetch click data for a specific page (Heatmap) [cite: 28]
app.get('/api/events/heatmap', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "URL parameter required" });

        // Only fetch clicks for this URL
        const clicks = await Event.find({
            url: decodeURIComponent(url),
            event_type: 'click'
        }).select('position_x position_y rel_x rel_y doc_w doc_h viewport_w viewport_h scroll_x scroll_y device_pixel_ratio -_id'); // Return heatmap fields

        res.json(clicks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Friendly errors (e.g., CORS rejections)
app.use((err, req, res, next) => {
    if (err && typeof err.message === 'string' && err.message.startsWith('CORS blocked')) {
        return res.status(403).json({ error: err.message });
    }
    return next(err);
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});