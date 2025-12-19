const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// 1. Middleware
app.use(cors()); 
app.use(bodyParser.json());

// 2. Database Connection (MongoDB)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/user_analytics';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 3. Schema & Model
const eventSchema = new mongoose.Schema({
    session_id: { type: String, required: true, index: true }, // [cite: 14]
    event_type: { type: String, required: true }, // 'page_view' or 'click' [cite: 15]
    url: { type: String, required: true }, // [cite: 16]
    timestamp: { type: Date, default: Date.now }, // [cite: 17]
    position_x: { type: Number }, // [cite: 18]
    position_y: { type: Number }, // [cite: 18]
});

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
            { $sort: { startTime: -1 } } // Show newest sessions first
        ]);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Fetch all events for a specific session [cite: 26]
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const events = await Event.find({ session_id: req.params.sessionId })
            .sort({ timestamp: 1 }); // Chronological order
        res.json(events);
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
        }).select('position_x position_y -_id'); // Return only coordinates

        res.json(clicks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});