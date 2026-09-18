import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { CreatePollPage } from './pages/CreatePollPage';
import { PollViewPage } from './pages/PollViewPage';
import { PollListPage } from './pages/PollListPage';
import { ShieldCheck, Zap } from 'lucide-react';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Navbar */}
        <Navbar />

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<PollListPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/create" element={<CreatePollPage />} />
            <Route path="/poll/:id" element={<PollViewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-300">HCL Real-Time Polling Engine</span>
              <span>•</span>
              <span>Go (Gin) + Redis (INCR & Pub/Sub) + MongoDB + React</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>FingerprintJS & IP Lock</span>
              </span>
              <span className="flex items-center space-x-1 text-cyan-400 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>Sub-Millisecond Engine</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
