import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { Auth } from './core/services/auth';
import { NotificationService } from './core/services/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  unreadNotificationCount = 0;
  mobileMenuOpen = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: Auth,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationCount = count;
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this.refreshNavigationState();
      });

    this.refreshNavigationState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  get isCompany(): boolean {
    return this.authService.hasRole('COMPANY');
  }

  get isConsultant(): boolean {
    return this.authService.hasRole('CONSULTANT');
  }

  get dashboardLink(): string {
    return this.isCompany
      ? '/company/dashboard'
      : '/consultant/dashboard';
  }

  get profileLink(): string {
    return this.isCompany
      ? '/company/profile'
      : '/consultant/profile';
  }

  get invitationsLink(): string {
    return this.isCompany
      ? '/company/invitations'
      : '/consultant/invitations';
  }

  get missionsLink(): string {
    return this.isCompany
      ? '/company/missions'
      : '/consultant/missions';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.clearUnreadCount();
    this.mobileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  private refreshNavigationState(): void {
    if (!this.isAuthenticated) {
      this.notificationService.clearUnreadCount();
      return;
    }

    this.notificationService.refreshUnreadCount();
  }
}