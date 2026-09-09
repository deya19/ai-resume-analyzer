import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import { usePuterStore } from "~/lib/puter";

export default function ResumeCard({
  resume: { id, companyName, jobTitle, feedback, imagePath, resumePath },
  onDelete,
}: {
  resume: Resume;
  onDelete?: (id: string) => void;
}) {
  const { fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const blob = await fs.read(imagePath);
        if (!blob) return;
        setResumeUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Failed to load resume image", err);
      }
    };

    loadResume();
  }, [imagePath]);

  useEffect(() => {
    if (!showConfirm) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirm]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await kv.delete(`resume:${id}`);
      await Promise.all([
        fs.delete(resumePath),
        fs.delete(imagePath),
      ]).catch(() => {});
    } catch (err) {
      console.error("Failed to delete resume", err);
    }
    onDelete?.(id);
  };

  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000 relative group"
    >
      <button
        onClick={handleDeleteClick}
        disabled={deleting}
        aria-label="Delete resume"
        title="Delete resume"
        className="absolute top-2.5 right-2.5 z-10 flex items-center justify-center size-8 rounded-full bg-red-50 text-red-500 shadow-sm hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {companyName && (
            <h2 className="!text-black font-bold break-words">{companyName}</h2>
          )}
          {jobTitle && (
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
          )}
          {!companyName && !jobTitle && (
            <h2 className="!text-black font-bold">Resume</h2>
          )}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback?.overallScore ?? 0} />
        </div>
      </div>
      <div className="gradient-border animate-in fade-in duration-1000">
        <div className="w-full h-full">
          {resumeUrl && (
            <img
              src={resumeUrl}
              alt="resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
            />
          )}
        </div>
      </div>

      {showConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center size-11 rounded-full bg-red-50 text-red-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h2 id="delete-modal-title" className="!text-black font-bold text-lg">
                    Delete this resume?
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {companyName ? `The ${companyName} application` : "This resume"} and
                    its feedback will be permanently removed. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Link>
  );
}
