import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultantService } from '../../../core/services/consultant';

@Component({
  selector: 'app-upload-cv',
  imports: [CommonModule, RouterLink],
  templateUrl: './upload-cv.html',
  styleUrls: ['./upload-cv.css']
})
export class UploadCv {
  selectedFile: File | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  cvUrl = '';

  constructor(private consultantService: ConsultantService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Veuillez sélectionner un fichier PDF.';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';
  }

  uploadCv(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Veuillez choisir un CV avant de continuer.';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.consultantService.uploadCv(this.selectedFile).subscribe({
      next: (consultant) => {
        this.cvUrl = consultant.cvUrl;
        this.successMessage = 'CV envoyé avec succès.';
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l’envoi du CV.';
        this.loading = false;
      }
    });
  }
}