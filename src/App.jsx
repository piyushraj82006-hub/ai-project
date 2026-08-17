import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';
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

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/pdf" element={<PDFApp />} />
        <Route path="/summarize" element={<TextSummarizer />} />
        <Route path="/tools/quiz" element={<QuizPage />} />
        <Route path="/tools/flashcards" element={<FlashcardsPage />} />
        <Route path="/tools/youtube" element={<YouTubePage />} />
        <Route path="/tools/pomodoro" element={<PomodoroPage />} />
        <Route path="/course/:courseCode" element={
          <ProtectedRoute><CourseDetail /></ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute><AcademicCalendar /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
