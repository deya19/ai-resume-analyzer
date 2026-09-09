import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  return [
    { title: `Resumind | Review ${id}` },
    { name: "description", content: `Detailed overview of resume ${id}` },
  ];
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Timed out")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export default function Resume() {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
      if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading])

  useEffect(() => {
      let cancelled = false;
      const objectUrls: string[] = [];

      const loadResume = async () => {
          setLoadError('');
          setFeedback(null);
          setResumeUrl('');
          setImageUrl('');
          try {
            const resume = await withTimeout(kv.get(`resume:${id}`), 15000);
            if (cancelled) return;

            if(!resume) {
              setLoadError("Review not found — it may have been deleted.");
              return;
            }

            const data = JSON.parse(resume);

            const resumeBlob = await withTimeout(fs.read(data.resumePath), 20000);
            if (cancelled) return;
            if(!resumeBlob) {
              setLoadError("Could not load the resume file.");
              return;
            }

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            objectUrls.push(resumeUrl);
            setResumeUrl(resumeUrl);

            const imageBlob = await withTimeout(fs.read(data.imagePath), 20000);
            if (cancelled) return;
            if(!imageBlob) {
              setLoadError("Could not load the resume image.");
              return;
            }
            const imageUrl = URL.createObjectURL(imageBlob);
            objectUrls.push(imageUrl);
            setImageUrl(imageUrl);

            if(!data.feedback) {
              setLoadError("This review has no analysis saved — it was created before a bug was fixed. Please upload the resume again to generate a new review.");
              return;
            }

            setFeedback(data.feedback);
          } catch (err) {
            if (cancelled) return;
            console.error(err);
            setLoadError("Failed to load this resume — Puter may be rate-limiting requests. Wait a moment and try again.");
          }
      }

      loadResume();

      return () => {
          cancelled = true;
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
      };
  }, [id, retryCount]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-red-600 font-medium">{loadError}</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="primary-button w-fit cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" alt="resume scan 2" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
}
