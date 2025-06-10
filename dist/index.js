"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before any other imports
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Routes
app.use('/api/feedback', feedback_routes_1.default);
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Community Insights API' });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
