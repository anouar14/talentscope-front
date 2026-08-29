import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { ConsultantProfile } from '../../../core/models/consultant';
import {
  ContractType,
  CreateInvitationRequest,
  WorkMode
} from '../../../core/models/invitation';
import { MissionOffer } from '../../../core/models/mission-offer';
import { ConsultantService } from '../../../core/services/consultant';
import { InvitationService } from '../../../core/services/invitation';
import { MissionOfferService } from '../../../core/services/mission-offer';

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
export class ConsultantDetail implements OnInit, OnDestroy {
  consultant: ConsultantProfile | null = null;
  missionOffer: MissionOffer | null = null;

  profileImageObjectUrl: string | null = null;

  missionOfferId: string | null = null;

  loading = false;
  errorMessage = '';

  offerLoading = false;
  offerErrorMessage = '';

  showInvitationForm = false;
  invitationLoading = false;
  invitationSuccessMessage = '';
  invitationErrorMessage = '';

  invitationSubject = '';
  invitationMessage = '';
  invitationStartDate = '';
  invitationEndDate = '';
  invitationContractType: ContractType | '' = '';
  invitationWorkMode: WorkMode | '' = '';
  invitationLocation = '';
  invitationSalary: number | null = null;
  invitationTechnologies = '';
  invitationNotes = '';

  cvDownloadLoading = false;
  cvDownloadErrorMessage = '';

  readonly contractTypes: Array<{
    value: ContractType;
    label: string;
  }> = [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    {
      value: 'FREELANCE',
      label: 'Freelance'
    },
    {
      value: 'INTERNSHIP',
      label: 'Stage'
    },
    { value: 'OTHER', label: 'Autre' }
  ];

  readonly workModes: Array<{
    value: WorkMode;
    label: string;
  }> = [
    {
      value: 'ONSITE',
      label: 'Sur site'
    },
    {
      value: 'REMOTE',
      label: 'À distance'
    },
    {
      value: 'HYBRID',
      label: 'Hybride'
    }
  ];

  constructor(
    private readonly consultantService: ConsultantService,
    private readonly invitationService: InvitationService,
    private readonly missionOfferService: MissionOfferService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const consultantId =
      this.activatedRoute.snapshot.paramMap.get(
        'id'
      );

    this.missionOfferId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'missionOfferId'
      );

    if (!consultantId) {
      this.errorMessage =
        'Identifiant du consultant invalide.';
      return;
    }

    this.loadConsultant(
      consultantId
    );

    if (this.missionOfferId) {
      this.loadMissionOffer(
        this.missionOfferId
      );
    }
  }

  ngOnDestroy(): void {
    this.revokeProfileImageObjectUrl();
  }

  get minimumStartDate(): string {
    return new Date()
      .toISOString()
      .split('T')[0];
  }

  get minimumEndDate(): string {
    return (
      this.invitationStartDate ||
      this.minimumStartDate
    );
  }

  get hasMissionOfferContext(): boolean {
    return this.missionOffer !== null;
  }

  loadConsultant(
    consultantId: string
  ): void {
    this.loading = true;
    this.errorMessage = '';

    this.consultantService
      .getConsultantById(consultantId)
      .subscribe({
        next: consultant => {
          this.consultant = {
            ...consultant,
            skills:
              consultant.skills ?? [],
            profileImageUrl:
              consultant.profileImageUrl ??
              null
          };

          this.loading = false;
          this.loadProfileImage();

          if (
            this.missionOffer &&
            this.consultant.available
          ) {
            this.openInvitationForm();
          }
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors du chargement du consultant :',
            error
          );

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

  loadMissionOffer(
    missionOfferId: string
  ): void {
    this.offerLoading = true;
    this.offerErrorMessage = '';

    this.missionOfferService
      .getOfferById(missionOfferId)
      .subscribe({
        next: offer => {
          this.offerLoading = false;

          if (offer.status !== 'OPEN') {
            this.missionOfferId = null;
            this.missionOffer = null;

            this.offerErrorMessage =
              'Cette offre n’est plus ouverte.';
            return;
          }

          this.missionOffer = {
            ...offer,
            technologies:
              offer.technologies ?? []
          };

          this.prefillInvitationFromOffer(
            this.missionOffer
          );

          if (
            this.consultant &&
            this.consultant.available
          ) {
            this.showInvitationForm =
              true;
          }
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors du chargement de l’offre :',
            error
          );

          this.offerLoading = false;
          this.missionOfferId = null;
          this.missionOffer = null;

          if (error.status === 403) {
            this.offerErrorMessage =
              'Vous n’êtes pas autorisé à utiliser cette offre.';
            return;
          }

          if (error.status === 404) {
            this.offerErrorMessage =
              'L’offre utilisée pour cette proposition est introuvable.';
            return;
          }

          this.offerErrorMessage =
            'Impossible de charger l’offre de mission.';
        }
      });
  }

  goBack(): void {
    if (this.missionOfferId) {
      this.router.navigate([
        '/company/mission-offers',
        this.missionOfferId,
        'matching'
      ]);
      return;
    }

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

    if (this.missionOffer) {
      this.prefillInvitationFromOffer(
        this.missionOffer
      );
    }

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
    if (
      !this.consultant?.cvAvailable
    ) {
      return;
    }

    this.cvDownloadLoading = true;
    this.cvDownloadErrorMessage = '';

    this.consultantService
      .downloadConsultantCv(
        this.consultant.id
      )
      .subscribe({
        next: blob => {
          this.cvDownloadLoading =
            false;

          const fileUrl =
            URL.createObjectURL(blob);

          const fileName =
            this.buildCvFileName();

          const link =
            document.createElement('a');

          link.href = fileUrl;
          link.download = fileName;

          document.body.appendChild(
            link
          );

          link.click();

          document.body.removeChild(
            link
          );

          URL.revokeObjectURL(
            fileUrl
          );
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors du téléchargement du CV :',
            error
          );

          this.cvDownloadLoading =
            false;

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
    if (
      !this.consultant ||
      !this.validateInvitationForm()
    ) {
      return;
    }

    const request =
      this.buildInvitationRequest();

    this.invitationLoading = true;
    this.invitationErrorMessage = '';
    this.invitationSuccessMessage = '';

    this.invitationService
      .createInvitation(request)
      .subscribe({
        next: () => {
          this.invitationLoading =
            false;

          this.showInvitationForm =
            false;

          const wasOfferInvitation =
            this.missionOfferId !==
            null;

          this.resetInvitationForm();

          this.invitationSuccessMessage =
            wasOfferInvitation
              ? 'La proposition liée à cette offre a été envoyée au consultant.'
              : 'La proposition de mission a été envoyée au consultant.';
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors de l’envoi de l’invitation :',
            error
          );

          this.invitationLoading =
            false;

          if (error.status === 400) {
            this.invitationErrorMessage =
              this.extractBackendMessage(
                error,
                'Les informations de la proposition sont invalides.'
              );
            return;
          }

          if (error.status === 403) {
            this.invitationErrorMessage =
              this.extractBackendMessage(
                error,
                'Vous n’êtes pas autorisé à envoyer cette proposition.'
              );
            return;
          }

          if (error.status === 404) {
            this.invitationErrorMessage =
              this.extractBackendMessage(
                error,
                'Le consultant, l’entreprise ou l’offre est introuvable.'
              );
            return;
          }

          if (error.status === 409) {
            this.invitationErrorMessage =
              this.extractBackendMessage(
                error,
                'Cette proposition ne peut pas être envoyée.'
              );
            return;
          }

          this.invitationErrorMessage =
            'Impossible d’envoyer la proposition de mission.';
        }
      });
  }

  private loadProfileImage(): void {
    if (
      !this.consultant?.id ||
      !this.consultant
        .profileImageUrl
    ) {
      this.revokeProfileImageObjectUrl();
      return;
    }

    this.consultantService
      .getProfileImage(
        this.consultant.id
      )
      .subscribe({
        next: blob => {
          this.revokeProfileImageObjectUrl();

          this.profileImageObjectUrl =
            URL.createObjectURL(blob);
        },
        error: () => {
          this.revokeProfileImageObjectUrl();
        }
      });
  }

  private revokeProfileImageObjectUrl(): void {
    if (
      !this.profileImageObjectUrl
    ) {
      return;
    }

    URL.revokeObjectURL(
      this.profileImageObjectUrl
    );

    this.profileImageObjectUrl =
      null;
  }

  private prefillInvitationFromOffer(
    offer: MissionOffer
  ): void {
    this.invitationSubject =
      offer.title ?? '';

    this.invitationMessage =
      offer.description ?? '';

    this.invitationStartDate =
      offer.startDate ?? '';

    this.invitationEndDate =
      offer.endDate ?? '';

    this.invitationContractType =
      offer.contractType ?? '';

    this.invitationWorkMode =
      offer.workMode ?? '';

    this.invitationLocation =
      offer.location ?? '';

    this.invitationSalary =
      offer.salary ?? null;

    this.invitationTechnologies =
      (
        offer.technologies ?? []
      ).join(', ');

    this.invitationNotes =
      offer.notes ?? '';
  }

  private validateInvitationForm(): boolean {
    const subject =
      this.invitationSubject.trim();

    const message =
      this.invitationMessage.trim();

    const location =
      this.invitationLocation.trim();

    const technologies =
      this.parseTechnologies();

    this.invitationErrorMessage = '';
    this.invitationSuccessMessage = '';

    if (subject.length < 3) {
      this.invitationErrorMessage =
        'Le titre doit contenir au moins 3 caractères.';
      return false;
    }

    if (message.length < 10) {
      this.invitationErrorMessage =
        'La description doit contenir au moins 10 caractères.';
      return false;
    }

    if (!this.invitationStartDate) {
      this.invitationErrorMessage =
        'La date de début est obligatoire.';
      return false;
    }

    if (
      this.invitationEndDate &&
      this.invitationEndDate <
        this.invitationStartDate
    ) {
      this.invitationErrorMessage =
        'La date de fin doit être postérieure ou égale à la date de début.';
      return false;
    }

    if (
      !this.invitationContractType
    ) {
      this.invitationErrorMessage =
        'Le type de contrat est obligatoire.';
      return false;
    }

    if (!this.invitationWorkMode) {
      this.invitationErrorMessage =
        'Le mode de travail est obligatoire.';
      return false;
    }

    if (!location) {
      this.invitationErrorMessage =
        'La localisation est obligatoire.';
      return false;
    }

    if (
      this.invitationSalary !==
        null &&
      this.invitationSalary <= 0
    ) {
      this.invitationErrorMessage =
        'La rémunération doit être supérieure à zéro.';
      return false;
    }

    if (technologies.length === 0) {
      this.invitationErrorMessage =
        'Ajoutez au moins une technologie.';
      return false;
    }

    if (technologies.length > 20) {
      this.invitationErrorMessage =
        'Vous ne pouvez pas ajouter plus de 20 technologies.';
      return false;
    }

    return true;
  }

  private buildInvitationRequest():
    CreateInvitationRequest {
    return {
      consultantId:
        this.consultant!.id,
      missionOfferId:
        this.missionOfferId,
      subject:
        this.invitationSubject.trim(),
      message:
        this.invitationMessage.trim(),
      startDate:
        this.invitationStartDate,
      endDate:
        this.invitationEndDate ||
        null,
      contractType:
        this.invitationContractType as ContractType,
      workMode:
        this.invitationWorkMode as WorkMode,
      location:
        this.invitationLocation.trim(),
      salary:
        this.invitationSalary,
      technologies:
        this.parseTechnologies(),
      notes:
        this.invitationNotes.trim() ||
        null
    };
  }

  private parseTechnologies(): string[] {
    return [
      ...new Set(
        this.invitationTechnologies
          .split(',')
          .map(
            technology =>
              technology.trim()
          )
          .filter(Boolean)
      )
    ];
  }

  private resetInvitationForm(): void {
    this.invitationSubject = '';
    this.invitationMessage = '';
    this.invitationStartDate = '';
    this.invitationEndDate = '';
    this.invitationContractType = '';
    this.invitationWorkMode = '';
    this.invitationLocation = '';
    this.invitationSalary = null;
    this.invitationTechnologies = '';
    this.invitationNotes = '';
  }

  private buildCvFileName(): string {
    const firstName =
      this.consultant
        ?.firstName
        ?.trim() ||
      'consultant';

    const lastName =
      this.consultant
        ?.lastName
        ?.trim() ||
      '';

    const normalizedName =
      `${firstName}-${lastName}`
        .trim()
        .replace(/\s+/g, '-')
        .replace(
          /[^a-zA-Z0-9À-ÿ-]/g,
          ''
        );

    return `CV-${
      normalizedName ||
      'consultant'
    }.pdf`;
  }

  private extractBackendMessage(
    error: HttpErrorResponse,
    defaultMessage: string
  ): string {
    const backendMessage =
      error.error?.message ||
      error.error?.detail ||
      error.error?.error;

    return (
      typeof backendMessage ===
        'string' &&
      backendMessage.trim()
        ? backendMessage
        : defaultMessage
    );
  }
}