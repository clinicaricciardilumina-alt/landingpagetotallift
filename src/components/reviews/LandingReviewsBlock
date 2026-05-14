import React, { useEffect, useState, useMemo } from "react";
import { Star, ExternalLink } from "lucide-react";
import * as manualService from "../../lib/manualReviewsService";
import * as googleService from "../../lib/googleReviewsService";
import type { LandingPageDoc, ManualReview, GoogleReviewItem, GoogleReviewsCache } from "../../types";

/**
 * Componente per mostrare recensioni sulla landing.
 * Riceve la configurazione direttamente dal documento landing.
 */
export default function LandingReviewsBlock({ landing, primaryColor }: {
  landing: LandingPageDoc;
  primaryColor?: string;
}) {
  const [manualReviews, setManualReviews] = useState<ManualReview[]>([]);
  const [googleCache, setGoogleCache] = useState<GoogleReviewsCache | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landing.reviewsEnabled) {
      setLoading(false);
      return;
    }
    (async () => {
      const tasks: Promise<any>[] = [];
      if (landing.reviewsShowManual !== false) {
        tasks.push(manualService.getManualReviews().then(setManualReviews));
      }
      if (landing.reviewsShowGoogle) {
        tasks.push(googleService.getGoogleReviewsCache().then(setGoogleCache));
      }
      await Promise.all(tasks);
      setLoading(false);
    })();
  }, [landing.id, landing.reviewsEnabled]);

  // Filtra manuali per tag
  const filteredManual = useMemo(() => {
    if (!landing.reviewsShowManual) return [];
    return manualService.filterReviewsByTags(manualReviews, landing.reviewsManualTags);
  }, [manualReviews, landing.reviewsManualTags, landing.reviewsShowManual]);

  // Filtra Google per parole chiave
  const filteredGoogle = useMemo(() => {
    if (!landing.reviewsShowGoogle || !googleCache) return [];
    return googleService.filterGoogleReviewsByKeywords(
      googleCache.reviews,
      landing.reviewsKeywordFilter
    );
  }, [googleCache, landing.reviewsKeywordFilter, landing.reviewsShowGoogle]);

  // Combina e limita
  const max = landing.reviewsMaxCount || 5;
  const combined = useMemo(() => {
    const items: { source: "manual" | "google"; data: ManualReview | GoogleReviewItem }[] = [];
    for (const r of filteredManual) items.push({ source: "manual", data: r });
    for (const r of filteredGoogle) items.push({ source: "google", data: r });
    return items.slice(0, max);
  }, [filteredManual, filteredGoogle, max]);

  if (!landing.reviewsEnabled) return null;
  if (loading) return <div className="py-8 text-center text-sm text-gray-500">Caricamento recensioni...</div>;
  if (combined.length === 0 && !landing.reviewsShowSummaryWidget) return null;

  const layout = landing.reviewsLayout || "grid";
  const color = primaryColor || landing.primaryColor || "#0066A1";

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-2">
          Cosa dicono i nostri pazienti
        </h2>
        {googleCache && landing.reviewsShowSummaryWidget && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={16} className={n <= Math.round(googleCache.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              <span className="font-bold">{googleCache.averageRating?.toFixed(1)}/5</span>
              <span className="text-gray-500 text-sm">su Google</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-500 text-sm">{googleCache.totalRatings} recensioni</span>
            </div>
          </div>
        )}

        {/* GRID / LIST / CAROUSEL */}
        {layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {combined.map((item, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-80">
                <ReviewCard item={item} color={color} />
              </div>
            ))}
          </div>
        ) : layout === "list" ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {combined.map((item, i) => (
              <div key={i}>
                <ReviewCard item={item} color={color} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combined.map((item, i) => (
              <div key={i}>
                <ReviewCard item={item} color={color} />
              </div>
            ))}
          </div>
        )}

        {/* Link a Google Maps */}
        {googleCache?.googleMapsUrl && landing.reviewsShowSummaryWidget && (
          <div className="text-center mt-8">
            <a
              href={googleCache.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
              style={{ color }}
            >
              Leggi tutte le recensioni su Google
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ item, color }: {
  item: { source: "manual" | "google"; data: ManualReview | GoogleReviewItem };
  color: string;
}) {
  const r = item.data;
  const authorName = r.authorName;
  const text = r.text;
  const rating = r.rating || 5;
  const photo = (r as any).authorPhoto || (r as any).authorPhotoUrl;
  const relativeTime = (r as any).relativeTime || (r as any).reviewDate;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {photo ? (
            <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: color }}>
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold truncate text-sm">{authorName}</div>
            {relativeTime && <div className="text-[11px] text-gray-400">{relativeTime}</div>}
          </div>
        </div>
        {item.source === "google" && (
          <div className="text-[10px] font-bold text-blue-600 flex-shrink-0">G</div>
        )}
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {[1,2,3,4,5].map(n => (
          <Star key={n} size={14} className={n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
        ))}
      </div>
      <p className="text-sm text-gray-700 flex-1">{text}</p>
    </div>
  );
}
