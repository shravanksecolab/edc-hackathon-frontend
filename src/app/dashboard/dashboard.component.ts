import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
//import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { PestService } from '../services/pest.service';
import { WarningDialogComponent } from '../warning-dialog/warning-dialog.component';
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
    overallRiskScore = 0;
    externalRiskScore = 0;
    internalRiskScore = 0;
    selectedView: 'external' | 'internal' = 'external';

    // Store values to avoid calling methods on every change detection
    externalPests = 0;
    externalVulnerabilities = 0;
    hdiFindings = 0;
    aiRecommendations = 0;
    ecolabRecommendations = 0;
    internalIncidents = 0;
    internalUsers = 0;

    // Sites data
    userSites: any[] = [];
    selectedSiteId: any = null;
    siteDetails: any = null;

    // Risk score cards as a property instead of getter
    riskScoreCards: any[] = [];

    // Method to initialize/update risk score cards
    private updateRiskScoreCards(): void {
        this.riskScoreCards = [
            { icon: 'security', value: this.overallRiskScore, label: 'Your Overall Risk Score', actions: ['a', 'b', 'c'], open: false },
            { icon: 'public', value: this.externalRiskScore, label: 'Your External Risk Score', actions: ['d', 'e', 'f'], open: false },
            { icon: 'business', value: this.internalRiskScore, label: 'Your Internal Risk Score', actions: ['g', 'h', 'i'], open: false }
        ];
    }
    // Arrays for dynamic sorting of stat cards
    get externalStatCards() {
        return [
            { value: this.externalPests, label: 'External pests in my region' },
            { value: this.externalVulnerabilities, label: 'Pest issues found by sites during Ecolab service visits in my region' },
            { value: this.hdiFindings, label: 'HDI findings and Yelp reviews' },
            { value: this.aiRecommendations, label: 'AI recommendations' },
            { value: this.ecolabRecommendations, label: 'Ecolab recommendations' }
        ].sort((a, b) => b.value - a.value); // Sort in descending order
    }

    get internalStatCards() {
        return [
            { value: this.internalIncidents, label: 'Security Incidents' },
            { value: this.internalUsers, label: 'Active Users' }
        ].sort((a, b) => b.value - a.value); // Sort in descending order
    }
    constructor(
        private authService: MsalService,
        private pestService: PestService,
        private msalBroadcastService: MsalBroadcastService,
        private dialog: MatDialog
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
        this.getRiskScores();

        // Initialize stat values
        this.getExternalPests();
        this.getExternalVulnerabilities();
        this.getHdiFindings();
        this.getAiRecommendations();
        this.getEcolabRecommendations();
        this.getInternalIncidents();
        this.getInternalUsers();

        this.getSites();
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

    getSites(): void {
        this.pestService.getUserSitesList().subscribe(
            (response) => {
                this.userSites = response.sites || [];
                // Set first site as default selected if available
                if (this.userSites.length) {
                    this.selectedSiteId = this.userSites[0];
                    this.getSiteDetails(this.selectedSiteId.site_code);
                }
            },
            (error) => {
                console.error('Error fetching user sites:', error);
            }
        );
    }

    /**
     * Handle site selection change
     */
    onSiteChange(site: any): void {
        this.selectedSiteId = site;
        console.log('Selected site:', site);
        this.getSiteDetails(site.site_code);
    }


    getSiteDetails(siteId: number): void {
        this.pestService.getSelectedSiteDetails(siteId).subscribe(
            (response) => {
                console.log('Site details:', response);
                this.siteDetails = response;
            },
            (error) => {
                console.error('Error fetching site details:', error);
            }
        );
    }

    /**
     * Get formatted site details fields for display
     */
    getSiteDetailsFields(): { label: string, value: any }[] {
        if (!this.siteDetails) {
            return [];
        }

        const fields: { label: string, value: any }[] = [];

        // Iterate through all properties of siteDetails
        for (const [key, value] of Object.entries(this.siteDetails)) {
            // Convert camelCase or snake_case to readable format
            const label = key
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/_/g, ' ') // Replace underscores with spaces
                .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                .trim();

            fields.push({ label, value: value || 'N/A' });
        }

        return fields;
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

    /**
     * Get a random risk score between 1-100
     */
    getRiskScores(): void {
        this.externalRiskScore = Math.floor(Math.random() * 100) + 1;
        this.internalRiskScore = Math.floor(Math.random() * 100) + 1;
        this.overallRiskScore = Math.floor(Math.random() * 100) + 1;

        // Initialize the risk score cards after setting the values
        this.updateRiskScoreCards();

        // Check if overall risk score is greater than 70 and show warning
        if (this.overallRiskScore > 70) {
            this.showHighRiskWarning();
        }
    }

    /**
     * Generic method to get risk level class based on any value
     */
    getRiskLevelClass(value: number): string {
        if (value <= 30) return 'Low';
        if (value <= 70) return 'Medium';
        return 'High';
    }

    /**
     * Handle view toggle change
     */
    onViewToggle(event: any): void {
        this.selectedView = event.value;

        // Refresh data based on selected view
        // if (this.selectedView === 'external') {
        //     this.getExternalPests();
        //     this.getExternalVulnerabilities();
        // } else if (this.selectedView === 'internal') {
        //     this.getInternalIncidents();
        //     this.getInternalUsers();
        // }
    }

    /**
     * Update external threats count
     */
    getExternalPests(): void {
        this.externalPests = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Update external threats count
     */
    getHdiFindings(): void {
        this.hdiFindings = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Update external threats count
     */
    getAiRecommendations(): void {
        this.aiRecommendations = Math.floor(Math.random() * 100) + 1;
    }

    getEcolabRecommendations(): void {
        this.ecolabRecommendations = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Update external vulnerabilities count
     */
    getExternalVulnerabilities(): void {
        this.externalVulnerabilities = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Update internal incidents count
     */
    getInternalIncidents(): void {
        this.internalIncidents = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Update internal active users count
     */
    getInternalUsers(): void {
        this.internalUsers = Math.floor(Math.random() * 100) + 1;
    }

    /**
     * Toggle the actions list for a specific card
     */
    toggleCardActions(card: any): void {
        card.open = !card.open;
        console.log('Toggled card:', card.icon, 'Open:', card.open);
    }

    /**
     * Show warning dialog when external risk score is high
     */
    showHighRiskWarning(): void {
        const dialogRef = this.dialog.open(WarningDialogComponent, {
            width: '400px',
            data: {
                title: 'High Risk Alert',
                message: 'Alert: Your facility is currently at elevated pest risk. Engage your Ecolab strategic partner immediately to initiate proactive mitigation and safeguard operations.',
                riskScore: this.overallRiskScore
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'take-action') {
                console.log('User chose to take action for high risk');
                // You can add navigation to risk management page or other actions here
                // this.router.navigate(['/risk-management']);
            }
        });
    }
}