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
  selector: 'app-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invitations.html',
  styleUrl: './invitations.css'
})
export class Invitations implements OnInit {
  invitations: Invitation[] = [];

  loading = false;
  errorMessage = '';

  actionInvitationId: string | null = null;
  actionSuccessMessage = '';
  actionErrorMessage = '';

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
        invitation.companyName.toLowerCase().includes(search) ||
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
    this.clearActionMessages();

    this.invitationService.getConsultantInvitations().subscribe({
      next: invitations => {
        this.invitations = invitations ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des invitations :', error);

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage = 'Vous n’êtes pas autorisé à consulter ces invitations.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Votre profil consultant est introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de charger vos invitations.';
      }
    });
  }

  acceptInvitation(invitation: Invitation): void {
    if (invitation.status !== 'PENDING' || this.isInvitationProcessing(invitation.id)) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous accepter l’invitation de « ${invitation.companyName} » ?`
    );

    if (confirmed) {
      this.respondToInvitation(invitation, true);
    }
  }

  rejectInvitation(invitation: Invitation): void {
    if (invitation.status !== 'PENDING' || this.isInvitationProcessing(invitation.id)) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous refuser l’invitation de « ${invitation.companyName} » ?`
    );

    if (confirmed) {
      this.respondToInvitation(invitation, false);
    }
  }

  filterByStatus(status: InvitationStatusFilter): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }

  isInvitationProcessing(invitationId: string): boolean {
    return this.actionInvitationId === invitationId;
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

  trackInvitation(index: number, invitation: Invitation): string {
    return invitation.id;
  }

  private respondToInvitation(invitation: Invitation, accepted: boolean): void {
    this.actionInvitationId = invitation.id;
    this.clearActionMessages();

    this.invitationService.respondToInvitation(invitation.id, accepted).subscribe({
      next: updatedInvitation => {
        this.replaceInvitation(updatedInvitation);
        this.actionInvitationId = null;

        this.actionSuccessMessage = accepted
          ? 'Invitation acceptée. Une mission active a été créée.'
          : 'Invitation refusée.';
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la réponse à l’invitation :', error);

        this.actionInvitationId = null;
        this.actionErrorMessage = this.getActionErrorMessage(error);

        if (error.status === 409) {
          this.loadInvitations();
        }
      }
    });
  }

  private replaceInvitation(updatedInvitation: Invitation): void {
    this.invitations = this.invitations.map(invitation =>
      invitation.id === updatedInvitation.id ? updatedInvitation : invitation
    );
  }

  private countByStatus(status: InvitationStatus): number {
    return this.invitations.filter(invitation => invitation.status === status).length;
  }

  private getActionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return this.extractBackendMessage(
        error,
        'La réponse envoyée est invalide.'
      );
    }

    if (error.status === 403) {
      return 'Vous n’êtes pas autorisé à répondre à cette invitation.';
    }

    if (error.status === 404) {
      return 'Cette invitation est introuvable.';
    }

    if (error.status === 409) {
      return this.extractBackendMessage(
        error,
        'Cette invitation ne peut plus être acceptée.'
      );
    }

    return 'Impossible d’enregistrer votre réponse.';
  }

  private extractBackendMessage(
    error: HttpErrorResponse,
    defaultMessage: string
  ): string {
    const backendMessage =
      error.error?.message ||
      error.error?.detail ||
      error.error?.error;

    return typeof backendMessage === 'string' && backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }
}