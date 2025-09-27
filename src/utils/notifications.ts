// Notification system to replace alert() calls

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface INotification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
}

class NotificationManager {
  private notifications: INotification[] = []
  private listeners: ((notifications: INotification[]) => void)[] = []
  private idCounter = 0

  private generateId(): string {
    return `notification-${Date.now()}-${++this.idCounter}`
  }

  private notify(listeners: boolean = true) {
    if (listeners) {
      this.listeners.forEach(listener => listener([...this.notifications]))
    }
  }

  subscribe(listener: (notifications: INotification[]) => void) {
    this.listeners.push(listener)
    // Immediately provide current notifications
    listener([...this.notifications])

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private addNotification(
    type: NotificationType,
    message: string,
    title?: string,
    duration: number = 5000,
    dismissible: boolean = true
  ): string {
    const notification: INotification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      dismissible
    }

    this.notifications.push(notification)
    this.notify()

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id)
      }, duration)
    }

    return notification.id
  }

  success(message: string, title?: string, duration?: number): string {
    return this.addNotification(NotificationType.SUCCESS, message, title, duration)
  }

  error(message: string, title?: string, duration?: number): string {
    return this.addNotification(NotificationType.ERROR, message, title, duration || 8000)
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.addNotification(NotificationType.WARNING, message, title, duration)
  }

  info(message: string, title?: string, duration?: number): string {
    return this.addNotification(NotificationType.INFO, message, title, duration)
  }

  dismiss(id: string) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.notify()
    }
  }

  dismissAll() {
    this.notifications = []
    this.notify()
  }

  getNotifications(): INotification[] {
    return [...this.notifications]
  }
}

export const notificationManager = new NotificationManager()

// Convenience functions that replace alert()
export const showSuccess = (message: string, title?: string) => notificationManager.success(message, title)
export const showError = (message: string, title?: string) => notificationManager.error(message, title)
export const showWarning = (message: string, title?: string) => notificationManager.warning(message, title)
export const showInfo = (message: string, title?: string) => notificationManager.info(message, title)

// Direct replacement for alert() - shows as warning
export const notify = (message: string) => notificationManager.warning(message)