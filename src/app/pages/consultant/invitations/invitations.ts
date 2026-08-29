import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  ContractType,
  Invitation,
  InvitationStatus,
  WorkMode
} from '../../../core/models/invitation';
import { CompanyService } from '../../../core/services/company';
import { InvitationService } from '../../../core/services/invitation';
import { MessagingService } from '../../../core/services/messaging';

type InvitationStatusFilter = 'ALL' | InvitationStatus;
type InvitationAction = 'ACCEPT' | 'REJECT';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invitations.html',
  styleUrl: './invitations.css'
})
export class Invitations implements OnInit, OnDestroy {
  invitations: Invitation[] = [];
  companyImageUrls: Record<string, string> = {};

  loading = false;
  errorMessage = '';

  actionInvitationId: string | null = null;
  actionSuccessMessage = '';
  actionErrorMessage = '';

  searchTerm = '';
  selectedStatus: InvitationStatusFilter = 'ALL';

  messagingParticipantId: string | null = null;

  focusedInvitationId: string | null = null;

  selectedInvitation: Invitation | null = null;
  selectedAction: InvitationAction | null = null;

  constructor(
    private readonly invitationService: InvitationService,
    private readonly messagingService: MessagingService,
    private readonly companyService: CompanyService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.focusedInvitationId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'invitationId'
      );

    this.loadInvitations();
  }

  ngOnDestroy(): void {
    this.clearCompanyImages();
  }

  get filteredInvitations(): Invitation[] {
    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.invitations.filter(invitation => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        invitation.status === this.selectedStatus;

      const searchableContent = [
        invitation.companyName,
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
        !search ||
        searchableContent.includes(search);

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
    return this.selectedStatus !== 'ALL' ||
      this.searchTerm.trim().length > 0;
  }

  get confirmationTitle(): string {
    if (!this.selectedInvitation) {
      return '';
    }

    return this.selectedAction === 'ACCEPT'
      ? 'Accepter cette proposition ?'
      : 'Refuser cette proposition ?';
  }

  get confirmationMessage(): string {
    if (!this.selectedInvitation) {
      return '';
    }

    if (this.selectedAction === 'ACCEPT') {
      return `Vous allez accepter la proposition « ${this.selectedInvitation.subject} » de ${this.selectedInvitation.companyName}.`;
    }

    return `Vous allez refuser la proposition « ${this.selectedInvitation.subject} » de ${this.selectedInvitation.companyName}.`;
  }

  loadInvitations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.clearCompanyImages();

    this.invitationService
      .getConsultantInvitations()
      .subscribe({
        next: invitations => {
          this.invitations = (invitations ?? []).map(
            invitation => ({
              ...invitation,
              technologies:
                invitation.technologies ?? []
            })
          );

          this.invitations.forEach(invitation => {
            this.loadCompanyImage(
              invitation.companyId
            );
          });

          this.loading = false;

          this.focusRequestedInvitation();
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des invitations :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à consulter ces invitations.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil consultant est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger vos invitations.';
        }
      });
  }

  getCompanyImageUrl(
    companyId: string
  ): string | null {
    return this.companyImageUrls[companyId] ?? null;
  }

  contactCompany(invitation: Invitation): void {
    if (
      !invitation.companyId ||
      this.messagingParticipantId
    ) {
      return;
    }

    this.messagingParticipantId =
      invitation.companyId;

    this.actionErrorMessage = '';

    this.messagingService
      .openConversation(invitation.companyId)
      .subscribe({
        next: conversation => {
          this.messagingParticipantId = null;

          this.router.navigate(
            ['/messaging'],
            {
              queryParams: {
                conversationId:
                  conversation.id
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

          this.actionErrorMessage =
            'Impossible d’ouvrir la conversation avec cette entreprise.';
        }
      });
  }

  isOpeningConversation(
    companyId: string
  ): boolean {
    return this.messagingParticipantId ===
      companyId;
  }

  acceptInvitation(
    invitation: Invitation
  ): void {
    this.openActionModal(
      invitation,
      'ACCEPT'
    );
  }

  rejectInvitation(
    invitation: Invitation
  ): void {
    this.openActionModal(
      invitation,
      'REJECT'
    );
  }

  openActionModal(
    invitation: Invitation,
    action: InvitationAction
  ): void {
    if (
      invitation.status !== 'PENDING' ||
      this.isInvitationProcessing(
        invitation.id
      )
    ) {
      return;
    }

    this.selectedInvitation = invitation;
    this.selectedAction = action;
    this.clearActionMessages();
  }

  cancelActionModal(): void {
    if (this.actionInvitationId) {
      return;
    }

    this.selectedInvitation = null;
    this.selectedAction = null;
  }

  confirmInvitationAction(): void {
    const invitation =
      this.selectedInvitation;

    const action =
      this.selectedAction;

    if (!invitation || !action) {
      return;
    }

    this.respondToInvitation(
      invitation,
      action === 'ACCEPT'
    );
  }

  filterByStatus(
    status: InvitationStatusFilter
  ): void {
    this.selectedStatus = status;
    this.clearFocusedInvitation();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.clearFocusedInvitation();
  }

  isInvitationProcessing(
    invitationId: string
  ): boolean {
    return this.actionInvitationId ===
      invitationId;
  }

  isFocusedInvitation(
    invitationId: string
  ): boolean {
    return this.focusedInvitationId ===
      invitationId;
  }

  getStatusLabel(
    status: InvitationStatus
  ): string {
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

  getStatusClass(
    status: InvitationStatus
  ): string {
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

  getSalaryLabel(
    salary: number | null
  ): string {
    if (
      salary === null ||
      salary === undefined
    ) {
      return 'Non renseignée';
    }

    return `${salary.toLocaleString('fr-FR')} DT`;
  }

  trackInvitation(
    index: number,
    invitation: Invitation
  ): string {
    return invitation.id;
  }

  private loadCompanyImage(
    companyId: string
  ): void {
    if (
      !companyId ||
      this.companyImageUrls[companyId]
    ) {
      return;
    }

    this.companyService
      .getProfileImage(companyId)
      .subscribe({
        next: blob => {
          this.companyImageUrls = {
            ...this.companyImageUrls,
            [companyId]: URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.removeCompanyImageUrl(companyId);
        }
      });
  }

  private removeCompanyImageUrl(
    companyId: string
  ): void {
    const currentUrl =
      this.companyImageUrls[companyId];

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    const {
      [companyId]: removed,
      ...remainingUrls
    } = this.companyImageUrls;

    this.companyImageUrls = remainingUrls;
  }

  private clearCompanyImages(): void {
    Object.values(
      this.companyImageUrls
    ).forEach(url => {
      URL.revokeObjectURL(url);
    });

    this.companyImageUrls = {};
  }

  private respondToInvitation(
    invitation: Invitation,
    accepted: boolean
  ): void {
    this.actionInvitationId =
      invitation.id;

    this.clearActionMessages();

    this.invitationService
      .respondToInvitation(
        invitation.id,
        accepted
      )
      .subscribe({
        next: updatedInvitation => {
          this.replaceInvitation({
            ...updatedInvitation,
            technologies:
              updatedInvitation.technologies ?? []
          });

          this.actionInvitationId = null;
          this.selectedInvitation = null;
          this.selectedAction = null;

          this.actionSuccessMessage = accepted
            ? 'Proposition acceptée. Une mission active a été créée.'
            : 'Proposition refusée.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la réponse à l’invitation :',
            error
          );

          this.actionInvitationId = null;
          this.selectedInvitation = null;
          this.selectedAction = null;

          this.actionErrorMessage =
            this.getActionErrorMessage(error);

          if (error.status === 409) {
            this.loadInvitations();
          }
        }
      });
  }

  private focusRequestedInvitation(): void {
    const invitationId =
      this.focusedInvitationId;

    if (!invitationId) {
      return;
    }

    const invitationExists =
      this.invitations.some(
        invitation =>
          invitation.id === invitationId
      );

    if (!invitationExists) {
      this.focusedInvitationId = null;

      this.removeInvitationIdFromUrl();

      return;
    }

    this.searchTerm = '';
    this.selectedStatus = 'ALL';

    setTimeout(() => {
      const element =
        document.getElementById(
          this.buildInvitationElementId(
            invitationId
          )
        );

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }

  private clearFocusedInvitation(): void {
    if (!this.focusedInvitationId) {
      return;
    }

    this.focusedInvitationId = null;

    this.removeInvitationIdFromUrl();
  }

  private removeInvitationIdFromUrl(): void {
    this.router.navigate(
      [],
      {
        relativeTo: this.activatedRoute,
        queryParams: {
          invitationId: null
        },
        queryParamsHandling: 'merge',
        replaceUrl: true
      }
    );
  }

  private buildInvitationElementId(
    invitationId: string
  ): string {
    return `invitation-${invitationId}`;
  }

  private replaceInvitation(
    updatedInvitation: Invitation
  ): void {
    this.invitations =
      this.invitations.map(
        invitation =>
          invitation.id === updatedInvitation.id
            ? updatedInvitation
            : invitation
      );
  }

  private countByStatus(
    status: InvitationStatus
  ): number {
    return this.invitations.filter(
      invitation =>
        invitation.status === status
    ).length;
  }

  private getActionErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 400) {
      return this.extractBackendMessage(
        error,
        'La réponse envoyée est invalide.'
      );
    }

    if (error.status === 403) {
      return 'Vous n’êtes pas autorisé à répondre à cette proposition.';
    }

    if (error.status === 404) {
      return 'Cette proposition est introuvable.';
    }

    if (error.status === 409) {
      return this.extractBackendMessage(
        error,
        'Cette proposition ne peut plus être acceptée.'
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

    return typeof backendMessage === 'string' &&
      backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }
}