// import { Routes } from '@angular/router';
// import { Welcome } from './pages/welcome/welcome';
// import { Register } from './pages/auth/register/register';
// import { Login } from './pages/auth/login/login';
// import { ConsultantDashboard } from './pages/consultant/dashboard/dashboard';
// import { CompanyDashboard } from './pages/company/dashboard/dashboard';
// import { consultantGuard } from './core/guards/consultant-guard';
// import { companyGuard } from './core/guards/company-guard';
// import { ConsultantProfile } from './pages/consultant/profile/profile';
// import { UploadCv } from './pages/consultant/upload-cv/upload-cv';
// import { CompanyProfile } from './pages/company/profile/profile';
// import { SearchConsultants } from './pages/company/search-consultants/search-consultants';
// import { ResetPassword } from './pages/auth/reset-password/reset-password';
// import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
// import {GoogleRoleSelection} from './pages/auth/google-role-selection/google-role-selection';
// import { ConsultantDetail } from './pages/company/consultant-detail/consultant-detail';
// import { Invitations } from './pages/consultant/invitations/invitations';
// import {CompanyInvitations} from './pages/company/invitations/company-invitations';
// export const routes: Routes = [
//   { path: '', component: Welcome },
//   { path: 'register', component: Register },
//   { path: 'login', component: Login },

//   {
//     path: 'consultant/dashboard',
//     component: ConsultantDashboard,
//     canActivate: [consultantGuard]
//   },
//   {
//     path: 'company/dashboard',
//     component: CompanyDashboard,
//     canActivate: [companyGuard]
//   },
//   {
//   path: 'consultant/upload-cv',
//   component: UploadCv,
//   canActivate: [consultantGuard]
// },
//   {
//     path:'consultant/profile',
//     component: ConsultantProfile,
//     canActivate:[consultantGuard]
//   },
//   {
//     path: 'company/profile',
//     component: CompanyProfile,
//     canActivate: [companyGuard]
//   },
//   {
//   path: 'company/search-consultants',
//   component: SearchConsultants,
//   canActivate: [companyGuard]
//   },
//   {
//   path: 'forgot-password',
//   component: ForgotPassword
// },
// {
//   path: 'reset-password',
//   component: ResetPassword
// },
// {
//   path: 'google-role-selection',
//   component: GoogleRoleSelection
// },
// {
//   path: 'company/consultants/:id',
//   component: ConsultantDetail,
//   canActivate: [companyGuard]
// },
// {
//   path: 'consultant/invitations',
//   component: Invitations,
//   canActivate: [consultantGuard]
// },
// {
//   path: 'company/invitations',
//   component: CompanyInvitations,
//   canActivate: [companyGuard]
// },
//   { path: '**', redirectTo: '' }
// ];
import { Routes } from '@angular/router';
import { companyGuard } from './core/guards/company-guard';
import { consultantGuard } from './core/guards/consultant-guard';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { GoogleRoleSelection } from './pages/auth/google-role-selection/google-role-selection';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { ResetPassword } from './pages/auth/reset-password/reset-password';
import { ConsultantDetail } from './pages/company/consultant-detail/consultant-detail';
import { CompanyDashboard } from './pages/company/dashboard/dashboard';
import { CompanyInvitations } from './pages/company/invitations/invitations';
import { CompanyMissions } from './pages/company/missions/missions';
import { CompanyProfile } from './pages/company/profile/profile';
import { SearchConsultants } from './pages/company/search-consultants/search-consultants';
import { ConsultantDashboard } from './pages/consultant/dashboard/dashboard';
import { Invitations } from './pages/consultant/invitations/invitations';
import { ConsultantMissions } from './pages/consultant/missions/missions';
import { ConsultantProfile } from './pages/consultant/profile/profile';
import { UploadCv } from './pages/consultant/upload-cv/upload-cv';
import { MissionDetail } from './pages/mission-detail/mission-detail';
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
    path: '**',
    redirectTo: ''
  }
];