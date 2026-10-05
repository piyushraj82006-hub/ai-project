import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import PDFApp from './components/PDFApp';
import TextSummarizer from './components/TextSummarizer';
import CourseDetail from './components/CourseDetail';
import AcademicCalendar from './components/AcademicCalendar';
import QuizPage from './pages/QuizPage';
import FlashcardsPage from './pages/FlashcardsPage';
import YouTubePage from './pages/YouTubePage';
import PomodoroPage from './pages/PomodoroPage';
import { ToastContainer } from './components/Toast';
import AIMentor from './components/AIMentor';

export default function App() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <ToastContainer />
      <ThemeToggle />
      <AIMentor />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            <PageTransition><LoginPage /></PageTransition>
          } />
          <Route path="/signup" element={
            <PageTransition><SignupPage /></PageTransition>
          } />
          <Route path="/" element={
            <PageTransition><Dashboard /></PageTransition>
          } />
          <Route path="/pdf" element={
            <PageTransition><PDFApp /></PageTransition>
          } />
          <Route path="/summarize" element={
            <PageTransition><TextSummarizer /></PageTransition>
          } />
          <Route path="/tools/quiz" element={
            <PageTransition><QuizPage /></PageTransition>
          } />
          <Route path="/tools/flashcards" element={
            <PageTransition><FlashcardsPage /></PageTransition>
          } />
          <Route path="/tools/youtube" element={
            <PageTransition><YouTubePage /></PageTransition>
          } />
          <Route path="/tools/pomodoro" element={
            <PageTransition><PomodoroPage /></PageTransition>
          } />
          <Route path="/course/:courseCode" element={
            <ProtectedRoute>
              <PageTransition><CourseDetail /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <PageTransition><AcademicCalendar /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}
