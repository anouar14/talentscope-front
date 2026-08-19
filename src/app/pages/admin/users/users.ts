import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminUser,
  AdminUserRole
} from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

type UserStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED';
type UserRoleFilter = 'ALL' | AdminUserRole;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class AdminUsers implements OnInit {
  users: AdminUser[] = [];

  loading = false;
  errorMessage = '';

  actionSuccessMessage = '';
  actionErrorMessage = '';

  processingUserId: string | null = null;

  searchTerm = '';
  selectedRole: UserRoleFilter = 'ALL';
  selectedStatus: UserStatusFilter = 'ALL';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): AdminUser[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.users.filter(user => {
      const matchesRole =
        this.selectedRole === 'ALL' ||
        user.role === this.selectedRole;

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        (
          this.selectedStatus === 'ENABLED' &&
          user.enabled
        ) ||
        (
          this.selectedStatus === 'DISABLED' &&
          !user.enabled
        );

      const searchableContent = [
        user.displayName,
        user.email,
        user.professionalTitle,
        user.role,
        user.authProvider
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesRole &&
        matchesStatus &&
        (!search || searchableContent.includes(search))
      );
    });
  }

  get consultantCount(): number {
    return this.countByRole('CONSULTANT');
  }

  get companyCount(): number {
    return this.countByRole('COMPANY');
  }

  get adminCount(): number {
    return this.countByRole('ADMIN');
  }

  get enabledCount(): number {
    return this.users.filter(user => user.enabled).length;
  }

  get disabledCount(): number {
    return this.users.filter(user => !user.enabled).length;
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedRole !== 'ALL' ||
      this.selectedStatus !== 'ALL'
    );
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.adminService.getUsers().subscribe({
      next: users => {
        this.users = users ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des utilisateurs :',
          error
        );

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Vous n’êtes pas autorisé à consulter les utilisateurs.';
          return;
        }

        this.errorMessage =
          'Impossible de charger les utilisateurs.';
      }
    });
  }

  filterByRole(role: UserRoleFilter): void {
    this.selectedRole = role;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = 'ALL';
    this.selectedStatus = 'ALL';
  }

  toggleUserStatus(user: AdminUser): void {
    if (
      user.role === 'ADMIN' ||
      this.isProcessing(user.id)
    ) {
      return;
    }

    const newStatus = !user.enabled;

    const confirmed = window.confirm(
      newStatus
        ? `Voulez-vous réactiver le compte de ${user.displayName} ?`
        : `Voulez-vous désactiver le compte de ${user.displayName} ?`
    );

    if (!confirmed) {
      return;
    }

    this.processingUserId = user.id;
    this.clearActionMessages();

    this.adminService
      .updateUserStatus(user.id, newStatus)
      .subscribe({
        next: updatedUser => {
          this.users = this.users.map(currentUser =>
            currentUser.id === updatedUser.id
              ? updatedUser
              : currentUser
          );

          this.processingUserId = null;

          this.actionSuccessMessage = updatedUser.enabled
            ? 'Le compte utilisateur a été réactivé.'
            : 'Le compte utilisateur a été désactivé.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la modification du compte :',
            error
          );

          this.processingUserId = null;

          if (error.status === 403) {
            this.actionErrorMessage =
              'Vous n’êtes pas autorisé à modifier ce compte.';
            return;
          }

          if (error.status === 404) {
            this.actionErrorMessage =
              'Cet utilisateur est introuvable.';
            return;
          }

          this.actionErrorMessage =
            'Impossible de modifier le statut du compte.';
        }
      });
  }

  isProcessing(userId: string): boolean {
    return this.processingUserId === userId;
  }

  getRoleLabel(role: AdminUserRole): string {
    switch (role) {
      case 'CONSULTANT':
        return 'Consultant';
      case 'COMPANY':
        return 'Entreprise';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return role;
    }
  }

  getRoleClass(role: AdminUserRole): string {
    switch (role) {
      case 'CONSULTANT':
        return 'role-consultant';
      case 'COMPANY':
        return 'role-company';
      case 'ADMIN':
        return 'role-admin';
      default:
        return '';
    }
  }

  getProviderLabel(provider: string): string {
    return provider === 'GOOGLE'
      ? 'Google'
      : 'Email / mot de passe';
  }

  getInitial(user: AdminUser): string {
    return user.displayName?.charAt(0).toUpperCase() || 'U';
  }

  trackUser(index: number, user: AdminUser): string {
    return user.id;
  }

  private countByRole(role: AdminUserRole): number {
    return this.users.filter(user => user.role === role).length;
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }
}