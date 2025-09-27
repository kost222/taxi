import { body, ValidationChain } from 'express-validator';

export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('userType')
    .isIn(['passenger', 'driver'])
    .withMessage('User type must be either passenger or driver')
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const createOrderValidation: ValidationChain[] = [
  body('b_start_address')
    .trim()
    .notEmpty()
    .withMessage('Start address is required'),
  body('b_start_latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid start latitude is required'),
  body('b_start_longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid start longitude is required'),
  body('b_destination_address')
    .trim()
    .notEmpty()
    .withMessage('Destination address is required'),
  body('b_destination_latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid destination latitude is required'),
  body('b_destination_longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid destination longitude is required'),
  body('b_contact')
    .trim()
    .notEmpty()
    .withMessage('Contact information is required'),
  body('b_start_datetime')
    .isISO8601()
    .withMessage('Valid start datetime is required'),
  body('b_passengers_count')
    .isInt({ min: 1, max: 8 })
    .withMessage('Passenger count must be between 1 and 8'),
  body('b_car_class')
    .isIn(['economy', 'comfort', 'business', 'premium'])
    .withMessage('Valid car class is required'),
  body('b_payment_way')
    .isIn(['cash', 'card', 'online'])
    .withMessage('Valid payment method is required'),
  body('b_max_waiting')
    .isInt({ min: 0, max: 60 })
    .withMessage('Max waiting time must be between 0 and 60 minutes'),
  body('b_services')
    .isArray()
    .withMessage('Services must be an array'),
  body('b_options')
    .isArray()
    .withMessage('Options must be an array')
];

export const updateDriverPositionValidation: ValidationChain[] = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required')
];