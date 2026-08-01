import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Chữ ký của lỗi React vs DOM bị sửa từ bên ngoài — kinh điển là tiện ích dịch
 * trang thay text node dưới chân React. `index.html` đã gắn `notranslate` nên đây
 * chỉ là lớp chắn thứ hai. Cố ý KHÔNG bắt mọi chuỗi chứa "Node": `NodeList`,
 * `ReactNode`, `getRootNode`… là lỗi ứng dụng bình thường, không phải DOM lệch.
 */
const DOM_DESYNC_SIGNATURES = ['insertBefore', 'removeChild', 'not a child of this node'];

// Tải lại trang thì mất luôn state đã crash, nên phải nhớ ở nơi sống qua reload.
// Sống theo tab (sessionStorage) chứ không theo trình duyệt: mở tab mới là một
// lần thử mới hợp lệ.
const RELOAD_ONCE_KEY = 'pbms:dom-desync-reloaded';

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || '';
      // Tự tải lại ĐÚNG MỘT LẦN. Nếu lỗi là thật (không phải DOM bị sửa ngoài) thì
      // nó sẽ tái diễn ngay sau reload — không có chốt chặn này, người dùng rơi vào
      // vòng lặp tải lại vô tận và không bao giờ đọc được thông báo lỗi.
      if (DOM_DESYNC_SIGNATURES.some((signature) => msg.includes(signature))) {
        let reloading = false;
        try {
          if (sessionStorage.getItem(RELOAD_ONCE_KEY) !== '1') {
            sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
            reloading = true;
            window.location.reload();
          }
        } catch {
          // sessionStorage bị chặn (chế độ riêng tư/iframe) → không đếm được số lần
          // thử, nên bỏ hẳn việc tự tải lại và hiện màn hình lỗi cho người dùng.
          reloading = false;
        }
        if (reloading) return null;
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
            <p className="text-4xl font-black text-rose-500">!</p>
            <h2 className="mt-3 text-lg font-semibold text-foreground">An unexpected error occurred</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-rose-500 px-5 py-2 text-sm font-bold text-white hover:bg-rose-400 transition"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
