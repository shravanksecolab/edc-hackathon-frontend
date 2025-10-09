import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
//import { AuthService } from '../services/auth.service';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private router = inject(Router);
    //private authService = inject(AuthService);

    currentUser: string | null = null;
    currentUserMailId: string | null = null;
    isLoggingOut: boolean = false;
    constructor(
        private authService: MsalService,
        private msalBroadcastService: MsalBroadcastService
    ) { }

    ngOnInit(): void {
        // if (!this.authService.isAuthenticated()) {
        //     this.router.navigate(['/login']);
        //     return;
        // }

        // Set active account immediately if available
        this.setActiveAccount();

        // Set current user display name
        this.setCurrentUser();

        // this.currentUser = this.authService.getCurrentUser();
        this.msalBroadcastService.msalSubject$
            .pipe(
                filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
            )
            .subscribe((result: EventMessage) => {
                const payload = result.payload as AuthenticationResult;
                this.authService.instance.setActiveAccount(payload.account);
            });
    }

    // logout(): void {
    //     this.authService.logout();
    //     this.router.navigate(['/login']);
    // }


    /**
     * Sets the current user display name
     */
    private setCurrentUser(): void {
        const activeAccount = this.authService.instance.getActiveAccount();
        if (activeAccount) {
            this.currentUser = activeAccount.name || activeAccount.username || 'User';
            this.currentUserMailId = activeAccount.username || '';
        }
    }

    /**
     * Gets the user initials from the current user name
     */
    getUserInitials(): string {
        if (!this.currentUser) {
            return 'U';
        }
        const names = this.currentUser.trim().split(' ');
        if (names.length === 1) {
            // Single name, return first letter
            return names[0].charAt(0).toUpperCase();
        } else if (names.length >= 2) {
            // Multiple names, return first letter of first and last name
            const lastName = names[0].charAt(0).toUpperCase();
            const firstName = names[names.length - 1].charAt(0).toUpperCase();
            return firstName + lastName;
        }

        return 'U'; // Fallback
    }

    /**
     * Sets the active account from available accounts
     */
    private setActiveAccount(): void {
        const accounts = this.authService.instance.getAllAccounts();

        if (accounts.length > 0) {
            // If no active account is set, set the first available account as active
            const activeAccount = this.authService.instance.getActiveAccount();
            if (!activeAccount) {
                this.authService.instance.setActiveAccount(accounts[0]);
            }
        }
    }

    logout(): void {
        this.isLoggingOut = true;

        // Get the active account to avoid account selection prompt
        const activeAccount = this.authService.instance.getActiveAccount();

        if (activeAccount) {
            // Logout with specific account - avoids account selection
            this.authService.logoutRedirect({
                account: activeAccount,
                postLogoutRedirectUri: window.location.origin + '/login'
            });
        } else {
            // Fallback: logout all accounts silently
            const allAccounts = this.authService.instance.getAllAccounts();
            if (allAccounts.length) {
                this.authService.logoutRedirect({
                    account: allAccounts[0],
                    postLogoutRedirectUri: window.location.origin + '/login'
                });
            } else {
                // No accounts found, just navigate to login
                this.router.navigate(['/login']);
            }
        }
    }
}