import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultantService } from '../../../core/services/consultant';
import { Consultant } from '../../../core/models/consultant';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ConsultantProfile implements OnInit {

  consultant: Consultant = {
    id: '',
    userId: '',
    firstName: '',
    lastName: '',
    title: '',
    skills: [],
    cvUrl: '',
    experienceYears: 0,
    location: '',
    available: true
  };

  newSkill = '';
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private consultantService: ConsultantService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.consultantService.getProfile().subscribe({
      next: (data) => {
        this.consultant = {
          ...data,
          skills: data.skills || []
        };
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le profil.';
        this.loading = false;
      }
    });
  }

  addSkill(): void {
    const skill = this.newSkill.trim();

    if (skill && !this.consultant.skills.includes(skill)) {
      this.consultant.skills.push(skill);
    }

    this.newSkill = '';
  }

  removeSkill(skill: string): void {
    this.consultant.skills = this.consultant.skills.filter(s => s !== skill);
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.consultantService.updateProfile(this.consultant).subscribe({
      next: (data) => {
        this.consultant = {
          ...data,
          skills: data.skills || []
        };

        this.successMessage = 'Profil enregistré avec succès.';
        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l’enregistrement du profil.';
        this.saving = false;
      }
    });
  }
}