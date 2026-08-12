import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Platform } from '@/lib/platform'
import { MoreVertical, Plus, Share, X } from 'lucide-react'

export interface AddToHomeDialogProps {
  open: boolean
  onClose: () => void
  platform: Platform
  canInstall: boolean
  onInstall: () => void
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[14px] text-muted">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accentSoft font-mono text-[11px] text-accent">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  )
}

export function AddToHomeDialog({
  open,
  onClose,
  platform,
  canInstall,
  onInstall,
}: AddToHomeDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thêm vào màn hình chính"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold text-ink">
            Thêm vào màn hình chính
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {canInstall && platform === 'android' ? (
          <>
            <p className="mb-4 text-[14px] text-muted">
              Cài Agora như một ứng dụng để mở nhanh từ màn hình chính.
            </p>
            <button
              onClick={onInstall}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white"
            >
              <Plus size={17} /> Cài đặt ngay
            </button>
          </>
        ) : platform === 'ios' ? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Nhấn nút <b className="text-ink">Chia sẻ</b>{' '}
              <Share size={14} className="inline align-text-bottom" /> trên thanh Safari.
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào MH chính</b> (Add to Home Screen).
            </Step>
            <Step n={3}>
              Nhấn <b className="text-ink">Thêm</b> để tạo shortcut Agora trên màn hình chính.
            </Step>
          </ol>
        ) : platform === 'android' ? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Mở menu <MoreVertical size={14} className="inline align-text-bottom" /> của trình
              duyệt.
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào Màn hình chính</b> (Add to Home screen).
            </Step>
            <Step n={3}>
              Xác nhận <b className="text-ink">Thêm</b> để tạo shortcut.
            </Step>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Mở menu trình duyệt trên điện thoại (biểu tượng{' '}
              <MoreVertical size={14} className="inline align-text-bottom" /> hoặc{' '}
              <Share size={14} className="inline align-text-bottom" />).
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào Màn hình chính</b> / Add to Home Screen.
            </Step>
          </ol>
        )}
      </div>
    </div>
  )
}
