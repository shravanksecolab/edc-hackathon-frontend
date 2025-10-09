import { RouterModule, Routes } from '@angular/router';
import type { ModuleWithProviders } from '@angular/core';
import { BrowserUtils } from '@azure/msal-browser';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MsalGuard } from '@azure/msal-angular';
export const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [MsalGuard]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];

export const APP_ROUTER: ModuleWithProviders<any> = RouterModule.forRoot(
  routes,
  {
    // preloadingStrategy: PreloadAllModules,
    useHash: true,
    // enableTracing: true
    // Don't perform initial navigation in iframes or popups
    initialNavigation:
      !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()
        ? 'enabledNonBlocking'
        : 'disabled', // Set to enabledBlocking to use Angular Universal
  })