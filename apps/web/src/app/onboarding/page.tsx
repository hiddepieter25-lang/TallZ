"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  answersToParams,
  getSwipeDeckProducts,
  BUDGET_BANDS,
  FIT_PREFERENCES,
  OCCASION_TAGS,
  PROPORTIONS,
  type BudgetBand,
  type FitPreference,
  type OccasionTag,
  type Product,
  type Proportion,
  type StyleTag,
} from "@/lib/products";
import { SwipeDeck } from "@/components/SwipeDeck";
import { createClient } from "@/lib/supabase/browser";

const HEIGHT_RANGES = ["173–178cm", "179–184cm", "185–190cm", "191–196cm", "197cm+"];

function SingleChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`border px-6 py-3 text-left transition-colors duration-150 ease-out ${
            value === opt.id
              ? "border-foreground bg-foreground text-background"
              : "border-line hover:border-foreground"
          }`}
        >
          <span className="text-sm font-medium">{opt.label}</span>
          {opt.hint && (
            <span
              className={`mt-0.5 block text-xs ${
                value === opt.id ? "text-background/70" : "text-muted"
              }`}
            >
              {opt.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function MultiChoice<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: { id: T; label: string }[];
  values: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onToggle(opt.id)}
          className={`border px-5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
            values.includes(opt.id)
              ? "border-foreground bg-foreground text-background"
              : "border-line hover:border-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState<string | null>(null);
  const [proportion, setProportion] = useState<Proportion | null>(null);
  const [swipeProducts, setSwipeProducts] = useState<Product[] | null>(null);
  const [swipeTags, setSwipeTags] = useState<StyleTag[] | null>(null);
  const [occasions, setOccasions] = useState<OccasionTag[]>([]);
  const [fitPreference, setFitPreference] = useState<FitPreference | null>(null);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?next=%2Fonboarding");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    getSwipeDeckProducts().then((products) => {
      setSwipeProducts(products);
      if (products.length === 0) setSwipeTags([]); // nothing to swipe, don't block
    });
  }, []);

  const toggleOccasion = (id: OccasionTag) => {
    setOccasions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const onPhotoSelected = (file: File | null) => {
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const finish = async () => {
    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let photoPath: string | null = null;
    if (photoFile) {
      const path = `${crypto.randomUUID()}-${photoFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("onboarding-photos")
        .upload(path, photoFile);
      if (uploadError) {
        console.error("Failed to upload photo:", uploadError.message);
      } else {
        photoPath = data.path;
      }
    }

    const { error } = await supabase.from("onboarding_responses").insert({
      height_range: height,
      styles: swipeTags ?? [],
      occasions,
      proportion,
      fit_preference: fitPreference,
      budget,
      photo_path: photoPath,
      // Optional — attaches these answers to the account when logged in,
      // still works fully anonymously when not.
      user_id: user?.id ?? null,
    });
    if (error) console.error("Failed to save onboarding response:", error.message);

    const params = new URLSearchParams(
      answersToParams({
        swipeTags: swipeTags ?? [],
        occasions,
        proportion: proportion ?? undefined,
        fitPreference: fitPreference ?? undefined,
        budget: budget ?? undefined,
      })
    );
    if (height) params.set("height", height);
    router.push(`/feed?${params.toString()}`);
  };

  const steps = [
    {
      label: "Your height",
      canContinue: !!height,
      content: (
        <SingleChoice
          options={HEIGHT_RANGES.map((r) => ({ id: r, label: r }))}
          value={height}
          onChange={setHeight}
        />
      ),
    },
    {
      label: "Where's most of your height?",
      canContinue: !!proportion,
      content: <SingleChoice options={PROPORTIONS} value={proportion} onChange={setProportion} />,
    },
    {
      label: "What catches your eye?",
      canContinue: swipeTags !== null,
      content: swipeProducts ? (
        <SwipeDeck products={swipeProducts} onComplete={setSwipeTags} />
      ) : (
        <p className="text-sm text-muted">Loading a few pieces for you…</p>
      ),
    },
    {
      label: "What are you shopping for?",
      canContinue: occasions.length > 0,
      content: (
        <MultiChoice options={OCCASION_TAGS} values={occasions} onToggle={toggleOccasion} />
      ),
    },
    {
      label: "How do you like it to fit?",
      canContinue: !!fitPreference,
      content: (
        <SingleChoice options={FIT_PREFERENCES} value={fitPreference} onChange={setFitPreference} />
      ),
    },
    {
      label: "What's your budget, per item?",
      canContinue: !!budget,
      content: <SingleChoice options={BUDGET_BANDS} value={budget} onChange={setBudget} />,
    },
    {
      label: "A photo of your style",
      canContinue: true,
      content: (
        <div>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-line px-6 py-16 text-center hover:border-foreground overflow-hidden">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Selected style reference"
                className="max-h-64 object-cover"
              />
            ) : (
              <>
                <span className="text-sm font-medium">Upload a photo</span>
                <span className="text-xs text-muted">
                  Optional — helps sharpen your feed
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (!authChecked) return null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">
        {step + 1} / {steps.length}
      </p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {current.label}
      </h1>

      {current.content}

      <div className="mt-10 flex items-center gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-foreground"
          >
            Back
          </button>
        )}
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          disabled={!current.canContinue || submitting}
          className="ml-auto h-12 border border-accent bg-accent px-8 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-150 ease-out hover:bg-background hover:text-accent disabled:opacity-40"
        >
          {isLast ? (submitting ? "Saving…" : "See my feed") : "Continue"}
        </button>
      </div>
    </div>
  );
}
