import { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { ThemeProvider } from '@/lib/ThemeContext';
// Add page imports here
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Home = lazy(() => import('@/pages/Home'));
const Train = lazy(() => import('@/pages/Train'));
const ExerciseLibrary = lazy(() => import('@/pages/ExerciseLibrary'));
const WorkoutLogger = lazy(() => import('@/pages/WorkoutLogger'));
const ProgramBuilder = lazy(() => import('@/pages/ProgramBuilder'));
const Programs = lazy(() => import('@/pages/Programs'));
const ProgramDetail = lazy(() => import('@/pages/ProgramDetail'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Nutrition = lazy(() => import('@/pages/Nutrition'));
const NutritionHistory = lazy(() => import('@/pages/NutritionHistory'));
const Cardio = lazy(() => import('@/pages/Cardio'));
const CardioSession = lazy(() => import('@/pages/CardioSession'));
const CardioHistory = lazy(() => import('@/pages/CardioHistory'));
const Progress = lazy(() => import('@/pages/Progress'));
const GoalJourney = lazy(() => import('@/pages/GoalJourney'));
const Coach = lazy(() => import('@/pages/Coach'));
const Profile = lazy(() => import('@/pages/Profile'));
const More = lazy(() => import('@/pages/More'));
const ShareProfile = lazy(() => import('@/pages/ShareProfile'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Habits = lazy(() => import('@/pages/Habits'));
const MonthlyReport = lazy(() => import('@/pages/MonthlyReport'));
const Search = lazy(() => import('@/pages/Search'));
const TrainHistoryPage = lazy(() => import('@/pages/TrainHistoryPage'));
const ExerciseHistory = lazy(() => import('@/pages/ExerciseHistory'));
const ExerciseDetail = lazy(() => import('@/pages/ExerciseDetail'));
const WeeklyPlan = lazy(() => import('@/pages/WeeklyPlan'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const HRZones = lazy(() => import('@/pages/HRZones'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Features = lazy(() => import('@/pages/Features'));
const Community = lazy(() => import('@/pages/Community'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const Messages = lazy(() => import('@/pages/Messages'));
const Chat = lazy(() => import('@/pages/Chat'));
const FollowList = lazy(() => import('@/pages/FollowList'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Widgets = lazy(() => import('@/pages/Widgets'));
const WidgetView = lazy(() => import('@/pages/WidgetView'));

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/train" element={<Train />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/workout/new" element={<WorkoutLogger />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/program/new" element={<ProgramBuilder />} />
            <Route path="/program/:id" element={<ProgramDetail />} />
            <Route path="/train-history" element={<TrainHistoryPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/history" element={<NutritionHistory />} />
            <Route path="/cardio" element={<Cardio />} />
            <Route path="/cardio/session" element={<CardioSession />} />
            <Route path="/cardio/history" element={<CardioHistory />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/goal-journey" element={<GoalJourney />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/more" element={<More />} />
            <Route path="/share" element={<ShareProfile />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/report" element={<MonthlyReport />} />
            <Route path="/search" element={<Search />} />
            <Route path="/exercise-history" element={<ExerciseHistory />} />
            <Route path="/exercise/:slug" element={<ExerciseDetail />} />
            <Route path="/plan" element={<WeeklyPlan />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/hr-zones" element={<HRZones />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/features" element={<Features />} />
            <Route path="/community" element={<Community />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Chat />} />
            <Route path="/social/:userId/:type" element={<FollowList />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/widgets" element={<Widgets />} />
          </Route>
          <Route path="/widget/:type" element={<WidgetView />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App