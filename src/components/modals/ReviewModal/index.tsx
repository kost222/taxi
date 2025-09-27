import React, { useState, useCallback } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../../localization'
import { IRootState } from '../../../state'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import { ordersActionCreators } from '../../../state/orders'
import Overlay from '../Overlay'
import Button, { EButtonStyles } from '../../Button'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isReviewModalOpen(state),
  orderId: modalsSelectors.reviewOrderId(state),
})

const mapDispatchToProps = {
  setReviewModal: modalsActionCreators.setReviewModal,
  submitReview: ordersActionCreators.submitReview,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {}

const ReviewModal: React.FC<IProps> = ({
  isOpen,
  orderId,
  setReviewModal,
  submitReview,
}) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [driverRating, setDriverRating] = useState(5)
  const [carRating, setCarRating] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(() => {
    if (orderId) {
      submitReview({
        orderId,
        rating,
        driverRating,
        carRating,
        comment,
      })
      setSubmitted(true)
      setTimeout(() => {
        setReviewModal({ isOpen: false, orderId: null })
        setSubmitted(false)
        setRating(5)
        setDriverRating(5)
        setCarRating(5)
        setComment('')
      }, 2000)
    }
  }, [orderId, rating, driverRating, carRating, comment, submitReview, setReviewModal])

  const handleClose = useCallback(() => {
    setReviewModal({ isOpen: false, orderId: null })
  }, [setReviewModal])

  const renderStars = (currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="review-modal__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`review-modal__star ${star <= currentRating ? 'review-modal__star--active' : ''}`}
            onClick={() => onRatingChange(star)}
            disabled={submitted}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <Overlay isOpen={isOpen} onClick={handleClose}>
      <div className="modal review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal__header">
          <h2 className="review-modal__title">
            {t(TRANSLATION.RATE_YOUR_RIDE) || 'Оцените поездку'}
          </h2>
          <button className="review-modal__close" onClick={handleClose}>
            ×
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="review-modal__section">
              <label className="review-modal__label">
                {t(TRANSLATION.OVERALL_RATING) || 'Общая оценка'}
              </label>
              {renderStars(rating, setRating)}
            </div>

            <div className="review-modal__section">
              <label className="review-modal__label">
                {t(TRANSLATION.DRIVER_RATING) || 'Оценка водителя'}
              </label>
              {renderStars(driverRating, setDriverRating)}
            </div>

            <div className="review-modal__section">
              <label className="review-modal__label">
                {t(TRANSLATION.CAR_RATING) || 'Оценка автомобиля'}
              </label>
              {renderStars(carRating, setCarRating)}
            </div>

            <div className="review-modal__section">
              <label className="review-modal__label">
                {t(TRANSLATION.COMMENT_OPTIONAL) || 'Комментарий (необязательно)'}
              </label>
              <textarea
                className="review-modal__textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t(TRANSLATION.SHARE_YOUR_EXPERIENCE) || 'Поделитесь вашими впечатлениями...'}
                rows={4}
              />
            </div>

            <div className="review-modal__actions">
              <Button
                buttonStyle={EButtonStyles.RedDesign}
                text={t(TRANSLATION.SUBMIT_REVIEW) || 'Отправить отзыв'}
                onClick={handleSubmit}
              />
              <Button
                buttonStyle={EButtonStyles.WhiteDesign}
                text={t(TRANSLATION.SKIP) || 'Пропустить'}
                onClick={handleClose}
              />
            </div>
          </>
        ) : (
          <div className="review-modal__success">
            <div className="review-modal__success-icon">✓</div>
            <p className="review-modal__success-text">
              {t(TRANSLATION.THANK_YOU_FOR_REVIEW) || 'Спасибо за ваш отзыв!'}
            </p>
          </div>
        )}
      </div>
    </Overlay>
  )
}

export default connector(ReviewModal)