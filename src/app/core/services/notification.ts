import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  Notification,
  UnreadNotificationCountResponse
} from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8080/api/notifications';

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);

  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<UnreadNotificationCountResponse> {
    return this.http.get<UnreadNotificationCountResponse>(
      `${this.apiUrl}/unread-count`
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: response => {
        this.unreadCountSubject.next(response.count ?? 0);
      },
      error: () => {
        this.unreadCountSubject.next(0);
      }
    });
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(
      `${this.apiUrl}/${notificationId}/read`,
      {}
    ).pipe(
      tap(notification => {
        if (notification.read) {
          this.decrementUnreadCount();
        }
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/read-all`,
      {}
    ).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
      })
    );
  }

  clearUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  private decrementUnreadCount(): void {
    const currentCount = this.unreadCountSubject.value;

    this.unreadCountSubject.next(
      Math.max(0, currentCount - 1)
    );
  }
}