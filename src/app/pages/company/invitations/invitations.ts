import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ContractType,
  Invitation,
  InvitationStatus,
  WorkMode
} from '../../../core/models/invitation';
import { InvitationService } from '../../../core/services/invitation';
import { MessagingService } from '../../../core/services/messaging';

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

  messagingParticipantId: string | null = null;
  messagingErrorMessage = '';

  constructor(
    private readonly invitationService: InvitationService,
    private readonly messagingService: MessagingService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  get filteredInvitations(): Invitation[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.invitations.filter(invitation => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        invitation.status === this.selectedStatus;

      const searchableContent = [
        invitation.consultantName,
        invitation.consultantTitle,
        invitation.subject,
        invitation.message,
        invitation.location,
        invitation.notes,
        ...(invitation.technologies ?? [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search || searchableContent.includes(search);

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
    return (
      this.selectedStatus !== 'ALL' ||
      this.searchTerm.trim().length > 0
    );
  }

  loadInvitations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.messagingErrorMessage = '';

    this.invitationService.getCompanyInvitations().subscribe({
      next: invitations => {
        this.invitations = (invitations ?? []).map(
          invitation => ({
            ...invitation,
            technologies: invitation.technologies ?? []
          })
        );

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
            'Vous n’êtes pas autorisé à consulter ces propositions.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage =
            'Votre profil entreprise est introuvable.';
          return;
        }

        this.errorMessage =
          'Impossible de charger vos propositions.';
      }
    });
  }

  contactConsultant(invitation: Invitation): void {
    if (
      !invitation.consultantId ||
      this.messagingParticipantId
    ) {
      return;
    }

    this.messagingParticipantId =
      invitation.consultantId;

    this.messagingErrorMessage = '';

    this.messagingService
      .openConversation(invitation.consultantId)
      .subscribe({
        next: conversation => {
          this.messagingParticipantId = null;

          this.router.navigate(
            ['/messaging'],
            {
              queryParams: {
                conversationId: conversation.id
              }
            }
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de l’ouverture de la conversation :',
            error
          );

          this.messagingParticipantId = null;

          this.messagingErrorMessage =
            'Impossible d’ouvrir la conversation avec ce consultant.';
        }
      });
  }

  isOpeningConversation(
    consultantId: string
  ): boolean {
    return this.messagingParticipantId === consultantId;
  }

  filterByStatus(
    status: InvitationStatusFilter
  ): void {
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

  getContractTypeLabel(
    contractType: ContractType | null
  ): string {
    switch (contractType) {
      case 'CDI':
        return 'CDI';
      case 'CDD':
        return 'CDD';
      case 'FREELANCE':
        return 'Freelance';
      case 'INTERNSHIP':
        return 'Stage';
      case 'OTHER':
        return 'Autre';
      default:
        return 'Non renseigné';
    }
  }

  getWorkModeLabel(
    workMode: WorkMode | null
  ): string {
    switch (workMode) {
      case 'ONSITE':
        return 'Sur site';
      case 'REMOTE':
        return 'À distance';
      case 'HYBRID':
        return 'Hybride';
      default:
        return 'Non renseigné';
    }
  }

  getSalaryLabel(salary: number | null): string {
    if (salary === null || salary === undefined) {
      return 'Non renseignée';
    }

    return `${salary.toLocaleString('fr-FR')} DT`;
  }

  getConsultantInitial(
    invitation: Invitation
  ): string {
    return (
      invitation.consultantName
        ?.charAt(0)
        .toUpperCase() || 'C'
    );
  }

  trackInvitation(
    index: number,
    invitation: Invitation
  ): string {
    return invitation.id;
  }

  private countByStatus(
    status: InvitationStatus
  ): number {
    return this.invitations.filter(
      invitation =>
        invitation.status === status
    ).length;
  }
}