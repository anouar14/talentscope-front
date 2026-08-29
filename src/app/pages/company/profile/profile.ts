import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Company } from '../../../core/models/company';
import { CompanyService } from '../../../core/services/company';

@Component({
  selector: 'app-company-profile',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class CompanyProfile implements OnInit, OnDestroy {
  company: Company = {
    id: '',
    userId: '',
    companyName: '',
    sector: '',
    location: '',
    website: '',
    description: '',
    profileImageUrl: null
  };

  profileImageObjectUrl: string | null = null;

  loading = false;
  saving = false;
  uploadingImage = false;
  deletingImage = false;

  successMessage = '';
  errorMessage = '';
  imageSuccessMessage = '';
  imageErrorMessage = '';

  constructor(
    private readonly companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.revokeProfileImageObjectUrl();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';

    this.companyService
      .getProfile()
      .subscribe({
        next: data => {
          this.company = {
            ...data,
            profileImageUrl:
              data.profileImageUrl ?? null
          };

          this.loading = false;
          this.loadProfileImage();
        },
        error: () => {
          this.errorMessage =
            'Impossible de charger le profil entreprise.';

          this.loading = false;
        }
      });
  }

  onProfileImageSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }

    this.imageSuccessMessage = '';
    this.imageErrorMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.imageErrorMessage =
        'Formats acceptés : JPEG, PNG et WEBP.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageErrorMessage =
        'La photo ne doit pas dépasser 5 Mo.';
      return;
    }

    this.uploadingImage = true;

    this.companyService
      .uploadProfileImage(file)
      .subscribe({
        next: company => {
          this.company = {
            ...company,
            profileImageUrl:
              company.profileImageUrl ?? null
          };

          this.uploadingImage = false;

          this.imageSuccessMessage =
            'Photo de l’entreprise mise à jour.';

          this.loadProfileImage();
        },
        error: (error: HttpErrorResponse) => {
          this.uploadingImage = false;

          this.imageErrorMessage =
            this.extractImageError(
              error,
              'Impossible de mettre à jour la photo.'
            );
        }
      });
  }

  deleteProfileImage(): void {
    if (
      !this.company.profileImageUrl ||
      this.deletingImage
    ) {
      return;
    }

    this.imageSuccessMessage = '';
    this.imageErrorMessage = '';
    this.deletingImage = true;

    this.companyService
      .deleteProfileImage()
      .subscribe({
        next: () => {
          this.company.profileImageUrl = null;
          this.deletingImage = false;

          this.revokeProfileImageObjectUrl();

          this.imageSuccessMessage =
            'Photo de l’entreprise supprimée.';
        },
        error: (error: HttpErrorResponse) => {
          this.deletingImage = false;

          this.imageErrorMessage =
            this.extractImageError(
              error,
              'Impossible de supprimer la photo.'
            );
        }
      });
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.companyService
      .updateProfile(this.company)
      .subscribe({
        next: data => {
          this.company = {
            ...data,
            profileImageUrl:
              data.profileImageUrl ?? null
          };

          this.successMessage =
            'Profil entreprise enregistré avec succès.';

          this.saving = false;
        },
        error: () => {
          this.errorMessage =
            'Erreur lors de l’enregistrement.';

          this.saving = false;
        }
      });
  }

  private loadProfileImage(): void {
    if (
      !this.company.id ||
      !this.company.profileImageUrl
    ) {
      this.revokeProfileImageObjectUrl();
      return;
    }

    this.companyService
      .getProfileImage(this.company.id)
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
    if (!this.profileImageObjectUrl) {
      return;
    }

    URL.revokeObjectURL(
      this.profileImageObjectUrl
    );

    this.profileImageObjectUrl = null;
  }

  private extractImageError(
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
}