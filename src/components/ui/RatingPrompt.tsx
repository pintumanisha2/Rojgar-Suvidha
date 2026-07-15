"use client";

import { useState } from "react";
import { Star, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RatingPromptProps {
  orderId: string;
  jobTitle: string;
  userId: string;
  reviewerName: string;
  onDismiss: () => void;
}

export default function RatingPrompt({
  orderId,
  jobTitle,
  userId,
  reviewerName,
  onDismiss,
}: RatingPromptProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await supabase.from("reviews").insert({
        user_id: userId,
        order_id: orderId,
        rating,
        review_text: reviewText.trim() || null,
        reviewer_name: reviewerName,
        is_visible: true,
      });
      // Mark as reviewed in localStorage so prompt never shows again for this order
      const reviewed = JSON.parse(localStorage.getItem("rs_reviewed_orders") || "[]");
      localStorage.setItem("rs_reviewed_orders", JSON.stringify([...reviewed, orderId]));
      setDone(true);
      setTimeout(onDismiss, 1800);
    } catch (err) {
      console.error("[RatingPrompt] Error saving review:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Mark as dismissed so it doesn't show again
    const reviewed = JSON.parse(localStorage.getItem("rs_reviewed_orders") || "[]");
    localStorage.setItem("rs_reviewed_orders", JSON.stringify([...reviewed, orderId]));
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 relative">

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close rating prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Thank you!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your review helps other aspirants.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">
                Rate Your Experience
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Your <strong className="text-gray-700 dark:text-gray-300">{jobTitle}</strong> application is complete. How was our service?
              </p>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  id={`rating-star-${star}`}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= (hovered || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Label */}
            {rating > 0 && (
              <p className="text-center text-sm font-bold text-amber-600 dark:text-amber-400 mb-3">
                {["", "Poor 😞", "Fair 😐", "Good 👍", "Great 😊", "Excellent! 🌟"][rating]}
              </p>
            )}

            {/* Optional review text */}
            <textarea
              rows={3}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mb-4 text-gray-700 dark:text-gray-300"
            />

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || loading}
                id="submit-review-btn"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-indigo-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
