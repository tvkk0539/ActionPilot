import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import repoRoutes from './routes/repoRoutes';
import workflowRoutes from './routes/workflowRoutes';
import accountRoutes from './routes/accountRoutes';
import { authGuard } from './middleware/authGuard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/views')); // Adjusted for dist/ structure vs src/
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
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
app.use('/', authRoutes);

// Protected API Routes
app.use('/repos', authGuard, repoRoutes);
// Note: workflow routes are nested in repo routes in the REST API,
// but here we might want to mount them separately or handle them within repoRoutes?
// My plan had `src/routes/workflowRoutes.ts` with `/repos/:owner/:repo/workflows` etc.
// But `repoRoutes` mounts at `/repos`.
// If I mount `repoRoutes` at `/repos`, it handles `/repos/:owner/:repo`.
// I should probably merge them or mount `workflowRoutes` at `/repos` as well?
// Express allows multiple routers on same path.
app.use('/repos', authGuard, workflowRoutes); // This will match /repos/:owner/:repo/workflows...

app.use('/accounts', authGuard, accountRoutes);

// Protected UI Routes
app.get('/dashboard', authGuard, (req, res) => {
  res.render('dashboard', { user: req.session!.user });
});

app.get('/repo/:owner/:repo', authGuard, (req, res) => {
  res.render('repo-detail', {
    user: req.session!.user,
    owner: req.params.owner,
    repo: req.params.repo
  });
});

app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
