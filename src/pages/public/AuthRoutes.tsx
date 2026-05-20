import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
import { saveSession } from "@/services/storage";

function usePublicAuthFlow(initialMode: "login" | "register") {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [notice, setNotice] = useState<{ message?: string; type?: string }>({});
  const [isLoading, setLoading] = useState(false);

  const onModeChange = useCallback((m: "login" | "register") => setMode(m), []);

  const onBackHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  const onSubmit = useCallback(
    async ({
      mode: m,
      payload,
    }: {
      mode: "login" | "register";
      payload: Record<string, string>;
    }) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));

      if (m === "login") {
        // Lưu session mock vào localStorage để UI hiển thị tên user
        saveSession({
          token: `mock-token-${Date.now()}`,
          user: { fullName: "Khach hang", email: payload.email, role: "user" },
        });

        setNotice({ message: "Đăng nhập thành công (mock).", type: "success" });
        setLoading(false);
        // Redirect về trang Home (landing) thay vì dashboard
        navigate("/", { replace: true });
        return;
      }

      setNotice({
        message: "Đăng ký thành công (mock). Vui lòng kiểm tra email.",
        type: "success",
      });
      setLoading(false);
      setMode("login");
    },
    [navigate],
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const flow = usePublicAuthFlow("login");
  return <AuthPage {...flow} />;
}

export function PublicRegisterRoute() {
  const flow = usePublicAuthFlow("register");
  return <AuthPage {...flow} />;
}

export default PublicLoginRoute;
