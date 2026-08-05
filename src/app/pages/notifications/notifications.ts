import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Notification,
  NotificationType
} from '../../core/models/notification';
import { Auth } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';

type NotificationFilter = 'ALL' | 'UNREAD' | 'READ';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];

  loading = false;
  markAllLoading = false;
  processingNotificationId: string | null = null;

  errorMessage = '';
  actionSuccessMessage = '';
  actionErrorMessage = '';

  selectedFilter: NotificationFilter = 'ALL';
  searchTerm = '';

  constructor(
    private readonly notificationService: NotificationService,
    private readonly authService: Auth,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  get filteredNotifications(): Notification[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.notifications.filter(notification => {
      const matchesFilter =
        this.selectedFilter === 'ALL' ||
        (this.selectedFilter === 'UNREAD' && !notification.read) ||
        (this.selectedFilter === 'READ' && notification.read);

      const searchableContent = [
        notification.title,
        notification.message,
        this.getTypeLabel(notification.type)
      ]
        .join(' ')
        .toLowerCase();

      return matchesFilter && (!search || searchableContent.includes(search));
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(notification => !notification.read).length;
  }

  get readCount(): number {
    return this.notifications.filter(notification => notification.read).length;
  }

  get hasActiveFilters(): boolean {
    return this.selectedFilter !== 'ALL' || this.searchTerm.trim().length > 0;
  }

  get dashboardLink(): string {
    return this.authService.hasRole('COMPANY')
      ? '/company/dashboard'
      : '/consultant/dashboard';
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.notificationService.getNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des notifications :',
          error
        );

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Vous n’êtes pas autorisé à consulter ces notifications.';
          return;
        }

        this.errorMessage = 'Impossible de charger vos notifications.';
      }
    });
  }

  filterNotifications(filter: NotificationFilter): void {
    this.selectedFilter = filter;
  }

  resetFilters(): void {
    this.selectedFilter = 'ALL';
    this.searchTerm = '';
  }

  openNotification(notification: Notification): void {
    if (this.isProcessing(notification.id)) {
      return;
    }

    if (notification.read) {
      this.navigateToNotification(notification);
      return;
    }

    this.processingNotificationId = notification.id;
    this.clearActionMessages();

    this.notificationService.markAsRead(notification.id).subscribe({
      next: updatedNotification => {
        this.replaceNotification(updatedNotification);
        this.processingNotificationId = null;
        this.navigateToNotification(updatedNotification);
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors de la lecture de la notification :',
          error
        );

        this.processingNotificationId = null;

        if (error.status === 404) {
          this.actionErrorMessage = 'Cette notification est introuvable.';
          return;
        }

        this.actionErrorMessage =
          'Impossible de marquer cette notification comme lue.';
      }
    });
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (notification.read || this.isProcessing(notification.id)) {
      return;
    }

    this.processingNotificationId = notification.id;
    this.clearActionMessages();

    this.notificationService.markAsRead(notification.id).subscribe({
      next: updatedNotification => {
        this.replaceNotification(updatedNotification);
        this.processingNotificationId = null;
        this.actionSuccessMessage =
          'La notification a été marquée comme lue.';
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors de la lecture de la notification :',
          error
        );

        this.processingNotificationId = null;
        this.actionErrorMessage =
          error.status === 404
            ? 'Cette notification est introuvable.'
            : 'Impossible de marquer cette notification comme lue.';
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0 || this.markAllLoading) {
      return;
    }

    this.markAllLoading = true;
    this.clearActionMessages();

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();

        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true,
          readAt: notification.readAt ?? readAt
        }));

        this.markAllLoading = false;
        this.actionSuccessMessage =
          'Toutes les notifications ont été marquées comme lues.';
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors de la lecture des notifications :',
          error
        );

        this.markAllLoading = false;
        this.actionErrorMessage =
          'Impossible de marquer toutes les notifications comme lues.';
      }
    });
  }

  isProcessing(notificationId: string): boolean {
    return this.processingNotificationId === notificationId;
  }

  getTypeLabel(type: NotificationType): string {
    switch (type) {
      case 'INVITATION_RECEIVED':
        return 'Nouvelle proposition';
      case 'INVITATION_ACCEPTED':
        return 'Proposition acceptée';
      case 'INVITATION_REJECTED':
        return 'Proposition refusée';
      case 'INVITATION_CLOSED':
        return 'Proposition clôturée';
      case 'MISSION_CREATED':
        return 'Mission créée';
      case 'MISSION_COMPLETED':
        return 'Mission terminée';
      case 'MISSION_CANCELLED':
        return 'Mission annulée';
      default:
        return type;
    }
  }

  getTypeClass(type: NotificationType): string {
    switch (type) {
      case 'INVITATION_RECEIVED':
        return 'type-invitation';
      case 'INVITATION_ACCEPTED':
        return 'type-success';
      case 'INVITATION_REJECTED':
      case 'INVITATION_CLOSED':
        return 'type-warning';
      case 'MISSION_CREATED':
        return 'type-mission';
      case 'MISSION_COMPLETED':
        return 'type-completed';
      case 'MISSION_CANCELLED':
        return 'type-cancelled';
      default:
        return '';
    }
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'INVITATION_RECEIVED':
        return '✉';
      case 'INVITATION_ACCEPTED':
        return '✓';
      case 'INVITATION_REJECTED':
        return '×';
      case 'INVITATION_CLOSED':
        return '!';
      case 'MISSION_CREATED':
        return '💼';
      case 'MISSION_COMPLETED':
        return '✓';
      case 'MISSION_CANCELLED':
        return '×';
      default:
        return '•';
    }
  }

  trackNotification(index: number, notification: Notification): string {
    return notification.id;
  }

  private navigateToNotification(notification: Notification): void {
    const route = this.getNotificationRoute(notification);

    if (route) {
      this.router.navigate(route);
    }
  }

  private getNotificationRoute(notification: Notification): string[] | null {
    if (!notification.referenceId) {
      return null;
    }

    const isCompany = this.authService.hasRole('COMPANY');

    switch (notification.type) {
      case 'INVITATION_RECEIVED':
        return ['/consultant/invitations'];

      case 'INVITATION_ACCEPTED':
      case 'INVITATION_REJECTED':
      case 'INVITATION_CLOSED':
        return ['/company/invitations'];

      case 'MISSION_CREATED':
      case 'MISSION_COMPLETED':
      case 'MISSION_CANCELLED':
        return [
          isCompany ? '/company/missions' : '/consultant/missions',
          notification.referenceId
        ];

      default:
        return null;
    }
  }

  private replaceNotification(updatedNotification: Notification): void {
    this.notifications = this.notifications.map(notification =>
      notification.id === updatedNotification.id
        ? updatedNotification
        : notification
    );
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }
}