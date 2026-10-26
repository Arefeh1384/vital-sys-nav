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
import { X, Info, Bot } from 'lucide-react';
import {useShellLanguage} from './components/useShellLanguage';

const AppShell: React.FC = () => {
  const { user, notificationMessage, clearNotification, workView, openWorkView } = useApp();
  const [lang] = useShellLanguage();
  useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';},[lang]);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased" dir={lang==='en'?'ltr':'rtl'}>
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

      {/* Always-visible Copilot entry: opens the chat page from anywhere */}
      {workView?.kind !== 'copilot' && (
        <button
          type="button"
          data-testid="copilot-fab"
          onClick={() => openWorkView({ kind: 'copilot' })}
          aria-label="باز کردن کوپایلت"
          title="کوپایلت؛ پرسش از شواهد"
          className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bot className="w-5 h-5" aria-hidden />
          <span>{lang==='en'?'Copilot':'کوپایلت'}</span>
        </button>
      )}

      {/* Main Top Header */}
      <Header />

      {lang==='en' && <p role="status" className="border-b bg-amber-50 px-4 py-1 text-xs text-amber-900">English LTR shell enabled. Some domain-specific content is not translated yet; this is a localization preview, not completed English acceptance.</p>}
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
