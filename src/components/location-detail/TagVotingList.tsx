/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../../types/accessibility';
import { getTagIcon } from '../../utils/tagHelpers';
import { Badge } from '../ui/Badge';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface TagVotingListProps {
  location: LocationPin;
  onVoteTag: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAnnounce: (msg: string) => void;
}

export const TagVotingList: React.FC<TagVotingListProps> = ({
  location,
  onVoteTag,
  onAnnounce,
}) => {
  return (
    <div className="space-y-3 font-space">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F172A]">
          Accessibility Features & Community Verification
        </h3>
        <span className="text-xs text-[#475569] font-bold">
          {location.tags.length} reported tags
        </span>
      </div>

      <div className="space-y-2.5">
        {location.tags.map((tag) => {
          const isVerified = tag.confirmations >= 2 && tag.confirmations > tag.disputes;
          return (
            <div
              key={tag.name}
              className="p-3.5 bg-white rounded-[14px] border-[1.5px] border-[#0F172A] shadow-[0_2px_0_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-full bg-[#21524B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {tag.name}
                  </span>

                  {isVerified && (
                    <Badge variant="success" size="xs">
                      Community verified
                    </Badge>
                  )}

                  {tag.isAiSuggested && (
                    <Badge variant="ai-suggested" size="xs">
                      AI-suggested
                    </Badge>
                  )}
                </div>

                {tag.rating > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#475569]">
                    <span className="font-bold text-[#0F172A]">
                      {tag.rating.toFixed(1)}★
                    </span>
                    <span>({tag.ratingCount} ratings)</span>
                  </div>
                )}
              </div>

              {/* Confirm & Dispute Voting Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    onVoteTag(location.id, tag.name, 'confirm');
                    onAnnounce(`You voted to confirm ${tag.name}`);
                  }}
                  className={`btn-neo text-xs px-3 py-1 ${
                    tag.userVoted === 'confirm' ? 'btn-neo-accent' : ''
                  }`}
                  title="Confirm this tag is accurate"
                  aria-label={`Confirm tag ${tag.name}. Currently has ${tag.confirmations} confirmations.`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                  <span className="font-mono text-[11px] opacity-90">
                    ({tag.confirmations})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onVoteTag(location.id, tag.name, 'dispute');
                    onAnnounce(`You voted to dispute ${tag.name}`);
                  }}
                  className={`btn-neo text-xs px-3 py-1 ${
                    tag.userVoted === 'dispute' ? 'bg-rose-600 text-white' : ''
                  }`}
                  title="Dispute this tag (inaccurate or barrier exists)"
                  aria-label={`Dispute tag ${tag.name}. Currently has ${tag.disputes} disputes.`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Dispute</span>
                  <span className="font-mono text-[11px] opacity-90">
                    ({tag.disputes})
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

