"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const repoRoutes_1 = __importDefault(require("./routes/repoRoutes"));
const workflowRoutes_1 = __importDefault(require("./routes/workflowRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const authGuard_1 = require("./middleware/authGuard");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../src/views')); // Adjusted for dist/ structure vs src/
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true on HTTPS/Cloud Run
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Routes
// Public
app.use('/', authRoutes_1.default);
// Protected API Routes
app.use('/repos', authGuard_1.authGuard, repoRoutes_1.default);
// Note: workflow routes are nested in repo routes in the REST API,
// but here we might want to mount them separately or handle them within repoRoutes?
// My plan had `src/routes/workflowRoutes.ts` with `/repos/:owner/:repo/workflows` etc.
// But `repoRoutes` mounts at `/repos`.
// If I mount `repoRoutes` at `/repos`, it handles `/repos/:owner/:repo`.
// I should probably merge them or mount `workflowRoutes` at `/repos` as well?
// Express allows multiple routers on same path.
app.use('/repos', authGuard_1.authGuard, workflowRoutes_1.default); // This will match /repos/:owner/:repo/workflows...
app.use('/accounts', authGuard_1.authGuard, accountRoutes_1.default);
// Protected UI Routes
app.get('/dashboard', authGuard_1.authGuard, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});
app.get('/repo/:owner/:repo', authGuard_1.authGuard, (req, res) => {
    res.render('repo-detail', {
        user: req.session.user,
        owner: req.params.owner,
        repo: req.params.repo
    });
});
app.get('/healthz', (req, res) => res.status(200).send('OK'));
// Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
