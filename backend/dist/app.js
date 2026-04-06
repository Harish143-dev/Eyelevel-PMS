"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
dotenv_1.default.config();
const socket_1 = require("./config/socket");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const todo_routes_1 = __importDefault(require("./routes/todo.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const time_routes_1 = __importDefault(require("./routes/time.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const milestone_routes_1 = __importDefault(require("./routes/milestone.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const leave_routes_1 = __importDefault(require("./routes/leave.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const payroll_routes_1 = __importDefault(require("./routes/payroll.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const activityTracking_routes_1 = __importDefault(require("./routes/activityTracking.routes"));
const onboarding_routes_1 = __importDefault(require("./routes/onboarding.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const monitoring_routes_1 = __importDefault(require("./routes/monitoring.routes"));
const workflow_routes_1 = __importDefault(require("./routes/workflow.routes"));
const customField_routes_1 = __importDefault(require("./routes/customField.routes"));
const cron_service_1 = require("./services/cron.service");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialize Socket.io
(0, socket_1.initSocket)(server);
// Security Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
        },
    } : false, // Disabled in development for hot-reload compatibility
}));
app.use((0, morgan_1.default)('short'));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Global rate limiting for mutation requests (POST/PUT/DELETE)
app.use('/api', rateLimit_middleware_1.mutationLimiter);
// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
// app.use('/uploads', express.static(path.resolve(uploadDir)));
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', rateLimit_middleware_1.authLimiter, auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api', task_routes_1.default); // task routes have both /projects/:id/tasks and /tasks/:id
app.use('/api', comment_routes_1.default);
// app.use('/api', attachmentRoutes);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/todos', todo_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/time', time_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/projects/:projectId/milestones', milestone_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/leaves', leave_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api', document_routes_1.default); // handles /api/projects/:id/documents and /api/documents/:id
app.use('/api/clients', client_routes_1.default);
app.use('/api/payroll', payroll_routes_1.default);
app.use('/api/performance', performance_routes_1.default);
app.use('/api/session', session_routes_1.default);
app.use('/api/activity-tracking', activityTracking_routes_1.default);
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
// Start app routes definitions here...
app.use('/api/onboarding', onboarding_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/roles', role_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/monitoring', monitoring_routes_1.default);
app.use('/api/workflow', workflow_routes_1.default);
app.use('/api/custom-fields', customField_routes_1.default);
// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});
const PORT = parseInt(process.env.PORT || '5000', 10);
// Start background jobs
(0, cron_service_1.initCronJobs)();
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map