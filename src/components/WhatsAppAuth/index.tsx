import React, { useState } from 'react'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import Input, { EInputTypes } from '../Input'
import Button from '../Button'

interface IProps {
  onSuccess?: (phone: string) => void
  onCancel?: () => void
}

const WhatsAppAuth: React.FC<IProps> = ({ onSuccess, onCancel }) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setError('Введите корректный номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Имитация отправки кода через WhatsApp
      await new Promise(resolve => setTimeout(resolve, 1500))

      // В реальном приложении здесь будет запрос к API
      console.log('Sending WhatsApp code to:', phone)

      setStep('code')
      setLoading(false)
    } catch (err) {
      setError('Ошибка отправки кода. Попробуйте снова.')
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Имитация проверки кода
      await new Promise(resolve => setTimeout(resolve, 1000))

      // В реальном приложении здесь будет проверка кода через API
      console.log('Verifying WhatsApp code:', code)

      onSuccess?.(phone)
    } catch (err) {
      setError('Неверный код. Попробуйте снова.')
      setLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+]/g, '')
    setPhone(value)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  return (
    <div className="whatsapp-auth">
      <div className="whatsapp-auth__header">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="whatsapp-auth__logo"
        />
        <h3 className="whatsapp-auth__title">
          Вход через WhatsApp
        </h3>
      </div>

      {step === 'phone' ? (
        <>
          <p className="whatsapp-auth__description">
            Введите номер телефона, привязанный к WhatsApp.
            Мы отправим вам код подтверждения.
          </p>

          <Input
            inputType={EInputTypes.Phone}
            inputProps={{
              placeholder: '+7 (999) 123-45-67',
              value: phone,
              onChange: handlePhoneChange,
              disabled: loading
            }}
            className="whatsapp-auth__input"
          />

          {error && (
            <div className="whatsapp-auth__error">{error}</div>
          )}

          <div className="whatsapp-auth__actions">
            <Button
              onClick={handleSendCode}
              disabled={loading || !phone}
              className="whatsapp-auth__btn whatsapp-auth__btn--primary"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </Button>
            <Button
              onClick={onCancel}
              disabled={loading}
              className="whatsapp-auth__btn whatsapp-auth__btn--secondary"
            >
              Отмена
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="whatsapp-auth__description">
            Код отправлен на WhatsApp номер {phone}.
            Введите 6-значный код из сообщения.
          </p>

          <Input
            inputType={EInputTypes.Number}
            inputProps={{
              placeholder: '000000',
              value: code,
              onChange: handleCodeChange,
              disabled: loading,
              maxLength: 6
            }}
            className="whatsapp-auth__input whatsapp-auth__input--code"
          />

          {error && (
            <div className="whatsapp-auth__error">{error}</div>
          )}

          <div className="whatsapp-auth__actions">
            <Button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="whatsapp-auth__btn whatsapp-auth__btn--primary"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
            <Button
              onClick={() => {
                setStep('phone')
                setCode('')
                setError('')
              }}
              disabled={loading}
              className="whatsapp-auth__btn whatsapp-auth__btn--secondary"
            >
              Изменить номер
            </Button>
          </div>

          <button
            className="whatsapp-auth__resend"
            onClick={handleSendCode}
            disabled={loading}
          >
            Отправить код повторно
          </button>
        </>
      )}
    </div>
  )
}

export default WhatsAppAuth