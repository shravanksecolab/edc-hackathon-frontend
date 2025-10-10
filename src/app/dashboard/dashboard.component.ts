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
    externalStatCards: any[] = [];

    // Chatbot properties
    chatbotOpen: boolean = false;
    currentMessage: string = '';
    chatMessages: any[] = [];

    // Method to initialize/update risk score cards
    private updateRiskScoreCards(): void {
        this.riskScoreCards = [
            { icon: 'security', value: this.overallRiskScore, label: 'Your Overall Risk Score', actions: ['a', 'b', 'c'], open: false },
            { icon: 'public', value: this.externalRiskScore, label: 'Your External Risk Score', actions: ['d', 'e', 'f'], open: false },
            { icon: 'business', value: this.internalRiskScore, label: 'Your Internal Risk Score', actions: ['g', 'h', 'i'], open: false }
        ];
    }
    // Arrays for dynamic sorting of stat cards with expandable content
    private updateExternalStatCards(): void {
        this.externalStatCards = [
            {
                value: this.externalPests,
                label: 'External pests in my region',
                expanded: false,
                locked: false,
                selectedDays: '30',
                content: {
                    description: 'Monitor pest activity and threats detected in your geographical area.',
                    details30: [
                        'Rodent activity: High in urban areas (30-day trend)',
                        'Insect infestations: 15 incidents reported this month',
                        'Weather-related increases: 20% rise due to recent rains',
                        'Neighboring site reports: 3 nearby locations affected'
                    ],
                    details60: [
                        'Rodent activity: Consistent high levels over 60 days',
                        'Insect infestations: 32 incidents total, peak in weeks 3-4',
                        'Weather patterns: 35% seasonal increase observed',
                        'Regional trend: 7 sites reporting similar patterns',
                        'Treatment effectiveness: 85% success rate in treated areas',
                        'Cost impact: $2,400 in additional monitoring expenses'
                    ],
                    recommendations: 'Increase monitoring frequency during peak seasons and coordinate with nearby locations.'
                }
            },
            {
                value: this.externalVulnerabilities,
                label: 'Pest issues found in sites during Ecolab service visits in my region',
                expanded: false,
                locked: false,
                selectedDays: '30',
                content: {
                    description: 'Issues identified during professional service visits across regional locations.',
                    details30: [
                        'Entry points identified: 8 critical vulnerabilities',
                        'Service visits: 12 completed, 3 urgent follow-ups',
                        'Kitchen issues: 5 drain fly incidents resolved',
                        'Compliance status: 2 sites requiring immediate action'
                    ],
                    details60: [
                        'Comprehensive audit: 24 service visits completed',
                        'Critical vulnerabilities: 15 entry points sealed',
                        'Recurring problems: 11 kitchen-related incidents',
                        'Compliance improvements: 8 sites now fully compliant',
                        'Staff training: 45 employees certified',
                        'Cost savings: $3,200 from proactive measures'
                    ],
                    recommendations: 'Schedule additional training and implement enhanced monitoring protocols.'
                }
            },
            {
                value: this.hdiFindings,
                label: 'HDI findings and Yelp reviews',
                expanded: false,
                locked: false,
                selectedDays: '30',
                content: {
                    description: 'Health department inspections and public review analysis.',
                    details30: [
                        'HDI inspections: 3 completed, average score 96/100',
                        'Yelp reviews: 28 new reviews, 4.3/5 star rating',
                        'Customer feedback: 2 cleanliness mentions',
                        'Response rate: 100% to customer concerns'
                    ],
                    details60: [
                        'HDI performance: 6 inspections, 95.5/100 average',
                        'Review analytics: 58 reviews analyzed, 4.2/5 overall',
                        'Sentiment trends: 15% improvement in cleanliness ratings',
                        'Issue resolution: 98% customer concerns addressed',
                        'Proactive communications: 12 updates posted',
                        'Competitive analysis: Above industry average by 8%'
                    ],
                    recommendations: 'Continue transparency efforts and proactive communication about pest control measures.'
                }
            },
            {
                value: this.aiRecommendations,
                label: 'AI recommendations',
                expanded: false,
                locked: true,
                // content: {
                //     description: 'Machine learning insights and predictive recommendations.',
                //     details: [
                //         'Predictive alerts: 85% accuracy in forecasting issues',
                //         'Optimization suggestions: Route efficiency improvements available',
                //         'Seasonal patterns: Spring pest activity predicted to increase 15%',
                //         'Resource allocation: Recommend 2 additional technician hours/week'
                //     ],
                //     recommendations: 'Implement AI-suggested scheduling changes and prepare for seasonal increases.'
                // }
            },
            {
                value: this.ecolabRecommendations,
                label: 'Ecolab recommendations',
                expanded: false,
                locked: true,
                // content: {
                //     description: 'Professional service recommendations from Ecolab experts.',
                //     details: [
                //         'Service frequency: Increase to bi-weekly during peak season',
                //         'Product updates: New eco-friendly solutions available',
                //         'Training opportunities: Staff certification program recommended',
                //         'Technology upgrades: Digital monitoring system expansion'
                //     ],
                //     recommendations: 'Schedule team for advanced certification and evaluate new monitoring technology.'
                // }
            }
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
        this.updateExternalStatCards();

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
     * Get CSS classes for stat values including blur effect for locked cards
     */
    getStatValueClasses(card: any): string {
        const riskClass = this.getRiskLevelClass(card.value).toLowerCase();
        const blurClass = card.locked ? 'blurred-value' : '';
        return `${riskClass} ${blurClass}`.trim();
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
     * Toggle the expanded state of external stat cards
     */
    toggleExternalCard(card: any): void {
        card.expanded = !card.expanded;
        console.log('Toggled external card:', card.label, 'Expanded:', card.expanded);
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

    /**
     * Handle day toggle change for external stat cards
     */
    onDayToggleChange(card: any, event: any): void {
        card.selectedDays = event.value;
        console.log('Day toggle changed for', card.label, 'to', event.value, 'days');
    }

    /**
     * Get details for specific time period
     */
    getDetailsForPeriod(card: any, period: string): string[] {
        if (!card.content) return [];

        if (period === '60') {
            return card.content.details60 || card.content.details || [];
        } else {
            return card.content.details30 || card.content.details || [];
        }
    }

    /**
     * Toggle chatbot visibility
     */
    toggleChatbot(): void {
        this.chatbotOpen = !this.chatbotOpen;

        // Initialize with welcome message if first time opening
        if (this.chatbotOpen && this.chatMessages.length === 0) {
            setTimeout(() => {
                this.initializeChatbot();
            }, 300);
        }
    }

    /**
     * Initialize chatbot with welcome message
     */
    private initializeChatbot(): void {
        this.chatMessages = [
            {
                text: "Hi! I'm your risk management assistant. How can I help you today?",
                isUser: false,
                timestamp: new Date()
            }
        ];
        this.scrollChatToBottom();
    }

    /**
     * Send message in chatbot
     */
    sendMessage(): void {
        if (!this.currentMessage.trim()) return;

        // Add user message
        this.chatMessages.push({
            text: this.currentMessage,
            isUser: true,
            timestamp: new Date()
        });

        const userMessage = this.currentMessage;
        this.currentMessage = '';
        this.scrollChatToBottom();

        // Simulate bot response after a delay
        setTimeout(() => {
            const botResponse = this.generateBotResponse(userMessage);
            this.chatMessages.push({
                text: botResponse,
                isUser: false,
                timestamp: new Date()
            });
            this.scrollChatToBottom();
        }, 1000);
    }

    /**
     * Generate bot response based on user message
     */
    private generateBotResponse(userMessage: string): string {
        const message = userMessage.toLowerCase();

        if (message.includes('risk') || message.includes('score')) {
            return `Your current overall risk score is ${this.overallRiskScore}. External risk is ${this.externalRiskScore} and internal risk is ${this.internalRiskScore}. Would you like me to explain what factors contribute to these scores?`;
        } else if (message.includes('help') || message.includes('assist')) {
            return "I can help you with risk analysis, site management, and explaining your security metrics. What specific area would you like to know more about?";
        } else if (message.includes('site') || message.includes('location')) {
            return `You're currently viewing data for ${this.siteDetails?.site_name || 'your selected site'}. I can help you understand the risk factors and recommendations for this location.`;
        } else if (message.includes('external') || message.includes('threat')) {
            return "External threats include pest vulnerabilities and public security risks. I can provide detailed analysis and actionable recommendations to improve your external security posture.";
        } else if (message.includes('internal') || message.includes('employee')) {
            return "Internal risks involve employee activities and system access. Would you like me to show you recent incidents or provide security awareness recommendations?";
        } else {
            const responses = [
                "That's an interesting question! Can you provide more details about what specific aspect you'd like to know about?",
                "I'm here to help with your risk management needs. Could you be more specific about what you're looking for?",
                "Let me help you with that. Are you interested in risk scores, site analysis, or security recommendations?",
                "I can assist with various risk management topics. What would you like to explore first?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    /**
     * Scroll chat messages to bottom
     */
    private scrollChatToBottom(): void {
        setTimeout(() => {
            const chatContainer = document.querySelector('.chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }
}