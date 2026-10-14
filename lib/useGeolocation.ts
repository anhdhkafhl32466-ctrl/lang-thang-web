'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoPoint } from './geo';

export type GeoPermissionState = 'unknown' | 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface GeolocationErrorInfo {
  code:
    | 'unsupported'
    | 'insecure-context'
    | 'permission-denied'
    | 'position-unavailable'
    | 'timeout'
    | 'unknown';
  /** Thông báo ngắn gọn, nói rõ vì sao không lấy được vị trí. */
  message: string;
  /** Hướng dẫn cụ thể để người dùng tự bật lại quyền vị trí. */
  hint: string;
}

export type GeolocationStatus = 'idle' | 'locating' | 'tracking' | 'success' | 'error';

export interface UseGeolocationResult {
  /** Vị trí GPS thật của người dùng. null nghĩa là CHƯA có vị trí thật (không có vị trí mặc định). */
  position: GeoPoint | null;
  status: GeolocationStatus;
  error: GeolocationErrorInfo | null;
  permission: GeoPermissionState;
  isSupported: boolean;
  /** Lấy vị trí một lần. Nếu opts.watch = true thì theo dõi liên tục khi người dùng di chuyển. */
  locate: (opts?: { watch?: boolean; highAccuracy?: boolean }) => void;
  /** Dừng theo dõi và xoá vị trí hiện tại khỏi state. */
  clear: () => void;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 0,
};

const PERMISSION_DENIED_ERROR: GeolocationErrorInfo = {
  code: 'permission-denied',
  message: 'Quyền truy cập vị trí đang bị chặn cho trang này, nên không thể lấy toạ độ thật.',
  hint:
    'Bấm vào biểu tượng ổ khoá 🔒 (hoặc biểu tượng vị trí) trên thanh địa chỉ → chọn "Cài đặt trang web" / "Site settings" → mục "Vị trí (Location)" → chọn "Cho phép (Allow)", sau đó tải lại trang và bấm lại nút định vị.',
};

function describeError(error: GeolocationPositionError): GeolocationErrorInfo {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return PERMISSION_DENIED_ERROR;
    case error.POSITION_UNAVAILABLE:
      return {
        code: 'position-unavailable',
        message: 'Thiết bị không xác định được vị trí (GPS yếu hoặc dịch vụ vị trí đang tắt).',
        hint:
          'Kiểm tra đã bật GPS/Dịch vụ vị trí trên thiết bị chưa, ra khu vực thoáng hơn, rồi thử lại. Trên máy tính, hãy bật "Location services" trong cài đặt hệ điều hành.',
      };
    case error.TIMEOUT:
      return {
        code: 'timeout',
        message: 'Quá thời gian chờ lấy vị trí (12 giây) mà thiết bị chưa phản hồi.',
        hint:
          'Thử lại; nếu vẫn lỗi, hãy kiểm tra kết nối mạng và bật lại dịch vụ vị trí của thiết bị.',
      };
    default:
      return {
        code: 'unknown',
        message: 'Không lấy được vị trí vì lỗi không xác định từ trình duyệt.',
        hint: 'Hãy tải lại trang và thử lại; nếu vẫn lỗi, kiểm tra cài đặt quyền vị trí của trình duyệt.',
      };
  }
}

/**
 * Bọc Geolocation API của trình duyệt.
 *
 * Nguyên tắc bắt buộc:
 *  - Chỉ trả về toạ độ THẬT do thiết bị cung cấp; tuyệt đối không thay bằng toạ độ mặc định.
 *  - Khi thất bại, trạng thái là "error" kèm nguyên nhân và hướng dẫn, KHÔNG báo thành công giả.
 *  - Hỗ trợ watchPosition để cập nhật khi người dùng di chuyển.
 */
export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<GeolocationErrorInfo | null>(null);
  const [permission, setPermission] = useState<GeoPermissionState>('unknown');

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  // Đánh dấu lần lấy vị trí gần nhất để bỏ qua phản hồi đến muộn sau khi clear().
  const requestTokenRef = useRef(0);

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const supported =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator;
    setIsSupported(supported);
    if (!supported) setPermission('unsupported');
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        /* bỏ qua */
      }
    }
    watchIdRef.current = null;
  }, []);

  const clear = useCallback(() => {
    requestTokenRef.current += 1;
    stopWatch();
    setPosition(null);
    setError(null);
    setStatus('idle');
  }, [stopWatch]);

  const locate = useCallback(
    (opts: { watch?: boolean; highAccuracy?: boolean } = {}) => {
      const token = ++requestTokenRef.current;

      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setStatus('error');
        setError({
          code: 'unsupported',
          message: 'Trình duyệt này không hỗ trợ Geolocation API.',
          hint: 'Hãy dùng bản mới nhất của Chrome, Edge, Firefox hoặc Safari để định vị.',
        });
        return;
      }

      // Geolocation chỉ hoạt động trên HTTPS (hoặc localhost).
      const secure =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (!secure) {
        setStatus('error');
        setError({
          code: 'insecure-context',
          message: 'Trình duyệt chỉ cho phép lấy vị trí trên kết nối HTTPS (trang này đang chạy HTTP).',
          hint: 'Hãy truy cập website qua địa chỉ HTTPS, hoặc chạy kiểm thử trên localhost.',
        });
        return;
      }

      stopWatch();
      setStatus(opts.watch ? 'tracking' : 'locating');
      setError(null);

      const options: PositionOptions = {
        ...DEFAULT_OPTIONS,
        enableHighAccuracy: opts.highAccuracy ?? true,
      };

      // Kiểm tra quyền trước khi gọi API: khi quyền đã bị chặn, một số trình duyệt
      // (Chromium) không gọi callback lỗi ngay mà để hết 12 giây timeout rồi báo sai
      // nguyên nhân. Kiểm tra trước giúp báo đúng lý do và không bắt người dùng chờ.
      const permissionProbe =
        navigator.permissions?.query?.({ name: 'geolocation' as PermissionName }) ?? null;

      if (permissionProbe) {
        permissionProbe
          .then((status) => {
            if (!mountedRef.current || token !== requestTokenRef.current) return;
            if (status.state !== 'denied') return;
            setPermission('denied');
            setPosition(null);
            setError(PERMISSION_DENIED_ERROR);
            setStatus('error');
          })
          .catch(() => {
            /* Không truy vấn được quyền thì vẫn gọi API như bình thường. */
          });
      }

      const applyPosition = (pos: GeolocationPosition) => {
        if (!mountedRef.current || token !== requestTokenRef.current) return;
        const coords = pos.coords;
        const next: GeoPoint = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : undefined,
          source: 'gps',
        };
        // Chỉ nhận toạ độ thiết bị báo về; không bao giờ gán giá trị mặc định.
        if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return;
        setPosition(next);
        setError(null);
        setStatus('success');
      };

      const applyError = (err: GeolocationPositionError) => {
        if (!mountedRef.current || token !== requestTokenRef.current) return;
        const info = describeError(err);
        setPosition(null);
        setError(info);
        setStatus('error');
        if (info.code === 'permission-denied') setPermission('denied');
      };

      try {
        if (opts.watch) {
          watchIdRef.current = navigator.geolocation.watchPosition(applyPosition, applyError, options);
        } else {
          navigator.geolocation.getCurrentPosition(applyPosition, applyError, options);
        }
      } catch {
        applyError({ code: 2 } as GeolocationPositionError);
      }
    },
    [stopWatch]
  );

  // Đọc trạng thái quyền trước khi người dùng bấm, để báo lỗi ngay nếu đã bị chặn.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return;
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const handler = () => {
      if (cancelled || !permissionStatus) return;
      const state = permissionStatus.state as GeoPermissionState;
      setPermission(state);
      if (state === 'denied') {
        setStatus((prev) => (prev === 'success' ? prev : 'error'));
        setError((prev) => prev ?? PERMISSION_DENIED_ERROR);
      }
    };

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled) return;
        permissionStatus = status;
        setPermission(status.state as GeoPermissionState);
        // Báo ngay cho người dùng biết quyền đang bị chặn (thay vì đợi họ bấm rồi mới lỗi).
        if (status.state === 'denied') handler();
        status.addEventListener('change', handler);
      })
      .catch(() => {
        /* Trình duyệt không hỗ trợ truy vấn quyền – bỏ qua. */
      });

    return () => {
      cancelled = true;
      permissionStatus?.removeEventListener('change', handler);
    };
  }, []);

  // Dọn watch khi unmount.
  useEffect(() => () => stopWatch(), [stopWatch]);

  return { position, status, error, permission, isSupported, locate, clear };
}
