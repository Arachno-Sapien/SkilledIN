import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ConversationProvider } from "@elevenlabs/react";
import { LanguageProvider, useLanguage } from "./i18n";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { WorkerOnboard } from "./pages/WorkerOnboard";
import { WorkerHome } from "./pages/WorkerHome";
import { Challenge } from "./pages/Challenge";
import { Passport } from "./pages/Passport";
import { Hire } from "./pages/Hire";
import { RateWorker } from "./pages/RateWorker";
import { JobStatus } from "./components/JobStatus";

const JobStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  useEffect(() => {
    document.title = `${t("jobPageTitle")} · SkilledIN`;
  }, [lang]); // t() only changes when lang does
  if (!id) return null;
  return (
    <div className="max-w-md mx-auto p-4 py-8">
      <JobStatus jobId={id} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ConversationProvider>
      <LanguageProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-brand-500 selection:text-white">
            <Navbar />
            <main className="flex-1 pb-8">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/w/start" element={<WorkerOnboard />} />
                <Route path="/w/:id" element={<WorkerHome />} />
                <Route path="/w/:id/challenge/:skillId" element={<Challenge />} />
                <Route path="/p/:id" element={<Passport />} />
                <Route path="/hire" element={<Hire />} />
                <Route path="/jobs/:id" element={<JobStatusPage />} />
                <Route path="/rate/:id" element={<RateWorker />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </ConversationProvider>
  );
};

export default App;
