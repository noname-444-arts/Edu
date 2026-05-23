export interface LessonPart {
  type: 'text' | 'code' | 'warning' | 'tip' | 'duolingo_game';
  content: string;
  metadata?: string;
  gameQuestion?: string;
  gameOptions?: string[];
  gameAnswer?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  parts: LessonPart[];
  estimatedTime: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: Lesson[];
  quizzes: QuizQuestion[];
  createdWithAI: boolean;
  promptUsed?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface StudentStats {
  completedLessons: string[];
  gradedQuizzes: { [courseId: string]: { score: number; maxScore: number; date: string } };
  aiChatMessagesCount: number;
}

export interface FeedbackLog {
  id: string;
  courseId?: string;
  courseTitle?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AdminStats {
  coursesCount: number;
  aiGenerationsCount: number;
  quizzesTakenCount: number;
  averageQuizScorePct: number;
  feedbacksCount: number;
}

export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  instructor: string;
  views: number;
  category: string;
  thumbnailUrl?: string;
}

export interface PlatformVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  views: number;
  category: string;
  thumbnailText: string;
  youtubeId?: string;
  videoUrl?: string;
  sourceType: "youtube" | "upload" | "url";
  createdAt: string;
}

export interface PromoEvent {
  id: string;
  imageUrl: string;
  description: string;
}

export interface SiteContent {
  videos: PlatformVideo[];
  events: PromoEvent[];
}

export type AdminTabId = "videos" | "events";

export interface PracticeQuestion {
  id: string;
  title: string;
  description: string;
  task: string;
  initialCode: string;
  expectedResult: string;
  correctCodeSnippet: string;
  language: string;
  hint: string;
}
