import React, { useId, useState, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { connect, ConnectedProps } from 'react-redux'
import { EBookingCommentTypes } from '../../../types/types'
import SITE_CONSTANTS from '../../../siteConstants'
import { t, TRANSLATION } from '../../../localization'
import { IRootState } from '../../../state'
import {
  clientOrderActionCreators,
  clientOrderSelectors,
} from '../../../state/clientOrder'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import Checkbox, { ECheckboxStyles } from '../../Checkbox'
import Input, { EInputStyles } from '../../Input'
import Button, { EButtonStyles } from '../../Button'
import { showWarning } from '../../../utils/notifications'
import Modal, { EModalStyles } from '../Modal'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  comments: clientOrderSelectors.comments(state),
  isOpen: modalsSelectors.isCommentsModalOpen(state),
})

const mapDispatchToProps = {
  setComments: clientOrderActionCreators.setComments,
  setCommentsModal: modalsActionCreators.setCommentsModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {}

interface IFormValues {
  ids: string[],
  custom: string,
  flightNumber: string,
  placard: string,
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

function CommentsModal({
  isOpen,
  comments,
  setComments,
  setCommentsModal,
}: IProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
    control,
    setValue,
    getValues
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onChange',
    defaultValues: {
      ids: comments.ids,
      custom: comments.custom,
      flightNumber: comments.flightNumber,
      placard: comments.placard,
    },
  })

  const { ids, ...values } = useWatch<IFormValues>({ control })

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showWarning('Распознавание речи не поддерживается в вашем браузере')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'ru-RU'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const currentValue = getValues('custom')
      setValue('custom', currentValue ? `${currentValue} ${transcript}` : transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const onSubmit = () => {
    if (!ids) return
    if (isValid)
      setComments({ ...values, ids: ids ?? [] })
    setCommentsModal(false)
  }

  const componentId = useId()

  return (
    <Modal
      overlayProps={{
        isOpen,
        onClick() {
          setCommentsModal(false)
        },
      }}
      style={EModalStyles.RedDesign}
      className="comments-modal"
    >
      <form
        className="comments-modal__form"
        onSubmit={handleSubmit(onSubmit)}
      >
        {Object.keys(SITE_CONSTANTS.BOOKING_COMMENTS).map(id =>
          <Checkbox
            key={id}
            {...register('ids')}
            id={componentId + id}
            checkboxStyle={ECheckboxStyles.RedDesign}
            value={id}
            label={t(TRANSLATION.BOOKING_COMMENTS[id])}
          />,
        )}
        {ids?.some(id =>
          SITE_CONSTANTS.BOOKING_COMMENTS[id].type ===
            EBookingCommentTypes.Plane,
        ) &&
          <div className="comments-modal__plane-inputs">
            <Input
              inputProps={{
                ...register('flightNumber', {
                  required: t(TRANSLATION.REQUIRED_FIELD),
                }),
                placeholder: `№ ${t(TRANSLATION.FLIGHT)}`,
              }}
              style={EInputStyles.RedDesign}
              error={errors.flightNumber?.message}
            />
            <Input
              inputProps={{
                ...register('placard', {
                  required: t(TRANSLATION.REQUIRED_FIELD),
                }),
                placeholder: t(TRANSLATION.TEXT_ON_THE_TABLE),
              }}
              style={EInputStyles.RedDesign}
              error={errors.placard?.message}
            />
          </div>
        }

        <div style={{ position: 'relative' }}>
          <Input
            inputProps={{
              ...register('custom'),
              placeholder: t(TRANSLATION.CUSTOM_COMMENT),
            }}
            style={EInputStyles.RedDesign}
          />
          <button
            type="button"
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: isListening ? '#ff4444' : '#4CAF50',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
            title={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
        </div>
        <Button
          type="submit"
          buttonStyle={EButtonStyles.RedDesign}
          checkLogin={false}
          text={t(TRANSLATION.OK)}
        />
      </form>
    </Modal>
  )
}

export default connector(CommentsModal)