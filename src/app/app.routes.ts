import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { Register } from './pages/auth/register/register';
import { Login } from './pages/auth/login/login';
import { ConsultantDashboard } from './pages/consultant/dashboard/dashboard';
import { CompanyDashboard } from './pages/company/dashboard/dashboard';
import { consultantGuard } from './core/guards/consultant-guard';
import { companyGuard } from './core/guards/company-guard';
import { ConsultantProfile } from './pages/consultant/profile/profile';
import { UploadCv } from './pages/consultant/upload-cv/upload-cv';
import { CompanyProfile } from './pages/company/profile/profile';
import { SearchConsultants } from './pages/company/search-consultants/search-consultants';
export const routes: Routes = [
  { path: '', component: Welcome },
  { path: 'register', component: Register },
  { path: 'login', component: Login },

  {
    path: 'consultant/dashboard',
    component: ConsultantDashboard,
    canActivate: [consultantGuard]
  },
  {
    path: 'company/dashboard',
    component: CompanyDashboard,
    canActivate: [companyGuard]
  },
  {
  path: 'consultant/upload-cv',
  component: UploadCv,
  canActivate: [consultantGuard]
},
  {
    path:'consultant/profile',
    component: ConsultantProfile,
    canActivate:[consultantGuard]
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
  { path: '**', redirectTo: '' }
];