import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultantService } from '../../../core/services/consultant';
import { Consultant } from '../../../core/models/consultant';

@Component({
  selector: 'app-search-consultants',
  imports: [CommonModule, FormsModule],
  templateUrl: './search-consultants.html',
  styleUrls: ['./search-consultants.css']
})
export class SearchConsultants implements OnInit {
  consultants: Consultant[] = [];
  filteredConsultants: Consultant[] = [];

  searchTerm = '';
  loading = false;
  errorMessage = '';

  constructor(private consultantService: ConsultantService) {}

  ngOnInit(): void {
    this.loadConsultants();
  }

  loadConsultants(): void {
    this.loading = true;

    this.consultantService.getAllConsultants().subscribe({
      next: (data) => {
        this.consultants = data.map(c => ({
          ...c,
          skills: c.skills || []
        }));
        this.filteredConsultants = this.consultants;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les consultants.';
        this.loading = false;
      }
    });
  }

  filterConsultants(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredConsultants = this.consultants.filter(c =>
      (c.firstName || '').toLowerCase().includes(term) ||
      (c.lastName || '').toLowerCase().includes(term) ||
      (c.title || '').toLowerCase().includes(term) ||
      (c.location || '').toLowerCase().includes(term) ||
      c.skills.some(skill => skill.toLowerCase().includes(term))
    );
  }
}