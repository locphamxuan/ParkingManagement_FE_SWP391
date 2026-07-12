import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type Feedback, type ParkingHistory } from '@/services/user/userApi';

export const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * State + business logic for the public Reviews page: loading/filtering the
 * reviews list, deleting own reviews, and the "write a review" submission
 * flow (parking session lookup + feedback creation). Tách khỏi ReviewsPage
 * để page chỉ còn lo phần hiển thị theo từng khu vực (stats, filters, list, modal).
 */
export function useReviews() {
  const navigate = useNavigate();
  const { session, user } = useAuth();

  // Reviews states
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<{ _id: string; name: string }[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Write Review states
  const [modalOpen, setModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ParkingHistory[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Form states
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Custom Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(feedbackId);
    try {
      await userApi.feedbacks.remove(feedbackId);
      loadReviews(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  // Get currently selected session details
  const selectedSession = useMemo(() => {
    return sessions.find((s) => s._id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const selectedBuildingName = useMemo(() => {
    if (selectedBuilding === 'all') return 'All parking lots';
    const found = buildings.find((b) => b._id === selectedBuilding);
    return found ? found.name : 'All parking lots';
  }, [selectedBuilding, buildings]);

  const selectedRatingLabel = useMemo(() => {
    switch (selectedRating) {
      case 'all': return 'All ratings';
      case '5': return '5 stars ⭐⭐⭐⭐⭐';
      case '4': return '4 stars ⭐⭐⭐⭐';
      case '3': return '3 stars ⭐⭐⭐';
      case '2': return '2 stars ⭐⭐';
      case '1': return '1 star ⭐';
      default: return 'All ratings';
    }
  }, [selectedRating]);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!dropdownOpen && !buildingDropdownOpen && !ratingDropdownOpen) return;
    const handleClose = () => {
      setDropdownOpen(false);
      setBuildingDropdownOpen(false);
      setRatingDropdownOpen(false);
    };
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [dropdownOpen, buildingDropdownOpen, ratingDropdownOpen]);

  // Load buildings
  useEffect(() => {
    userApi.buildings
      .list({ limit: 100 })
      .then((res) => {
        const items = res.data?.items || [];
        setBuildings(items.map((b) => ({ _id: b._id, name: b.name })));
      })
      .catch(() => undefined);
  }, []);

  // Load reviews list
  const loadReviews = useCallback((p = 1) => {
    setLoading(true);
    setError(null);
    const query: { page: number; limit: number; buildingId?: string; rating?: number } = { page: p, limit: 10 };
    if (selectedBuilding !== 'all') query.buildingId = selectedBuilding;
    if (selectedRating !== 'all') query.rating = Number(selectedRating);

    userApi.feedbacks
      .listAll(query)
      .then((res) => {
        const raw = res.data;
        setReviews(raw?.items || []);
        setTotalPages(raw?.pagination?.totalPages ?? 1);
        setPage(p);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, [selectedBuilding, selectedRating]);

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  // Load user parking sessions when opening modal
  const handleOpenWriteReview = async () => {
    setModalOpen(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    setCommentInput('');
    setRatingInput(5);
    setSelectedSessionId('');

    if (!session) {
      setSessions([]);
      return;
    }
    if (session.role !== 'user') {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    setSessionsError(null);

    try {
      const res = await userApi.parkingHistory.list({ limit: 100 });
      // Map checkIn/checkOut standard fields
      const items: ParkingHistory[] = (res.data?.items ?? []).map(
        (item: ParkingHistory & { entryTime?: string | null; exitTime?: string | null }) => ({
          ...item,
          checkIn: item.checkIn ?? item.entryTime ?? null,
          checkOut: item.checkOut ?? item.exitTime ?? null,
        }),
      );
      // Only keep completed sessions
      const completed = items.filter((s) => s.status === 'completed');
      setSessions(completed);
      if (completed.length > 0) {
        setSelectedSessionId(completed[0]._id);
      }
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Unable to load parking history.');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Submit feedback action
  const handleSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setSubmitError('Please select a parking session to review.');
      return;
    }
    if (!commentInput.trim()) {
      setSubmitError('Please enter your review comment.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const sessionObj = sessions.find((s) => s._id === selectedSessionId);
    if (!sessionObj) {
      setSubmitError('Invalid parking session.');
      setSubmitting(false);
      return;
    }

    try {
      await userApi.feedbacks.create({
        buildingId: sessionObj.building._id,
        parkingSessionId: selectedSessionId,
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        loadReviews(1);
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, total: 0 };
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: Number((sum / total).toFixed(1)),
      total,
    };
  }, [reviews]);

  return {
    navigate,
    session,
    user,
    reviews,
    loading,
    error,
    deletingId,
    buildings,
    selectedBuilding,
    setSelectedBuilding,
    selectedRating,
    setSelectedRating,
    selectedBuildingName,
    selectedRatingLabel,
    page,
    totalPages,
    loadReviews,
    modalOpen,
    setModalOpen,
    sessions,
    loadingSessions,
    sessionsError,
    selectedSessionId,
    setSelectedSessionId,
    selectedSession,
    ratingInput,
    setRatingInput,
    hoveredRating,
    setHoveredRating,
    commentInput,
    setCommentInput,
    submitting,
    submitSuccess,
    submitError,
    dropdownOpen,
    setDropdownOpen,
    buildingDropdownOpen,
    setBuildingDropdownOpen,
    ratingDropdownOpen,
    setRatingDropdownOpen,
    stats,
    handleDeleteFeedback,
    handleOpenWriteReview,
    handleSubmitFeedback,
  };
}

export type ReviewsWorkflow = ReturnType<typeof useReviews>;
