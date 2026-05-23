import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  MessageSquare, 
  ChevronRight, 
  Play, 
  Award, 
  MessageCircle, 
  Lightbulb, 
  AlertTriangle,
  Code,
  Copy,
  Star,
  Send,
  Sparkles,
  BookMarked,
  X,
  Home,
  Search,
  Video,
  User,
  Flame,
  Globe,
  Smartphone,
  Laptop,
  Check,
  FileText,
  TrendingUp,
  RotateCcw,
  Sparkle,
  Activity,
  Trophy,
  Coins,
  ShoppingBag,
  Languages,
  Brain,
  Terminal,
  Phone,
  Fingerprint,
  Calendar,
  Bell,
  Zap,
  Droplets,
  Footprints,
  RefreshCw,
} from "lucide-react";
import { Course, Lesson, QuizQuestion, ChatMessage, StudentStats, SiteContent, PromoEvent } from "../types";
import {
  analyzeFaceFrame,
  FaceScanPhase,
  FACE_PHASE_LABELS,
  FACE_PHASE_STEPS,
} from "../utils/faceBlink";

interface StudentPortalProps {
  courses: Course[];
  studentStats: StudentStats;
  updateStats: (statChanges: Partial<StudentStats>) => void;
  onRefreshCourses: () => void;
  siteContent: SiteContent;
  onOpenAdmin?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/** YouTube Shorts on home — embed only, no chrome */
const HOME_YOUTUBE_SHORTS = [
  "jNQXAC9IVRw",
  "kUMe1fhM0lo",
  "kh060lK7Zrc",
  "ZGwQoRw7yh8",
  "9No-FiEInLA",
];

const CAMPUS_MARKET_ITEMS = [
  { name: "Gold house badge", desc: "Exclusive crest on your profile and leaderboard.", cost: 200, icon: "🏅" },
  { name: "Library extension pass", desc: "+2 hours in the study hall this week.", cost: 120, icon: "📚" },
  { name: "Cafeteria voucher", desc: "Premium lunch menu — one day.", cost: 80, icon: "🍽️" },
  { name: "Sports day VIP pass", desc: "Front-row seat at the inter-house match.", cost: 150, icon: "⚽" },
  { name: "Merit boost (+50 XP)", desc: "Instant merit points for house ranking.", cost: 100, icon: "⭐" },
  { name: "Kapusta AI tutor plus", desc: "Extra hints in lessons for 7 days.", cost: 180, icon: "🥦" },
];

export default function StudentPortal({ 
  courses, 
  studentStats, 
  updateStats,
  onRefreshCourses,
  siteContent,
  onOpenAdmin,
  onRefresh,
  isRefreshing = false,
}: StudentPortalProps) {
  // Navigation: "home" | "lessons" | "search" | "video" | "profile"
  const [currentTab, setCurrentTab] = useState<"home" | "lessons" | "search" | "video" | "profile">("home");
  
  // Format / Simulator Settings
  const [isPhoneView, setIsPhoneView] = useState<boolean>(false);

  // User Profile Name editor states
  const [profileFirstName, setProfileFirstName] = useState<string>("Михаил");
  const [profileLastName, setProfileLastName] = useState<string>("Студент");
  const [profilePhone, setProfilePhone] = useState<string>("+7 (999) 123-45-67");
  const [profileFaceId, setProfileFaceId] = useState<boolean>(true);
  const [certExpanded, setCertExpanded] = useState<boolean>(false);
  const [proxyExpanded, setProxyExpanded] = useState<boolean>(false);

  // Website Settings
  const [siteLanguage, setSiteLanguage] = useState<"ru" | "en">("ru");
  const [siteNotifications, setSiteNotifications] = useState<boolean>(true);
  const [siteVibration, setSiteVibration] = useState<boolean>(false);
  
  // Active Course/Classroom state
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [classroomTab, setClassroomTab] = useState<"lessons" | "quiz">("lessons");
  
  // Quiz states within classroom
  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // AI Tutor chat states (Kapusta AI)
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Optical Face ID sensor references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Feedback states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Practice States
  const [activePracticeIdx, setActivePracticeIdx] = useState<number>(0);
  const [practiceCode, setPracticeCode] = useState<string>("");
  const [practiceOutput, setPracticeOutput] = useState<string>("");
  const [practiceSuccess, setPracticeSuccess] = useState<boolean | null>(null);
  const [showPracticeHint, setShowPracticeHint] = useState<boolean>(false);

  // Video States
  const [videoActiveIdx, setVideoActiveIdx] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(35);
  const [videoSpeed, setVideoSpeed] = useState<string>("1.0x");

  // Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  const [aiSearchRecommendation, setAiSearchRecommendation] = useState<string | null>(null);

  // SSO Login simulator states
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    tier: string;
    streak: number;
    avatar: string;
    badgeCount: number;
  }>({
    name: "Михаил Студент",
    email: "student.mikhail@gmail.com",
    tier: "IB Diploma Programme · Year 12",
    streak: 5,
    avatar: "🎒",
    badgeCount: 4
  });

  const [ssoModalOpen, setSsoModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Home-tab customized dynamic states
  const [userCoins, setUserCoins] = useState<number>(() => {
    const saved = localStorage.getItem("student_user_coins");
    return saved ? Number(saved) : 450;
  });
  const [userRating, setUserRating] = useState<number>(() => {
    const saved = localStorage.getItem("student_user_rating");
    return saved ? Number(saved) : 1250;
  });

  const [eventsOffset, setEventsOffset] = useState<number>(0);
  const [eventModal, setEventModal] = useState<PromoEvent | null>(null);
  const [aiExtraVideos, setAiExtraVideos] = useState<any[]>([]);
  const [marketOpen, setMarketOpen] = useState<boolean>(false);
  const [showRatingLeaderboard, setShowRatingLeaderboard] = useState<boolean>(false);
  const [marketPurchaseHistory, setMarketPurchaseHistory] = useState<string[]>([]);

  // Helpers state: text translator state, active helper, output text
  const [selectedHelperId, setSelectedHelperId] = useState<string | null>(null);
  const [helperInputText, setHelperInputText] = useState<string>("");
  const [helperResultText, setHelperResultText] = useState<string>("");
  const [isTranslatingHelper, setIsTranslatingHelper] = useState<boolean>(false);

  // Real Face ID states (blink liveness: open → close → open)
  const [faceScannerOpen, setFaceScannerOpen] = useState<boolean>(false);
  const [faceScannerMode, setFaceScannerMode] = useState<"register" | "authenticate">("register");
  const [faceScannerStatus, setFaceScannerStatus] = useState<"idle" | "camera-active" | "scanning" | "success" | "error">("idle");
  const [faceScannerMessage, setFaceScannerMessage] = useState<string>("");
  const [faceScanPhase, setFaceScanPhase] = useState<FaceScanPhase>("camera_start");
  const [faceSimulatedMode, setFaceSimulatedMode] = useState(false);
  const [storedFaceIdImage, setStoredFaceIdImage] = useState<string | null>(() => localStorage.getItem("stored_face_id_image"));
  const [storedFaceIdTemplate, setStoredFaceIdTemplate] = useState<string | null>(() => localStorage.getItem("stored_face_id_template"));

  const faceScanPhaseRef = useRef<FaceScanPhase>("camera_start");
  const faceScanModeRef = useRef<"register" | "authenticate">("register");
  const faceScannerOpenRef = useRef(false);
  const phaseHoldSinceRef = useRef<number | null>(null);
  const faceCompletingRef = useRef(false);
  const peakEyeContrastRef = useRef(0);
  const PHASE_HOLD_MS = 750;

  // YouTube / Video Search states
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>("");
  const [isVideoSearching, setIsVideoSearching] = useState<boolean>(false);

  // Duolingo game states
  const [isGeneratingDuo, setIsGeneratingDuo] = useState<boolean>(false);
  const [activeDuolingoLesson, setActiveDuolingoLesson] = useState<any | null>(null);
  const [duolingoStep, setDuolingoStep] = useState<number>(0);
  const [duolingoLives, setDuolingoLives] = useState<number>(3);
  const [duolingoXP, setDuolingoXP] = useState<number>(0);
  const [duolingoSelectedAnswers, setDuolingoSelectedAnswers] = useState<Record<number, string>>({});
  const [duolingoCheckedAnswers, setDuolingoCheckedAnswers] = useState<number[]>([]);

  const handleProfileNameChange = (first: string, last: string) => {
    setProfileFirstName(first);
    setProfileLastName(last);
    setUserProfile(prev => ({
      ...prev,
      name: `${first} ${last}`.trim()
    }));
  };

  const handleAvatarChange = (newAvatar: string) => {
    setUserProfile(prev => ({
      ...prev,
      avatar: newAvatar
    }));
  };

  const renderAvatar = (av: string, classNameString: string = "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-900 text-white select-none overflow-hidden") => {
    if (av && (av.startsWith("data:") || av.startsWith("http://") || av.startsWith("https://"))) {
      return (
        <img
          src={av}
          alt="Avatar"
          className={`${classNameString} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className={classNameString}>
        {av || "🎒"}
      </div>
    );
  };

  const setFacePhase = (phase: FaceScanPhase, message?: string) => {
    faceScanPhaseRef.current = phase;
    setFaceScanPhase(phase);
    setFaceScannerMessage(message ?? FACE_PHASE_LABELS[phase]);
    phaseHoldSinceRef.current = null;
  };

  const advancePhaseIfHeld = (condition: boolean, next: FaceScanPhase) => {
    if (!condition) {
      phaseHoldSinceRef.current = null;
      return;
    }
    const now = Date.now();
    if (phaseHoldSinceRef.current === null) phaseHoldSinceRef.current = now;
    if (now - phaseHoldSinceRef.current >= PHASE_HOLD_MS) {
      setFacePhase(next);
    }
  };

  const stopFaceAnimationLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const scheduleNextFaceFrame = () => {
    stopFaceAnimationLoop();
    animationFrameRef.current = requestAnimationFrame(processFaceBlinkFrame);
  };

  const eyesClosedWithBaseline = (analysis: ReturnType<typeof analyzeFaceFrame>) => {
    const peak = peakEyeContrastRef.current;
    const dropped =
      peak > 12 && analysis.contrast < peak * 0.55;
    return analysis.eyesClosed || dropped;
  };

  const processFaceBlinkFrame = () => {
    if (!faceScannerOpenRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      scheduleNextFaceFrame();
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      scheduleNextFaceFrame();
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    let phase = faceScanPhaseRef.current;

    if (phase === "success") return;

    if (phase === "capturing") {
      completeFaceScan(faceScanModeRef.current);
      return;
    }

    const videoReady = video.readyState >= 2 && !video.paused && video.videoWidth > 0;

    if (videoReady) {
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();
      setFaceScannerStatus("scanning");

      const analysis = analyzeFaceFrame(ctx, w, h);

      if (analysis.contrast > peakEyeContrastRef.current) {
        peakEyeContrastRef.current = analysis.contrast;
      }

      switch (phase) {
        case "camera_start":
        case "position_face":
          if (analysis.facePresent) {
            advancePhaseIfHeld(true, "eyes_open_1");
          } else {
            setFaceScannerMessage(FACE_PHASE_LABELS.position_face);
          }
          break;
        case "eyes_open_1":
          if (analysis.eyesOpen) peakEyeContrastRef.current = Math.max(peakEyeContrastRef.current, analysis.contrast);
          advancePhaseIfHeld(analysis.eyesOpen, "eyes_closed");
          break;
        case "eyes_closed":
          advancePhaseIfHeld(eyesClosedWithBaseline(analysis), "eyes_open_2");
          break;
        case "eyes_open_2":
          advancePhaseIfHeld(analysis.eyesOpen, "capturing");
          break;
        default:
          break;
      }

      drawFaceGuideOverlay(ctx, w, h, analysis.contrast);
    } else {
      setFaceScannerMessage(FACE_PHASE_LABELS.camera_start);
    }

    phase = faceScanPhaseRef.current;
    if (phase === "capturing") {
      completeFaceScan(faceScanModeRef.current);
      return;
    }

    scheduleNextFaceFrame();
  };

  const drawFaceGuideOverlay = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    contrast: number
  ) => {
    const phase = faceScanPhaseRef.current;

    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    const stepIdx = FACE_PHASE_STEPS.indexOf(phase as (typeof FACE_PHASE_STEPS)[number]);
    if (stepIdx >= 0) {
      const ey = h * 0.36;
      ctx.fillStyle = phase === "eyes_closed" ? "rgba(15, 39, 68, 0.45)" : "rgba(201, 162, 39, 0.35)";
      ctx.fillRect(w * 0.2, ey - 5, w * 0.24, 12);
      ctx.fillRect(w * 0.56, ey - 5, w * 0.24, 12);
    }

    ctx.fillStyle = "#0f2744";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.fillText(`Signal ${Math.min(99, Math.round(contrast * 2.5))}%`, 8, h - 10);
  };

  const advanceSimulatedBlinkStep = () => {
    const order: FaceScanPhase[] = [
      "position_face",
      "eyes_open_1",
      "eyes_closed",
      "eyes_open_2",
      "capturing",
    ];
    const idx = order.indexOf(faceScanPhaseRef.current);
    const next = order[Math.min(idx + 1, order.length - 1)];
    setFacePhase(next);
    if (next === "capturing") {
      setTimeout(() => completeFaceScan(faceScanModeRef.current), 400);
    }
  };

  const startFaceScan = (mode: "register" | "authenticate") => {
    if (mode === "authenticate" && !storedFaceIdTemplate) {
      alert("Register Face ID in Profile first (eyes open → closed → open).");
      return;
    }

    faceCompletingRef.current = false;
    peakEyeContrastRef.current = 0;
    faceScanModeRef.current = mode;
    faceScannerOpenRef.current = true;
    setFaceScannerMode(mode);
    setFaceScannerOpen(true);
    setFaceSimulatedMode(false);
    setFaceScannerStatus("camera-active");
    setFacePhase("camera_start");

    if (siteVibration && "vibrate" in navigator) navigator.vibrate([20, 20]);
  };

  useEffect(() => {
    if (!faceScannerOpen || faceSimulatedMode) return;

    let cancelled = false;

    const attachStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        const onReady = () => {
          if (cancelled) return;
          video
            .play()
            .then(() => {
              setFacePhase("position_face");
              scheduleNextFaceFrame();
            })
            .catch((e) => {
              console.warn("Video play error:", e);
              enableSimulatedFaceFlow();
            });
        };

        if (video.readyState >= 2) onReady();
        else video.addEventListener("loadeddata", onReady, { once: true });
      } catch (err) {
        console.warn("Webcam unavailable:", err);
        if (!cancelled) enableSimulatedFaceFlow();
      }
    };

    const enableSimulatedFaceFlow = () => {
      setFaceSimulatedMode(true);
      setFaceScannerStatus("scanning");
      setFacePhase("eyes_open_1", "Camera unavailable. Confirm each step manually:");
    };

    const t = window.setTimeout(() => attachStream(), 150);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      stopFaceAnimationLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [faceScannerOpen, faceSimulatedMode]);

  const completeFaceScan = (mode: "register" | "authenticate") => {
    if (faceCompletingRef.current) return;
    faceCompletingRef.current = true;

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    stopFaceAnimationLoop();

    if (siteVibration && "vibrate" in navigator) navigator.vibrate([100, 50, 100]);

    if (mode === "register") {
      let capturedBase64 =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='50' cy='50' r='40' fill='%230f2744'/><text x='50' y='58' font-size='28' text-anchor='middle'>👤</text></svg>";

      const canvas = canvasRef.current;
      if (canvas) {
        try {
          capturedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        } catch (e) {
          console.warn("Canvas capture failed:", e);
        }
      }

      const templateId = `Face-ISA-${Date.now().toString(16)}`;
      setStoredFaceIdImage(capturedBase64);
      setStoredFaceIdTemplate(templateId);
      localStorage.setItem("stored_face_id_image", capturedBase64);
      localStorage.setItem("stored_face_id_template", templateId);
      
      setProfileFaceId(true);
      setFaceScannerStatus("success");
      setFacePhase("success", "Face ID сохранён! Проверка «глаза открыты → закрыты → открыты» пройдена.");
      setTimeout(() => closeFaceScanner(), 2200);
    } else {
      setFaceScannerStatus("success");
      setFacePhase("success", "Вход подтверждён! Liveness (моргание) пройден.");
      setTimeout(() => {
        setUserProfile((prev) => ({
          ...prev,
          name: `${profileFirstName} ${profileLastName}`.trim() || prev.name,
        }));
        closeFaceScanner();
        alert(
          `Face ID sign-in successful — welcome, ${profileFirstName || "Student"} ${profileLastName || ""}!`
        );
      }, 1500);
    }
  };

  const closeFaceScanner = () => {
    faceCompletingRef.current = false;
    faceScannerOpenRef.current = false;
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    stopFaceAnimationLoop();
    setFaceScannerOpen(false);
    setFaceScannerStatus("idle");
    setFaceSimulatedMode(false);
    setFacePhase("camera_start");
  };

  // Pre-seed practice problems
  const practiceProblems = [
    {
      id: "prac-py",
      title: "🐍 Основы циклов в Python",
      description: "Напишите простой цикл, который выведет числа от 1 до 5 включительно.",
      task: "Замените заполнитель, чтобы вызвать правильный вывод переменной i:",
      initialCode: "for i in range(1, 6):\n    print(______)",
      expectedResult: "1\n2\n3\n4\n5",
      correctCodeSnippet: "i",
      hint: "Просто введите ключевое имя переменной 'i' внутрь функции print() без скобок!",
      language: "python"
    },
    {
      id: "prac-js",
      title: "📦 Стрелочные функции в JS",
      description: "Напишите стрелочную функцию sum(a, b), возвращающую их сумму.",
      task: "Объявите математическое сложение (a, b) => a + b:",
      initialCode: "const sum = (a, b) => __________",
      expectedResult: "a + b",
      correctCodeSnippet: "a + b",
      hint: "Справа от стрелочного аргумента укажите 'a + b' для лаконичного вычисления.",
      language: "javascript"
    },
    {
      id: "prac-html",
      title: "🎨 HTML & CSS Стилизация",
      description: "Задайте тегу абзаца ярко-красный цвет методами инлайн-стилизации.",
      task: "Допишите атрибут style с красителем red:",
      initialCode: '<p style="color: _________;">Привет от Google</p>',
      expectedResult: "red",
      correctCodeSnippet: "red",
      hint: "Просто напишите 'red' в значении цвета, чтобы браузер закрасил текст в красный цвет.",
      language: "html"
    }
  ];

  const videoLessons = [...siteContent.videos, ...aiExtraVideos];

  // Auto initialize practice code based on selection
  useEffect(() => {
    setPracticeCode(practiceProblems[activePracticeIdx].initialCode);
    setPracticeOutput("");
    setPracticeSuccess(null);
    setShowPracticeHint(false);
  }, [activePracticeIdx]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      updateStats({ aiChatMessagesCount: chatMessages.length });
    }
  }, [chatMessages]);

  // Synchronize dynamic home coins and offline ratings
  useEffect(() => {
    localStorage.setItem("student_user_coins", String(userCoins));
  }, [userCoins]);

  useEffect(() => {
    localStorage.setItem("student_user_rating", String(userRating));
  }, [userRating]);

  // Rotate active event cards every 10 seconds exactly
  useEffect(() => {
    const interval = setInterval(() => {
      setEventsOffset(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartCourse = (course: Course) => {
    setActiveCourse(course);
    setActiveLessonIdx(0);
    setClassroomTab("lessons");
    setQuizCompleted(false);
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setQuizScore(0);
    setCurrentTab("lessons"); // Switch tab to lessons internally when starting

    setChatMessages([
      {
        id: "greet-" + Date.now(),
        role: "model",
        content: `Привет! Я твой ИИ-репетитор Капуста (Kapusta AI). Рад(а) видеть тебя на курсе "${course.title}"! С чего мы здесь начнем? Спрашивай меня о любых терминах, формулах или коде в любое время! 🌿`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    if (!studentStats.completedLessons.includes(lessonId)) {
      const updated = [...studentStats.completedLessons, lessonId];
      updateStats({ completedLessons: updated });
    }
    
    if (activeCourse && activeLessonIdx < activeCourse.lessons.length - 1) {
      setActiveLessonIdx(prev => prev + 1);
    } else {
      setClassroomTab("quiz");
    }
  };

  const handleSubmitAnswer = (option: string, questionObj: QuizQuestion) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(option);
    setIsAnswerRevealed(true);
    if (option === questionObj.correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!activeCourse) return;
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    
    if (currentQuizIdx < activeCourse.quizzes.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      
      const finalVal = quizScore + (selectedAnswer === activeCourse.quizzes[currentQuizIdx].correctAnswer ? 1 : 0);
      fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalVal, maxScore: activeCourse.quizzes.length })
      }).catch(err => console.error("Error submitting quiz analytics:", err));

      const existingQuizzes = { ...studentStats.gradedQuizzes };
      existingQuizzes[activeCourse.id] = {
        score: finalVal,
        maxScore: activeCourse.quizzes.length,
        date: new Date().toLocaleDateString()
      };
      updateStats({ gradedQuizzes: existingQuizzes });
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setIsTyping(true);

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          currentTopic: activeCourse?.title || "Общее обучение"
        })
      });

      if (!resp.ok) throw new Error("Не удалось связаться с ИИ репетитором.");
      const data = await resp.json();
      setChatMessages(prev => [
        ...prev,
        {
          id: "reply-" + Date.now(),
          role: "model",
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "model",
          content: `⚠️ Извини, возникла ошибка: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    setSubmittingFeedback(true);

    try {
      const resp = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: activeCourse.id,
          courseTitle: activeCourse.title,
          userName: userProfile.name,
          rating,
          comment
        })
      });

      if (resp.ok) {
        setFeedbackSubmitted(true);
        setComment("");
        onRefreshCourses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Run user code compilers mockup check
  const handleCompilePracticeCode = () => {
    const activePrac = practiceProblems[activePracticeIdx];
    const isMatched = practiceCode.includes(activePrac.correctCodeSnippet);
    
    setPracticeOutput("⏳ [EduSandbox] Подключение к компилятору...\n🔄 [Sandbox] Анализ синтаксиса и отступов...");
    
    setTimeout(() => {
      if (isMatched) {
        setPracticeOutput(`✅ [SUCCESS] Компиляция завершена без предупреждений.\n🛰️ [Получено]: ${activePrac.expectedResult}\n🎯 [Совпадение результатов]: СУПЕР! Задание выполнено на отлично!`);
        setPracticeSuccess(true);
        // Increase user stats streak or mock badge internally
        if (userProfile.streak < 7) {
          setUserProfile(prev => ({ ...prev, streak: prev.streak + 1 }));
        }
      } else {
        setPracticeOutput(`❌ [ERROR] Ошибка вывода. Ожидался результат:\n${activePrac.expectedResult}\n\nПолучено пустое значение или синтаксическое падение. Попробуйте еще раз или воспользуйтесь подсказкой!`);
        setPracticeSuccess(false);
      }
    }, 1200);
  };

  // Google Search simulated responder involving Gemini API recommendation
  const handleAiSmartSeek = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    setAiSearchRecommendation(null);
    
    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `Найди мне лучший урок, сделай краткое саммари и порекомендуй план изучения по теме: "${searchQuery}".` }
          ],
          currentTopic: "Рекомендации Google Scholar Search"
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setAiSearchRecommendation(data.content);
      } else {
        setAiSearchRecommendation("Поиск по ключевым словам выполнен успешно! (см. список ниже). Ответ от ИИ Куратора временно задержан.");
      }
    } catch (err) {
      console.error(err);
      setAiSearchRecommendation("Поиск по ключевым словам выполнен успешно! Рекомендации от ИИ временно недоступны.");
    } finally {
      setIsAiSearching(false);
    }
  };

  // Copy code handler
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filter courses by manual search
  const filteredCoursesByQuery = courses.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || 
           c.description.toLowerCase().includes(q) || 
           c.category.toLowerCase().includes(q);
  });

  // Render visual parts within lessons beautifully
  const renderVisualParts = (parts: any[]) => {
    if (!parts || parts.length === 0) return null;
    return (
      <div className="space-y-4 pt-3 border-t border-slate-100 mt-4">
        {parts.map((p, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
              p.type === 'code' ? 'bg-slate-900 text-slate-100 border-slate-800 font-mono' :
              p.type === 'tip' ? 'bg-[#E6F4EA] border-[#A8DAB5] text-[#137333] font-sans' :
              p.type === 'warning' ? 'bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F] font-sans' :
              'bg-white border-slate-205 text-slate-750 font-sans'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold mb-1.5 opacity-80 select-none">
              <span className="flex items-center gap-1.5">
                {p.type === 'code' && (
                  <>
                    <Code className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Пример кода / Формулы</span>
                  </>
                )}
                {p.type === 'tip' && (
                  <>
                    <Lightbulb className="w-3.5 h-3.5 text-[#34A853]" />
                    <span>Лайфхак / Идея ученых</span>
                  </>
                )}
                {p.type === 'warning' && (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#EA4335]" />
                    <span>Частая ошибка новичков</span>
                  </>
                )}
                {p.type === 'text' && (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Дополнительные сведения</span>
                  </>
                )}
                {p.type === 'duolingo_game' && (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#58cc02]" />
                    <span>Интерактивное задание</span>
                  </>
                )}
              </span>

              {p.type === 'code' && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(p.content)}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 py-0.5 border border-slate-700 font-bold tracking-normal transition scale-90 cursor-pointer flex items-center gap-0.5"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>{copiedText === p.content ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            <p className="whitespace-pre-wrap">
              {p.type === 'duolingo_game' && p.gameQuestion ? p.gameQuestion : p.content}
            </p>
            {p.type === 'duolingo_game' && p.gameOptions && p.gameOptions.length > 0 && (
              <ul className="mt-2 space-y-1 list-none">
                {p.gameOptions.map((opt: string, i: number) => (
                  <li key={i} className={`text-[11px] px-2 py-1 rounded-lg border ${
                    opt === p.gameAnswer ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-700'
                  }`}>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
            {p.metadata && (
              <span className="text-[10px] font-bold text-slate-400 block mt-1 select-none font-mono">
                Раздел: {p.metadata}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Google Colored Line Accent Header
  const googleAccentBar = (
    <div className="h-1 flex w-full select-none shrink-0 z-50">
      <div className="h-full bg-[#4285F4] w-1/4" />
      <div className="h-full bg-[#EA4335] w-1/4" />
      <div className="h-full bg-[#FBBC05] w-1/4" />
      <div className="h-full bg-[#34A853] w-1/4" />
    </div>
  );

  // Phone Mockup shell container view
  const renderInPhoneFrame = (bodyContent: React.ReactNode) => {
    return (
      <div className="mx-auto max-w-[395px] w-full bg-[#202124] p-3.5 rounded-[48px] shadow-2xl border-4 border-slate-700 relative overflow-hidden select-none">
        {/* Physical Button Mockups */}
        <div className="absolute top-28 -left-1 w-1 h-12 bg-slate-700 rounded-r" />
        <div className="absolute top-44 -left-1 w-1 h-12 bg-slate-700 rounded-r" />
        <div className="absolute top-36 -right-1 w-1 h-16 bg-slate-700 rounded-l" />

        {/* Smartphone Camera Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 absolute left-4" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#34A853] absolute right-4 animate-pulse" />
        </div>
        
        {/* Outer Phone Shell Glass wrapper */}
        <div className="bg-[#F8F9FA] rounded-[36px] overflow-hidden flex flex-col h-[710px] relative text-slate-800 select-text outline-none shadow-inner">
          
          {/* Top Google Colors highlight under status bar */}
          <div className="h-9 bg-white px-5 pt-4 flex justify-between items-center text-[10px] font-extrabold text-[#202124] font-sans tracking-tight z-40 relative select-none">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#34A853]/10 text-[#137333] border border-[#A8DAB5] rounded px-1 text-[8px] font-bold">Google Fi 5G</span>
              <span className="text-slate-500 text-[9px]">📶 🔋 98%</span>
            </div>
          </div>

          {googleAccentBar}
          
          {/* Scrollable Phone App Body (Container) */}
          <div className="flex-1 overflow-y-auto pb-20 pt-1.5 px-3 bg-[#F8F9FA] scrollbar-thin">
            {bodyContent}
          </div>

          {/* Fixed Bottom Navigation inside Phone Frame */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-3 flex justify-around items-center z-40 shadow-lg select-none">
            {[
              { id: "home", label: "Главная", icon: Home, color: "text-[#4285F4]" },
              { id: "lessons", label: "Лекторий", icon: BookOpen, color: "text-[#EA4335]" },
              { id: "search", label: "ИИ Поиск", icon: Search, color: "text-[#34A853]" },
              { id: "video", label: "Видео", icon: Video, color: "text-[#4285F4]" },
              { id: "profile", label: "Профиль", icon: User, color: "text-[#EA4335]" }
            ].map(tab => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id as any);
                    if (tab.id !== 'lessons') setActiveCourse(null); // Return from course list when switching tabs
                  }}
                  className="flex flex-col items-center justify-center transition p-1 cursor-pointer"
                >
                  <tab.icon className={`w-5 h-5 ${active ? `${tab.color} scale-110 font-bold filter drop-shadow` : "text-slate-400 hover:text-slate-650"}`} />
                  <span className={`text-[9px] font-bold mt-0.5 tracking-tight ${active ? "text-slate-900 font-extrabold" : "text-slate-400 font-normal"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    );
  };

  // Wide View layout
  const renderInWideFrame = (bodyContent: React.ReactNode) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden min-h-[720px] flex flex-col justify-between relative">
        
        {googleAccentBar}

        {/* Desktop Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
          <div className="flex items-center gap-2">
            <span className="bg-[#4285F4] text-white p-1 rounded-lg text-xs font-bold leading-none">🧠 Google Classroom</span>
            <span className="font-extrabold text-slate-900 text-sm font-mono uppercase tracking-wider">/ Студ-Портал</span>
          </div>

          {/* Quick SSO avatar button in Header to navigate directly */}
          <button
            onClick={() => setCurrentTab("profile")}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-xl transition cursor-pointer text-left shadow-xs"
            title="Перейти в Личный SSO Кабинет"
          >
            {renderAvatar(userProfile.avatar, "text-sm w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200")}
            <div className="leading-none">
              <span className="text-[10px] font-bold text-slate-800 block">{userProfile.name}</span>
              <span className="text-[8px] font-mono text-[#4285F4] uppercase tracking-wide">SSO Кабинет ⚙️</span>
            </div>
          </button>
        </div>

        {/* Wide Body Container */}
        <div className="flex-1 p-6 md:p-8 bg-[#F8F9FA] overflow-y-auto pb-24 scrollbar-thin">
          {bodyContent}
        </div>

        {/* Fixed Bottom Navigation inside Wide/Desktop Frame */}
        <div className="bg-white border-t border-slate-200 py-3.5 px-6 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] select-none shrink-0">
          {[
            { id: "home", label: "Главная", icon: Home, bgActive: "bg-[#4285F4]/10 text-[#4285F4]", iconColor: "text-[#4285F4]" },
            { id: "lessons", label: "Лекции", icon: BookOpen, bgActive: "bg-[#EA4335]/10 text-[#EA4335]", iconColor: "text-[#EA4335]" },
            { id: "search", label: "ИИ Поиск", icon: Search, bgActive: "bg-[#34A853]/10 text-[#34A853]", iconColor: "text-[#34A853]" },
            { id: "video", label: "Видео-Колледж", icon: Video, bgActive: "bg-[#4285F4]/10 text-[#4285F4]", iconColor: "text-[#4285F4]" },
            { id: "profile", label: "Профиль (SSO)", icon: User, bgActive: "bg-[#EA4335]/10 text-[#EA4335]", iconColor: "text-[#EA4335]" }
          ].map(tab => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id as any);
                  if (tab.id !== 'lessons') setActiveCourse(null);
                }}
                className={`flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
                  active 
                    ? `${tab.bgActive} shadow-xs font-bold scale-102` 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${active ? tab.iconColor : "text-slate-400"}`} />
                <span className="text-[10px] md:text-xs font-extrabold font-sans">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    );
  };

  const handleBuyProduct = (itName: string, price: number) => {
    if (userCoins < price) {
      alert(
        `Not enough house coins.\nYou have ${userCoins} 🪙 — need ${price - userCoins} more.\nComplete lessons and campus quests to earn coins.`
      );
      return;
    }
    setUserCoins((prev) => prev - price);
    setUserRating((prev) => prev + 50);
    setMarketPurchaseHistory((prev) => [...prev, itName]);
    alert(`Purchased "${itName}" for ${price} 🪙 house coins. +50 merit XP!`);
  };

  const renderCampusProfileHeader = () => (
    <header className="isa-school-header sticky top-0 z-40 -mx-4 px-4 pt-0 mb-4 shadow-md">
      <div className="isa-school-header__gold-rule" />
      <div className="py-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setCurrentTab("profile")}
            className="flex items-center gap-3 text-left cursor-pointer min-w-0 flex-1"
          >
            {renderAvatar(
              userProfile.avatar,
              "w-14 h-14 bg-isa-gold-pale text-2xl rounded-full flex items-center justify-center border-2 border-isa-gold/60 shadow-md shrink-0"
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-isa-gold-light font-bold uppercase tracking-widest">
                International School
              </p>
              <h1 className="text-lg font-bold text-white leading-tight truncate font-[family-name:var(--font-display)]">
                {profileFirstName} {profileLastName}
              </h1>
              <p className="text-[10px] text-white/70 truncate">{userProfile.tier}</p>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-isa-gold-light cursor-pointer transition"
              title="Academic chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowRatingLeaderboard(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-isa-gold cursor-pointer transition"
              title="House cup"
            >
              <Trophy className="w-4 h-4" />
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 cursor-pointer transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            )}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-isa-gold/40 text-isa-gold cursor-pointer transition"
                title="Admin"
              >
                <Zap className="w-3.5 h-3.5 fill-isa-gold" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMarketOpen(true)}
            className="isa-wallet-pill flex-1 flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Coins className="w-4 h-4 text-isa-gold shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[9px] text-isa-gold-light/90 uppercase tracking-wider font-bold">House coins</p>
                <p className="text-lg font-black text-white leading-none">{userCoins}</p>
              </div>
            </div>
            <span className="text-[9px] text-isa-gold-light font-bold uppercase">Virtual currency</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketOpen(true)}
            className="isa-market-btn shrink-0 cursor-pointer"
            title="Campus market"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase mt-0.5">Market</span>
          </button>
        </div>
      </div>
    </header>
  );

  const renderMarketModal = () => (
    <AnimatePresence>
      {marketOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="bg-isa-navy text-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full border border-isa-gold/30 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-isa-gold" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide font-[family-name:var(--font-display)]">
                    Campus Market
                  </h3>
                  <p className="text-[9px] text-isa-gold-light/80">Spend house coins on campus rewards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarketOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="isa-wallet-pill flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-isa-gold-light">Your balance</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-xl font-black text-white">{userCoins}</span>
                <span className="text-xs text-isa-gold">🪙</span>
              </div>
            </div>

            <div className="space-y-2">
              {CAMPUS_MARKET_ITEMS.map((it) => {
                const purchased = marketPurchaseHistory.includes(it.name);
                return (
                  <div
                    key={it.name}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl flex gap-3 items-center"
                  >
                    <span className="text-2xl shrink-0">{it.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white">{it.name}</h4>
                        {purchased && (
                          <span className="isa-badge-gold text-[7px] py-0">Owned</span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 mt-0.5">{it.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyProduct(it.name, it.cost)}
                      disabled={purchased}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold shrink-0 ${
                        purchased
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-isa-gold text-isa-navy hover:bg-isa-gold-light cursor-pointer"
                      }`}
                    >
                      {purchased ? "Owned" : `${it.cost} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderLeaderboardModal = () => (
    <AnimatePresence>
      {showRatingLeaderboard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="isa-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-isa-border pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-isa-gold" />
                <h3 className="text-sm font-black text-isa-navy uppercase tracking-wide font-[family-name:var(--font-display)]">
                  House Cup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingLeaderboard(false)}
                className="p-1.5 hover:bg-isa-cream rounded-xl text-isa-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { rank: 1, name: "Emma Watson", rating: 1450, isMe: false, avatar: "👑" },
                { rank: 2, name: "James Chen", rating: 1390, isMe: false, avatar: "📖" },
                { rank: 3, name: "Sofia Aliyeva", rating: 1310, isMe: false, avatar: "🎓" },
                { rank: 4, name: `${profileFirstName} ${profileLastName} (You)`, rating: userRating, isMe: true, avatar: userProfile.avatar },
                { rank: 5, name: "Lucas Martin", rating: 1120, isMe: false, avatar: "🌍" },
              ].map((lead) => (
                <div
                  key={lead.rank}
                  className={`flex justify-between items-center p-2 rounded-xl ${
                    lead.isMe ? "bg-isa-gold-pale border border-isa-gold/40" : "bg-isa-cream border border-isa-border"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-isa-navy">
                    <span className="w-5 h-5 rounded-full bg-isa-navy text-isa-gold-light flex items-center justify-center text-[10px] font-bold">
                      {lead.rank}
                    </span>
                    <span>{typeof lead.avatar === "string" && lead.avatar.length <= 2 ? lead.avatar : "🎒"}</span>
                    <span className="truncate max-w-[140px] font-medium">{lead.name}</span>
                  </div>
                  <span className="text-xs font-bold text-isa-navy">{lead.rating} XP</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[9px] text-isa-muted font-bold uppercase">Rank #4 · 120 students</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // TAB 1: HOME PAGE RENDERER
  const renderHomeTab = () => {
    const promoEvents = siteContent.events.length > 0 ? siteContent.events : [];

    const homeShortIds = [
      ...new Set([
        ...HOME_YOUTUBE_SHORTS,
        ...siteContent.videos
          .filter((v) => v.youtubeId)
          .map((v) => v.youtubeId as string),
      ]),
    ].slice(0, 8);

    const translationHelpers = [
      { id: "ru-en", title: "🇷🇺 ➜ 🇬🇧 Английский", desc: "Перевод лекций и кода на English", emoji: "📝" },
      { id: "en-ru", title: "🇬🇧 ➜ 🇷🇺 Русский", desc: "Ошибки и термины с английского", emoji: "🩺" },
      { id: "ru-uz", title: "🇷🇺 ➜ 🇺🇿 O'zbek", desc: "Перевод материалов на узбекский", emoji: "🌐" },
      { id: "ru-kk", title: "🇷🇺 ➜ 🇰🇿 Қазақ", desc: "Перевод на казахский язык", emoji: "🏔️" },
      { id: "syntax", title: "🐍 ➜ 💻 Python/JS", desc: "Конвертация синтаксиса кода", emoji: "⚙️" },
      { id: "brain", title: "🧠 Объяснение терминов", desc: "Простыми словами про науку", emoji: "☄️" },
      { id: "regex", title: "📜 RegExp генератор", desc: "Регулярные выражения", emoji: "🔍" },
      { id: "summarize", title: "📋 Краткий конспект", desc: "Сжать длинный текст", emoji: "📎" },
      { id: "quiz", title: "❓ Вопросы для теста", desc: "Сгенерировать 3 вопроса", emoji: "🎯" },
    ];

    const handleHelperTranslate = () => {
      if (!helperInputText.trim() || !selectedHelperId) return;
      setIsTranslatingHelper(true);
      setHelperResultText("");
      setTimeout(() => {
        setIsTranslatingHelper(false);
        const text = helperInputText.trim();
        const h = selectedHelperId;
        const templates: Record<string, string> = {
          "ru-en": `[EN] ${text}\n→ Hello! This academic phrase translates naturally for international study materials.`,
          "en-ru": `[RU] ${text}\n→ Понятный перевод: технический фрагмент объяснён для студента на русском.`,
          "ru-uz": `[UZ] ${text}\n→ O'zbekcha: ushbu ibora darslikda quyidagicha ifodalanadi...`,
          "ru-kk": `[KK] ${text}\n→ Қазақша аударма: оқу материалында осылай түсіндіріледі...`,
          syntax: `// JS аналог:\n${text.replace(/print/g, "console.log")}`,
          brain: `💡 ${text} — это фундаментальное понятие курса. Разберите его на 2–3 простых примера из жизни.`,
          regex: `const pattern = /^[\\w.@+-]+$/;\n// Проверяет: "${text.slice(0, 30)}..."`,
          summarize: `📋 Кратко: ${text.slice(0, 80)}…\nГлавная мысль сохранена в 2 предложениях для конспекта.`,
          quiz: `1) Что означает "${text.slice(0, 20)}"?\n2) Приведите пример.\n3) Где применяется на практике?`,
        };
        setHelperResultText(templates[h] || `✅ Обработано (${h}): ${text}`);
      }, 900);
    };

    const displayEvents =
      promoEvents.length > 0
        ? promoEvents
        : [
            {
              id: "fb-1",
              imageUrl:
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=340&fit=crop",
              description: "IT-Олимпиада — соревнование по программированию. +500 коинов.",
            },
            {
              id: "fb-2",
              imageUrl:
                "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=340&fit=crop",
              description: "Хакатон ИИ-Кураторы — создайте помощника на Gemini.",
            },
          ];

    const ev1 = displayEvents[eventsOffset % displayEvents.length];
    const ev2 = displayEvents[(eventsOffset + 1) % displayEvents.length];

    return (
      <div className="space-y-4 animate-fade-in select-none">

        {/* YouTube Shorts — one row, no labels or buttons */}
        <div className="isa-shorts-row flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          {homeShortIds.map((id) => (
            <div
              key={id}
              className="isa-short-cell shrink-0 w-[108px] h-[192px] rounded-2xl overflow-hidden bg-isa-navy shadow-md border border-isa-border/60"
            >
              <iframe
                src={`https://www.youtube.com/embed/${id}?playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&loop=1&playlist=${id}`}
                title=""
                className="w-full h-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ))}
        </div>

        {/* 2 карточки событий — смена каждые 10 сек */}
        <div className="isa-events-strip rounded-2xl p-3 space-y-2">
          <div className="flex justify-between items-center px-0.5">
            <span className="isa-section-label flex items-center gap-1">
              <span className="text-isa-gold">📢</span> Campus events
            </span>
            <span className="text-[9px] text-isa-muted font-mono">↻ 10 sec</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[ev1, ev2].filter(Boolean).map((ev, idx) => (
              <motion.button
                key={`${ev.id}-${eventsOffset}-${idx}`}
                type="button"
                initial={{ opacity: 0, x: idx === 0 ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                onClick={() => setEventModal(ev)}
                className="relative rounded-2xl overflow-hidden h-[110px] w-full cursor-pointer border-2 border-isa-gold/60 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-[9px] text-white font-bold py-2 px-2 text-left line-clamp-2">
                  {ev.description.slice(0, 48)}…
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {eventModal && (
          <div
            className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setEventModal(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={eventModal.imageUrl} alt="" className="w-full aspect-video object-cover" />
              <div className="p-4 space-y-2">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {eventModal.description || "Описание скоро появится."}
                </p>
                <button
                  type="button"
                  onClick={() => setEventModal(null)}
                  className="w-full py-3 wellness-btn-primary text-sm cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}


        {/* 3 карты: коины, рейтинг, Lessons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMarketOpen(true)}
            className="wellness-card p-3 flex flex-col justify-between min-h-[100px] text-left cursor-pointer hover:shadow-md transition"
          >
            <span className="isa-section-label">House coins</span>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-2xl font-extrabold text-isa-navy">{userCoins}</span>
              <span className="text-sm mb-0.5">🪙</span>
            </div>
            <span className="mt-2 text-[9px] font-bold text-isa-gold">Open market →</span>
          </button>

          <div className="wellness-card p-3 flex flex-col justify-between min-h-[100px]">
            <span className="isa-section-label">Merit points</span>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-2xl font-extrabold text-isa-navy">{userRating}</span>
              <span className="text-[10px] text-isa-navy-mid font-bold mb-1">XP</span>
            </div>
            <span className="isa-badge-gold mt-2 inline-block">Rank #4</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentTab("lessons");
              setActiveCourse(null);
            }}
            className="isa-lessons-cta p-3 rounded-2xl flex flex-col justify-between min-h-[100px] text-left cursor-pointer hover:opacity-95 transition shadow-md"
          >
            <BookOpen className="w-5 h-5 text-isa-gold-light" />
            <span className="text-sm font-extrabold mt-2">Lessons</span>
            <span className="text-[9px] opacity-90">Curriculum →</span>
          </button>
        </div>


        {/* Language & academic helpers */}
        <div className="wellness-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-isa-border pb-2">
            <Languages className="w-5 h-5 text-isa-navy" />
            <div>
              <h3 className="text-sm font-bold text-isa-navy">Language & study helpers</h3>
              <p className="text-[10px] text-isa-muted">Multilingual support — select a tool</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {translationHelpers.map((hl) => {
              const active = selectedHelperId === hl.id;
              return (
                <button
                  key={hl.id}
                  type="button"
                  onClick={() => {
                    setSelectedHelperId(active ? null : hl.id);
                    setHelperInputText("");
                    setHelperResultText("");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex gap-2 items-start ${
                    active
                      ? "bg-isa-gold-pale border-isa-gold ring-2 ring-isa-gold/30"
                      : "bg-white border-isa-border hover:border-isa-gold/50"
                  }`}
                >
                  <span className="text-lg shrink-0">{hl.emoji}</span>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold text-isa-navy leading-tight">{hl.title}</h4>
                    <p className="text-[8px] text-isa-muted line-clamp-2 mt-0.5">{hl.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedHelperId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="wellness-card-soft p-3 space-y-2 overflow-hidden"
              >
                <p className="text-[10px] font-bold text-isa-navy">
                  {translationHelpers.find((h) => h.id === selectedHelperId)?.title}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={helperInputText}
                    onChange={(e) => setHelperInputText(e.target.value)}
                    placeholder="Введите текст или фразу..."
                    className="flex-1 text-xs p-2.5 border border-isa-border rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleHelperTranslate}
                    disabled={!helperInputText.trim() || isTranslatingHelper}
                    className="px-3 py-2 bg-isa-navy text-isa-gold-light rounded-xl font-bold text-sm cursor-pointer disabled:opacity-40"
                  >
                    ⚡
                  </button>
                </div>
                {helperResultText && (
                  <pre className="p-3 bg-isa-navy text-isa-gold-light text-[10px] rounded-xl whitespace-pre-wrap font-sans leading-relaxed">
                    {helperResultText}
                  </pre>
                )}
                {isTranslatingHelper && (
                  <p className="text-[10px] text-[#6b7c6b] text-center animate-pulse">Переводим…</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    );
  };

  // TAB 2: COURSE CATALOG & CLASSROOM LECTURES
  const renderLessonsTab = () => {
    // If studying an active course, render study workspace!
    if (activeCourse) {
      const currentLesson = activeCourse.lessons[activeLessonIdx];
      const isLessonComplete = currentLesson ? studentStats.completedLessons.includes(currentLesson.id) : false;

      return (
        <div className="space-y-4 animate-fade-in p-1">
          {/* Top header navigation buttons */}
          <button
            onClick={() => setActiveCourse(null)}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-[10px] font-extrabold bg-white border border-slate-205 py-1.5 px-3.5 rounded-xl shadow-sm cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#EA4335]" />
            Прервать и выйти к курсам
          </button>

          {/* Classroom Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <span className="bg-[#4285F4]/10 text-[#4285F4] text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#4285F4]/20">
              {activeCourse.category}
            </span>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
              {activeCourse.title}
            </h2>

            {/* Sub classroom mode selector switcher */}
            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <button
                onClick={() => setClassroomTab("lessons")}
                className={`py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  classroomTab === "lessons" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                📖 Лекции ({activeCourse.lessons.length})
              </button>
              <button
                onClick={() => {
                  setClassroomTab("quiz");
                  setCurrentQuizIdx(0);
                  setSelectedAnswer(null);
                  setIsAnswerRevealed(false);
                  setQuizCompleted(false);
                  setQuizScore(0);
                }}
                className={`py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  classroomTab === "quiz" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200"
                }`}
              >
                🎯 Контроль ({activeCourse.quizzes.length})
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* LECTURES SLIDES VIEW */}
            {classroomTab === "lessons" ? (
              <motion.div
                key="lessons-deck"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {/* Lecture selection slider indicators */}
                <div className="flex gap-2.0 overflow-x-auto py-1 select-none">
                  {activeCourse.lessons.map((les, idx) => {
                    const done = studentStats.completedLessons.includes(les.id);
                    const isCurrent = idx === activeLessonIdx;
                    return (
                      <button
                        key={les.id}
                        onClick={() => setActiveLessonIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all shrink-0 cursor-pointer ${
                          isCurrent 
                            ? "bg-[#4285F4] text-white border-[#4285F4] font-black" 
                            : done 
                            ? "bg-[#E6F4EA] text-[#137333] border-[#A8DAB5]" 
                            : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {done ? "✓" : idx + 1}. {les.title.substring(0, 18)}...
                      </button>
                    );
                  })}
                </div>

                {/* Lesson Sheet Paper */}
                {currentLesson ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-3.5 relative shadow-sm">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                      <span>Лекционный материал</span>
                      <span>⏱️ ~{currentLesson.estimatedTime} мин</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#202124] leading-snug">
                      {currentLesson.title}
                    </h3>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {currentLesson.content}
                    </p>

                    {/* Styled parts list */}
                    {renderVisualParts(currentLesson.parts)}

                    {/* Lesson Footer Controls */}
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-4.5 -mb-4.5 p-4 rounded-b-2xl">
                      <div className="text-[10px] text-slate-400 font-bold font-mono">Слайд {activeLessonIdx + 1} из {activeCourse.lessons.length}</div>
                      
                      <button
                        onClick={() => handleMarkLessonComplete(currentLesson.id)}
                        className={`py-1.5 px-3.5 rounded-xl text-[10.5px] font-black shadow transition-all cursor-pointer flex items-center gap-1 ${
                          isLessonComplete 
                            ? "bg-[#34A853] hover:bg-[#2C8E47] text-white" 
                            : "bg-slate-900 hover:bg-slate-850 text-white"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isLessonComplete 
                          ? "Изучено (следующий)" 
                          : "Завершить изучение"}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center text-xs p-6 bg-white rounded-2xl text-slate-400 border border-slate-200">
                    Урок не найден или база данных устарела.
                  </div>
                )}
              </motion.div>
            ) : (
              
              // LIVE QUIZ EXAMINATION MODE
              <motion.div
                key="quiz-deck"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {!quizCompleted ? (
                  <div className="bg-white rounded-2xl border border-slate-203 p-4 space-y-4 shadow-sm">
                    <div className="space-y-2 pb-1 border-b border-slate-100">
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                        <span>Контрольное тестирование</span>
                        <span>Вопрос {currentQuizIdx + 1} / {activeCourse.quizzes.length}</span>
                      </div>
                      
                      {/* Visual progress bar using motion.div */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative">
                        <motion.div
                          className="h-full bg-[#34A853]"
                          initial={{ width: 0 }}
                          animate={{ width: `${activeCourse.quizzes.length > 0 ? ((currentQuizIdx + 1) / activeCourse.quizzes.length) * 100 : 0}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <h3 className="text-xs md:text-sm font-extrabold text-slate-900 leading-snug">
                      {activeCourse.quizzes[currentQuizIdx]?.question}
                    </h3>

                    <div className="space-y-2 pt-1.5">
                      {activeCourse.quizzes[currentQuizIdx]?.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrect = opt === activeCourse.quizzes[currentQuizIdx].correctAnswer;
                        const isWrongSelection = isSelected && !isCorrect;

                        let styleClasses = "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100";
                        if (isAnswerRevealed) {
                          if (isCorrect) {
                            styleClasses = "border-[#34A853] bg-[#E6F4EA] text-[#137333] font-bold";
                          } else if (isWrongSelection) {
                            styleClasses = "border-[#EA4335] bg-[#FCE8E6] text-[#C5221F] font-bold";
                          } else {
                            styleClasses = "border-slate-150 bg-slate-100 text-slate-400 opacity-60";
                          }
                        } else if (isSelected) {
                          styleClasses = "border-[#4285F4] bg-[#E8F0FE] text-[#1967D2] font-black";
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isAnswerRevealed}
                            onClick={() => handleSubmitAnswer(opt, activeCourse.quizzes[currentQuizIdx])}
                            className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold leading-normal transition flex justify-between items-center cursor-pointer ${styleClasses}`}
                          >
                            <span>{opt}</span>
                            {isAnswerRevealed && isCorrect && <CheckCircle className="w-4 h-4 text-[#34A853] shrink-0" />}
                            {isAnswerRevealed && isWrongSelection && <AlertTriangle className="w-4 h-4 text-[#EA4335] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswerRevealed && (
                      <div className="bg-[#E8F0FE] p-3 rounded-xl border border-[#AECBFA] text-[10.5px] text-[#1967D2] leading-relaxed space-y-1">
                        <span className="font-extrabold uppercase tracking-wide block">💡 Разбор от ИИ Капусты:</span>
                        <p>{activeCourse.quizzes[currentQuizIdx]?.explanation}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      {isAnswerRevealed ? (
                        <button
                          onClick={handleNextQuizQuestion}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition h-fit inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {currentQuizIdx < activeCourse.quizzes.length - 1 ? "Дальше" : "Посмотреть итог"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold py-2">Выберите один вариант ответа</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // EXAM FINISHED SCREEN WITH FEEDBACK FORM
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-5 shadow-sm">
                    <span className="text-3xl block">🏆</span>
                    <h3 className="text-base font-black text-slate-900">Тест сдан успешно!</h3>
                    
                    <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-xl text-center">
                      <span className="text-slate-500 font-bold block text-[10.5px] uppercase tracking-wider">Ваши баллы:</span>
                      <span className="text-3xl font-black font-mono text-slate-800">
                        {quizScore} <span className="text-sm font-semibold text-slate-400">/ {activeCourse.quizzes.length}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed px-4">
                      {quizScore === activeCourse.quizzes.length 
                        ? "Замечательно! Академический лекторий пройден со 100% результатом!" 
                        : "Хорошая работа! Оценка добавлена в картотеку учебного табеля."}
                    </p>

                    {/* Brief feedback form below result */}
                    <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 text-left border-t border-slate-100 pt-4">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                        <span>Оставить оценку курсу:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(st => (
                            <button key={st} type="button" onClick={() => setRating(st)} className="focus:outline-none">
                              <Star className={`w-3.5 h-3.5 ${st <= rating ? "text-[#FBBC05] fill-current" : "text-slate-350"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Отзыв... Помогите Капусте доработать дидактику..."
                        className="w-full text-[11px] p-2.5 border border-slate-205 rounded-xl bg-slate-50"
                      />

                      <button
                        type="submit"
                        disabled={submittingFeedback || feedbackSubmitted}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] py-2 px-3 rounded-lg font-bold transition-all disabled:bg-slate-300"
                      >
                        {feedbackSubmitted ? "✓ Отзыв отправлен, спасибо!" : "Сохранить отзыв в реестре"}
                      </button>
                    </form>

                    <button
                      onClick={() => {
                        setActiveCourse(null);
                        onRefreshCourses();
                      }}
                      className="w-full bg-[#4285F4] hover:bg-blue-600 text-white py-2.5 text-xs font-black rounded-lg transition shadow-md"
                    >
                      Вернуться к курсам
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      );
    }

    // LIST CATALOG view if no activeCourse studied
    return (
      <div className="space-y-4 animate-fade-in p-1">
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-extrabold text-[#202124] text-xs uppercase tracking-wider">Каталог Лекций ({courses.length})</h3>
          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-650 px-2 py-0.5 rounded-lg font-mono">
            Облачная База
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            Нет доступных курсов. Напишите или сгенерируйте в Админ-панели!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoursesByQuery.map((course) => {
              const isGrade = studentStats.gradedQuizzes[course.id];
              const completedCount = course.lessons.filter(l => studentStats.completedLessons.includes(l.id)).length;
              const totalLessons = course.lessons.length;
              const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

              return (
                <div 
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#4285F4]/60 p-4 shadow-sm space-y-3 transition group relative"
                >
                  {course.createdWithAI && (
                    <div className="absolute top-3.5 right-3.5 bg-[#E8F0FE] text-[#1967D2] border border-[#AECBFA] px-1.5 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 uppercase tracking-wider scale-95">
                      <Sparkles className="w-2.5 h-2.5 text-[#4285F4] animate-pulse" />
                      Gemini ИИ
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#34A853]/10 text-[#137333] border border-[#A8DAB5] font-extrabold py-0.5 px-1.5 rounded text-[8.5px] uppercase">
                        {course.category}
                      </span>
                      <span className="bg-slate-100 text-slate-500 font-mono py-0.5 px-1.5 rounded text-[8.5px]">
                        {course.difficulty}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs md:text-sm pt-1 hover:text-[#4285F4] transition duration-150 leading-snug">
                      {course.title}
                    </h4>
                    <p className="text-slate-500 text-[10.5px] md:text-xs leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  {/* progress stat bar inside card */}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-450">
                      {isGrade ? (
                        <span className="text-[#34A853] flex items-center gap-0.5">
                          ✓ Тест сдан: {isGrade.score}/{isGrade.maxScore}
                        </span>
                      ) : (
                        <span>Прогресс: {completedCount}/{totalLessons} уроков</span>
                      )}
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isGrade ? "bg-[#34A853]" : "bg-[#4285F4]"} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCourse(course)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-xl text-[10.5px] flex items-center justify-center gap-1.5 transition select-none cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Начать лекторий
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // TAB 4: INTERACTIVE DUOLINGO AI LESSONS (lessons)
  const renderSearchTab = () => {
    // If we are currently loading/generating a lesson
    if (isGeneratingDuo) {
      return (
        <div className="space-y-6 animate-fade-in p-2 text-center py-12 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          {/* Animated Playful Green Owl Placeholder loader */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-1 bg-emerald-555 text-white text-5xl rounded-full flex items-center justify-center shadow-lg relative z-10 animate-pulse">
              🦉
            </div>
          </div>
          <div className="space-y-2 max-w-xs select-none">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Загружаем интерактивный урок...</h3>
            <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
              Наш ИИ-сервер подключается к Duolingo и адаптирует уроки в реальном времени под ваш текущий уровень знаний!
            </p>
          </div>
          <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-6 relative border border-slate-200">
            <div className="h-full bg-emerald-500 animate-[bounce_1.5s_infinite]" style={{ width: '45%' }} />
          </div>
        </div>
      );
    }

    // If active lesson gameplay is loaded
    if (activeDuolingoLesson) {
      const parts = activeDuolingoLesson.parts;
      const isCompleted = duolingoStep >= parts.length || duolingoLives <= 0;
      
      if (isCompleted) {
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-6 animate-fade-in py-10">
            <div className="text-6xl animate-bounce">
              {duolingoLives > 0 ? "🏆" : "💀"}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-indigo-950 font-sans">
                {duolingoLives > 0 ? "Урок успешно пройден!" : "Жизни закончились!"}
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                {duolingoLives > 0 
                  ? "Потрясающая работа! Вы освоили новые навыки в игровом центре Duolingo." 
                  : "Не расстраивайтесь! Шахматы, языки и математика требуют времени. Попробуйте пройти урок заново."}
              </p>
            </div>

            {/* XP Gained Statistics and Streak Increment */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-emerald-600 block leading-tight font-mono">Набрано очков</span>
                <span className="text-lg font-mono font-black text-emerald-700">+{duolingoXP} XP</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-indigo-650 block leading-tight font-mono">Супер Серия</span>
                <span className="text-lg font-mono font-black text-indigo-700">
                  {duolingoLives > 0 ? userProfile.streak + 1 : userProfile.streak} дн
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (duolingoLives > 0) {
                  setUserProfile(prev => ({
                    ...prev,
                    streak: prev.streak + 1,
                    badgeCount: prev.badgeCount + 1,
                  }));
                }
                setActiveDuolingoLesson(null);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider px-6 py-3 rounded-full shadow-sm transition cursor-pointer select-none"
            >
              Вернуться в Лекторий lessons
            </button>
          </div>
        );
      }

      const currentPart = parts[duolingoStep];
      const isPartChecked = duolingoCheckedAnswers.includes(duolingoStep);
      const selectedOption = duolingoSelectedAnswers[duolingoStep];
      const selectedCorrectly = selectedOption === currentPart.correctAnswer;

      return (
        <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-xs space-y-5 animate-fade-in font-sans">
          
          {/* Duolingo HUD Panel Header */}
          <div className="flex justify-between items-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100 select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🦉</span>
              <div className="space-y-0.1">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-600 block leading-none font-mono">Курс: {activeDuolingoLesson.title}</span>
                <span className="text-[10px] font-black text-slate-950 block leading-none">Вопрос {duolingoStep + 1} из {parts.length}</span>
              </div>
            </div>

            {/* Lives ❤️ and Points */}
            <div className="flex items-center gap-2.5 font-mono text-xs font-bold">
              <div className="text-red-550 flex items-center gap-0.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span key={idx} className="transition duration-300">
                    {idx < duolingoLives ? "❤️" : "🤍"}
                  </span>
                ))}
              </div>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                {duolingoXP} XP
              </span>
            </div>
          </div>

          {/* Gamified Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${((duolingoStep) / parts.length) * 100}%` }}
            />
          </div>

          {/* Question Presentation Screen */}
          <div className="space-y-3 pt-1 select-none text-center">
            <div className="inline-block bg-slate-900 text-white rounded-2xl px-3 py-1 text-[8.5px] font-extrabold uppercase font-mono tracking-widest bg-emerald-600">
              DUOLINGO GAME PART
            </div>
            
            <h3 className="text-base font-black text-slate-950 px-2 leading-snug">
              {currentPart.question}
            </h3>
          </div>

          {/* Choice Option Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {currentPart.options.map((opt, oIdx) => {
              const optLetter = ["A", "B", "C", "D"][oIdx] || "•";
              const isSelected = selectedOption === opt;
              const isOptionCorrect = opt === currentPart.correctAnswer;
              
              let borderClass = "border-slate-202 bg-white text-slate-950 hover:bg-slate-50/40";
              if (isSelected) {
                borderClass = "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-600/10";
              }
              if (isPartChecked) {
                if (isOptionCorrect) {
                  borderClass = "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/10";
                } else if (isSelected) {
                  borderClass = "border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/10";
                }
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={isPartChecked}
                  onClick={() => {
                    setDuolingoSelectedAnswers(prev => ({
                      ...prev,
                      [duolingoStep]: opt
                    }));
                    if (siteVibration && "vibrate" in navigator) navigator.vibrate(10);
                  }}
                  className={`p-3.5 rounded-2xl border transition duration-150 text-left font-sans cursor-pointer flex gap-3.5 text-xs font-semibold ${borderClass}`}
                >
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {optLetter}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Verification check banner and Next operations */}
          <div className="space-y-3 pt-2">
            {!isPartChecked ? (
              <button
                type="button"
                onClick={() => handleDuoCheckAnswer(duolingoStep)}
                disabled={!selectedOption}
                className="w-full bg-[#58cc02] hover:bg-[#4cad00] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer select-none shadow-md transition scale-100 active:scale-98"
              >
                ✔️ Проверить ответ
              </button>
            ) : (
              <div className="space-y-3 animate-slide-up">
                {/* Visual Feedback Message Section */}
                {selectedCorrectly ? (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-sans font-black text-xs text-emerald-800">
                      <span>🟢</span>
                      <span>Правильно! +15 XP</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-emerald-880 font-medium">
                      <strong>Объяснение: </strong> {currentPart.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-50 text-rose-900 border border-rose-200 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-sans font-black text-xs text-rose-800">
                      <span>🔴</span>
                      <span>Ой, не совсем верно! Теряем одну жизнь.</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-rose-880 font-medium pb-0.5">
                      <strong>Правильный ответ: </strong> `{currentPart.correctAnswer}`
                    </p>
                    <p className="text-[10px] leading-relaxed text-rose-880 font-medium">
                      <strong>Объяснение: </strong> {currentPart.explanation}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDuolingoStep(prev => prev + 1)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer select-none shadow-md transition"
                >
                  Продолжить ▶
                </button>
              </div>
            )}
          </div>

        </div>
      );
    }

    // Default Selection Panel
    return (
      <div className="space-y-4 animate-fade-in p-1">
        
        {/* Playful Duolingo header card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-xs">
          <div className="w-16 h-16 bg-emerald-500 text-white text-4xl rounded-full flex items-center justify-center select-none shadow-md shrink-0">
            🦉
          </div>
          <div className="space-y-1 z-10">
            <h2 className="text-base font-black text-emerald-950 tracking-tight flex items-center gap-1 justify-center sm:justify-start">
              <span>Duolingo ИИ lessons</span>
              <span className="bg-[#4285F4] text-white text-[7px] font-black px-1.5 rounded uppercase font-mono tracking-widest leading-none">AI PLAY</span>
            </h2>
            <p className="text-[10.5px] leading-snug text-emerald-850 font-medium">
              Пройдите пятиступенчатые интерактивные тесты для освоения шахматной теории, языков или математики. Зарабатывайте XP очки!
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/40 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Categories Grid - Chess, Languages, Math */}
        <div className="space-y-2.5">
          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block font-bold">Выберите тему для быстрого игрового урока:</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            
            {/* Category 1: Chess */}
            <div className="bg-white border border-slate-200. rounded-2xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 relative group hover:border-[#4285F4] transition-all">
              <div className="space-y-2">
                <div className="text-3xl bg-amber-50 rounded-xl w-11 h-11 flex items-center justify-center border border-amber-100">♟️</div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-[#4285F4] transition leading-none">Шахматы & Эндшпиль</h3>
                <p className="text-[9.5px] leading-relaxed text-slate-500. font-medium">
                  Обучение тактическим связкам, теории миттельшпиля, рокировкам и вилкам в интерактивных разборах.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLoadDuolingoLesson("chess")}
                className="w-full bg-[#58cc02] hover:bg-[#4cad00] text-white text-[8px] font-extrabold uppercase tracking-widest py-2 rounded-lg cursor-pointer text-center select-none transition shadow-xs"
              >
                Начать Урок
              </button>
            </div>

            {/* Category 2: Languages */}
            <div className="bg-white border border-slate-202 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 relative group hover:border-[#4285F4] transition-all">
              <div className="space-y-2">
                <div className="text-3xl bg-blue-50 rounded-xl w-11 h-11 flex items-center justify-center border border-blue-100">🌐</div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-[#4285F4] transition leading-none">Иностранные Языки</h3>
                <p className="text-[9.5px] leading-relaxed text-slate-500. font-medium">
                  Игровой тренинг по лексике, спряжениям глаголов и грамматике английского / испанского языков.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLoadDuolingoLesson("languages")}
                className="w-full bg-[#58cc02] hover:bg-[#4cad00] text-white text-[8px] font-extrabold uppercase tracking-widest py-2 rounded-lg cursor-pointer text-center select-none transition shadow-xs"
              >
                Начать Урок
              </button>
            </div>

            {/* Category 3: Math */}
            <div className="bg-white border border-slate-202 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 relative group hover:border-[#4285F4] transition-all">
              <div className="space-y-2">
                <div className="text-3xl bg-purple-50 rounded-xl w-11 h-11 flex items-center justify-center border border-purple-100">📐</div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-[#4285F4] transition leading-none">Быстрая Математика</h3>
                <p className="text-[9.5px] leading-relaxed text-slate-500. font-medium">
                  Увлекательные задачки на логику, устный счет, комбинаторику и геометрическую смекалку.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLoadDuolingoLesson("math")}
                className="w-full bg-[#58cc02] hover:bg-[#4cad00] text-white text-[8px] font-extrabold uppercase tracking-widest py-2 rounded-lg cursor-pointer text-center select-none transition shadow-xs"
              >
                Начать Урок
              </button>
            </div>

          </div>
        </div>

      </div>
    );
  };

  // TAB 3: INTERACTIVE PRACTICE LAB (praktica)
  const renderPracticeTab = () => {
    const activePrac = practiceProblems[activePracticeIdx];

    return (
      <div className="space-y-4 animate-fade-in p-1">
        <div className="bg-white rounded-2xl border border-slate-202 p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[#34A853] font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
              <Code className="w-3.5 h-3.5" />
              Код-Лаборатория Google Sandbox
            </span>
            <span className="text-xs">⚡</span>
          </div>

          <h2 className="text-sm font-black text-slate-900 leading-none">Редактор Интерактивных Конспектов</h2>
          <p className="text-slate-655 text-[10.5px] leading-relaxed font-semibold">
            Закрепите полученные из лекций академические навыки во встроенном интерпретаторе. Выберите задачу ниже, заполните недостающие аргументы, запустите синтаксическую проверку и посмотрите вывод.
          </p>
        </div>

        {/* Task presets selector slider tabs */}
        <div className="flex gap-2 overflow-x-auto select-none py-1">
          {practiceProblems.map((prob, pIdx) => (
            <button
              key={prob.id}
              onClick={() => setActivePracticeIdx(pIdx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition whitespace-nowrap cursor-pointer ${
                pIdx === activePracticeIdx
                  ? "bg-[#34A853] text-white border-[#34A853]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-slate-202"
              }`}
            >
              {prob.title}
            </button>
          ))}
        </div>

        {/* Selected Task Details Sheet */}
        <div className="bg-white rounded-2xl border border-slate-202 p-4 space-y-3.5 shadow-sm">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8.5px] font-mono font-bold uppercase tracking-widest text-[#34A853]">
              <span>Задание {activePracticeIdx + 1}</span>
              <span>Язык: {activePrac.language}</span>
            </div>
            <h3 className="text-xs font-black text-slate-900">{activePrac.title}</h3>
            <p className="text-slate-600 text-[11px] leading-relaxed italic">
              "{activePrac.description}"
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Поручение:</span>
            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
              {activePrac.task}
            </p>
          </div>

          {/* Code Textarea Editor with line counter mockup */}
          <div className="space-y-1 bg-slate-950 rounded-2xl p-3 border border-slate-900 relative border-slate-202">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-450 select-none pb-2 border-b border-slate-900 uppercase">
              <span>Секция ввода кода (Интерактивная замена)</span>
              <span className="text-[#34A853]">● ACTIVE EDITING</span>
            </div>

            <textarea
              rows={5}
              value={practiceCode}
              onChange={(e) => {
                setPracticeCode(e.target.value);
                setPracticeSuccess(null);
              }}
              className="w-full bg-transparent font-mono text-[11px] text-emerald-400 focus:outline-none focus:ring-0 leading-relaxed border-none outline-none ring-0 p-1 resize-none h-[110px]"
            />

            <div className="absolute right-3 bottom-3 bg-slate-900/80 px-2 py-0.5 rounded text-[8px] font-mono text-slate-500 tracking-wider">
              {practiceCode.length} chars
            </div>
          </div>

          {/* Compiler Simulator output console */}
          {practiceOutput && (
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-950 font-mono text-[10px] space-y-1">
              <span className="text-slate-500 block select-none uppercase tracking-wide font-extrabold pb-1 border-b border-slate-800">
                Консольный Терминал вывода:
              </span>
              <p className="text-slate-200 whitespace-pre-line leading-relaxed pb-1">{practiceOutput}</p>
            </div>
          )}

          {/* Buttons and actions */}
          <div className="space-y-3.5">
            <div className="flex gap-2">
              <button
                onClick={handleCompilePracticeCode}
                className="flex-1 bg-[#34A853] hover:bg-[#2C8E47] text-white py-2 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow cursor-pointer select-none"
              >
                <Code className="w-3.5 h-3.5" />
                Проверить код
              </button>

              <button
                onClick={() => setShowPracticeHint(prev => !prev)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 transition select-none cursor-pointer"
                title="Показать подсказку"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Hint Box revealed */}
            <AnimatePresence>
              {showPracticeHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#FFF9E6] border border-[#FFE082] rounded-xl p-3 text-[10px] text-[#B78103] leading-relaxed space-y-1"
                >
                  <span className="font-extrabold uppercase select-none block">💡 Академическая Подсказка:</span>
                  <p>{activePrac.hint}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reward Streak progress block upon completion */}
            {practiceSuccess === true && (
              <div className="bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl p-3 text-center text-[#137333] space-y-1 animate-bounce">
                <span className="text-lg block">🌟</span>
                <span className="text-[11px] font-black uppercase tracking-wider block">Упражнение Зачтено!</span>
                <p className="text-[9.5px] leading-relaxed px-2">
                  Результат совпал с эталонным. Студучет повысил ваш академических рейтинг в базе данных. Вы заработали 1 очко дневного стейка!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleLoadDuolingoLesson = async (subject: string) => {
    const topicBySubject: Record<string, string> = {
      chess: "Шахматы: тактика, дебюты и эндшпиль для начинающих",
      languages: "Иностранные языки: лексика, грамматика и переводы",
      math: "Быстрая математика: логика, уравнения и геометрия",
    };

    setIsGeneratingDuo(true);
    setActiveDuolingoLesson(null);
    setDuolingoCheckedAnswers([]);
    setDuolingoSelectedAnswers({});
    setDuolingoStep(0);
    setDuolingoLives(3);
    setDuolingoXP(0);
    
    if (siteVibration && "vibrate" in navigator) navigator.vibrate(50);

    try {
      const response = await fetch("/api/courses/generate-duolingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicBySubject[subject] || subject })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Could not retrieve Duolingo lesson");
      }
      const course = await response.json();

      const gameParts = (course.lessons || []).flatMap((lesson: { parts?: Array<Record<string, unknown>> }) =>
        (lesson.parts || [])
          .filter((p) => p.type === "duolingo_game")
          .map((p) => ({
            question: String(p.gameQuestion || p.content || ""),
            options: Array.isArray(p.gameOptions) ? p.gameOptions.map(String) : [],
            correctAnswer: String(p.gameAnswer || ""),
            explanation: String(p.metadata || "Отличная работа! Продолжайте учиться."),
          }))
      );

      const quizParts = (course.quizzes || []).map((q: QuizQuestion) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Правильный ответ выбран.",
      }));

      const parts = gameParts.length > 0 ? gameParts : quizParts;

      if (parts.length > 0) {
        setActiveDuolingoLesson({
          title: course.title || "Duolingo урок",
          parts,
        });
        onRefreshCourses();
      } else {
        alert("Ошибка генерации. Пожалуйста, попробуйте еще раз.");
      }
    } catch(e) {
      console.warn("Duo lesson load error:", e);
      alert("❌ Ошибка соединения при загрузке интерактивного урока.");
    } finally {
      setIsGeneratingDuo(false);
    }
  };

  const handleDuoCheckAnswer = (partIdx: number) => {
    if (!activeDuolingoLesson) return;
    const currentPart = activeDuolingoLesson.parts[partIdx];
    const selected = duolingoSelectedAnswers[partIdx];
    
    if (!selected) {
      alert("Пожалуйста, выберите ответ!");
      return;
    }

    const isCorrect = selected === currentPart.correctAnswer;
    
    if (siteVibration && "vibrate" in navigator) {
      if (isCorrect) {
        navigator.vibrate([40, 40]);
      } else {
        navigator.vibrate([100, 50, 100]);
      }
    }

    setDuolingoCheckedAnswers(prev => [...prev, partIdx]);
    
    if (isCorrect) {
      setDuolingoXP(prev => prev + 15);
    } else {
      setDuolingoLives(prev => Math.max(0, prev - 1));
    }
  };

  const handleYouTubeSearch = async () => {
    if (!videoSearchQuery.trim()) return;
    setIsVideoSearching(true);
    if (siteVibration && "vibrate" in navigator) navigator.vibrate(30);

    try {
      const response = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: videoSearchQuery })
      });
      if (!response.ok) throw new Error("API responded with an error");
      const matchedVideos = await response.json();
      
      if (matchedVideos && matchedVideos.length > 0) {
        setAiExtraVideos(matchedVideos);
        setVideoActiveIdx(0); // Activate the first search card
        setVideoPlaying(true);
        alert(`🎓 ИИ подобрал ${matchedVideos.length} видеолекций из YouTube специально для вас! Приятного просмотра.`);
      } else {
        alert("🔍 Ничего не найдено. Напишите другой запрос!");
      }
    } catch (e: any) {
      console.warn("YouTube AI search request failed:", e);
      alert("❌ Временный сбой AI-поиска видео. Пожалуйста, попробуйте снова.");
    } finally {
      setIsVideoSearching(false);
    }
  };

  // TAB 5: VIDEO LESSONS GALLERY (video)
  const renderVideoTab = () => {
    if (videoLessons.length === 0) {
      return (
        <div className="text-center py-16 text-slate-500 text-sm">
          Видеоуроков пока нет. Администратор может добавить их в панели «Видео».
        </div>
      );
    }

    const activeVideo = videoLessons[videoActiveIdx] || videoLessons[0];

    return (
      <div className="space-y-4 animate-fade-in p-1 font-sans text-slate-800">
        
        {/* YouTube Video Search Deck */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">Поиск обучающих видео на YouTube</h4>
            <p className="text-[9.5px] text-slate-500">Введите тему (например, "обучение шахматам", "javascript react") и ИИ подберет ролики</p>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={videoSearchQuery}
              onChange={(e) => setVideoSearchQuery(e.target.value)}
              placeholder="Тема лекции или навыка..."
              className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#4285F4] focus:bg-white outline-none rounded-xl font-medium transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleYouTubeSearch();
              }}
            />
            <button
              onClick={handleYouTubeSearch}
              disabled={isVideoSearching || !videoSearchQuery.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shrink-0"
            >
              {isVideoSearching ? (
                <>
                  <span className="animate-spin text-xs">⏳</span>
                  <span>Поиск...</span>
                </>
              ) : (
                <>
                  <span>🔍 Искать</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Curved Media Monitor Viewer mockup with overlay */}
        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-950 shadow flex flex-col justify-between">
          
          {/* Virtual Retro Monitor Frame Screen / Real YouTube Embed Player */}
          <div className="bg-slate-950 rounded-t-2xl h-[220px] relative flex flex-col justify-center items-center text-white text-center overflow-hidden">
            {activeVideo && activeVideo.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=${videoPlaying ? 1 : 0}&enablejsapi=1&rel=0`}
                title={activeVideo.title}
                className="w-full h-full border-0 absolute inset-0 rounded-t-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : activeVideo && activeVideo.videoUrl ? (
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay={videoPlaying}
                className="w-full h-full object-contain absolute inset-0 rounded-t-2xl bg-black"
              />
            ) : activeVideo ? (
              <>
                <div className="absolute top-2.5 left-3.5 bg-rose-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse z-10">
                  ● Live Stream
                </div>

                <div className="absolute top-2.5 right-3.5 bg-slate-800/80 px-2 py-0.5 rounded text-[8px] font-sans text-slate-350 tracking-wider z-10">
                  {activeVideo.category}
                </div>

                {videoPlaying ? (
                  <div className="space-y-2 text-center z-10">
                    <div className="flex gap-1 justify-center items-end h-6 pb-1">
                      <div className="w-1 bg-[#4285F4] rounded-t animate-pulse h-5" style={{ animationDuration: '0.6s' }} />
                      <div className="w-1 bg-[#EA4335] rounded-t animate-pulse h-3" style={{ animationDuration: '0.4s' }} />
                      <div className="w-1 bg-[#FBBC05] rounded-t animate-pulse h-6" style={{ animationDuration: '0.7s' }} />
                      <div className="w-1 bg-[#34A853] rounded-t animate-pulse h-4" style={{ animationDuration: '0.5s' }} />
                      <div className="w-1 bg-[#4285F4] rounded-t animate-pulse h-2" />
                    </div>
                    <span className="text-xs font-bold font-mono tracking-wider block text-slate-350">Трансляция видеоурока...</span>
                    <p className="text-[9.5px] italic text-[#34A853] font-semibold">"Поток данных стабилен, скорость: {videoSpeed}"</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(true)}
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg transition duration-200 cursor-pointer text-sm z-10"
                  >
                    ▶
                  </button>
                )}

                <span className="absolute bottom-2 left-3.5 text-[10px] font-extrabold text-[#4285F4] font-mono z-10">
                  {activeVideo.thumbnailText}
                </span>

                <span className="absolute bottom-2 right-3.5 text-[10px] font-bold text-slate-400 font-mono z-10">
                  Длительность: {activeVideo.duration}
                </span>
              </>
            ) : (
              <p className="text-xs text-slate-400">Поиск видео...</p>
            )}
          </div>

          {/* Player controls deck bar with speed selectors and play click handlers */}
          <div className="bg-slate-950 p-3 flex flex-col gap-2 border-t border-slate-900 select-none">
            
            {/* Slide progress timer timeline */}
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] text-slate-455 font-mono font-bold">03:45</span>
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(((e.clientX - rect.left) / rect.width) * 105);
                  setVideoProgress(pct);
                }}
                className="flex-grow bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer relative"
              >
                <div 
                  className="h-full bg-[#EA4335] transition-all"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <span className="text-[8.5px] text-slate-455 font-mono font-bold">{activeVideo.duration}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVideoPlaying(prev => !prev)}
                  className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded font-bold text-[9px] cursor-pointer"
                >
                  {videoPlaying ? "⏸ Пауза" : "▶ Воспроизвести"}
                </button>

                <button
                  type="button"
                  onClick={() => setVideoProgress(35)}
                  className="p-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-white text-[9px] cursor-pointer"
                  title="Сбросить время"
                >
                  🔄
                </button>
              </div>

              {/* speed selectors */}
              <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 text-[8.5px] font-bold font-mono text-slate-350">
                {["1.0x", "1.5x", "2.0x"].map(spd => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setVideoSpeed(spd)}
                    className={`px-1 rounded text-[8px] transition cursor-pointer ${
                      videoSpeed === spd ? "bg-[#EA4335] text-white font-black" : "hover:text-white"
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Video Meta details information below */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <span className="bg-[#4285F4]/10 text-[#4285F4] font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 border border-[#4285F4]/20 rounded-md">
            {activeVideo.category}
          </span>
          <h3 className="text-xs font-black text-slate-950 leading-tight pt-1">
            {activeVideo.title}
          </h3>
          <p className="text-slate-655 text-[10.5px] leading-relaxed">
            {activeVideo.description}
          </p>
          
          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] text-slate-500 font-medium space-y-0.5">
            <div>🎙️ Спикер: <strong>{activeVideo.instructor}</strong></div>
            <div>📊 Просмотры лектория: <strong>{activeVideo.views}</strong> раз</div>
          </div>
        </div>

        {/* Curated videos scroll list */}
        <div className="space-y-2.5">
          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Другие эфиры видео-колледжа ({videoLessons.length}):</span>
          
          {videoLessons.map((vd, index) => {
            const isActive = index === videoActiveIdx;
            return (
              <button
                key={vd.id}
                onClick={() => {
                  setVideoActiveIdx(index);
                  setVideoPlaying(false);
                  setVideoProgress(35);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex gap-3 cursor-pointer items-center ${
                  isActive 
                    ? "bg-white border-[#EA4335]/70" 
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="bg-slate-900 text-slate-350 w-11 h-11 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-950 font-mono">
                  🎞️ {vd.thumbnailText.split(" ")[0]}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  <h4 className="font-extrabold text-slate-900 text-xs truncate leading-snug">
                    {vd.title}
                  </h4>
                  <p className="text-slate-450 text-[10px] truncate">
                    {vd.description}
                  </p>
                  <span className="text-[8.5px] text-slate-400 block font-mono">
                    Спикер: {vd.instructor.split(" (")[0]} | {vd.duration} мин
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    );
  };

  // TAB 6: AUTHENTICATION PROFILE & CREDENTIALS CONTROLS
  const renderProfileTab = () => {
    const availableAvatars = ["🎒", "🎓", "💻", "🧠", "⚡", "🚀", "🥷", "🌿", "📖", "🥇", "👨‍💻", "👩‍💻"];

    return (
      <div className="space-y-6 animate-fade-in text-slate-800">
        {/* Minimalist Grid layout: Left are two small cards stacked, Right is one large card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT SIDE: TWO SMALL STACKED CARDS */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Card 1: Elegant Student ID Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 font-mono tracking-wider block">Студенческий билет</span>
              
              <div className="flex items-center gap-3">
                {renderAvatar(userProfile.avatar, "w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-2xl shrink-0")}
                <div className="overflow-hidden min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                    {profileFirstName} {profileLastName}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5 lowercase">
                    {userProfile.email}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5 text-[10px] font-medium text-slate-500">
                <div className="flex justify-between items-center bg-slate-50/50 p-1 px-1.5 rounded-md">
                  <span>Телефон:</span>
                  <span className="font-mono text-slate-900 font-bold">{profilePhone || "Не указан"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Статус:</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     Активен
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ударные дни:</span>
                  <span className="text-amber-600 font-bold">🔥 {userProfile.streak} дн</span>
                </div>
              </div>
            </div>

            {/* Card 2: Security & Quick Settings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 font-mono tracking-wider block font-bold">Безопасность и настройки</span>
              
              <div className="space-y-3">
                {/* Face ID Status toggle */}
                <div className="flex justify-between items-center text-[10px]">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-950 flex items-center gap-1">
                      <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                      Face ID Авторизация
                    </div>
                    <p className="text-[8.5px] text-slate-400">Быстрый биометрический вход</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!storedFaceIdTemplate) {
                        startFaceScan("register");
                      } else {
                        // Clear registered face template
                        setStoredFaceIdImage(null);
                        setStoredFaceIdTemplate(null);
                        localStorage.removeItem("stored_face_id_image");
                        localStorage.removeItem("stored_face_id_template");
                        setProfileFaceId(false);
                        alert("🗑 Шаблон Face ID успешно удален.");
                      }
                      if (siteVibration && "vibrate" in navigator) navigator.vibrate(15);
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-[8.5px] transition-all border cursor-pointer ${
                      storedFaceIdTemplate 
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs" 
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {storedFaceIdTemplate ? "АКТИВЕН" : "ОТКЛ"}
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* Vibration Toggle */}
                <div className="flex justify-between items-center text-[10px]">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-950 flex items-center gap-1">
                      <span className="text-[12px]">📳</span>
                      Тактильный отклик
                    </div>
                    <p className="text-[8.5px] text-slate-400">Вибрация экрана на касание</p>
                  </div>
                  <button
                    onClick={() => {
                      setSiteVibration(!siteVibration);
                      if (!siteVibration && "vibrate" in navigator) navigator.vibrate(30);
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-[8.5px] transition-all border cursor-pointer ${
                      siteVibration 
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {siteVibration ? "ВКЛ" : "ВЫКЛ"}
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* Language selection toggle */}
                <div className="flex justify-between items-center text-[10px]">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-950 block">Язык</span>
                    <p className="text-[8.5px] text-slate-400">Текущий язык Лектория</p>
                  </div>
                  <button
                    onClick={() => {
                      setSiteLanguage(siteLanguage === "ru" ? "en" : "ru");
                      if (siteVibration && "vibrate" in navigator) navigator.vibrate(10);
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg font-bold text-[8.5px] cursor-pointer"
                  >
                    {siteLanguage === "ru" ? "Ru" : "En"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: LARGE COMPACT REGISTRATION / EDIT CARD */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 select-none">
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">Регистрация профиля</h3>
                  <p className="text-[10px] text-slate-400">Имя, фамилия, телефон и Face ID</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSsoModalOpen(true)}
                  className="bg-slate-50 hover:bg-slate-100 text-[#4285F4] text-[9px] font-black px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  🌐 Вход SSO
                </button>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-450 font-mono block">Имя</label>
                  <input
                    type="text"
                    value={profileFirstName}
                    onChange={(e) => handleProfileNameChange(e.target.value, profileLastName)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#4285F4] focus:bg-white outline-none rounded-xl font-medium transition"
                    placeholder="Ваше имя"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-450 font-mono block">Фамилия</label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => handleProfileNameChange(profileFirstName, e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#4285F4] focus:bg-white outline-none rounded-xl font-medium transition"
                    placeholder="Ваша фамилия"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-455 font-mono block">Номер телефона</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-450 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#4285F4] focus:bg-white outline-none rounded-xl font-mono font-medium transition"
                      placeholder="+7"
                    />
                  </div>
                </div>

                {/* Face ID Switch inside Large Card */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-455 font-mono block font-bold">Биометрия (Регистрация Face ID)</label>
                  <button
                    type="button"
                    onClick={() => {
                      startFaceScan("register");
                    }}
                    className={`w-full flex items-center justify-between text-xs p-2.5 rounded-xl border transition cursor-pointer ${
                      storedFaceIdTemplate 
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-xs" 
                        : "bg-slate-50 border-slate-200 text-slate-550"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <Fingerprint className={`w-4 h-4 ${storedFaceIdTemplate ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
                      {storedFaceIdTemplate ? "Face ID Настроен" : "Настроить Face ID"}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {storedFaceIdTemplate ? "АКТИВЕН" : "НАЖАТЬ"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Avatar choosing grid */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1.5">
                  <label className="text-[9px] font-extrabold uppercase text-slate-455 font-mono block">🎭 Студенческий эмодзи-аватар или личное фото</label>
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              handleAvatarChange(reader.result);
                              if (siteVibration && "vibrate" in navigator) navigator.vibrate(40);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="custom-avatar-file-upload"
                    />
                    <label
                      htmlFor="custom-avatar-file-upload"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-bold rounded-md cursor-pointer transition uppercase tracking-wider shadow-xs select-none"
                    >
                      📁 Из галереи
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {availableAvatars.map((av) => {
                    const isSelected = userProfile.avatar === av;
                    return (
                      <button
                        key={av}
                        onClick={() => {
                          handleAvatarChange(av);
                          if (siteVibration && "vibrate" in navigator) navigator.vibrate(10);
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs scale-105"
                            : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {av}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Registration Action Form Save Button */}
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (siteVibration && "vibrate" in navigator) navigator.vibrate(60);
                  alert(`🎉 Студент ${profileFirstName} ${profileLastName} успешно зарегистрирован во внутренней базе данных Лектория!`);
                }}
                className="flex-1 bg-[#4285F4] hover:bg-[#357ae8] text-white rounded-xl py-2.5 px-4 text-xs font-black transition text-center uppercase tracking-wider cursor-pointer shadow-sm select-none"
              >
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* COLLAPSIBLE MINIMALIST ACCORDIONS TO REDUCE VERTICAL HEIGHT */}
        {/* ========================================================== */}
        <div className="space-y-4">
          
          {/* ACCORDION 1: ВЫПУСКНОЙ СЕРТИФИКАТ */}
          <div className="bg-[#E6F4EA] border border-[#A8DAB5] rounded-2xl overflow-hidden shadow-xs transition-all text-slate-800">
            <button
              onClick={() => {
                setCertExpanded(!certExpanded);
                if (siteVibration && "vibrate" in navigator) navigator.vibrate(15);
              }}
              className="w-full flex justify-between items-center py-3.5 px-5 bg-transparent hover:bg-emerald-50/50 transition cursor-pointer font-sans text-[#137333]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#137333]">Выпускной Сертификат</span>
              </div>
              <span className="text-[10px] text-[#137333] font-mono tracking-widest font-extrabold uppercase">
                {certExpanded ? "Свернуть ▲" : "Развернуть ▼"}
              </span>
            </button>

            {certExpanded && (
              <div className="p-5 border-t border-[#A8DAB5]/60 space-y-4 bg-white/75 animate-fade-in">
                <p className="text-[9.5px] text-slate-600 leading-relaxed px-1">
                  При завершении проверочной лекции вы вправе выгрузить электронную верификацию квалификации.
                </p>

                {/* Certificate design mock preview */}
                <div className="bg-white border-2 border-dashed border-[#A8DAB5] rounded-xl p-4 text-center text-slate-800 space-y-3 relative font-serif shadow-inner">
                  <div className="text-[8px] font-sans uppercase tracking-[0.14em] text-slate-400 font-extrabold leading-none pb-1 font-mono">
                    ★ EduHub Google Scholar Certificate ★
                  </div>

                  <p className="text-[9px] italic text-slate-500 leading-none">Настоящий документ удостоверяет, что:</p>
                  <h4 className="text-xs font-black text-slate-900 tracking-wide font-sans leading-none">
                    {profileFirstName} {profileLastName}
                  </h4>
                  
                  <p className="text-[8.5px] leading-relaxed italic px-2">
                    Успешно прослушал лекции Академии, сдал сопутствующие тесты контроля знаний и прошел синтаксическую практику программирования.
                  </p>

                  <div className="flex justify-between items-center text-[7.5px] font-sans uppercase text-slate-400 pt-2.5 border-t border-slate-100 font-mono font-bold leading-none">
                    <div>Дата: {new Date().toLocaleDateString()}</div>
                    <div className="text-[#34A853]">Подпись: Капуста ИИ</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    alert(`🎉 Академический Сертификат выгружен успешно во временный архив для пользователя: ${profileFirstName} ${profileLastName}!`);
                  }}
                  className="w-full bg-[#34A853] hover:bg-[#2C8E47] text-white py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 select-none"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Распечатать / Скачать PDF
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  // Switch dispatcher for tabs content
  const tabBodyContent = () => {
    switch (currentTab) {
      case "home":
        return renderHomeTab();
      case "lessons":
        return renderLessonsTab();
      case "search":
        return renderSearchTab();
      case "video":
        return renderVideoTab();
      case "profile":
        return renderProfileTab();
      default:
        return renderHomeTab();
    }
  };

  // ================= MAIN RENDER =================

  const navTabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "lessons" as const, label: "Lessons", icon: BookOpen },
    { id: "center" as const, label: "", icon: Zap, isFab: true },
    { id: "video" as const, label: "Video", icon: Video },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <div className="pb-28 min-h-[520px]">
      {renderCampusProfileHeader()}
      {renderMarketModal()}
      {renderLeaderboardModal()}
      <div className="min-h-[480px]">{tabBodyContent()}</div>

      {/* Bottom nav — wellness app style with center FAB */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pb-4 pointer-events-auto">
          <div className="bg-white rounded-[28px] border border-isa-border py-2 px-2 flex justify-around items-end isa-shadow">
            {navTabs.map((tab) => {
              if (tab.isFab) {
                return (
                  <button
                    key="center"
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="isa-nav-fab cursor-pointer"
                    title="Kapusta AI tutor"
                  >
                    <Zap className="w-5 h-5 fill-isa-navy" />
                  </button>
                );
              }
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCurrentTab(tab.id);
                    if (tab.id !== "lessons") setActiveCourse(null);
                  }}
                  className={`flex flex-col items-center py-2 px-3 rounded-2xl transition cursor-pointer min-w-[56px] ${
                    active ? "isa-nav-item--active text-isa-navy font-bold" : "text-isa-muted"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
                  <span className={`text-[10px] font-semibold mt-0.5 ${active ? "font-bold" : ""}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic SSO overlay modal panel */}
      <AnimatePresence>
        {ssoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-center items-center gap-1">
                <span className="text-[#4285F4] font-extrabold">G</span>
                <span className="text-[#EA4335] font-extrabold">o</span>
                <span className="text-[#FBBC05] font-extrabold">o</span>
                <span className="text-[#4285F4] font-extrabold">g</span>
                <span className="text-[#34A853] font-extrabold">l</span>
                <span className="text-[#EA4335] font-extrabold">e</span>
                <span className="text-slate-400 font-semibold text-xs ml-1 font-mono">Sign In</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-none">Выберите способ входа:</span>
                <p className="text-[9.5px] text-slate-500 pb-2">Авторизуйтесь моментально по лицу или выберите аккаунт:</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSsoModalOpen(false);
                  startFaceScan("authenticate");
                }}
                className="w-full flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-indigo-600 hover:bg-[#4338ca] text-white font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                <Fingerprint className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Войти по Face ID (Скан лица)</span>
              </button>

              <div className="relative flex py-1 items-center select-none">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-2 text-slate-400 text-[7.5px] font-black uppercase tracking-widest leading-none">ИЛИ ТЕСТОВЫЙ АККАУНТ</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Михаил Студент", email: "student.mikhail@gmail.com", avatar: "🎒", streak: 5, tier: "Google Scholar Premium" },
                  { name: "Дарья Отличница", email: "dasha.expert@gmail.com", avatar: "🎓", streak: 7, tier: "Google Scholar Premium" },
                  { name: "Владислав Гость", email: "guest.vlad.99@gmail.com", avatar: "🕊️", streak: 1, tier: "Бесплатный Ученик" }
                ].map((prof, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      const parts = prof.name.split(" ");
                      setProfileFirstName(parts[0] || "");
                      setProfileLastName(parts[1] || "");
                      setUserProfile({
                        name: prof.name,
                        email: prof.email,
                        tier: prof.tier,
                        streak: prof.streak,
                        avatar: prof.avatar,
                        badgeCount: prof.streak
                      });
                      setSsoModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-[#E8F0FE] border border-slate-200 hover:border-[#4285F4] transition flex items-center gap-2.5 cursor-pointer font-sans"
                  >
                    <span className="text-xl bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center">{prof.avatar}</span>
                    <div className="space-y-0.1 overflow-hidden font-medium">
                      <span className="text-[11px] font-black text-slate-900 block leading-none">{prof.name}</span>
                      <span className="text-[8.5px] text-slate-400 block truncate">{prof.email}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSsoModalOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition select-none"
              >
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Face ID — liveness: eyes open → closed → open */}
      <AnimatePresence>
        {faceScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="isa-card max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-isa-gold-pale rounded-full flex items-center justify-center border border-isa-gold/40">
                  <Fingerprint className="w-6 h-6 text-isa-navy" />
                </div>
                <h3 className="text-base font-bold text-isa-navy font-[family-name:var(--font-display)]">
                  {faceScannerMode === "register" ? "Campus Face ID registration" : "Face ID sign-in"}
                </h3>
                <p className="text-[11px] text-isa-muted">
                  Liveness check: eyes open → closed → open again
                </p>
              </div>

              {/* Step progress */}
              <div className="flex justify-center gap-2">
                {FACE_PHASE_STEPS.map((step, i) => {
                  const current = FACE_PHASE_STEPS.indexOf(
                    faceScanPhase as (typeof FACE_PHASE_STEPS)[number]
                  );
                  const done = current > i || faceScanPhase === "capturing" || faceScanPhase === "success";
                  const active = faceScanPhase === step;
                  return (
                    <div
                      key={step}
                      className={`flex flex-col items-center gap-0.5 ${
                        done ? "opacity-100" : active ? "opacity-100" : "opacity-35"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                          done
                            ? "bg-isa-navy border-isa-navy text-isa-gold-light"
                            : active
                              ? "bg-isa-gold-pale border-isa-gold text-isa-navy scale-110"
                              : "bg-white border-isa-border text-isa-muted"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span className="text-[8px] font-semibold text-isa-muted max-w-[52px] leading-tight">
                        {step === "eyes_open_1"
                          ? "Открыть"
                          : step === "eyes_closed"
                            ? "Закрыть"
                            : "Открыть"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="relative w-52 h-52 mx-auto rounded-full overflow-hidden border-[3px] border-isa-gold bg-isa-navy shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-0 pointer-events-none"
                  aria-hidden
                />
                <canvas
                  ref={canvasRef}
                  width={208}
                  height={208}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                {faceScannerStatus === "camera-active" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-isa-gold-pale text-isa-muted text-xs gap-2 z-10">
                    <span className="animate-spin text-xl">⏳</span>
                    <span>Starting camera…</span>
                  </div>
                )}
                {faceScanPhase === "success" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-isa-navy/90 text-isa-gold-light">
                    <span className="text-4xl">✔</span>
                    <span className="text-xs font-bold mt-1">Verified</span>
                  </div>
                )}
              </div>

              <div className="wellness-card-soft px-4 py-3 min-h-[52px] flex items-center justify-center">
                <p className="text-sm font-semibold text-isa-navy leading-snug">
                  {faceScannerMessage}
                </p>
              </div>

              {faceScanPhase !== "success" && faceScanPhase !== "capturing" && (
                <button
                  type="button"
                  onClick={advanceSimulatedBlinkStep}
                  className="w-full py-2.5 wellness-btn-primary text-sm cursor-pointer"
                >
                  {faceSimulatedMode
                    ? faceScanPhase === "eyes_open_1"
                      ? "✓ Eyes open — next"
                      : faceScanPhase === "eyes_closed"
                        ? "✓ Eyes closed — next"
                        : faceScanPhase === "eyes_open_2"
                          ? "✓ Eyes open again — finish"
                          : "Confirm step"
                    : "Skip step (manual)"}
                </button>
              )}

              <button
                type="button"
                onClick={closeFaceScanner}
                className="w-full py-2.5 text-sm font-semibold text-isa-muted hover:text-isa-navy cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING COLLAPSED / EXPANDED AI TUTOR COMPANION PANEL (KAPUSTA AI) */}
      <div className="fixed bottom-5 right-5 z-40">
        <AnimatePresence>
          {chatOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-[310px] md:w-[360px] h-[450px] bg-white rounded-2xl border border-slate-250 shadow-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Chat Panel Header - Google Accent with green dots */}
              <div className="bg-isa-navy p-3 text-isa-gold-light flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center text-sm">
                    🌿
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-none">Капуста AI</h3>
                    <span className="text-[10px] text-white/90 block mt-0.5">● Онлайн</span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages flow scrolling viewport */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-[10.5px] space-y-1 select-none">
                    <span>Вы можете спросить ИИ Капусту о чем угодно в лекционном курсе!</span>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-xl p-2.5 text-[11px] leading-relaxed space-y-1 ${
                      msg.role === 'user'
                        ? 'bg-[#4285F4] text-white shadow-sm rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-line break-words">{msg.content}</p>
                      <span className={`block text-[7.5px] font-mono text-right leading-none ${msg.role === 'user' ? 'text-blue-105' : 'text-slate-400'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-205 rounded-xl p-2.5 text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <span className="animate-bounce">🌿</span>
                      <span>Анализ теории...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Interactive Quick prompts sliders */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto select-none font-sans">
                <button
                  type="button"
                  onClick={() => setChatInput("Объясни, пожалуйста, последний пройденный абзац максимально простыми словами.")}
                  className="whitespace-nowrap bg-slate-50 hover:bg-[#E8F0FE] border border-slate-200 text-slate-700 hover:text-[#1967D2] transition px-2.5 py-1 text-[9px] rounded-full cursor-pointer font-bold shrink-0"
                >
                  📝 Простым словом
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput("Приведи ещё 3 понятных примера в быту на пройденную тему.")}
                  className="whitespace-nowrap bg-slate-50 hover:bg-[#E8F0FE] border border-slate-200 text-slate-700 hover:text-[#1967D2] transition px-2.5 py-1 text-[9px] rounded-full cursor-pointer font-bold shrink-0"
                >
                  💡 Бытовые примеры
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput("Какие типичные ловушки или ошибки делают новички здесь?")}
                  className="whitespace-nowrap bg-slate-50 hover:bg-[#E8F0FE] border border-slate-200 text-slate-700 hover:text-[#1967D2] transition px-2.5 py-1 text-[9px] rounded-full cursor-pointer font-bold shrink-0"
                >
                  ⚠️ Избежать ошибок
                </button>
              </div>

              {/* Chat inputs submission widget */}
              <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChatMessage();
                  }}
                  placeholder="Вопрос по лекциям к Kapusta AI..."
                  className="flex-grow text-xs px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:border-[#4285F4] focus:outline-none"
                />
                
                <button
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || isTyping}
                  className="p-2 bg-[#4285F4] hover:bg-blue-600 text-white rounded-xl shadow cursor-pointer disabled:bg-slate-300 transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed-bubble"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setChatOpen(true);
                if (chatMessages.length === 0) {
                  setChatMessages([
                    {
                      id: "greet-" + Date.now(),
                      role: "model",
                      content: `Привет! Я твой Код-репетитор ИИ Капуста (Kapusta AI). Я готов помочь разобраться с программированием, сложными терминами или вопросами. Задай мне любой вопрос! 🌿`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }
              }}
              className="bg-isa-navy hover:bg-isa-navy-mid text-isa-gold-light p-3.5 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer border-2 border-isa-gold/50 font-sans select-none relative"
            >
              <span className="text-xl">🌿</span>
              <span className="text-[11px] font-bold">Капуста AI</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
