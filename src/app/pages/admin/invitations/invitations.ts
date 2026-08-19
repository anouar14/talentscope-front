import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminInvitation,
  AdminInvitationStatus
} from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

type InvitationStatusFilter =
  | 'ALL'
  | AdminInvitationStatus;

@Component({
  selector: 'app-admin-invitations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './invitations.html',
  styleUrl: './invitations.css'
})
export class AdminInvitations implements OnInit {
  invitations: AdminInvitation[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: InvitationStatusFilter = 'ALL';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  get filteredInvitations(): AdminInvitation[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.invitations.filter(invitation => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        invitation.status === this.selectedStatus;

      const searchableContent = [
        invitation.subject,
        invitation.message,
        invitation.companyName,
        invitation.consultantName,
        invitation.consultantTitle,
        invitation.location,
        ...invitation.technologies
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        (!search || searchableContent.includes(search))
      );
    });
  }

  get pendingCount(): number {
    return this.countByStatus('PENDING');
  }

  get acceptedCount(): number {
    return this.countByStatus('ACCEPTED');
  }

  get rejectedCount(): number {
    return this.countByStatus('REJECTED');
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedStatus !== 'ALL'
    );
  }

  loadInvitations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getInvitations().subscribe({
      next: invitations => {
        this.invitations = invitations ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des propositions :',
          error
        );

        this.loading = false;

        this.errorMessage =
          error.status === 403
            ? 'Vous n’êtes pas autorisé à consulter les propositions.'
            : 'Impossible de charger les propositions.';
      }
    });
  }

  filterByStatus(status: InvitationStatusFilter): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }

  getStatusLabel(status: AdminInvitationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
    }
  }

  getStatusClass(status: AdminInvitationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
    }
  }

  formatDate(date: string | null): string {
    if (!date) {
      return 'Non définie';
    }

    return new Intl.DateTimeFormat('fr-FR').format(
      new Date(date)
    );
  }

  formatSalary(salary: number | null): string {
    if (salary == null) {
      return 'Non renseigné';
    }

    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    }).format(salary);
  }

  trackInvitation(
    index: number,
    invitation: AdminInvitation
  ): string {
    return invitation.id;
  }

  private countByStatus(
    status: AdminInvitationStatus
  ): number {
    return this.invitations.filter(
      invitation => invitation.status === status
    ).length;
  }
}