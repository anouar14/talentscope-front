import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Invitation,
  InvitationStatus
} from '../../../core/models/invitation';
import { InvitationService } from '../../../core/services/invitation';

type InvitationStatusFilter = 'ALL' | InvitationStatus;

@Component({
  selector: 'app-company-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invitations.html',
  styleUrl: './invitations.css'
})
export class CompanyInvitations implements OnInit {
  invitations: Invitation[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: InvitationStatusFilter = 'ALL';

  constructor(private readonly invitationService: InvitationService) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  get filteredInvitations(): Invitation[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.invitations.filter(invitation => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        invitation.status === this.selectedStatus;

      const matchesSearch =
        !search ||
        invitation.consultantName.toLowerCase().includes(search) ||
        invitation.consultantTitle?.toLowerCase().includes(search) ||
        invitation.subject.toLowerCase().includes(search) ||
        invitation.message.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
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
    return this.selectedStatus !== 'ALL' || this.searchTerm.trim().length > 0;
  }

  loadInvitations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.invitationService.getCompanyInvitations().subscribe({
      next: invitations => {
        this.invitations = invitations ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des invitations de l’entreprise :',
          error
        );

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Vous n’êtes pas autorisé à consulter ces invitations.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Votre profil entreprise est introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de charger vos invitations.';
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

  getStatusLabel(status: InvitationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status;
    }
  }

  getStatusClass(status: InvitationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getConsultantInitial(invitation: Invitation): string {
    return invitation.consultantName?.charAt(0).toUpperCase() || 'C';
  }

  trackInvitation(index: number, invitation: Invitation): string {
    return invitation.id;
  }

  private countByStatus(status: InvitationStatus): number {
    return this.invitations.filter(invitation => invitation.status === status)
      .length;
  }
}