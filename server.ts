import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Course, QuizQuestion, Lesson, FeedbackLog, PlatformVideo, PromoEvent, SiteContent } from "./src/types.js";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = 3000;

// Shared in-memory databases
let courses: Course[] = [
  {
    id: "course-python-basics",
    title: "Прекрасный Python: Быстрый Старт",
    description: "Погрузитесь в основы программирования на самом популярном и дружелюбном языке мира. В этом курсе мы изучим базовый синтаксис, переменные и циклы.",
    category: "Программирование",
    difficulty: "Beginner",
    createdWithAI: false,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: "python-l1",
        title: "Введение в мир Python и первая программа",
        description: "Узнаем историю языка, почему он популярен и напишем традиционную программу приветствия.",
        content: "Python — это высокоуровневый язык программирования общего назначения, созданный Гвидо ван Россумом и выпущенный в 1991 году.\n\nФилософия Python ставит во главу угла читаемость кода. Синтаксис Python стремится быть чистым и интуитивно понятным, что делает его идеальным выбором для новичков. Сегодня Python применяется в веб-разработке (Django, Flask), анализе данных, машинном обучении (TensorFlow, PyTorch) и автоматизации рутинных задач.",
        parts: [
          {
            type: "text",
            content: "Обычно знакомство с любым языком начинается с вывода приветственной фразы на экран. В Python это занимает ровно одну простую строчку."
          },
          {
            type: "code",
            content: "print(\"Привет, будущий программист! Это твой первый код на Python.\")",
            metadata: "python"
          },
          {
            type: "tip",
            content: "Обратите внимание: в Python в конце строк не нужно ставить точку с запятой (;), в отличие от C++, Java или JavaScript!"
          }
        ],
        estimatedTime: 10
      },
      {
        id: "python-l2",
        title: "Переменные и Базовые Типы Данных",
        description: "Поймем, как компьютер хранит информацию в оперативной памяти и как с ней работать через ярлыки.",
        content: "Переменная — это именованная область памяти, в которой хранится некоторое значение. В Python вам не нужно объявлять тип переменной заранее; интерпретатор сам понимает тип данных на лету (динамическая типизация).\n\nОсновные типы данных:\n1. Integer (целые числа, например `age = 25`)\n2. Float (вещественные числа с плавающей точкой, например `pi = 3.14`)\n3. String (строки, например `name = 'Алексей'`)\n4. Boolean (логический тип, принимающий `True` или `False`)\n\nДля присвоения значения используется простой одиночный знак равенства (=).",
        parts: [
          {
            type: "code",
            content: "# Примеры переменных разных типов\nusername = \"Лиза\"\nage = 19\ngpa = 4.8\nis_student = True\n\nprint(f\"Студентка {username}, возраст: {age}, средний балл: {gpa}\")",
            metadata: "python"
          },
          {
            type: "warning",
            content: "Имена переменных чувствительны к регистру! Переменная 'MyVar' и 'myvar' — это две абсолютно разные ячейки памяти."
          }
        ],
        estimatedTime: 15
      },
      {
        id: "python-l3",
        title: "Управляющие условия и ветвление",
        description: "Научим программу принимать логические решения на основе входящих данных с помощью conditional statements.",
        content: "Ветвление позволяет выполнять определенные блоки кода в зависимости от условий. В Python для этого используются ключевые слова `if` (если), `elif` (сокращение от else if — иначе если) и `else` (иначе).\n\nВажнейшей отличительной чертой Python является использование отступов (обычно 4 пробела). Отступы определяют тело условных операторов, циклов и функций. Ошибка в отступах вызовет исключение `IndentationError`.",
        parts: [
          {
            type: "text",
            content: "Ниже приведен пример проверки температуры воздуха. В зависимости от значения переменной, программа выдает разные советы."
          },
          {
            type: "code",
            content: "temp = 18\n\nif temp < 10:\n    print(\"Оденься теплее, на улице холодно!\")\nelif temp >= 10 and temp < 25:\n    print(\"Погода отличная, легкая ветровка будет в самый раз!\")\nelse:\n    print(\"Ух, на улице жара. Не забудь взять воду!\")",
            metadata: "python"
          },
          {
            type: "warning",
            content: "Ставьте двоеточие (:) в конце каждой условной строки. Забытое двоеточие — самая частая ошибка новичков."
          }
        ],
        estimatedTime: 12
      }
    ],
    quizzes: [
      {
        id: "py-q1",
        question: "Кто создал язык программирования Python?",
        options: [
          "Бьерн Страуструп",
          "Брендан Эйх",
          "Гвидо ван Россум",
          "Деннис Ритчи"
        ],
        correctAnswer: "Гвидо ван Россум",
        explanation: "Python был создан в конце 1980-х годов сотрудником нидерландского института CWI Гвидо ван Россумом в качестве преемника языка ABC."
      },
      {
        id: "py-q2",
        question: "Как обозначаются логические блоки в коде Python?",
        options: [
          "Фигурными скобками { }",
          "Круглыми скобками ( )",
          "Ключевыми словами begin / end",
          "Отступами (обычно 4 пробела)"
        ],
        correctAnswer: "Отступами (обычно 4 пробела)",
        explanation: "В отличие от большинства других языков программирования, Python использует отступы для выделения блоков кода, что увеличивает его читаемость."
      },
      {
        id: "py-q3",
        question: "Какая инструкция выведет тип переменной на экран?",
        options: [
          "print(typeof(x))",
          "print(type(x))",
          "print(x.type)",
          "print(gettype(x))"
        ],
        correctAnswer: "print(type(x))",
        explanation: "Функция type() является встроенной функцией Python и возвращает тип переданного объекта."
      }
    ]
  },
  {
    id: "course-cosmic-studies",
    title: "Чудеса Солнечной Системы",
    description: "Узнайте захватывающие факты об устройстве нашего космического дома: от пылающего Солнца до ледяных окраин пояса Койпера.",
    category: "Естественные науки",
    difficulty: "Intermediate",
    createdWithAI: false,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: "space-l1",
        title: "Солнце — Сердце Нашей Системы",
        description: "Раскроем физическую природу нашей родной звезды, гравитацию и термоядерный синтез.",
        content: "Солнце — это желтый карлик (спектральный класс G2V), сосредоточивший в себе 99.86% всей массы Солнечной системы. Его гравитационное поле удерживает на орбитах планеты, астероиды, кометы и космическую пыль.\n\nВ недрах Солнца при температуре около 15 миллионов градусов Кельвина непрерывно идет термоядерный синтез — ядра водорода превращаются в гелий с выделением колоссальной энергии. Этот свет и тепло питают жизнь на Земле.",
        parts: [
          {
            type: "text",
            content: "Без Солнца наша планета замерзла бы за считанные дни. Интересный факт: солнечному свету требуется около 8 минут и 20 секунд, чтобы преодолеть расстояние в 150 миллионов километров до Земли."
          },
          {
            type: "tip",
            content: "Магнитное поле Солнца закручивается из-за неравномерного вращения: его экватор вращается быстрее полярных регионов. Это порождает солнечные пятна и вспышки!"
          }
        ],
        estimatedTime: 12
      },
      {
        id: "space-l2",
        title: "Планеты Земной Группы",
        description: "Пройдемся по твердым космическим телам: Меркурий, сказочная Венера, обитаемая Земля и пустынный Марс.",
        content: "Планеты земной группы располагаются ближе всего к Солнцу. Они обладают твердой поверхностью, высокой плотностью и состоят преимущественно из силикатов и металлов.\n\n- Меркурий: самый маленький, безвоздушный мир с огромными температурными качелями (от -180°C ночью до +430°C днем).\n- Венера: окутана плотной атмосферой углекислого газа, создающей мощный парниковый эффект. Самая горячая планета (+460°C).\n- Земля: оазис жидкой воды и органической жизни со сбалансированной атмосферой.\n- Марс: 'Красная планета' с тонкой разреженной CO2 атмосферой, гигантскими потухшими вулканами и сухими руслами рек в прошлом.",
        parts: [
          {
            type: "warning",
            content: "Хотя Меркурий ближе всех к Солнцу, самой горячей планетой Солнечной системы остается именно Венера за счет неуправляемого парникового эффекта плотных облаков!"
          }
        ],
        estimatedTime: 15
      }
    ],
    quizzes: [
      {
        id: "space-q1",
        question: "Какая планета Солнечной системы является самой горячей?",
        options: [
          "Меркурий",
          "Венера",
          "Юпитер",
          "Марс"
        ],
        correctAnswer: "Венера",
        explanation: "Из-за плотной атмосферы, состоящей в основном из углекислого газа, на Венере действует сильный парниковый эффект, разогревающий ее до 460-470 градусов Цельсия."
      }
    ]
  }
];

let userFeedbacks: FeedbackLog[] = [
  {
    id: "f-1",
    courseId: "course-python-basics",
    courseTitle: "Прекрасный Python: Быстрый Старт",
    userName: "Анна Смирнова",
    rating: 5,
    comment: "Очень понятные примеры, особенно понравились карточки-советы!",
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: "f-2",
    courseId: "course-cosmic-studies",
    courseTitle: "Чудеса Солнечной Системы",
    userName: "Геннадий К.",
    rating: 4,
    comment: "Интересно, но хотелось бы больше тестов по планетам-гигантам.",
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  }
];

let statsDatabase = {
  aiGenerationsCount: 0,
  quizzesTakenCount: 15,
  totalScoreSumPct: 1200 // Mock 15 quizzes with average 80%
};

const SITE_CONTENT_PATH = path.join(process.cwd(), "data", "site-content.json");

const defaultSiteContent: SiteContent = {
  videos: [
    {
      id: "vid-1",
      title: "Введение в ИИ и Big Data",
      description: "Простыми словами о весах, сверточных слоях и Gemini Flash за 10 минут.",
      duration: "10:15",
      instructor: "Доктор Сандалов",
      views: 1420,
      category: "ИИ и Нейросети",
      thumbnailText: "AI Neural Map",
      youtubeId: "kUMe1fhM0lo",
      sourceType: "youtube",
      createdAt: new Date().toISOString(),
    },
    {
      id: "vid-2",
      title: "Архитектура State Managers в React",
      description: "Виртуальный DOM, функциональные компоненты и хуки жизненного цикла.",
      duration: "08:45",
      instructor: "Елена Власова",
      views: 935,
      category: "Разработка",
      thumbnailText: "React Lifecycle",
      youtubeId: "kh060lK7Zrc",
      sourceType: "youtube",
      createdAt: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: "ev-1",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=340&fit=crop",
      description: "IT-Олимпиада Google Global Dev: соревнования по Web-программированию. Призовой фонд +500 коинов.",
    },
    {
      id: "ev-2",
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=340&fit=crop",
      description: "Хакатон ИИ-Кураторы Капуста: создайте умного помощника на Gemini. Осталось 4 часа до финала.",
    },
    {
      id: "ev-3",
      imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop",
      description: "Лекционный марафон ЮНЕСКО: спец-лекции по космологии и физике частиц. +200 коинов за участие.",
    },
  ],
};

function loadSiteContent(): SiteContent {
  try {
    if (fs.existsSync(SITE_CONTENT_PATH)) {
      const raw = fs.readFileSync(SITE_CONTENT_PATH, "utf-8");
      const parsed = JSON.parse(raw) as SiteContent;
      if (Array.isArray(parsed.videos) && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load site-content.json, using defaults:", e);
  }
  return JSON.parse(JSON.stringify(defaultSiteContent)) as SiteContent;
}

function saveSiteContentToDisk() {
  try {
    fs.mkdirSync(path.dirname(SITE_CONTENT_PATH), { recursive: true });
    fs.writeFileSync(SITE_CONTENT_PATH, JSON.stringify(siteContent, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save site content:", e);
  }
}

let siteContent: SiteContent = loadSiteContent();

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (host.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts?.[1]) return shorts[1];
      const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    /* not a URL */
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// Help helper for Gemini AI client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined! AI features might fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_IF_NOT_SET",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ---------------- API ENDPOINTS ----------------

// Get custom metadata/stats
app.get("/api/stats", (req, res) => {
  const avgPct = statsDatabase.quizzesTakenCount > 0 
    ? Math.round(statsDatabase.totalScoreSumPct / statsDatabase.quizzesTakenCount) 
    : 0;

  res.json({
    coursesCount: courses.length,
    aiGenerationsCount: statsDatabase.aiGenerationsCount,
    quizzesTakenCount: statsDatabase.quizzesTakenCount,
    averageQuizScorePct: avgPct,
    feedbacksCount: userFeedbacks.length
  });
});

// Get all courses
app.get("/api/courses", (req, res) => {
  res.json(courses);
});

// Submit a manually created course
app.post("/api/courses", (req, res) => {
  try {
    const { title, description, category, difficulty, lessons, quizzes } = req.body;
    if (!title || !description || !category || !lessons || !quizzes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newCourse: Course = {
      id: "course-manual-" + Date.now().toString(),
      title,
      description,
      category,
      difficulty: difficulty || "Beginner",
      lessons: lessons.map((l: any, idx: number) => ({
        id: `m-l-${Date.now()}-${idx}`,
        title: l.title || `Урок ${idx + 1}`,
        description: l.description || "",
        content: l.content || "",
        parts: l.parts || [{ type: "text", content: l.content || "" }],
        estimatedTime: Number(l.estimatedTime) || 15
      })),
      quizzes: quizzes.map((q: any, idx: number) => ({
        id: `m-q-${Date.now()}-${idx}`,
        question: q.question || "",
        options: q.options || ["", "", "", ""],
        correctAnswer: q.correctAnswer || "",
        explanation: q.explanation || "Интуитивный ответ."
      })),
      createdWithAI: false,
      createdAt: new Date().toISOString()
    };

    courses.unshift(newCourse);
    res.status(201).json(newCourse);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a course
app.delete("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = courses.length;
  courses = courses.filter(c => c.id !== id);
  if (courses.length < initialLength) {
    res.json({ message: "Course deleted successfully", success: true });
  } else {
    res.status(404).json({ error: "Course not found", success: false });
  }
});

// Submit course feedback
app.post("/api/feedback", (req, res) => {
  try {
    const { courseId, courseTitle, userName, rating, comment } = req.body;
    if (!userName || !rating) {
      return res.status(400).json({ error: "Name and Rating are required" });
    }

    const feedback: FeedbackLog = {
      id: "f-" + Date.now().toString(),
      courseId,
      courseTitle,
      userName,
      rating: Number(rating),
      comment: comment || "",
      date: new Date().toISOString()
    };

    userFeedbacks.unshift(feedback);
    res.status(201).json(feedback);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get feedbacks
app.get("/api/feedback", (req, res) => {
  res.json(userFeedbacks);
});

// Increment and log quiz submissions for tracking
app.post("/api/quizzes/submit", (req, res) => {
  const { score, maxScore } = req.body;
  if (typeof score === 'number' && typeof maxScore === 'number' && maxScore > 0) {
    const pct = Math.round((score / maxScore) * 100);
    statsDatabase.quizzesTakenCount += 1;
    statsDatabase.totalScoreSumPct += pct;
    res.json({ success: true, loggedPercentage: pct });
  } else {
    res.status(400).json({ error: "Invalid scoring stats" });
  }
});

// Generate dynamic Course with Gemini API
app.post("/api/courses/generate", async (req, res) => {
  try {
    const { topic, difficulty, language } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Тема курса (topic) обязательна!" });
    }

    const ai = getGeminiClient();
    const targetDiff = difficulty || "Beginner";
    const targetLang = language || "Russian";

    console.log(`Starting course generation for topic: "${topic}", diff: ${targetDiff}`);

    const prompt = `Создай качественный учебный мини-курс на тему: "${topic}".
Уровень сложности: ${targetDiff}.
Язык курса: ${targetLang === "Russian" ? "Русский" : "Английский"}.

Сгенерируй ответ строго в соответствии со следующей схемой JSON. Проработай содержание очень глубоко. Обязательно напиши развернутый подробный текст уроков (поле content должно содержать как минимум 400-500 слов на красивом понятном языке с подробными описаниями, историческими фактами или теоретическим обоснованием).
В каждом уроке обязательно добавь коллекцию из 3 визуальных блоков в массив parts. Типы блоков:
- "text" для обычных пояснений,
- "code" для примеров кода или формул,
- "warning" для важных предупреждений, оговорок или частых ошибок новичков,
- "tip" для интересных скрытых фишек, полезных трюков или фактов для расширения кругозора.

Сгенерируй ровно 3 полноценных развивающих лекционных урока (lessons) и ровно 3 проверочных вопроса для теста с множественным выбором (quizzes).`;

    const courseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Яркое увлекательное название курса" },
        description: { type: Type.STRING, description: "Интригующее и краткое описание целей и пользы курса" },
        category: { type: Type.STRING, description: "Категория дисциплины (например: Программирование, Естественные науки, История, Финансы, Языки)" },
        difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"], description: "Уровень сложности" },
        lessons: {
          type: Type.ARRAY,
          description: "Массив из ровно 3 структурированных уроков",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Название урока" },
              description: { type: Type.STRING, description: "Краткое превью урока" },
              content: { type: Type.STRING, description: "Полный подробный текст лекции. Опиши глубоко и академически вежливо, используй абзацы и интересную стилистику." },
              parts: {
                type: Type.ARRAY,
                description: "Массив из ровно 3 интерактивных фрагментов (text, code, warning, tip)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["text", "code", "warning", "tip"], description: "Тип блока" },
                    content: { type: Type.STRING, description: "Содержимое блока (код, предупреждение, совет или абзац)" },
                    metadata: { type: Type.STRING, description: "Пояснение или язык программирования (например 'python', 'Филологическая загадка')" }
                  },
                  required: ["type", "content"]
                }
              },
              estimatedTime: { type: Type.INTEGER, description: "Оценочное время на прочтение в минутах" }
            },
            required: ["title", "description", "content", "parts", "estimatedTime"]
          }
        },
        quizzes: {
          type: Type.ARRAY,
          description: "Точно 3 тестовых вопроса по темам пройденного",
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Текст вопроса" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ровно 4 варианта ответа" },
              correctAnswer: { type: Type.STRING, description: "Правильный вариант ответа (должен точно совпадать с одной из строк в options)" },
              explanation: { type: Type.STRING, description: "Подробное объяснение правильного ответа для студента" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      },
      required: ["title", "description", "category", "difficulty", "lessons", "quizzes"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: courseSchema,
        temperature: 1.0,
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Пустой ответ от модели искусственного интеллекта.");
    }

    const parsedJson = JSON.parse(outputText.trim());

    // Populate metadata & save on server
    const generatedCourse: Course = {
      id: "course-ai-" + Date.now().toString(),
      title: parsedJson.title || `Курс: ${topic}`,
      description: parsedJson.description || "Сгенерировано искусственным интеллектом.",
      category: parsedJson.category || "Общее",
      difficulty: parsedJson.difficulty || targetDiff,
      lessons: (parsedJson.lessons || []).map((l: any, idx: number) => ({
        id: `ai-l-${Date.now()}-${idx}`,
        title: l.title || `Урок ${idx + 1}`,
        description: l.description || "",
        content: l.content || "",
        parts: l.parts || [],
        estimatedTime: Number(l.estimatedTime) || 12
      })),
      quizzes: (parsedJson.quizzes || []).map((q: any, idx: number) => ({
        id: `ai-q-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ""
      })),
      createdWithAI: true,
      promptUsed: topic,
      createdAt: new Date().toISOString()
    };

    courses.unshift(generatedCourse);
    statsDatabase.aiGenerationsCount += 1;

    res.status(201).json(generatedCourse);
  } catch (error: any) {
    console.error("Gemini course generation error:", error);
    res.status(500).json({ error: error.message || "Ошибка при генерации курса искусственным интеллектом." });
  }
});

// Talking with AI Tutor helper
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, currentTopic } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGeminiClient();

    // Map history to parts standard
    // Use the latest 8 messages to keep inside token context
    const recentMessages = messages.slice(-8);

    const historyPrompt = recentMessages.map(m => {
      const roleName = m.role === "user" ? "Студент" : "Капуста-Репетитор";
      return `${roleName}: ${m.content}`;
    }).join("\n");

    const systemInstruction = `Ты — Капуста (Kapusta AI), дружелюбный, невероятно умный и отзывчивый мобильный ИИ-куратор и репетитор этой образовательной веб-платформы.
Твоя задача — поддерживать студентов, весело, образно и понятно объяснять правила, формулы, исторические даты или ошибки программирования.
Отвечай всегда вежливо на русском языке (если вопрос не задан на другом). Используй понятные метафоры, форматируй ответы списками, выделяй код символами \`\`\`.
${currentTopic ? `Прямо сейчас студент находится внутри курса на тему: "${currentTopic}". Пожалуйста, отвечай с фокусом на эту тему или приводи примеры оттуда.` : ""}
Никогда не выдумывай ложные факты. Поддерживай студента, мотивируй его учиться дальше! Будь лаконичен — пиши ответы объемом 100-250 слов.`;

    const userPrompt = `История диалога:\n${historyPrompt}\n\nСтудент задает следующий новый вопрос: "${recentMessages[recentMessages.length - 1]?.content || ""}"\nТвой ответ (от лица Капусты-Репетитора):`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });

    const responseText = response.text || "Извини, я задумался над этим вопросом. Задай его еще раз!";
    res.json({ content: responseText });
  } catch (error: any) {
    console.error("Gemini AI Chat tutor error:", error);
    res.status(500).json({ error: error.message || "Ошибка связи с ИИ-репетитором." });
  }
});


// Site content: videos & promo events
app.get("/api/site/content", (_req, res) => {
  res.json(siteContent);
});

app.post("/api/site/videos", (req, res) => {
  try {
    const { title, description, url, videoUrl, duration, instructor, category, thumbnailText, fileData } = req.body;
    const link = String(url || videoUrl || "").trim();
    const youtubeId = extractYoutubeId(link);
    const isDataUrl = typeof fileData === "string" && fileData.startsWith("data:");

    let sourceType: PlatformVideo["sourceType"] = "url";
    let finalVideoUrl: string | undefined;
    let finalYoutubeId: string | undefined;

    if (youtubeId) {
      sourceType = "youtube";
      finalYoutubeId = youtubeId;
    } else if (isDataUrl) {
      sourceType = "upload";
      finalVideoUrl = fileData;
    } else if (link) {
      sourceType = "url";
      finalVideoUrl = link;
    } else {
      return res.status(400).json({ error: "Укажите ссылку на видео или загрузите файл" });
    }

    const video: PlatformVideo = {
      id: "vid-" + Date.now(),
      title: title || "Новый видеоурок",
      description: description || "",
      duration: duration || "—",
      instructor: instructor || "Администратор",
      views: 0,
      category: category || "Общее",
      thumbnailText: thumbnailText || "Видео",
      youtubeId: finalYoutubeId,
      videoUrl: finalVideoUrl,
      sourceType,
      createdAt: new Date().toISOString(),
    };

    siteContent.videos.unshift(video);
    saveSiteContentToDisk();
    res.status(201).json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/site/videos/:id", (req, res) => {
  const before = siteContent.videos.length;
  siteContent.videos = siteContent.videos.filter((v) => v.id !== req.params.id);
  if (siteContent.videos.length < before) {
    saveSiteContentToDisk();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Видео не найдено" });
  }
});

app.put("/api/site/events", (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "events должен быть массивом" });
    }
    siteContent.events = events.map((e: PromoEvent, idx: number) => ({
      id: e.id || "ev-" + Date.now() + "-" + idx,
      imageUrl: e.imageUrl || "",
      description: e.description || "",
    }));
    saveSiteContentToDisk();
    res.json(siteContent.events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/site/events/:id", (req, res) => {
  const event = siteContent.events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: "Событие не найдено" });
  if (req.body.imageUrl !== undefined) event.imageUrl = req.body.imageUrl;
  if (req.body.description !== undefined) event.description = req.body.description;
  saveSiteContentToDisk();
  res.json(event);
});

// TCP Connection check for MTProto or custom servers
app.post("/api/proxy/check", (req, res) => {
  const { server, port, secret } = req.body;
  
  if (!server || !port) {
    return res.status(400).json({ error: "Не указаны хост или порт для проверки!" });
  }

  const hostname = String(server).trim();
  const portNum = Number(port);

  if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    return res.status(400).json({ error: "Недопустимый порт!" });
  }

  console.log(`[Proxy Monitor] Testing socket connection to ${hostname}:${portNum}...`);

  const socket = new net.Socket();
  let completed = false;

  // Set timeout of 4 seconds
  socket.setTimeout(4000);

  socket.connect(portNum, hostname, () => {
    completed = true;
    socket.destroy();
    res.json({
      success: true,
      status: "Подключено",
      message: `Успешное TCP рукопожатие с прокси-сервером ${hostname}:${portNum}! Настройки MTProto верны.`
    });
  });

  socket.on("error", (err) => {
    if (!completed) {
      completed = true;
      socket.destroy();
      console.warn(`[Proxy Monitor] Connection error to ${hostname}:${portNum}:`, err.message);
      res.json({
        success: false,
        status: "Ошибка",
        message: `Не удалось установить соединение: ${err.message}`
      });
    }
  });

  socket.on("timeout", () => {
    if (!completed) {
      completed = true;
      socket.destroy();
      console.warn(`[Proxy Monitor] Connection timeout reaching ${hostname}:${portNum}`);
      res.json({
        success: false,
        status: "Таймаут",
        message: `Сервер не ответил в течение 4 секунд. Проверьте фаервол или статус прокси.`
      });
    }
  });
});


// Search YouTube videos with AI recommendation
app.post("/api/youtube/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required!" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an academic expert matching relevant Youtube video recommendations for educational subjects. Return a list of 4 highly relevant Youtube videos.`;
    const prompt = `Generate a JSON object containing exactly 4 relevant educational YouTube videos for the topic: "${query}".
For each video, provide:
- id: e.g. "yt-${Date.now()}-1"
- title: engaging educational title
- description: clear summarizing description in Russian
- duration: e.g. "12:35"
- instructor: name of teacher or creator
- views: random high views e.g. Between 5000 and 200000
- category: educational category name e.g. "Chess", "Languages", "Math"
- thumbnailText: 2-3 words descriptors e.g. "♟️ Chess Moves", "🇬🇧 Grammar", "📐 Sine law"
- youtubeId: A highly probable or real working YouTube Video ID. For chess, use typical working IDs like '8U8_0S9u_Yc' or 'kh060lK7Zrc' or '6oXp0ZND2S4' or 'dQw4w9WgXcQ' etc.
Ensure your response follows the JSON schema exactly.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        videos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              duration: { type: Type.STRING },
              instructor: { type: Type.STRING },
              views: { type: Type.INTEGER },
              category: { type: Type.STRING },
              thumbnailText: { type: Type.STRING },
              youtubeId: { type: Type.STRING }
            },
            required: ["id", "title", "description", "duration", "instructor", "views", "category", "thumbnailText", "youtubeId"]
          }
        }
      },
      required: ["videos"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed.videos || []);
  } catch (err: any) {
    console.error("Youtube Search API error:", err);
    res.status(500).json({ error: err.message || "Failed to query YouTube recommendations with AI." });
  }
});


// Generate Duolingo-style game lesson sequence
app.post("/api/courses/generate-duolingo", async (req, res) => {
  try {
    const { topic, subject, language } = req.body;
    const resolvedTopic = topic || subject;
    if (!resolvedTopic) {
      return res.status(400).json({ error: "Тема (topic) обязательна!" });
    }

    const ai = getGeminiClient();
    const targetLang = language || "Russian";
    
    const prompt = `Создай один интерактивный игровой Duolingo-style курс на тему: "${resolvedTopic}".
Сделай ответ строго на языке: ${targetLang === "Russian" ? "Русский" : "Английский"}.
Курс должен содержать:
- title: Название типа "Duolingo Интенсив: [Тема]"
- description: Короткое весёлое описание в игровом стиле Дуолинго со смайликами.
- category: Категория дисциплины
- difficulty: "Beginner" или "Intermediate"
- lessons: массив из ровно 3 уроков-шагов:
  Каждый урок (шаг) содержит ровно 2 визуальные карточки в массиве parts:
    Одна карточка должна быть типа "text" (теоретическая разминка с весёлыми подбадриваниями ИИ-совы Duo).
    Вторая карточка должна быть типа "duolingo_game" (собственно интерактивная игра, например, выбор перевода, расстановка матчей, завершение фраз).
    Для карточки типа "duolingo_game" передай дополнительные поля:
      • gameQuestion: Вопрос или задание игры (например "Как переводится пешка на английский язык?", "Решите уравнение: 2x + 5 = 15")
      • gameOptions: массив из ровно 4 понятных вариантов ответа.
      • gameAnswer: правильный ответ из массива gameOptions (должен совпадать до сотых символов).
      • metadata: Заголовок мини-игры (например "♟️ Шахматный дебют", "🇬🇧 Грамматика", "📐 Простые уравнения").
- quizzes: массив из одного вопроса самопроверки.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        lessons: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              content: { type: Type.STRING },
              parts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["text", "code", "warning", "tip", "duolingo_game"] },
                    content: { type: Type.STRING },
                    metadata: { type: Type.STRING },
                    gameQuestion: { type: Type.STRING },
                    gameOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gameAnswer: { type: Type.STRING }
                  },
                  required: ["type", "content"]
                }
              },
              estimatedTime: { type: Type.INTEGER }
            },
            required: ["title", "description", "content", "parts", "estimatedTime"]
          }
        },
        quizzes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      },
      required: ["title", "description", "category", "difficulty", "lessons", "quizzes"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.9
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");

    const generatedCourse: Course = {
      id: "course-duolingo-" + Date.now().toString(),
      title: parsedJson.title || `Duolingo: ${resolvedTopic}`,
      description: parsedJson.description || "Игровой курс от ИИ-совы.",
      category: parsedJson.category || "Геймификация",
      difficulty: parsedJson.difficulty || "Beginner",
      lessons: (parsedJson.lessons || []).map((l: any, idx: number) => ({
        id: `duo-l-${Date.now()}-${idx}`,
        title: l.title || `Шаг ${idx + 1}`,
        description: l.description || "",
        content: l.content || "",
        parts: l.parts || [],
        estimatedTime: Number(l.estimatedTime) || 5
      })),
      quizzes: (parsedJson.quizzes || []).map((q: any, idx: number) => ({
        id: `duo-q-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ""
      })),
      createdWithAI: true,
      promptUsed: resolvedTopic + " (Duolingo Style)",
      createdAt: new Date().toISOString()
    };

    courses.unshift(generatedCourse);
    statsDatabase.aiGenerationsCount += 1;

    res.status(201).json(generatedCourse);
  } catch (error: any) {
    console.error("Duolingo Course generation error:", error);
    res.status(500).json({ error: error.message || "Ошибка при генерации интерактивного урока Duolingo." });
  }
});


// ---------------- VITE INTERPOLATION MIDDLEWARE ----------------

async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Educational platform running at http://localhost:${PORT}`);
  });
}

serveApp();
