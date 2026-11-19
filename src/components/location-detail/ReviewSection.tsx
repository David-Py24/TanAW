/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, Review } from '../../types/accessibility';
import { StarRating } from '../ui/StarRating';
import { MessageSquare, PlusCircle, Calendar, Send } from 'lucide-react';

interface ReviewSectionProps {
  location: LocationPin;
  onAddReview: (pinId: string, review: Omit<Review, 'id' | 'date'>) => void;
  onAnnounce: (msg: string) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  location,
  onAddReview,
  onAnnounce,
}) => {
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tagRatings, setTagRatings] = useState<Record<string, number>>({});

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      onAnnounce('Please provide your name and a brief comment');
      return;
    }

    onAddReview(location.id, {
      authorName: authorName.trim(),
      rating: newRating,
      comment: comment.trim(),
      tagRatings,
    });

    setAuthorName('');
    setComment('');
    setTagRatings({});
    setIsAddingReview(false);
    onAnnounce('Thank you! Your accessibility review has been submitted.');
  };

  return (
    <div className="space-y-4 pt-4 border-t-[1.5px] border-dashed border-[#CBD5E1] font-space">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#21524B]" />
          <h3 className="text-sm font-bold text-[#0F172A]">
            Community Reviews & Notes ({location.reviews.length})
          </h3>
        </div>
        {!isAddingReview && (
          <button
            type="button"
            onClick={() => setIsAddingReview(true)}
            className="btn-neo text-xs px-3.5 py-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#21524B]" />
            <span>Write Review</span>
          </button>
        )}
      </div>

      {/* Add Review Form */}
      {isAddingReview && (
        <form
          onSubmit={handleReviewSubmit}
          className="p-4 bg-white rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_3px_0_#0F172A] space-y-3.5 animate-fade-in"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            Add Your Accessibility Experience
          </h4>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Your Name or Handle
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Maria S."
              className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#0F172A] text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B] shadow-[0_1.5px_0_#0F172A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Overall Accessibility Rating (1–5 Stars)
            </label>
            <div className="flex items-center gap-2">
              <StarRating
                value={newRating}
                onChange={setNewRating}
                size="lg"
              />
              <span className="text-xs font-bold text-[#0F172A] ml-2">
                {newRating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Optional tag ratings */}
          {location.tags.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Rate Specific Features (Optional):
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border-[1.5px] border-[#0F172A]">
                {location.tags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between text-xs py-1">
                    <span className="truncate max-w-[200px] text-[#0F172A] font-medium">{tag.name}</span>
                    <div className="flex items-center gap-1">
                      <StarRating
                        value={tagRatings[tag.name] || 0}
                        onChange={(s) => setTagRatings({ ...tagRatings, [tag.name]: s })}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Detailed Accessibility Comment
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about ramps, door width, bathroom grab bars, sensory conditions, staff assistance..."
              className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#0F172A] text-xs sm:text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B] shadow-[0_1.5px_0_#0F172A]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingReview(false)}
              className="btn-neo text-xs px-3.5 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-neo btn-neo-accent text-xs px-4 py-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Reviews List */}
      <div className="space-y-3">
        {location.reviews.length === 0 ? (
          <p className="text-xs text-[#0F172A]/60 italic py-2">
            No written reviews yet. Be the first to share an accessibility review!
          </p>
        ) : (
          location.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 bg-white rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_2px_0_#0F172A] space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0F172A]">{rev.authorName}</span>
                <div className="flex items-center gap-1 text-[#0F172A]/60 text-[11px] font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{rev.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-500">
                <StarRating value={rev.rating} size="sm" showLabel labelSuffix="★" />
              </div>

              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

