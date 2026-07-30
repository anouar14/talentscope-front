import { Component,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ActivatedRoute,  Router,  RouterLink} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ConsultantService } from '../../../core/services/consultant';
import { ConsultantProfile } from '../../../core/models/consultant';
import { FormsModule } from '@angular/forms';
import { InvitationService } from '../../../core/services/invitation';

@Component({
  selector: 'app-consultant-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './consultant-detail.html',
  styleUrl: './consultant-detail.css'
})
export class ConsultantDetail implements OnInit {

  consultant: ConsultantProfile | null = null;

  loading = false;
  errorMessage = '';
  showInvitationForm = false;

invitationSubject = '';
invitationMessage = '';

invitationLoading = false;
invitationSuccessMessage = '';
invitationErrorMessage = '';

cvDownloadLoading = false;
cvDownloadErrorMessage = '';

  constructor(
    private consultantService: ConsultantService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    const consultantId =
      this.activatedRoute.snapshot.paramMap.get('id');

    if (!consultantId) {
      this.errorMessage =
        'Identifiant du consultant invalide.';
      return;
    }

    this.loadConsultant(consultantId);
  }

  loadConsultant(consultantId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.consultantService
      .getConsultantById(consultantId)
      .subscribe({
        next: (consultant) => {
          this.consultant = {
            ...consultant,
            skills: consultant.skills ?? []
          };

          this.loading = false;
        },

        error: (error: HttpErrorResponse) => {
          console.error(error);

          this.loading = false;

          if (error.status === 404) {
            this.errorMessage =
              'Ce profil consultant est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger le profil du consultant.';
        }
      });
  }

  goBack(): void {
    this.router.navigate([
      '/company/search-consultants'
    ]);
  }
  openInvitationForm(): void {
  if (!this.consultant?.available) {
    return;
  }

  this.invitationSuccessMessage = '';
  this.invitationErrorMessage = '';
  this.showInvitationForm = true;
}

closeInvitationForm(): void {
  if (this.invitationLoading) {
    return;
  }

  this.showInvitationForm = false;
  this.invitationErrorMessage = '';
}
downloadCv(): void {
  if (!this.consultant?.cvAvailable) {
    return;
  }

  this.cvDownloadLoading = true;
  this.cvDownloadErrorMessage = '';

  this.consultantService
    .downloadConsultantCv(this.consultant.id)
    .subscribe({
      next: (blob: Blob) => {
        this.cvDownloadLoading = false;

        const fileUrl = URL.createObjectURL(blob);

        const firstName =
          this.consultant?.firstName?.trim() ||
          'consultant';

        const lastName =
          this.consultant?.lastName?.trim() ||
          '';

        const normalizedName =
          `${firstName}-${lastName}`
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9À-ÿ-]/g, '');

        const link = document.createElement('a');

        link.href = fileUrl;
        link.download =
          `CV-${normalizedName || 'consultant'}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(fileUrl);
      },

      error: (error: HttpErrorResponse) => {
        console.error(error);

        this.cvDownloadLoading = false;

        if (error.status === 403) {
          this.cvDownloadErrorMessage =
            'Vous n’êtes pas autorisé à télécharger ce CV.';
          return;
        }

        if (error.status === 404) {
          this.cvDownloadErrorMessage =
            'Le fichier CV est introuvable.';
          return;
        }

        this.cvDownloadErrorMessage =
          'Impossible de télécharger le CV.';
      }
    });
}

sendInvitation(): void {
  if (!this.consultant) {
    return;
  }

  const subject = this.invitationSubject.trim();
  const message = this.invitationMessage.trim();

  this.invitationErrorMessage = '';
  this.invitationSuccessMessage = '';

  if (subject.length < 3) {
    this.invitationErrorMessage =
      'L’objet doit contenir au moins 3 caractères.';

    return;
  }

  if (message.length < 10) {
    this.invitationErrorMessage =
      'Le message doit contenir au moins 10 caractères.';

    return;
  }

  this.invitationLoading = true;

  this.invitationService
    .createInvitation({
      consultantId: this.consultant.id,
      subject,
      message
    })
    .subscribe({
      next: () => {
        this.invitationLoading = false;
        this.showInvitationForm = false;

        this.invitationSubject = '';
        this.invitationMessage = '';

        this.invitationSuccessMessage =
          'Votre invitation a été envoyée au consultant.';
      },

      error: (error: HttpErrorResponse) => {
        console.error(error);

        this.invitationLoading = false;

        if (error.status === 409) {
          this.invitationErrorMessage =
            error.error?.message ||
            'Une invitation est déjà en attente pour ce consultant.';

          return;
        }

        if (error.status === 400) {
          this.invitationErrorMessage =
            'Les informations de l’invitation sont invalides.';

          return;
        }

        this.invitationErrorMessage =
          'Impossible d’envoyer l’invitation.';
      }
    });
}
}