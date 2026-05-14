/**
 * Vercel Serverless Function: /api/google-reviews-refresh
 *
 * Riceve un placeId, chiama Google Places API, salva la cache in Firestore.
 * La API key Google Places è in env var GOOGLE_PLACES_API_KEY (impostata in Vercel)
 * o letta da appSettings/global.googlePlacesApiKey
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
      } catch {
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { placeId } = req.body || {};
    if (!placeId) return res.status(400).json({ error: "placeId required" });

    const fs = getFirebaseAdmin();
    const settingsSnap = await fs.collection("appSettings").doc("global").get();
    const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};

    const apiKey = settings.googlePlacesApiKey || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "Google Places API key non configurata. Impostala in Settings o env var GOOGLE_PLACES_API_KEY",
      });
    }

    // Chiamata API Google Places (Place Details)
    // Documentazione: https://developers.google.com/maps/documentation/places/web-service/details
    const fields = "name,rating,user_ratings_total,reviews,url";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=it&reviews_sort=newest&key=${apiKey}`;

    const googleRes = await fetch(url);
    const googleData: any = await googleRes.json();

    if (googleData.status !== "OK") {
      return res.status(502).json({
        error: `Google API error: ${googleData.status} - ${googleData.error_message || "Unknown"}`,
      });
    }

    const place = googleData.result || {};
    const rawReviews: any[] = place.reviews || [];

    const reviews = rawReviews.map(r => ({
      authorName: r.author_name || "Anonimo",
      authorPhotoUrl: r.profile_photo_url || undefined,
      rating: r.rating || 5,
      text: r.text || "",
      relativeTime: r.relative_time_description || "",
      time: r.time || 0,
      language: r.language || "it",
    }));

    const cache = {
      placeId,
      studioName: place.name || undefined,
      totalRatings: place.user_ratings_total || 0,
      averageRating: place.rating || 0,
      reviews,
      googleMapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      cachedAt: new Date().toISOString(),
      ttlHours: 24,
    };

    // Salva in Firestore
    await fs.collection("googleReviewsCache").doc("global").set(cache);

    return res.status(200).json({ ok: true, cache });
  } catch (error: any) {
    console.error("Google reviews refresh error:", error);
    return res.status(500).json({ error: error?.message || "Internal error" });
  }
}
