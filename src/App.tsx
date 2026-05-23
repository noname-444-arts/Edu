import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import StudentPortal from "./components/StudentPortal";
import AdminPortal from "./components/AdminPortal";
import { Course, FeedbackLog, StudentStats, AdminStats, SiteContent, AdminTabId } from "./types";

const emptySiteContent: SiteContent = { videos: [], events: [] };

export default function App() {
  const [activeView, setActiveView] = useState<"student" | "admin">("student");
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTabId | undefined>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackLog[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(emptySiteContent);
  const [stats, setStats] = useState<AdminStats>({
    coursesCount: 0,
    aiGenerationsCount: 0,
    quizzesTakenCount: 0,
    averageQuizScorePct: 0,
    feedbacksCount: 0,
  });

  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const [studentStats, setStudentStats] = useState<StudentStats>(() => {
    const saved = localStorage.getItem("eduhub_student_stats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    return {
      completedLessons: [],
      gradedQuizzes: {},
      aiChatMessagesCount: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem("eduhub_student_stats", JSON.stringify(studentStats));
  }, [studentStats]);

  const fetchSiteContent = useCallback(async () => {
    try {
      const resp = await fetch("/api/site/content");
      if (resp.ok) setSiteContent(await resp.json());
    } catch (e) {
      console.error("Failed to load site content:", e);
    }
  }, []);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const resp = await fetch("/api/courses");
      if (resp.ok) setCourses(await resp.json());
    } catch (e) {
      console.error("Failed to load courses:", e);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const resp = await fetch("/api/feedback");
      if (resp.ok) setFeedbacks(await resp.json());
    } catch (e) {
      console.error("Failed to load feedbacks:", e);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const resp = await fetch("/api/stats");
      if (resp.ok) setStats(await resp.json());
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRefreshAll = () => {
    fetchCourses();
    fetchStats();
    fetchFeedbacks();
    fetchSiteContent();
  };

  useEffect(() => {
    handleRefreshAll();
  }, []);

  const openAdmin = (tab: AdminTabId = "videos") => {
    setAdminInitialTab(tab);
    setActiveView("admin");
  };

  const updateStudentStats = (changes: Partial<StudentStats>) => {
    setStudentStats((prev) => ({ ...prev, ...changes }));
  };

  return (
    <div className="min-h-screen flex flex-col text-isa-text">
      {activeView === "admin" && (
        <header className="isa-school-header sticky top-0 z-50">
          <div className="isa-school-header__gold-rule" />
          <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="isa-school-title truncate">International School</p>
              <p className="isa-school-subtitle truncate">Administration</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView("student")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-isa-gold/40 text-isa-gold-light text-[10px] font-bold cursor-pointer transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Portal
              </button>
              <button
                type="button"
                onClick={handleRefreshAll}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 cursor-pointer transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCourses ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow w-full max-w-lg mx-auto px-4 py-3 pb-8">
        {loadingCourses && courses.length === 0 ? (
          <div className="min-h-[400px] flex flex-col justify-center items-center space-y-4">
            <div className="w-12 h-12 border-4 border-isa-cream-dark border-t-isa-gold rounded-full animate-spin" />
            <p className="text-sm text-isa-muted font-medium">Loading campus data…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeView === "student" ? (
              <motion.div
                key="student-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <StudentPortal
                  courses={courses}
                  studentStats={studentStats}
                  updateStats={updateStudentStats}
                  onRefreshCourses={handleRefreshAll}
                  siteContent={siteContent}
                  onOpenAdmin={() => openAdmin("videos")}
                  onRefresh={handleRefreshAll}
                  isRefreshing={loadingCourses}
                />
              </motion.div>
            ) : (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="isa-card p-4 sm:p-6"
              >
                <AdminPortal
                  siteContent={siteContent}
                  initialTab={adminInitialTab}
                  onInitialTabConsumed={() => setAdminInitialTab(undefined)}
                  onRefreshSiteContent={fetchSiteContent}
                  onExitToStudent={() => setActiveView("student")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
