/**
 * Nút đăng nhập mạng xã hội (Google/Facebook/GitHub/LinkedIn) — chưa nối BE,
 * chỉ hiển thị placeholder "coming soon". Tách khỏi form login cho gọn.
 */
export function AuthSocialButtons() {
  return (
    <div className="flex justify-center gap-3.5">
      {/* Google */}
      <button
        type="button"
        onClick={() => alert('Google login is coming soon...')}
        className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5.04c1.67 0 3.2.58 4.4 1.71l3.29-3.29C17.72 1.58 14.99 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.22 7.74 8.89 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.45 12.3c0-.82-.07-1.6-.22-2.3H12v4.35h6.42c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.61z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.78a6.99 6.99 0 0 1 0-4.35L1.39 7.41a11.96 11.96 0 0 0 0 10.37l3.89-3z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.15-4.09 1.15-3.11 0-5.78-2.7-6.72-5.54L1.39 15.7A11.94 11.94 0 0 0 12 23z"
          />
        </svg>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={() => alert('Facebook login is coming soon...')}
        className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
      >
        <svg className="w-5 h-5 text-[#1877F2] fill-[#1877F2] group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* GitHub */}
      <button
        type="button"
        onClick={() => alert('GitHub login is coming soon...')}
        className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
      >
        <svg className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        type="button"
        onClick={() => alert('LinkedIn login is coming soon...')}
        className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
      >
        <svg className="w-5 h-5 text-[#0A66C2] fill-[#0A66C2] group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </button>
    </div>
  );
}
