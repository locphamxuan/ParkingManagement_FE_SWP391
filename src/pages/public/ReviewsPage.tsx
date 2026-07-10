import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';
import { RatingStatsCard } from '@/components/reviews/RatingStatsCard';
import { ReviewFiltersBar } from '@/components/reviews/ReviewFiltersBar';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { WriteReviewModal } from '@/components/reviews/WriteReviewModal';

export default function ReviewsPage() {
  const rv = useReviews();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 right-0 h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <button
            type="button"
            onClick={() => rv.navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all duration-200 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-orange-400 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-white">Service Reviews</h1>
            </div>
            <p className="text-xs text-slate-400">See feedback and comments from our customers</p>
          </div>
          <button
            type="button"
            onClick={rv.handleOpenWriteReview}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer"
          >
            Write a Review
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8 relative z-10">
        {/* Title Banner */}
        <div className="text-center py-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400">
            Real Reviews
          </span>
          <h2 className="mt-3 text-3xl font-black text-white tracking-tight">
            What customers say about <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">us</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            We collect feedback continuously to keep improving parking lot quality.
          </p>
        </div>

        {/* Stats & Filters Box */}
        <div className="grid gap-6 md:grid-cols-3">
          <RatingStatsCard avg={rv.stats.avg} total={rv.stats.total} />
          <ReviewFiltersBar
            buildings={rv.buildings}
            selectedBuilding={rv.selectedBuilding}
            setSelectedBuilding={rv.setSelectedBuilding}
            selectedBuildingName={rv.selectedBuildingName}
            buildingDropdownOpen={rv.buildingDropdownOpen}
            setBuildingDropdownOpen={rv.setBuildingDropdownOpen}
            selectedRating={rv.selectedRating}
            setSelectedRating={rv.setSelectedRating}
            selectedRatingLabel={rv.selectedRatingLabel}
            ratingDropdownOpen={rv.ratingDropdownOpen}
            setRatingDropdownOpen={rv.setRatingDropdownOpen}
          />
        </div>

        {/* Reviews List */}
        <ReviewsList
          loading={rv.loading}
          reviews={rv.reviews}
          selectedBuilding={rv.selectedBuilding}
          selectedRating={rv.selectedRating}
          currentUserId={rv.user?.userId}
          deletingId={rv.deletingId}
          onDelete={rv.handleDeleteFeedback}
          onWriteReview={rv.handleOpenWriteReview}
          page={rv.page}
          totalPages={rv.totalPages}
          loadReviews={rv.loadReviews}
        />
      </main>

      {/* Review Submission Modal */}
      <WriteReviewModal
        navigate={rv.navigate}
        modalOpen={rv.modalOpen}
        setModalOpen={rv.setModalOpen}
        session={rv.session}
        sessions={rv.sessions}
        loadingSessions={rv.loadingSessions}
        sessionsError={rv.sessionsError}
        selectedSessionId={rv.selectedSessionId}
        setSelectedSessionId={rv.setSelectedSessionId}
        selectedSession={rv.selectedSession}
        dropdownOpen={rv.dropdownOpen}
        setDropdownOpen={rv.setDropdownOpen}
        ratingInput={rv.ratingInput}
        setRatingInput={rv.setRatingInput}
        hoveredRating={rv.hoveredRating}
        setHoveredRating={rv.setHoveredRating}
        commentInput={rv.commentInput}
        setCommentInput={rv.setCommentInput}
        submitting={rv.submitting}
        submitSuccess={rv.submitSuccess}
        submitError={rv.submitError}
        handleSubmitFeedback={rv.handleSubmitFeedback}
      />
    </div>
  );
}
