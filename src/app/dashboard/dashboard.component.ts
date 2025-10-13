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
    isLoadingUserSites: boolean = true;
    overallRiskScore = 0;
    externalRiskScore = 0;
    internalRiskScore = 0;
    selectedView: 'external' | 'internal' = 'external';

    // External risk breakdown
    externalBreakdown = {
        environmental: 18,
        proximityFactors: 15,
        demographics: 12,
        seasonalPattern: 20
    };

    // Internal risk breakdown
    internalBreakdown = {
        pestActivity: 22,
        siteConditions: 18,
        historicalPattern: 15
    };

    // Store values to avoid calling methods on every change detection
    externalPests = 0;
    externalVulnerabilities = 0;
    hdiFindings = 0;
    yelpReviews = 0;
    aiRecommendations = 0;
    ecolabRecommendations = 0;
    internalIncidents = 0;
    internalUsers = 0;

    // Sites data
    userSites: any[] = [];
    selectedSiteId: any = null;
    siteDetails: any = null;

    // Peer Summary data
    peerSummaryData: any = null;
    isLoadingPeerSummary: boolean = false;
    isLoadingHdiFindings: boolean = false;

    // Risk score cards as a property instead of getter
    riskScoreCards: any[] = [];
    externalStatCards: any[] = [];

    // Chatbot properties
    chatbotOpen: boolean = false;
    currentMessage: string = '';
    chatMessages: any[] = [];

    // Notifications properties
    notifications: any[] = [];

    // Navigation properties
    activeTab: string = 'dashboard';

    // Contributing factors data
    contributingFactors: any[] = [
        { name: 'High Humidity', percentage: 35, color: '#E53E3E', icon: 'water_drop', subtext: 'Moisture levels above 60% creating ideal breeding conditions' },
        { name: 'Spring Season', percentage: 25, color: '#38A169', icon: 'eco', subtext: 'Increased pest activity during the breeding season' },
        { name: 'Nearby Construction', percentage: 20, color: '#D69E2E', icon: 'construction', subtext: 'Displacement of pests from construction zone' },
        { name: 'Proximity to Water Source', percentage: 20, color: '#3182CE', icon: 'waves', subtext: 'Building located near river increases rodent activity' }
    ];
    noSites = true;
    showDaysToggle = true;
    hdiFindingsData: any;

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
                selectedDays: '7',
                content: {},
                isLoadingContent: false
            },
            {
                value: this.externalVulnerabilities,
                label: 'Pest issues found in sites during Ecolab service visits in my region',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: this.peerSummaryData,
                isLoadingContent: false
            },
            {
                value: this.hdiFindings,
                label: 'HDI findings',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: {},
                isLoadingContent: false
            },
            {
                value: this.yelpReviews,
                label: 'Yelp reviews',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: {},
                isLoadingContent: false
            },
            {
                value: this.aiRecommendations,
                label: 'AI recommendations',
                expanded: false,
                locked: true,
                isLoadingContent: false
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
                isLoadingContent: false
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
        this.getYelpReviews();
        this.getAiRecommendations();
        this.getEcolabRecommendations();
        this.getInternalIncidents();
        this.getInternalUsers();
        this.updateExternalStatCards();

        this.getSites();
        this.initializeNotifications();
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
            const currentUser = activeAccount.name || activeAccount.username || 'User';
            this.currentUserMailId = activeAccount.username || '';
            this.currentUser = this.formatName(currentUser);
        }
    }

    /**
     * Converts name from 'lastname, firstname' format to 'firstname lastname' format
     */
    formatName(name: string): string {
        if (!name || !name.includes(',')) {
            return name; // Return as-is if no comma found
        }

        const parts = name.split(',').map(part => part.trim());
        if (parts.length !== 2) {
            return name; // Return original if format is unexpected
        }

        const [lastname, firstname] = parts;
        return `${firstname} ${lastname}`;
    }

    /**
     * Gets the user initials from the current user name
     */
    getUserInitials(): string {
        if (!this.currentUser) {
            return 'U';
        }

        // Format the name first (handles 'lastname, firstname' format)
        const formattedName = this.formatName(this.currentUser);
        const names = formattedName.trim().split(' ');

        if (names.length === 1) {
            // Single name, return first letter
            return names[0].charAt(0).toUpperCase();
        } else if (names.length >= 2) {
            // Multiple names, return first letter of first and last name
            const firstName = names[0].charAt(0).toUpperCase();
            const lastName = names[names.length - 1].charAt(0).toUpperCase();
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
                if (response.sites.length) {
                    this.userSites = response.sites || [];
                    // Set first site as default selected if available
                    this.selectedSiteId = this.userSites[0];
                    this.getSiteDetails(this.selectedSiteId.site_code);
                    // Set loading to false once sites are loaded
                    this.isLoadingUserSites = false;
                    this.noSites = false;
                }
            },
            (error) => {
                console.error('Error fetching user sites:', error);
                // Set loading to false even on error
                this.noSites = true;
                this.isLoadingUserSites = false;
            }
        );
    }

    /**
     * Handle site selection change
     */
    onSiteChange(site: any): void {
        this.selectedSiteId = site;
        //console.log('Selected site:', site);
        this.getSiteDetails(site.site_code);
    }


    getSiteDetails(siteId: number): void {
        this.pestService.getSelectedSiteDetails(siteId).subscribe(
            (response) => {
                //console.log('Site details:', response);
                this.siteDetails = {
                    account_number: response.account_number,
                    addressLine: response.address_line_1,
                    cityName: response.city,
                    state_province: response.state_province,
                    division: response.division
                };
                this.showDaysToggle = response.division.toLowerCase() === 'pest' ? true : false;
                // Fetch peer summary data when site details are loaded
                this.getPeerSummary(siteId, response.division, 'weekly');
                this.getYelpReviews();
                this.getHdiFindingsSummary(siteId, response.division, 'weekly');
            },
            (error) => {
                console.error('Error fetching site details:', error);
            }
        );
    }

    /**
     * Get HDI findings data for the selected site
     */
    getHdiFindingsSummary(siteId: number, division: string, duration: string): void {
        this.isLoadingHdiFindings = true;
        this.pestService.getHdiFindings(siteId, division, duration).subscribe(
            (response) => {
                //console.log('HDI findings:', response);
                this.hdiFindingsData = response.summary;
                this.externalStatCards.forEach(stat => {
                    if (stat.label.includes('Pest issues')) {
                        stat.content = this.hdiFindingsData;
                    } else {
                        stat.content = 'No Data Found';
                    }
                });
                this.isLoadingHdiFindings = false;
            },
            (error) => {
                console.error('Error fetching HDI findings:', error.detail);
                this.isLoadingHdiFindings = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.hdiFindingsData = {} : this.hdiFindingsData = { error: error.detail };
            }
        );
    }

    /**
     * Get peer summary data for the selected site
     */
    getPeerSummary(siteId: number, division: string, duration: string): void {
        this.isLoadingPeerSummary = true;
        this.pestService.getPeerSummary(siteId, division, duration).subscribe(
            (response) => {
                //console.log('Peer summary:', response);
                this.peerSummaryData = response.summary;
                this.externalStatCards.forEach(stat => {
                    if (stat.label.includes('Pest issues')) {
                        stat.content = this.peerSummaryData;
                    } else {
                        stat.content = 'No Data Found';
                    }
                });
                this.isLoadingPeerSummary = false;
            },
            (error) => {
                console.error('Error fetching peer summary:', error.detail);
                this.isLoadingPeerSummary = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.peerSummaryData = {} : this.peerSummaryData = { error: error.detail };
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
        // Calculate external risk score from breakdown components
        this.externalRiskScore = this.externalBreakdown.environmental +
            this.externalBreakdown.proximityFactors +
            this.externalBreakdown.demographics +
            this.externalBreakdown.seasonalPattern;

        // Calculate internal risk score from breakdown components
        this.internalRiskScore = this.internalBreakdown.pestActivity +
            this.internalBreakdown.siteConditions +
            this.internalBreakdown.historicalPattern;

        // Calculate overall risk score (average of external and internal)
        this.overallRiskScore = Math.round((this.externalRiskScore + this.internalRiskScore) / 2);

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
        if (value <= 30) return 'Manageable';
        if (value <= 70) return 'Vulnerable';
        return 'Breach';
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
     * Handle top navigation tab selection
     */
    setActiveTab(tab: string): void {
        this.activeTab = tab;
        // Here you can add logic to handle different tab selections
        // For example, routing to different views or loading different data
        console.log(`Active tab changed to: ${tab}`);
    }

    /**
     * Get progress bar CSS class based on risk score
     */
    getProgressBarClass(score: number): string {
        if (score >= 70) return 'progress-high';
        if (score >= 30) return 'progress-medium';
        return 'progress-low';
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
    getYelpReviews(): void {
        this.yelpReviews = Math.floor(Math.random() * 100) + 1;
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
        //console.log('Toggled card:', card.icon, 'Open:', card.open);
    }

    /**
     * Toggle the expanded state of external stat cards
     */
    toggleExternalCard(card: any): void {
        card.expanded = !card.expanded;
        //console.log('Toggled external card:', card.label, 'Expanded:', card.expanded);
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
                //console.log('User chose to take action for high risk');
                // You can add navigation to risk management page or other actions here
                // this.router.navigate(['/risk-management']);
            }
        });
    }

    /**
     * Handle day toggle change for external stat cards
     */
    onDayToggleChange(card: any, event: any): void {
        // Set loading state for the specific card
        card.isLoadingContent = true;
        card.selectedDays = event.value;

        const duration = event.value === '7' ? 'weekly' : 'monthly';

        // Get updated peer summary data
        this.getPeerSummaryForCard(card, duration);

        //console.log('Day toggle changed for', card.label, 'to', event.value, 'days');
    }

    /**
     * Get peer summary for a specific card
     */
    getPeerSummaryForCard(card: any, duration: string): void {
        this.pestService.getPeerSummary(this.selectedSiteId.site_code, this.siteDetails.division, duration).subscribe(
            (response) => {
                // Update the specific card content based on its type
                if (card.label.includes('Pest issues')) {
                    card.content = response.summary;
                } else {
                    card.content = 'No specific data available for this period';
                }
                card.isLoadingContent = false;
            },
            (error) => {
                console.error('Error fetching data for card:', error.detail);
                card.content = error.detail === 'Not Found' ? 'No data found for this period' : `Error: ${error.detail}`;
                card.isLoadingContent = false;
            }
        );
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

    /**
     * Initialize notifications with sample data
     */
    private initializeNotifications(): void {
        this.notifications = [
            {
                id: 1,
                type: 'risk',
                title: 'High Risk Alert',
                message: 'External risk score has increased to 85 for Site A',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                read: false
            },
            {
                id: 2,
                type: 'security',
                title: 'Security Update',
                message: 'New vulnerability detected in pest control system',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                read: false
            },
            {
                id: 3,
                type: 'info',
                title: 'Site Inspection Due',
                message: 'Scheduled inspection for Site B is due tomorrow',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                read: true
            },
            {
                id: 4,
                type: 'warning',
                title: 'System Maintenance',
                message: 'Planned maintenance scheduled for this weekend',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                read: false
            }
        ];
    }

    /**
     * Get count of unread notifications
     */
    getUnreadNotificationsCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    /**
     * Mark notification as read
     */
    markAsRead(notification: any): void {
        notification.read = true;
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(): void {
        this.notifications = [];
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type: string): string {
        switch (type) {
            case 'risk': return 'warning';
            case 'security': return 'security';
            case 'info': return 'info';
            case 'warning': return 'report_problem';
            default: return 'notifications';
        }
    }

    /**
     * Get notification icon CSS class based on type
     */
    getNotificationIconClass(type: string): string {
        switch (type) {
            case 'risk': return 'risk-icon';
            case 'security': return 'security-icon';
            case 'info': return 'info-icon';
            case 'warning': return 'warning-icon';
            default: return '';
        }
    }

    /**
     * Get CSS class for comparison metrics
     */
    getComparisonClass(comparison: string): string {
        switch (comparison) {
            case 'better': return 'better-performance';
            case 'worse': return 'worse-performance';
            case 'similar': return 'similar-performance';
            default: return '';
        }
    }

    /**
     * Get icon for comparison metrics
     */
    getComparisonIcon(comparison: string): string {
        switch (comparison) {
            case 'better': return 'trending_up';
            case 'worse': return 'trending_down';
            case 'similar': return 'trending_flat';
            default: return 'remove';
        }
    }
}