import React, { useState, useRef, useEffect } from 'react'
import './styles.scss'

interface IProps {
  onScan?: (data: string) => void
  onClose?: () => void
  showResult?: boolean
}

const QRCodeScanner: React.FC<IProps> = ({ onScan, onClose, showResult = true }) => {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (scanning) {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [scanning])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Имитация сканирования QR кода
      setTimeout(() => {
        const mockReferralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase()
        handleScanSuccess(mockReferralCode)
      }, 3000)

    } catch (err) {
      setError('Не удалось получить доступ к камере')
      console.error('Camera access error:', err)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleScanSuccess = (data: string) => {
    setResult(data)
    setScanning(false)
    stopScanning()
    onScan?.(data)
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim())
    }
  }

  const handleRetry = () => {
    setResult(null)
    setError(null)
    setManualCode('')
    setScanning(true)
  }

  return (
    <div className="qr-scanner">
      <div className="qr-scanner__header">
        <h3 className="qr-scanner__title">
          Сканирование QR кода
        </h3>
        <button className="qr-scanner__close" onClick={onClose}>
          ✕
        </button>
      </div>

      {!result && !error && (
        <>
          <div className="qr-scanner__viewport">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="qr-scanner__video"
                  autoPlay
                  playsInline
                />
                <div className="qr-scanner__overlay">
                  <div className="qr-scanner__frame">
                    <div className="qr-scanner__corner qr-scanner__corner--tl"></div>
                    <div className="qr-scanner__corner qr-scanner__corner--tr"></div>
                    <div className="qr-scanner__corner qr-scanner__corner--bl"></div>
                    <div className="qr-scanner__corner qr-scanner__corner--br"></div>
                  </div>
                  <p className="qr-scanner__hint">
                    Наведите камеру на QR код
                  </p>
                </div>
              </>
            ) : (
              <div className="qr-scanner__placeholder">
                <svg className="qr-scanner__icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11V3H11V11H3ZM5 5V9H9V5H5Z" fill="currentColor"/>
                  <path d="M3 21V13H11V21H3ZM5 15V19H9V15H5Z" fill="currentColor"/>
                  <path d="M13 11V3H21V11H13ZM15 5V9H19V5H15Z" fill="currentColor"/>
                  <path d="M21 21H17V17H13V13H17V17H21V21Z" fill="currentColor"/>
                  <path d="M19 13H21V15H19V13Z" fill="currentColor"/>
                </svg>
                <button
                  className="qr-scanner__start-btn"
                  onClick={() => setScanning(true)}
                >
                  Начать сканирование
                </button>
              </div>
            )}
          </div>

          <div className="qr-scanner__manual">
            <p className="qr-scanner__or">или введите код вручную</p>
            <div className="qr-scanner__manual-input">
              <input
                type="text"
                placeholder="Введите реферальный код"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="qr-scanner__input"
                maxLength={10}
              />
              <button
                className="qr-scanner__submit-btn"
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
              >
                →
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="qr-scanner__error">
          <p className="qr-scanner__error-text">{error}</p>
          <button className="qr-scanner__retry-btn" onClick={handleRetry}>
            Попробовать снова
          </button>
        </div>
      )}

      {result && showResult && (
        <div className="qr-scanner__result">
          <div className="qr-scanner__success-icon">✓</div>
          <p className="qr-scanner__result-text">Код успешно отсканирован</p>
          <div className="qr-scanner__result-code">{result}</div>
          <button className="qr-scanner__done-btn" onClick={onClose}>
            Готово
          </button>
        </div>
      )}

      {scanning && (
        <button
          className="qr-scanner__cancel-btn"
          onClick={() => setScanning(false)}
        >
          Отменить сканирование
        </button>
      )}
    </div>
  )
}

export default QRCodeScanner