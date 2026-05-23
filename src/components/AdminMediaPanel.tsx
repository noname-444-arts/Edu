import React, { useState, useRef } from "react";
import { Video, Upload, Link2, Trash2, Image as ImageIcon, Globe, CheckCircle } from "lucide-react";
import { PlatformVideo, PromoEvent, SiteContent } from "../types";

type AdminLang = "ru" | "en";

const labels = {
  ru: {
    videosTitle: "Видеоуроки",
    videoLink: "Ссылка YouTube или URL видео",
    videoFile: "Загрузить файл (MP4/WebM, до 25 МБ)",
    videoTitle: "Название",
    videoDesc: "Описание",
    addVideo: "Опубликовать видео",
    deleteVideo: "Удалить",
    eventsTitle: "События на главной",
    eventsHint: "Только фото на главной. Описание — по нажатию.",
    eventDesc: "Описание",
    changePhoto: "Сменить фото",
    saveEvents: "Сохранить события",
    saved: "Сохранено!",
    noVideos: "Видео пока нет",
    published: "Видео опубликовано!",
    needSource: "Укажите ссылку YouTube или загрузите файл",
    needTitle: "Укажите название видео",
    fileTooBig: "Файл слишком большой. Используйте YouTube ссылку или файл до 25 МБ.",
    serverError: "Ошибка сервера. Запустите npm run dev.",
  },
  en: {
    videosTitle: "Video lessons",
    videoLink: "YouTube or video URL",
    videoFile: "Upload file (MP4/WebM, max 25 MB)",
    videoTitle: "Title",
    videoDesc: "Description",
    addVideo: "Publish video",
    deleteVideo: "Delete",
    eventsTitle: "Home events",
    eventsHint: "Photo on home only. Description on tap.",
    eventDesc: "Description",
    changePhoto: "Change photo",
    saveEvents: "Save events",
    saved: "Saved!",
    noVideos: "No videos yet",
    published: "Video published!",
    needSource: "Add a YouTube link or upload a file",
    needTitle: "Enter a video title",
    fileTooBig: "File too large. Use YouTube or a file under 25 MB.",
    serverError: "Server error. Run npm run dev.",
  },
} as const;

const MAX_FILE_MB = 25;

interface AdminMediaPanelProps {
  activeSection: "videos" | "events";
  lang: AdminLang;
  siteContent: SiteContent;
  onRefreshSiteContent: () => void;
}

export function AdminLangToggle({
  lang,
  onChange,
}: {
  lang: AdminLang;
  onChange: (l: AdminLang) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-isa-cream border border-isa-border rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onChange("ru")}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
          lang === "ru" ? "bg-white shadow-sm text-isa-navy" : "text-isa-muted"
        }`}
      >
        🇷🇺 RU
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
          lang === "en" ? "bg-white shadow-sm text-isa-navy" : "text-isa-muted"
        }`}
      >
        🇬🇧 EN
      </button>
      <Globe className="w-3.5 h-3.5 text-isa-muted ml-0.5" />
    </div>
  );
}

export default function AdminMediaPanel({
  activeSection,
  lang,
  siteContent,
  onRefreshSiteContent,
}: AdminMediaPanelProps) {
  const t = labels[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoFileData, setVideoFileData] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoSuccess, setVideoSuccess] = useState(false);

  const [localEvents, setLocalEvents] = useState<PromoEvent[]>(siteContent.events);
  const [savingEvents, setSavingEvents] = useState(false);
  const [eventsSaved, setEventsSaved] = useState(false);

  React.useEffect(() => {
    setLocalEvents(siteContent.events);
  }, [siteContent.events]);

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setVideoError(t.fileTooBig);
      setVideoFileData(null);
      setVideoFileName("");
      return;
    }

    setVideoError(null);
    setVideoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setVideoFileData(reader.result as string);
    reader.onerror = () => setVideoError(lang === "ru" ? "Не удалось прочитать файл" : "Failed to read file");
    reader.readAsDataURL(file);
  };

  const handleAddVideo = async () => {
    setVideoError(null);
    setVideoSuccess(false);

    if (!videoUrl.trim() && !videoFileData) {
      setVideoError(t.needSource);
      return;
    }
    if (!videoTitle.trim()) {
      setVideoError(t.needTitle);
      return;
    }

    setUploadingVideo(true);
    try {
      const resp = await fetch("/api/site/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoTitle.trim(),
          description: videoDesc.trim(),
          url: videoUrl.trim(),
          fileData: videoFileData,
        }),
      });

      if (!resp.ok) {
        let msg = t.serverError;
        try {
          const err = await resp.json();
          if (err.error) msg = err.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      setVideoUrl("");
      setVideoTitle("");
      setVideoDesc("");
      setVideoFileData(null);
      setVideoFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      setVideoSuccess(true);
      await onRefreshSiteContent();
      setTimeout(() => setVideoSuccess(false), 3000);
    } catch (err: unknown) {
      setVideoError(err instanceof Error ? err.message : t.serverError);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm(lang === "ru" ? "Удалить видео?" : "Delete video?")) return;
    try {
      const resp = await fetch(`/api/site/videos/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error(t.serverError);
      onRefreshSiteContent();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t.serverError);
    }
  };

  const handleEventImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLocalEvents((prev) =>
        prev.map((ev) => (ev.id === id ? { ...ev, imageUrl: reader.result as string } : ev))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEvents = async () => {
    setSavingEvents(true);
    try {
      const resp = await fetch("/api/site/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: localEvents }),
      });
      if (!resp.ok) throw new Error(t.serverError);
      setEventsSaved(true);
      onRefreshSiteContent();
      setTimeout(() => setEventsSaved(false), 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t.serverError);
    } finally {
      setSavingEvents(false);
    }
  };

  if (activeSection === "videos") {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-isa-navy flex items-center gap-2 font-[family-name:var(--font-display)]">
          <Video className="w-5 h-5 text-isa-gold" />
          {t.videosTitle}
        </h2>

        <div className="isa-card p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-isa-navy">{t.videoLink}</label>
            <div className="flex gap-2">
              <Link2 className="w-4 h-4 text-isa-muted mt-2.5 shrink-0" />
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 text-xs p-3 border border-isa-border rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-isa-navy">{t.videoFile}</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-isa-border rounded-xl p-6 cursor-pointer hover:border-isa-gold hover:bg-isa-gold-pale/30 transition">
              <Upload className="w-5 h-5 text-isa-muted" />
              <span className="text-xs text-isa-muted">
                {videoFileName ? `✓ ${videoFileName}` : t.videoFile}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={handleVideoFile}
              />
            </label>
          </div>

          <input
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder={t.videoTitle + " *"}
            className="w-full text-xs p-3 border border-isa-border rounded-xl"
          />
          <textarea
            value={videoDesc}
            onChange={(e) => setVideoDesc(e.target.value)}
            placeholder={t.videoDesc}
            rows={2}
            className="w-full text-xs p-3 border border-isa-border rounded-xl"
          />

          {videoError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg p-2">
              {videoError}
            </p>
          )}
          {videoSuccess && (
            <p className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {t.published}
            </p>
          )}

          <button
            type="button"
            onClick={handleAddVideo}
            disabled={uploadingVideo}
            className="w-full isa-btn-primary py-3 text-xs cursor-pointer disabled:opacity-40"
          >
            {uploadingVideo ? "..." : t.addVideo}
          </button>
        </div>

        <div className="grid gap-3">
          {siteContent.videos.length === 0 && (
            <p className="text-sm text-isa-muted text-center py-8">{t.noVideos}</p>
          )}
          {siteContent.videos.map((v: PlatformVideo) => (
            <div
              key={v.id}
              className="flex justify-between items-center isa-card p-4"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-isa-navy truncate">{v.title}</p>
                <p className="text-[10px] text-isa-muted">
                  {v.sourceType === "youtube" && v.youtubeId
                    ? `YouTube · ${v.youtubeId}`
                    : v.sourceType}
                  {v.description ? ` · ${v.description.slice(0, 40)}…` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteVideo(v.id)}
                className="text-red-500 p-2 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                title={t.deleteVideo}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-isa-navy flex items-center gap-2 font-[family-name:var(--font-display)]">
          <ImageIcon className="w-5 h-5 text-isa-gold" />
          {t.eventsTitle}
        </h2>
        <p className="text-xs text-isa-muted mt-1">{t.eventsHint}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localEvents.map((ev) => (
          <div key={ev.id} className="isa-card overflow-hidden space-y-3 p-3">
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-isa-cream border border-isa-border">
              {ev.imageUrl ? (
                <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-isa-muted text-xs">
                  {t.changePhoto}
                </div>
              )}
            </div>

            <label className="block">
              <span className="text-[10px] font-bold text-isa-muted uppercase">{t.changePhoto}</span>
              <input
                type="file"
                accept="image/*"
                className="mt-1 text-[10px] w-full"
                onChange={(e) => handleEventImage(ev.id, e)}
              />
            </label>

            <div>
              <label className="text-[10px] font-bold text-isa-muted uppercase block mb-1">
                {t.eventDesc}
              </label>
              <textarea
                value={ev.description}
                onChange={(e) =>
                  setLocalEvents((prev) =>
                    prev.map((x) => (x.id === ev.id ? { ...x, description: e.target.value } : x))
                  )
                }
                rows={3}
                className="w-full text-xs p-2 border border-isa-border rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            setLocalEvents((prev) => [
              ...prev,
              {
                id: "ev-" + Date.now(),
                imageUrl:
                  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop",
                description: "",
              },
            ])
          }
          className="border border-isa-border text-isa-navy px-4 py-3 rounded-xl text-xs font-bold cursor-pointer hover:bg-isa-cream"
        >
          + {lang === "ru" ? "Добавить событие" : "Add event"}
        </button>
        <button
          type="button"
          onClick={handleSaveEvents}
          disabled={savingEvents}
          className="bg-isa-navy text-isa-gold-light px-6 py-3 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          {eventsSaved ? t.saved : savingEvents ? "..." : t.saveEvents}
        </button>
      </div>
    </div>
  );
}
