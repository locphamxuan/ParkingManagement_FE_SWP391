import type { ReactNode, FormEvent } from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthPageForm } from '@/hooks/useAuthPageForm';
import type { AuthMode } from '@/pages/AuthPage';
import { MIN_PASSWORD_LENGTH } from '@/utils/constants';

type SubmitFn = (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;

/**
 * Đăng ký đi 2 bước (xin OTP → xác minh) vì backend đã gỡ endpoint đăng ký
 * thẳng. Bài test này giữ đúng hợp đồng với `AuthRoutes`: bước 1 KHÔNG kèm `otp`,
 * bước 2 kèm `otp` + mật khẩu đã nhập ở bước 1 (backend vứt mật khẩu ở bước 1).
 */

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

const STRONG_PASSWORD = 'canh-buom-do-thang-7';

const fakeEvent = () => ({ preventDefault: () => {} }) as unknown as FormEvent<HTMLFormElement>;

function setup(onSubmit: Mock<SubmitFn>) {
  return renderHook(
    () =>
      useAuthPageForm({
        mode: 'register',
        notice: {},
        onModeChange: () => {},
        onSubmit,
      }),
    { wrapper }
  );
}

/** Điền form đăng ký hợp lệ. */
function fillForm(result: { current: ReturnType<typeof useAuthPageForm> }, over: Record<string, string> = {}) {
  const values: Record<string, string> = {
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    email: 'a@example.com',
    password: STRONG_PASSWORD,
    confirmPassword: STRONG_PASSWORD,
    ...over,
  };

  act(() => {
    Object.entries(values).forEach(([name, value]) => {
      result.current.handleChange({
        target: { name, value },
      } as React.ChangeEvent<HTMLInputElement>);
    });
  });
}

describe('useAuthPageForm — đăng ký 2 bước', () => {
  let onSubmit: Mock<SubmitFn>;

  beforeEach(() => {
    localStorage.clear();
    onSubmit = vi.fn<SubmitFn>().mockResolvedValue(undefined);
  });

  it('bước 1 gửi thông tin không kèm otp rồi chuyển sang ô nhập mã', async () => {
    const { result } = setup(onSubmit);
    fillForm(result);

    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0].payload;
    expect(payload).toMatchObject({ email: 'a@example.com', fullName: 'Nguyễn Văn A' });
    expect(payload.otp).toBeUndefined();
    expect(result.current.otpStep).toBe(true);
    expect(result.current.pendingEmail).toBe('a@example.com');
  });

  it('mật khẩu ngắn hơn ngưỡng của backend thì không gửi gì lên', async () => {
    const { result } = setup(onSubmit);
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    fillForm(result, { password: short, confirmPassword: short });

    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.otpStep).toBe(false);
    expect(result.current.displayNotice.type).toBe('error');
  });

  it('bước 1 lỗi thì ở lại form, không nhảy sang ô nhập mã', async () => {
    onSubmit.mockRejectedValueOnce(new Error('Valid email is required'));
    const { result } = setup(onSubmit);
    fillForm(result);

    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    expect(result.current.otpStep).toBe(false);
  });

  it('bước 2 gửi kèm otp và mật khẩu đã nhập ở bước 1', async () => {
    const { result } = setup(onSubmit);
    fillForm(result);
    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    act(() => result.current.setOtpCode('123456'));
    await act(async () => {
      await result.current.handleVerifyOtp(fakeEvent());
    });

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[1][0].payload).toMatchObject({
      email: 'a@example.com',
      otp: '123456',
      password: STRONG_PASSWORD,
    });
  });

  it('mã không đủ 6 chữ số thì không gọi backend', async () => {
    const { result } = setup(onSubmit);
    fillForm(result);
    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    act(() => result.current.setOtpCode('123'));
    await act(async () => {
      await result.current.handleVerifyOtp(fakeEvent());
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(result.current.displayNotice.type).toBe('error');
  });

  it('gửi lại mã dùng đúng dữ liệu bước 1, không bắt nhập lại form', async () => {
    const { result } = setup(onSubmit);
    fillForm(result);
    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    await act(async () => {
      await result.current.handleResendOtp();
    });

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[1][0].payload.otp).toBeUndefined();
    expect(result.current.otpStep).toBe(true);
  });

  it('bấm Back quay về form đăng ký', async () => {
    const { result } = setup(onSubmit);
    fillForm(result);
    await act(async () => {
      await result.current.handleSubmit(fakeEvent());
    });

    act(() => result.current.handleCancelOtp());

    expect(result.current.otpStep).toBe(false);
    expect(result.current.otpCode).toBe('');
  });
});
