import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Star, Sparkles, Plus, AlertTriangle, CheckCircle, RefreshCw, Quote, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type Feedback, type ParkingHistory } from '@/services/user/userApi';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Reviews states
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Get currently selected session details
  const selectedSession = useMemo(() => {
    return sessions.find((s) => s._id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const selectedBuildingName = useMemo(() => {
    if (selectedBuilding === 'all') return 'Tất cả bãi xe';
    const found = buildings.find((b) => b._id === selectedBuilding);
    return found ? found.name : 'Tất cả bãi xe';
  }, [selectedBuilding, buildings]);

  const selectedRatingLabel = useMemo(() => {
    switch (selectedRating) {
      case 'all': return 'Tất cả sao';
      case '5': return '5 sao ⭐⭐⭐⭐⭐';
      case '4': return '4 sao ⭐⭐⭐⭐';
      case '3': return '3 sao ⭐⭐⭐';
      case '2': return '2 sao ⭐⭐';
      case '1': return '1 sao ⭐';
      default: return 'Tất cả sao';
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
      .catch((err) => console.error('Failed to load buildings', err));
  }, []);

  // Load reviews list
  const loadReviews = useCallback((p = 1) => {
    setLoading(true);
    setError(null);
    const query: any = { page: p, limit: 10 };
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
        setError(err instanceof Error ? err.message : 'Tải đánh giá thất bại');
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
      const items: ParkingHistory[] = (res.data?.items ?? []).map((item: any) => ({
        ...item,
        checkIn: item.checkIn ?? item.entryTime ?? null,
        checkOut: item.checkOut ?? item.exitTime ?? null,
      }));
      // Only keep completed sessions
      const completed = items.filter((s) => s.status === 'completed');
      setSessions(completed);
      if (completed.length > 0) {
        setSelectedSessionId(completed[0]._id);
      }
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Không thể tải lịch sử gửi xe.');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Submit feedback action
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setSubmitError('Vui lòng chọn một phiên gửi xe để đánh giá.');
      return;
    }
    if (!commentInput.trim()) {
      setSubmitError('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const sessionObj = sessions.find((s) => s._id === selectedSessionId);
    if (!sessionObj) {
      setSubmitError('Phiên gửi xe không hợp lệ.');
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
      setSubmitError(err instanceof Error ? err.message : 'Gửi đánh giá thất bại. Vui lòng thử lại.');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 right-0 h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all duration-200 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-orange-400 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-white">Đánh giá dịch vụ</h1>
            </div>
            <p className="text-xs text-slate-400">Xem ý kiến và đóng góp từ khách hàng của hệ thống</p>
          </div>
          <button
            type="button"
            onClick={handleOpenWriteReview}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer"
          >
            Viết đánh giá
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8 relative z-10">
        {/* Title Banner */}
        <div className="text-center py-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400">
            <Sparkles size={11} /> Đánh giá thực tế
          </span>
          <h2 className="mt-3 text-3xl font-black text-white tracking-tight">
            Khách hàng nói gì về <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">chúng tôi</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Hệ thống luôn ghi nhận phản hồi để không ngừng cải thiện chất lượng bãi đỗ xe.
          </p>
        </div>

        {/* Stats & Filters Box */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Average Stats Card */}
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Điểm trung bình</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{stats.avg}</span>
              <span className="text-slate-500 text-lg">/ 5.0</span>
            </div>
            <div className="mt-3 flex gap-1 text-orange-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < Math.round(stats.avg) ? 'currentColor' : 'none'}
                  className={i < Math.round(stats.avg) ? 'text-orange-400' : 'text-slate-650'}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Dựa trên {stats.total} lượt đánh giá</p>
          </div>

          {/* Filters Card */}
          <div className="md:col-span-2 rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-300">Bộ lọc đánh giá</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Tòa nhà / Bãi xe</label>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBuildingDropdownOpen(!buildingDropdownOpen);
                      setRatingDropdownOpen(false);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-orange-500/50 focus:outline-none transition-all flex justify-between items-center cursor-pointer hover:border-white/20 hover:bg-slate-850"
                  >
                    <span className="font-semibold text-slate-200">{selectedBuildingName}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${buildingDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {buildingDropdownOpen && (
                    <div className="absolute z-30 w-full mt-1.5 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBuilding('all');
                          setBuildingDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                          selectedBuilding === 'all'
                            ? 'text-orange-400 bg-orange-500/10 font-bold'
                            : 'text-slate-355 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Tất cả bãi xe
                      </button>
                      {buildings.map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => {
                            setSelectedBuilding(b._id);
                            setBuildingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                            selectedBuilding === b._id
                              ? 'text-orange-400 bg-orange-500/10 font-bold'
                              : 'text-slate-355 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Số sao</label>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRatingDropdownOpen(!ratingDropdownOpen);
                      setBuildingDropdownOpen(false);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-orange-500/50 focus:outline-none transition-all flex justify-between items-center cursor-pointer hover:border-white/20 hover:bg-slate-850"
                  >
                    <span className="font-semibold text-slate-200">{selectedRatingLabel}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${ratingDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {ratingDropdownOpen && (
                    <div className="absolute z-30 w-full mt-1.5 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {[
                        { val: 'all', label: 'Tất cả sao' },
                        { val: '5', label: '5 sao ⭐⭐⭐⭐⭐' },
                        { val: '4', label: '4 sao ⭐⭐⭐⭐' },
                        { val: '3', label: '3 sao ⭐⭐⭐' },
                        { val: '2', label: '2 sao ⭐⭐' },
                        { val: '1', label: '1 sao ⭐' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setSelectedRating(item.val);
                            setRatingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                            selectedRating === item.val
                              ? 'text-orange-400 bg-orange-500/10 font-bold'
                              : 'text-slate-355 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBuilding('all');
                  setSelectedRating('all');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="mx-auto animate-spin text-orange-500" size={32} />
            <p className="text-sm text-slate-450 font-medium">Đang tải danh sách đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-16 text-center max-w-md mx-auto flex flex-col items-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-650" />
            <p className="text-base font-bold text-slate-300">Chưa có đánh giá nào</p>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-xs">
              {selectedBuilding !== 'all' || selectedRating !== 'all'
                ? 'Không tìm thấy đánh giá nào khớp với bộ lọc hiện tại.'
                : 'Hãy là người đầu tiên gửi đánh giá trải nghiệm gửi xe của bạn!'}
            </p>
            <button
              type="button"
              onClick={handleOpenWriteReview}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              Viết đánh giá đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reviews Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {reviews.map((item) => {
                const userInitials = item.user?.fullName
                  ? item.user.fullName
                      .split(' ')
                      .slice(-2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()
                  : 'U';

                return (
                  <div
                    key={item._id}
                    className="group relative rounded-3xl border border-white/6 bg-white/3 p-6 hover:border-orange-500/20 hover:bg-white/5 transition-all duration-350 shadow-lg hover:shadow-orange-500/2 shadow-slate-950/20 hover:scale-[1.01]"
                  >
                    {/* Background decoration inside card */}
                    <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-orange-500/5 transition-colors">
                      <Quote size={40} className="transform rotate-180" />
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {item.user?.avatar ? (
                        <img
                          src={item.user.avatar}
                          alt={item.user.fullName || 'User'}
                          className="h-11 w-11 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/10">
                          {userInitials}
                        </div>
                      )}

                      {/* Header details */}
                      <div className="space-y-1">
                        <p className="font-bold text-white leading-tight">
                          {item.user?.fullName || item.user?.email || 'Người dùng ẩn danh'}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-450 tracking-wide">
                          Khách hàng · {item.building?.name || 'Bãi đỗ'}
                        </p>
                      </div>
                    </div>

                    {/* Rating stars & Date */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-0.5 text-orange-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < item.rating ? 'currentColor' : 'none'}
                            className={i < item.rating ? 'text-orange-400' : 'text-slate-700'}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-black text-slate-350">{item.rating}.0</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{fmtTime(item.createdAt)}</span>
                    </div>

                    {/* Comment text */}
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
                      {item.comment}
                    </p>

                    {/* Manager's reply */}
                    {item.staffReply && (
                      <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                          <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                            Phản hồi từ quản trị viên
                          </p>
                          {item.repliedBy?.fullName && (
                            <span className="text-[10px] text-slate-450">({item.repliedBy.fullName})</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {item.staffReply}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2.5 pt-4">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => loadReviews(page - 1)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  ← Trước
                </button>
                <span className="text-xs text-slate-400 font-bold">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadReviews(page + 1)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Review Submission Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Đánh giá dịch vụ gửi xe">
        <div className="text-slate-100 text-sm leading-relaxed p-1">
          {!session ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5 px-4">
                <p className="font-black text-white text-base">Yêu cầu đăng nhập</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bạn cần đăng nhập bằng tài khoản Khách hàng và hoàn thành ít nhất một lượt gửi xe mới có quyền viết đánh giá dịch vụ.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl text-xs font-bold px-4 py-2 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    navigate('/auth/login');
                  }}
                  className="rounded-xl text-xs font-bold px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          ) : session.role !== 'user' ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5 px-4">
                <p className="font-black text-white text-base">Tính năng dành cho khách hàng</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tài khoản hiện tại của bạn có vai trò là <strong>{session.role === 'admin' ? 'Quản trị viên' : session.role === 'manager' ? 'Quản lý' : 'Nhân viên'}</strong>. Chỉ tài khoản Khách hàng (User) mới có quyền gửi đánh giá dịch vụ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="mt-2 rounded-xl text-xs font-bold px-5 py-2.5 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          ) : loadingSessions ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="mx-auto animate-spin text-orange-500" size={24} />
              <p className="text-xs text-slate-400">Đang kiểm tra lịch sử gửi xe của bạn...</p>
            </div>
          ) : sessionsError ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 flex gap-3 text-rose-400 items-start">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="font-bold text-sm">Lỗi tải dữ liệu</p>
                <p className="text-xs leading-relaxed">{sessionsError}</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1 px-4">
                <p className="font-black text-white text-base">Yêu cầu hoàn thành dịch vụ</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hệ thống ghi nhận bạn chưa hoàn thành phiên gửi xe nào. Vui lòng sử dụng dịch vụ và hoàn tất thanh toán trước khi thực hiện đánh giá.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="mt-2 rounded-xl text-xs font-bold px-5 py-2.5 border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          ) : submitSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle size={32} />
              </div>
              <p className="font-black text-white text-base">Cảm ơn đánh giá của bạn!</p>
              <p className="text-xs text-slate-400 font-semibold">Ý kiến đóng góp đã được gửi lên hệ thống và đang chờ phê duyệt.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <p className="text-xs text-slate-400">
                Ý kiến của bạn giúp chúng tôi cải thiện chất lượng bãi đỗ xe tốt hơn mỗi ngày.
              </p>

              {/* Sessions Select */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Chọn lượt gửi xe đã hoàn thành</label>
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
                        `${selectedSession.plateNumber} tại ${selectedSession.building.name} (Check-out: ${fmtTime(selectedSession.checkOut)})`
                      ) : (
                        'Chọn lượt gửi xe đã hoàn thành'
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
                          <span className="font-semibold">{s.plateNumber} tại {s.building.name}</span>
                          <span className="text-[10px] opacity-75 font-mono text-slate-400">Check-out: {fmtTime(s.checkOut)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stars Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Mức độ hài lòng</label>
                <div className="flex gap-1.5 py-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const index = i + 1;
                    const active = hoveredRating !== null ? index <= hoveredRating : index <= ratingInput;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRatingInput(index)}
                        onMouseEnter={() => setHoveredRating(index)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="text-slate-700 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={28}
                          fill={active ? '#f97316' : 'none'}
                          className={active ? 'text-orange-500' : 'text-slate-800'}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 font-mono font-black text-orange-400 self-center text-xs">
                    {ratingInput} / 5 sao
                  </span>
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Nội dung đánh giá</label>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Nhập trải nghiệm, đóng góp ý kiến của bạn về chỗ đỗ, thái độ nhân viên..."
                  rows={4}
                  required
                  maxLength={1000}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white placeholder:text-slate-650 focus:border-orange-500 focus:outline-none transition-all resize-none"
                />
                <div className="text-right text-[9px] font-mono text-slate-500">
                  {commentInput.length} / 1000 ký tự
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-5 py-2.5 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
