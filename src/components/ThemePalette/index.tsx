import React, { useState } from 'react'
import './styles.scss'

interface ITheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

const themes: ITheme[] = [
  {
    id: 'default',
    name: 'Классическая',
    primary: '#FF3B30',
    secondary: '#FF6B35',
    accent: '#FFD60A',
    background: '#FFFFFF',
    text: '#1C1C1E'
  },
  {
    id: 'dark',
    name: 'Тёмная',
    primary: '#FF453A',
    secondary: '#FF6961',
    accent: '#FFD60A',
    background: '#1C1C1E',
    text: '#FFFFFF'
  },
  {
    id: 'ocean',
    name: 'Океан',
    primary: '#007AFF',
    secondary: '#5AC8FA',
    accent: '#34C759',
    background: '#F2F2F7',
    text: '#1C1C1E'
  },
  {
    id: 'sunset',
    name: 'Закат',
    primary: '#FF6B9D',
    secondary: '#FEC8C1',
    accent: '#FFE66D',
    background: '#FFF5F5',
    text: '#2D3436'
  },
  {
    id: 'forest',
    name: 'Лес',
    primary: '#27AE60',
    secondary: '#52C77E',
    accent: '#F39C12',
    background: '#F0FFF4',
    text: '#1E3A2F'
  },
  {
    id: 'royal',
    name: 'Королевская',
    primary: '#5856D6',
    secondary: '#AF52DE',
    accent: '#FF2D55',
    background: '#F9F9FF',
    text: '#1C1C3E'
  },
  {
    id: 'minimal',
    name: 'Минимал',
    primary: '#000000',
    secondary: '#666666',
    accent: '#FF3B30',
    background: '#FFFFFF',
    text: '#000000'
  },
  {
    id: 'neon',
    name: 'Неон',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#0A0A0A',
    text: '#FFFFFF'
  }
]

interface IProps {
  onThemeChange?: (theme: ITheme) => void
  isOpen?: boolean
  onClose?: () => void
}

const ThemePalette: React.FC<IProps> = ({ onThemeChange, isOpen = false, onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('default')
  const [showPreview, setShowPreview] = useState(false)

  const handleThemeSelect = (theme: ITheme) => {
    setSelectedTheme(theme.id)
    applyTheme(theme)
    onThemeChange?.(theme)

    // Сохраняем выбранную тему в localStorage
    localStorage.setItem('selectedTheme', theme.id)
  }

  const applyTheme = (theme: ITheme) => {
    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.primary)
    root.style.setProperty('--secondary-color', theme.secondary)
    root.style.setProperty('--accent-color', theme.accent)
    root.style.setProperty('--background-color', theme.background)
    root.style.setProperty('--text-color', theme.text)

    // Добавляем класс темы к body
    document.body.className = `theme-${theme.id}`
  }

  // Загружаем сохранённую тему при монтировании
  React.useEffect(() => {
    const savedThemeId = localStorage.getItem('selectedTheme') || 'default'
    const savedTheme = themes.find(t => t.id === savedThemeId)
    if (savedTheme) {
      setSelectedTheme(savedThemeId)
      applyTheme(savedTheme)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="theme-palette">
      <div className="theme-palette__overlay" onClick={onClose} />

      <div className="theme-palette__container">
        <div className="theme-palette__header">
          <h3 className="theme-palette__title">Выберите тему оформления</h3>
          <button className="theme-palette__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="theme-palette__grid">
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`theme-palette__item ${selectedTheme === theme.id ? 'theme-palette__item--active' : ''}`}
              onClick={() => handleThemeSelect(theme)}
              onMouseEnter={() => setShowPreview(true)}
              onMouseLeave={() => setShowPreview(false)}
            >
              <div className="theme-palette__preview">
                <div
                  className="theme-palette__color theme-palette__color--primary"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="theme-palette__color theme-palette__color--secondary"
                  style={{ backgroundColor: theme.secondary }}
                />
                <div
                  className="theme-palette__color theme-palette__color--accent"
                  style={{ backgroundColor: theme.accent }}
                />
                <div
                  className="theme-palette__color theme-palette__color--bg"
                  style={{ backgroundColor: theme.background }}
                />
              </div>
              <span className="theme-palette__name">{theme.name}</span>
              {selectedTheme === theme.id && (
                <div className="theme-palette__checkmark">✓</div>
              )}
            </div>
          ))}
        </div>

        <div className="theme-palette__custom">
          <h4 className="theme-palette__custom-title">Настроить свою тему</h4>
          <div className="theme-palette__custom-colors">
            <div className="theme-palette__custom-color">
              <label>Основной цвет</label>
              <input type="color" defaultValue="#FF3B30" />
            </div>
            <div className="theme-palette__custom-color">
              <label>Дополнительный</label>
              <input type="color" defaultValue="#FF6B35" />
            </div>
            <div className="theme-palette__custom-color">
              <label>Акцент</label>
              <input type="color" defaultValue="#FFD60A" />
            </div>
            <div className="theme-palette__custom-color">
              <label>Фон</label>
              <input type="color" defaultValue="#FFFFFF" />
            </div>
          </div>
          <button className="theme-palette__custom-apply">
            Применить настройки
          </button>
        </div>

        <div className="theme-palette__footer">
          <button className="theme-palette__reset" onClick={() => handleThemeSelect(themes[0])}>
            Сбросить на стандартную
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThemePalette