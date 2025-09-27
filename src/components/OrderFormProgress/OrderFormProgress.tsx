import React, { useState, useEffect } from 'react'
import './styles.scss'

interface OrderFormProgressProps {
  onSubmit: (data: any) => void
  onModeChange?: (mode: 'order' | 'vote') => void
}

const OrderFormProgress: React.FC<OrderFormProgressProps> = ({ onSubmit, onModeChange }) => {
  const [mode, setMode] = useState<'order' | 'vote'>('order')
  const [formData, setFormData] = useState({
    from: { lat: null as number | null, lng: null as number | null, address: '' },
    to: { lat: null as number | null, lng: null as number | null, address: '' },
    phone: '',
    amount: '',
    people: 1,
    comment: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [voteProgress, setVoteProgress] = useState(0)

  // Расчет прогресса для кнопки Vote (задача 2)
  useEffect(() => {
    if (mode === 'vote') {
      let progress = 25 // Базовый прогресс если есть "Откуда"

      if (formData.from.address || (formData.from.lat && formData.from.lng)) {
        progress = 25
      } else {
        progress = 0
      }

      // Желательные поля
      if (formData.to.address || (formData.to.lat && formData.to.lng)) progress += 25
      if (formData.phone) progress += 25
      if (formData.amount) progress += 25

      setVoteProgress(progress)
    }
  }, [formData, mode])

  // Валидация формы
  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Для Order - обязательны "Откуда" и "Куда"
    if (mode === 'order') {
      if (!formData.from.address && (!formData.from.lat || !formData.from.lng)) {
        newErrors.from = 'Укажите адрес отправления'
      }
      if (!formData.to.address && (!formData.to.lat || !formData.to.lng)) {
        newErrors.to = 'Укажите адрес назначения'
      }
    }

    // Для Vote - обязательно только "Откуда" (задача 1-Б)
    if (mode === 'vote') {
      if (!formData.from.address && (!formData.from.lat || !formData.from.lng)) {
        newErrors.from = 'Укажите адрес отправления'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Проверка активности кнопки Order
  const isOrderButtonDisabled = () => {
    if (mode !== 'order') return true
    return !formData.from.address && (!formData.from.lat || !formData.from.lng) ||
           !formData.to.address && (!formData.to.lat || !formData.to.lng)
  }

  // Проверка активности кнопки Vote
  const isVoteButtonDisabled = () => {
    if (mode !== 'vote') return true
    return !formData.from.address && (!formData.from.lat || !formData.from.lng)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ ...formData, mode })
    }
  }

  const handleModeChange = (newMode: 'order' | 'vote') => {
    setMode(newMode)
    setErrors({})
    if (onModeChange) onModeChange(newMode)
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Очищаем ошибку поля при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getButtonColorStyle = () => {
    if (mode === 'vote' && voteProgress > 0) {
      // Плавное изменение цвета от серого к красному
      const red = Math.floor(255 * (voteProgress / 100))
      const gray = Math.floor(200 * (1 - voteProgress / 100))
      return {
        background: `linear-gradient(to right,
          rgb(${red}, ${36 * voteProgress / 100}, 0) 0%,
          rgb(${red}, ${36 * voteProgress / 100}, 0) ${voteProgress}%,
          rgb(${gray}, ${gray}, ${gray}) ${voteProgress}%,
          rgb(${gray}, ${gray}, ${gray}) 100%)`
      }
    }
    return {}
  }

  return (
    <div className="order-form-progress">
      {/* Переключатель режима */}
      <div className="order-form-progress__mode">
        <button
          type="button"
          className={`mode-btn ${mode === 'order' ? 'mode-btn--active' : ''}`}
          onClick={() => handleModeChange('order')}
        >
          Заказ
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'vote' ? 'mode-btn--active' : ''}`}
          onClick={() => handleModeChange('vote')}
        >
          Голосование
        </button>
      </div>

      <form onSubmit={handleSubmit} className="order-form-progress__form">
        {/* Откуда */}
        <div className={`form-field ${errors.from ? 'form-field--error' : ''}`}>
          <label className="form-field__label">
            Откуда {mode === 'order' || mode === 'vote' ? <span className="required">*</span> : ''}
          </label>
          <input
            type="text"
            className="form-field__input"
            placeholder="Введите адрес или укажите на карте"
            value={formData.from.address}
            onChange={(e) => handleFieldChange('from', { ...formData.from, address: e.target.value })}
          />
          {errors.from && <span className="form-field__error">{errors.from}</span>}
        </div>

        {/* Куда - не обязательно для Vote (задача 1-Б) */}
        <div className={`form-field ${errors.to ? 'form-field--error' : ''}`}>
          <label className="form-field__label">
            Куда {mode === 'order' ? <span className="required">*</span> : ''}
            {mode === 'vote' && <span className="optional">(желательно)</span>}
          </label>
          <input
            type="text"
            className="form-field__input"
            placeholder="Введите адрес или укажите на карте"
            value={formData.to.address}
            onChange={(e) => handleFieldChange('to', { ...formData.to, address: e.target.value })}
          />
          {errors.to && <span className="form-field__error">{errors.to}</span>}
        </div>

        {/* Телефон */}
        <div className="form-field">
          <label className="form-field__label">
            Телефон {mode === 'vote' && <span className="optional">(желательно)</span>}
          </label>
          <input
            type="tel"
            className="form-field__input"
            placeholder="+7 (___) ___-__-__"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
          />
        </div>

        {/* Сумма/Количество человек */}
        <div className="form-field-row">
          <div className="form-field form-field--half">
            <label className="form-field__label">
              {mode === 'vote' ? 'Сумма' : 'Количество человек'}
              {mode === 'vote' && <span className="optional">(желательно)</span>}
            </label>
            {mode === 'vote' ? (
              <input
                type="number"
                className="form-field__input"
                placeholder="Сумма в MAD"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
              />
            ) : (
              <select
                className="form-field__input"
                value={formData.people}
                onChange={(e) => handleFieldChange('people', parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>

          {/* Комментарий */}
          <div className="form-field form-field--half">
            <label className="form-field__label">Комментарий</label>
            <input
              type="text"
              className="form-field__input"
              placeholder="Дополнительно"
              value={formData.comment}
              onChange={(e) => handleFieldChange('comment', e.target.value)}
            />
          </div>
        </div>

        {/* Кнопки отправки с прогрессом */}
        <div className="form-buttons">
          {mode === 'order' ? (
            <button
              type="submit"
              className="submit-btn submit-btn--order"
              disabled={isOrderButtonDisabled()}
            >
              Заказать
            </button>
          ) : (
            <button
              type="submit"
              className="submit-btn submit-btn--vote"
              disabled={isVoteButtonDisabled()}
              style={getButtonColorStyle()}
            >
              <span className="submit-btn__text">Голосовать</span>
              {voteProgress > 0 && (
                <span className="submit-btn__progress">{voteProgress}%</span>
              )}
            </button>
          )}
        </div>

        {/* Информация о режиме */}
        <div className="form-info">
          {mode === 'vote' ? (
            <p>В режиме голосования водители видят ваш запрос и могут предложить свои условия</p>
          ) : (
            <p>В режиме заказа вы получите ближайшего доступного водителя</p>
          )}
        </div>
      </form>
    </div>
  )
}

export default OrderFormProgress