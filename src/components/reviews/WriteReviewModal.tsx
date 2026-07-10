import type { FormEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { AlertTriangle, ChevronDown, CheckCircle, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { ParkingHistory } from '@/services/user/userApi';
import { StarRatingInput } from '@/components/reviews/StarRatingInput';
import { fmtTime } from '@/hooks/useReviews';
import type { useAuth } from '@/hooks/useAuth';

type Session = ReturnType<typeof useAuth>['session'];

interface WriteReviewModalProps {
  navigate: NavigateFunction;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  session: Session;
  sessions: ParkingHistory[];
  loadingSessions: boolean;
  sessionsError: string | null;
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
  selectedSession: ParkingHistory | null;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  ratingInput: number;
  setRatingInput: (rating: number) => void;
  hoveredRating: number | null;
  setHoveredRating: (rating: number | null) => void;
  commentInput: string;
  setCommentInput: (comment: string) => void;
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  handleSubmitFeedback: (e: FormEvent) => void;
}

/** "Write a review" modal: login/role guards, completed-session lookup, and the submission form. */
export function WriteReviewModal({
  navigate,
  modalOpen,
  setModalOpen,
  session,
  sessions,
  loadingSessions,
  sessionsError,
  selectedSessionId,
  setSelectedSessionId,
  selectedSession,
  dropdownOpen,
  setDropdownOpen,
  ratingInput,
  setRatingInput,
  hoveredRating,
  setHoveredRating,
  commentInput,
  setCommentInput,
  submitting,
  submitSuccess,
  submitError,
  handleSubmitFeedback,
}: WriteReviewModalProps) {
  return (
    <Modal open={modalOpen} onOpenChange={setModalOpen} title="Rate Parking Service">
      <div className="text-slate-100 text-sm leading-relaxed p-1">
        {!session ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="font-black text-white text-base">Login Required</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                You need to log in with a Customer account and complete at least one parking session before you can write a service review.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl text-xs font-bold px-4 py-2 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  navigate('/auth/login');
                }}
                className="rounded-xl text-xs font-bold px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
              >
                Log In Now
              </button>
            </div>
          </div>
        ) : session.role !== 'user' ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="font-black text-white text-base">Customer Feature Only</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your current account role is <strong>{session.role === 'admin' ? 'Administrator' : session.role === 'manager' ? 'Manager' : 'Staff'}</strong>. Only Customer accounts can submit service reviews.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-2 rounded-xl text-xs font-bold px-5 py-2.5 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        ) : loadingSessions ? (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="mx-auto animate-spin text-orange-500" size={24} />
            <p className="text-xs text-slate-400">Checking your parking history...</p>
          </div>
        ) : sessionsError ? (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 flex gap-3 text-rose-400 items-start">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <p className="font-bold text-sm">Failed to Load Data</p>
              <p className="text-xs leading-relaxed">{sessionsError}</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1 px-4">
              <p className="font-black text-white text-base">Completed Session Required</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our records show you haven't completed any parking session yet. Please use the service and complete payment before submitting a review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-2 rounded-xl text-xs font-bold px-5 py-2.5 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        ) : submitSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle size={32} />
            </div>
            <p className="font-black text-white text-base">Thank you for your review!</p>
            <p className="text-xs text-slate-400 font-semibold">Your feedback has been submitted to the system and is pending approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <p className="text-xs text-slate-400">
              Your feedback helps us improve our parking lot quality every day.
            </p>

            {/* Sessions Select */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Select completed parking session</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs text-white focus:border-orange-500/50 focus:outline-none transition-all flex justify-between items-center cursor-pointer hover:bg-slate-900/60 hover:border-white/15"
                >
                  <span className="font-semibold text-slate-200">
                    {selectedSession ? (
                      `${selectedSession.plateNumber} at ${selectedSession.building.name} (Check-out: ${fmtTime(selectedSession.checkOut)})`
                    ) : (
                      'Select completed parking session'
                    )}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-1.5 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200 scrollbar-thin scrollbar-thumb-slate-800">
                    {sessions.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(s._id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs transition-all flex justify-between items-center hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 ${
                          s._id === selectedSessionId
                            ? 'text-orange-400 bg-orange-500/10 font-bold'
                            : 'text-slate-350 hover:text-white'
                        }`}
                      >
                        <span className="font-semibold">{s.plateNumber} at {s.building.name}</span>
                        <span className="text-[10px] opacity-75 font-mono text-slate-400">Check-out: {fmtTime(s.checkOut)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stars Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Satisfaction Level</label>
              <StarRatingInput
                value={ratingInput}
                hoveredRating={hoveredRating}
                onHover={setHoveredRating}
                onChange={setRatingInput}
              />
            </div>

            {/* Comment Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Review Comment</label>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Enter your experience, feedback about the spot, staff attitude..."
                rows={4}
                required
                maxLength={1000}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white placeholder:text-slate-650 focus:border-orange-500 focus:outline-none transition-all resize-none"
              />
              <div className="text-right text-[9px] font-mono text-slate-500">
                {commentInput.length} / 1000 characters
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 px-3 py-2.5 text-xs text-rose-450 flex gap-2 items-center">
                <AlertTriangle className="shrink-0" size={13} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form buttons */}
            <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-xl px-5 py-2.5 font-bold text-xs border border-white/10 bg-transparent text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl px-5 py-2.5 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
