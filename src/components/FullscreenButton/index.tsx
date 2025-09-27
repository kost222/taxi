import React, { useState, useEffect, useCallback } from 'react'
import './styles.scss'

interface IProps {
  className?: string
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
}

const FullscreenButton: React.FC<IProps> = ({
  className = '',
  position = 'bottom-right'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Проверка поддержки полноэкранного режима
  const isFullscreenSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  // Обработчик переключения полноэкранного режима
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen()
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen()
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
    }
  }, [isFullscreen])

  // Слушаем изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      setIsFullscreen(!!fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // Проверяем текущее состояние при монтировании
    handleFullscreenChange()

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Не показываем кнопку, если полноэкранный режим не поддерживается
  if (!isFullscreenSupported()) {
    return null
  }

  return (
    <button
      className={`fullscreen-button fullscreen-button--${position} ${className} ${
        isFullscreen ? 'fullscreen-button--active' : ''
      }`}
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {!isFullscreen ? (
          // Иконка входа в полноэкранный режим
          <>
            <path
              d="M4 4H9V6H6V9H4V4Z"
              fill="currentColor"
            />
            <path
              d="M20 4H15V6H18V9H20V4Z"
              fill="currentColor"
            />
            <path
              d="M4 20H9V18H6V15H4V20Z"
              fill="currentColor"
            />
            <path
              d="M20 20H15V18H18V15H20V20Z"
              fill="currentColor"
            />
          </>
        ) : (
          // Иконка выхода из полноэкранного режима
          <>
            <path
              d="M9 9H4V7H7V4H9V9Z"
              fill="currentColor"
            />
            <path
              d="M15 9H20V7H17V4H15V9Z"
              fill="currentColor"
            />
            <path
              d="M9 15H4V17H7V20H9V15Z"
              fill="currentColor"
            />
            <path
              d="M15 15H20V17H17V20H15V15Z"
              fill="currentColor"
            />
          </>
        )}
      </svg>
      <span className="fullscreen-button__text">
        {isFullscreen ? 'Выход' : 'Полный экран'}
      </span>
    </button>
  )
}

export default FullscreenButton