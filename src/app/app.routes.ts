import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin-guard';
import { authGuard } from './core/guards/auth.guard';
import { companyGuard } from './core/guards/company-guard';
import { consultantGuard } from './core/guards/consultant-guard';
import { messagingGuard } from './core/guards/messaging-guard';

import { AdminCompanies } from './pages/admin/companies/companies';
import { AdminConsultants } from './pages/admin/consultants/consultants';
import { AdminDashboardPage } from './pages/admin/dashboard/dashboard';
import { AdminInvitations } from './pages/admin/invitations/invitations';
import { AdminMissions } from './pages/admin/missions/missions';
import { AdminUsers } from './pages/admin/users/users';

import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { GoogleRoleSelection } from './pages/auth/google-role-selection/google-role-selection';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { ResetPassword } from './pages/auth/reset-password/reset-password';

import { ConsultantDetail } from './pages/company/consultant-detail/consultant-detail';
import { CreateMissionOffer } from './pages/company/create-mission-offer/create-mission-offer';
import { CompanyDashboard } from './pages/company/dashboard/dashboard';
import { CompanyInvitations } from './pages/company/invitations/invitations';
import { MissionOfferApplications } from './pages/company/mission-offer-applications/mission-offer-applications';
import { CompanyMissionOffers } from './pages/company/mission-offers/mission-offers';
import { CompanyMissions } from './pages/company/missions/missions';
import { CompanyProfile } from './pages/company/profile/profile';
import { SearchConsultants } from './pages/company/search-consultants/search-consultants';

import { ConsultantDashboard } from './pages/consultant/dashboard/dashboard';
import { Invitations } from './pages/consultant/invitations/invitations';
import { ConsultantMissionApplications } from './pages/consultant/mission-applications/mission-applications';
import { ConsultantMissions } from './pages/consultant/missions/missions';
import { ConsultantProfile } from './pages/consultant/profile/profile';
import { SearchMissions } from './pages/consultant/search-missions/search-missions';
import { UploadCv } from './pages/consultant/upload-cv/upload-cv';

import { Messaging } from './pages/messaging/messaging';
import { MissionDetail } from './pages/mission-detail/mission-detail';
import { MissionOfferDetail } from './pages/mission-offer-detail/mission-offer-detail';
import { Notifications } from './pages/notifications/notifications';
import { Welcome } from './pages/welcome/welcome';

export const routes: Routes = [
  {
    path: '',
    component: Welcome
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'forgot-password',
    component: ForgotPassword
  },
  {
    path: 'reset-password',
    component: ResetPassword
  },
  {
    path: 'google-role-selection',
    component: GoogleRoleSelection
  },
  {
    path: 'notifications',
    component: Notifications,
    canActivate: [authGuard]
  },

  {
    path: 'consultant/dashboard',
    component: ConsultantDashboard,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/profile',
    component: ConsultantProfile,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/upload-cv',
    component: UploadCv,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/invitations',
    component: Invitations,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/search-missions',
    component: SearchMissions,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/mission-applications',
    component: ConsultantMissionApplications,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/mission-offers/:id',
    component: MissionOfferDetail,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/missions',
    component: ConsultantMissions,
    canActivate: [consultantGuard]
  },
  {
    path: 'consultant/missions/:id',
    component: MissionDetail,
    canActivate: [consultantGuard]
  },

  {
    path: 'company/dashboard',
    component: CompanyDashboard,
    canActivate: [companyGuard]
  },
  {
    path: 'company/profile',
    component: CompanyProfile,
    canActivate: [companyGuard]
  },
  {
    path: 'company/search-consultants',
    component: SearchConsultants,
    canActivate: [companyGuard]
  },
  {
    path: 'company/consultants/:id',
    component: ConsultantDetail,
    canActivate: [companyGuard]
  },
  {
    path: 'company/invitations',
    component: CompanyInvitations,
    canActivate: [companyGuard]
  },
  {
    path: 'company/mission-offers',
    component: CompanyMissionOffers,
    canActivate: [companyGuard]
  },
  {
    path: 'company/mission-offers/create',
    component: CreateMissionOffer,
    canActivate: [companyGuard]
  },
  {
    path: 'company/mission-offers/:id/applications',
    component: MissionOfferApplications,
    canActivate: [companyGuard]
  },
  {
    path: 'company/missions',
    component: CompanyMissions,
    canActivate: [companyGuard]
  },
  {
    path: 'company/missions/:id',
    component: MissionDetail,
    canActivate: [companyGuard]
  },

  {
    path: 'admin/dashboard',
    component: AdminDashboardPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/users',
    component: AdminUsers,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/consultants',
    component: AdminConsultants,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/companies',
    component: AdminCompanies,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/invitations',
    component: AdminInvitations,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/missions',
    component: AdminMissions,
    canActivate: [adminGuard]
  },

  {
    path: 'messaging',
    component: Messaging,
    canActivate: [messagingGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }
];