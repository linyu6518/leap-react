import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly defaultDuration = 3000; // 3 seconds
  private readonly defaultErrorDuration = 5000; // 5 seconds

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   */
  success(message: string, duration?: number): void {
    this.show(message, 'success', duration || this.defaultDuration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration?: number): void {
    this.show(message, 'error', duration || this.defaultErrorDuration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration || this.defaultDuration);
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): void {
    this.show(message, 'info', duration || this.defaultDuration);
  }

  /**
   * Show notification with custom type
   */
  private show(message: string, type: NotificationType, duration: number): void {
    const config: MatSnackBarConfig = {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Show persistent notification (requires manual dismissal)
   */
  showPersistent(message: string, type: NotificationType = 'info'): void {
    const config: MatSnackBarConfig = {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Dismiss all notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  /**
   * Show notification for workflow actions
   */
  workflowSubmitted(workflowId: number): void {
    this.success(`Workflow #${workflowId} has been submitted for review`);
  }

  workflowApproved(workflowId: number): void {
    this.success(`Workflow #${workflowId} has been approved`);
  }

  workflowRejected(workflowId: number): void {
    this.warning(`Workflow #${workflowId} has been rejected`);
  }

  workflowEscalated(workflowId: number): void {
    this.info(`Workflow #${workflowId} has been escalated`);
  }

  /**
   * Show notification for data operations
   */
  dataAdjusted(): void {
    this.success('Data has been adjusted successfully');
  }

  commentarySaved(): void {
    this.success('Commentary has been saved');
  }

  dataExported(format: string): void {
    this.success(`Data has been exported in ${format.toUpperCase()} format`);
  }

  /**
   * Show notification for auth operations
   */
  loginSuccess(): void {
    this.success('Welcome to LEAP!');
  }

  logoutSuccess(): void {
    this.info('You have been logged out');
  }

  accessDenied(): void {
    this.error('Access denied: You do not have permission to access this resource');
  }

  /**
   * Show notification for API errors
   */
  apiError(error: any): void {
    const message = error?.message || error?.error?.message || 'An unexpected error occurred';
    this.error(message);
  }

  /**
   * Show notification for validation errors
   */
  validationError(message: string): void {
    this.warning(message);
  }

  /**
   * Show loading notification
   */
  loading(message: string = 'Loading...'): void {
    this.info(message);
  }
}
