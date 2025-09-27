// Type definitions for global window properties

export interface ISiteConstants {
  [key: string]: {
    value: string | number;
  };
}

export interface ICurrency {
  abbr: string;
  name: string;
}

export interface ICarClass {
  id: string;
  name: string;
  icon: string;
}

export interface ILang {
  iso: string;
  logo: string;
  native: string;
}

export interface ITranslation {
  [key: string]: {
    [langId: string]: string;
  };
}

export interface IBookingComment {
  [langId: string]: {
    [commentId: string]: string;
  };
}

export interface IWindowData {
  site_constants: ISiteConstants;
  currencies: { [key: string]: ICurrency };
  car_classes: { [key: string]: ICarClass };
  booking_location_classes: { [key: string]: ICarClass };
  booking_comments: { [key: string]: any };
  langs: { [key: string]: ILang };
  CAR_MODELS: { [key: string]: string };
  CAR_COLORS: { [key: string]: string };
  PAYMENT_WAYS: { [key: string]: string };
  BOOKING_DRIVER_STATES: { [key: string]: any };
  CAR_CLASSES: { [key: string]: any };
  LANG_VLS: { [key: string]: any };
  lang_vls: ITranslation;
  cities?: { [key: string]: { [langIso: string]: string } };
}

declare global {
  interface Window {
    data?: IWindowData;
    default_lang?: string;
    dataLoadedCallback?: () => void;
  }
}

export {};