import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Company } from '../../../core/models/company';
import { CompanyService } from '../../../core/services/company';

@Component({
  selector: 'app-company-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class CompanyProfile implements OnInit {
  company: Company = {
    id: '',
    userId: '',
    companyName: '',
    sector: '',
    location: '',
    website: '',
    description: ''
  };

  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.companyService.getProfile().subscribe({
      next: data => {
        this.company = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Impossible de charger le profil entreprise.';
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.companyService.updateProfile(this.company).subscribe({
      next: data => {
        this.company = data;
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
}