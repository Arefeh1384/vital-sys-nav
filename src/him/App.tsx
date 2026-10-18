/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp, type WorkView } from './context/AppContext';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ScopeModal } from './components/ScopeModal';
import { X, Info } from 'lucide-react';

const AppShell: React.FC = () => {
  const { user, notificationMessage, clearNotification } = useApp();

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notificationMessage, clearNotification]);

  // If not logged in, render the Login View
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased" dir="rtl">
      {/* Toast Notification Bar */}
      {notificationMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{notificationMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearNotification}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <Header />

      {/* Shell Layout: Sidebar + Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative min-w-0 w-full">
        <Sidebar />
        <MainContent />
      </div>

      {/* Interactive Scope Selection Modal */}
      <ScopeModal />
    </div>
  );
};

export default function App({ initialWorkView = null }: { initialWorkView?: WorkView | null }) {
  return (
    <AppProvider initialWorkView={initialWorkView}>
      <AppShell />
    </AppProvider>
  );
}
