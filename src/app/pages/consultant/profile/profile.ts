import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Consultant } from '../../../core/models/consultant';
import { ConsultantService } from '../../../core/services/consultant';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ConsultantProfile implements OnInit, OnDestroy {
  consultant: Consultant = {
    id: '',
    userId: '',
    firstName: '',
    lastName: '',
    title: '',
    skills: [],
    cvUrl: '',
    profileImageUrl: null,
    experienceYears: 0,
    location: '',
    available: true
  };

  profileImageObjectUrl: string | null = null;

  newSkill = '';
  loading = false;
  saving = false;
  uploadingImage = false;
  deletingImage = false;

  successMessage = '';
  errorMessage = '';
  imageSuccessMessage = '';
  imageErrorMessage = '';

  constructor(
    private readonly consultantService: ConsultantService
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

    this.consultantService.getProfile().subscribe({
      next: data => {
        this.consultant = {
          ...data,
          skills: data.skills || [],
          profileImageUrl:
            data.profileImageUrl ?? null
        };

        this.loading = false;
        this.loadProfileImage();
      },
      error: () => {
        this.errorMessage =
          'Impossible de charger le profil.';
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

    this.consultantService
      .uploadProfileImage(file)
      .subscribe({
        next: consultant => {
          this.consultant = {
            ...consultant,
            skills: consultant.skills || [],
            profileImageUrl:
              consultant.profileImageUrl ?? null
          };

          this.uploadingImage = false;
          this.imageSuccessMessage =
            'Photo de profil mise à jour.';

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
      !this.consultant.profileImageUrl ||
      this.deletingImage
    ) {
      return;
    }

    this.imageSuccessMessage = '';
    this.imageErrorMessage = '';
    this.deletingImage = true;

    this.consultantService
      .deleteProfileImage()
      .subscribe({
        next: () => {
          this.consultant.profileImageUrl = null;
          this.deletingImage = false;

          this.revokeProfileImageObjectUrl();

          this.imageSuccessMessage =
            'Photo de profil supprimée.';
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

  addSkill(): void {
    const skill =
      this.newSkill.trim();

    if (
      skill &&
      !this.consultant.skills.includes(skill)
    ) {
      this.consultant.skills.push(skill);
    }

    this.newSkill = '';
  }

  removeSkill(skill: string): void {
    this.consultant.skills =
      this.consultant.skills.filter(
        currentSkill =>
          currentSkill !== skill
      );
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.consultantService
      .updateProfile(this.consultant)
      .subscribe({
        next: data => {
          this.consultant = {
            ...data,
            skills: data.skills || [],
            profileImageUrl:
              data.profileImageUrl ?? null
          };

          this.successMessage =
            'Profil enregistré avec succès.';

          this.saving = false;
        },
        error: () => {
          this.errorMessage =
            'Erreur lors de l’enregistrement du profil.';

          this.saving = false;
        }
      });
  }

  private loadProfileImage(): void {
    if (
      !this.consultant.id ||
      !this.consultant.profileImageUrl
    ) {
      this.revokeProfileImageObjectUrl();
      return;
    }

    this.consultantService
      .getProfileImage(this.consultant.id)
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