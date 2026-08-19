import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDashboard } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboardPage implements OnInit {
  statistics: AdminDashboard | null = null;

  loading = false;
  errorMessage = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  get invitationAcceptanceRate(): number {
    if (!this.statistics || this.statistics.totalInvitations === 0) {
      return 0;
    }

    return Math.round(
      this.statistics.acceptedInvitations /
        this.statistics.totalInvitations *
        100
    );
  }

  get consultantAvailabilityRate(): number {
    if (!this.statistics || this.statistics.totalConsultants === 0) {
      return 0;
    }

    return Math.round(
      this.statistics.availableConsultants /
        this.statistics.totalConsultants *
        100
    );
  }

  get activeMissionRate(): number {
    if (!this.statistics || this.statistics.totalMissions === 0) {
      return 0;
    }

    return Math.round(
      this.statistics.activeMissions /
        this.statistics.totalMissions *
        100
    );
  }

  loadStatistics(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getDashboardStatistics().subscribe({
      next: statistics => {
        this.statistics = statistics;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement du dashboard admin :',
          error
        );

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Vous n’êtes pas autorisé à consulter cet espace.';
          return;
        }

        this.errorMessage =
          'Impossible de charger les statistiques administrateur.';
      }
    });
  }
}