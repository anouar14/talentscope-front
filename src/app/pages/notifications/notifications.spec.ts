import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Notification } from '../../core/models/notification';
import { Notifications } from './notifications';

describe('Notifications', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;
  let httpTestingController: HttpTestingController;

  const notification: Notification = {
    id: 'notification-1',
    type: 'INVITATION_RECEIVED',
    title: 'Nouvelle proposition de mission',
    message: 'Focus Corporation vous propose une mission Java.',
    referenceId: 'invitation-1',
    read: false,
    createdAt: '2026-08-04T17:30:00',
    readAt: null
  };

  beforeEach(async () => {
    localStorage.setItem('role', 'CONSULTANT');

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/notifications'
    );

    expect(request.request.method).toBe('GET');

    request.flush([notification]);

    expect(component.notifications.length).toBe(1);
    expect(component.unreadCount).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should filter unread notifications', () => {
    component.notifications = [
      notification,
      {
        ...notification,
        id: 'notification-2',
        read: true,
        readAt: '2026-08-04T18:00:00'
      }
    ];

    component.filterNotifications('UNREAD');

    expect(component.filteredNotifications.length).toBe(1);
    expect(component.filteredNotifications[0].read).toBeFalse();
  });

  it('should search notifications by title', () => {
    component.notifications = [notification];
    component.searchTerm = 'proposition';

    expect(component.filteredNotifications.length).toBe(1);

    component.searchTerm = 'mission annulée';

    expect(component.filteredNotifications.length).toBe(0);
  });

  it('should mark all notifications as read', () => {
    component.notifications = [notification];

    component.markAllAsRead();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/notifications/read-all'
    );

    expect(request.request.method).toBe('PUT');

    request.flush(null);

    expect(component.notifications[0].read).toBeTrue();
    expect(component.unreadCount).toBe(0);
  });
});