import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ExamEditor from './components/ExamEditor';

export default function App() {
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('mestreprovas_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mestreprovas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mestreprovas_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {currentExamId ? (
        <ExamEditor 
          examId={currentExamId} 
          onBack={() => setCurrentExamId(null)} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Dashboard 
          onOpenExam={setCurrentExamId} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}
