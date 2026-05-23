import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Video, Image as ImageIcon } from "lucide-react";
import { AdminTabId, SiteContent } from "../types";
import AdminMediaPanel, { AdminLangToggle } from "./AdminMediaPanel";

interface AdminPortalProps {
  siteContent: SiteContent;
  initialTab?: AdminTabId;
  onInitialTabConsumed?: () => void;
  onRefreshSiteContent: () => void;
  onExitToStudent: () => void;
}

export default function AdminPortal({
  siteContent,
  initialTab,
  onInitialTabConsumed,
  onRefreshSiteContent,
  onExitToStudent,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab || "videos");
  const [adminLang, setAdminLang] = useState<"ru" | "en">("ru");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      onInitialTabConsumed?.();
    }
  }, [initialTab, onInitialTabConsumed]);

  return (
    <div className="space-y-6 animate-fade-in p-1 text-isa-navy">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-isa-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            {adminLang === "ru" ? "Панель администратора" : "Admin panel"}
          </h1>
          <p className="text-xs text-isa-muted">
            {adminLang === "ru"
              ? "Видеоуроки и события для студентов."
              : "Video lessons and campus events."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminLangToggle lang={adminLang} onChange={setAdminLang} />
          <button
            type="button"
            onClick={onExitToStudent}
            className="text-xs font-bold text-isa-muted hover:text-isa-navy px-3 py-1.5 border border-isa-border rounded-lg cursor-pointer"
          >
            ← {adminLang === "ru" ? "К студентам" : "To students"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-isa-gold-pale p-1 rounded-2xl border border-isa-gold/30">
        <button
          type="button"
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "videos"
              ? "bg-white text-isa-navy shadow-sm"
              : "text-isa-muted hover:text-isa-navy"
          }`}
        >
          <Video className="w-4 h-4" />
          {adminLang === "ru" ? "Видео" : "Videos"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "events"
              ? "bg-white text-isa-navy shadow-sm"
              : "text-isa-muted hover:text-isa-navy"
          }`}
        >
          <ImageIcon className="w-4 h-4 text-isa-gold" />
          {adminLang === "ru" ? "События" : "Events"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <AdminMediaPanel
            activeSection={activeTab}
            lang={adminLang}
            siteContent={siteContent}
            onRefreshSiteContent={onRefreshSiteContent}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
