import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {
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

    // External risk factors from API
    externalRiskFactors: { riskCategory: string, score: number }[] = [];
    internalRiskFactors: { riskCategory: string, score: number }[] = [];

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

    // Site search functionality
    siteSearchTerm: string = '';
    filteredSites: any[] = [];

    // Peer Summary data
    peerSummaryData: any = null;
    isLoadingPeerSummary = false;
    isLoadingHdiFindings = false;
    isLoadingYelpReviews = false;

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
    hdiNewsData: any;
    yelpReviewsData: any;
    monthOnMonthData: any[] = [];
    isLoadingMonthOnMonth = false;
    isLoadingHdiNews = false;
    // Loading states for cards
    isLoadingRiskBreakdown = false;
    isLoadingContributingFactors = false;
    // Chart data properties
    chartLabels: string[] = [];
    chartDatasets: any[] = [];
    maxChartValue = 0;

    // Chart filter properties
    selectedTimeFilter = '3'; // Default to last 3 months
    timeFilterOptions = [
        { value: '3', label: '3M' },
        { value: '6', label: '6M' },
        { value: '12', label: '1Y' },
        { value: '24', label: '2Y' }
    ];
    externalRiskContributingFactors: any[] = [];
    internalRiskContributingFactors: any[] = [];
    selectedContributingFactorsView: 'external' | 'internal' = 'external';
    chatbotHistory: any[] = [];

    // Arrays for dynamic sorting of stat cards with expandable content
    private updateExternalStatCards(): void {
        this.externalStatCards = [
            {
                id: 1,
                value: this.externalPests,
                label: 'External pests in my region',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: '',
                isLoadingContent: false,
                hasToggle: false,
                hasNews: false
            },
            {
                id: 2,
                value: this.externalVulnerabilities,
                label: 'Pest issues found in sites during Ecolab service visits in my region',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: '',
                isLoadingContent: false,
                hasToggle: true,
                hasNews: false
            },
            {
                id: 3,
                value: this.hdiFindings,
                label: 'HDI findings',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: '',
                isLoadingContent: false,
                hasToggle: false,
                hasNews: true,
                news: ''
            },
            {
                id: 4,
                value: this.yelpReviews,
                label: 'Yelp reviews',
                expanded: false,
                locked: false,
                selectedDays: '7',
                content: '',
                isLoadingContent: false,
                hasToggle: false,
                hasNews: false
            },
            {
                id: 6,
                value: this.aiRecommendations,
                label: 'AI recommendations',
                expanded: false,
                locked: true,
                content: '',
                isLoadingContent: false,
                hasToggle: false,
                hasNews: false
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
                id: 7,
                value: this.ecolabRecommendations,
                label: 'Ecolab recommendations',
                expanded: false,
                locked: true,
                isLoadingContent: false,
                hasToggle: false,
                content: {},
                hasNews: false
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
        //this.getRiskScores();
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
                    this.filteredSites = [...this.userSites]; // Initialize filtered sites
                    // Set first site as default selected if available
                    this.selectedSiteId = this.userSites[0];
                    // Set loading states for initial data load
                    this.isLoadingRiskBreakdown = true;
                    this.isLoadingContributingFactors = true;
                    this.getSiteDetails(this.selectedSiteId.site_code);
                    this.getRiskScores(this.selectedSiteId.site_code);
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
        this.isLoadingRiskBreakdown = true;
        this.isLoadingContributingFactors = true;
        this.internalRiskFactors = [];
        this.externalRiskFactors = [];
        this.contributingFactors = [];
        //console.log('Selected site:', site);
        this.getSiteDetails(site.site_code);
        this.getRiskScores(site.site_code);
    }

    /**
     * Filter sites based on search term
     */
    filterSites(): void {
        if (!this.siteSearchTerm || this.siteSearchTerm.trim() === '') {
            this.filteredSites = [...this.userSites];
        } else {
            const searchTerm = this.siteSearchTerm.toLowerCase().trim();
            this.filteredSites = this.userSites.filter(site =>
                site.site_name.toLowerCase().includes(searchTerm) ||
                site.site_code.toString().includes(searchTerm)
            );
        }
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
                this.loadExternalInsights(siteId, response.division);
            },
            (error) => {
                console.error('Error fetching site details:', error);
            }
        );
    }

    /**
     * Get HDI findings data for the selected site
     */
    getHdiFindingsSummary(siteId: number, callback?: () => void): void {
        this.isLoadingHdiFindings = true;
        this.pestService.getHdiFindingsSummary(siteId).subscribe(
            (response) => {
                if (response.length) {
                    //console.log('HDI findings:', response);
                    this.hdiFindingsData = response[0].ai_summary_recommendation;
                } else {
                    this.hdiFindingsData = '';
                }
                this.isLoadingHdiFindings = false;
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching HDI findings:', error.detail);
                this.isLoadingHdiFindings = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.hdiFindingsData = {} : this.hdiFindingsData = { error: error.detail };
                if (callback) callback();
            }
        );
    }

    /**
     * Get HDI news data for the selected site
     */
    getHdiNewsData(siteId: number, callback?: () => void): void {
        this.isLoadingHdiNews = true;
        this.pestService.getHdiNewsData(siteId).subscribe(
            (response) => {
                if (response.length) {
                    //console.log('HDI news:', response);
                    this.hdiNewsData = response[0].hdi_news;
                } else {
                    this.hdiNewsData = '';
                }
                this.isLoadingHdiNews = false;
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching HDI news:', error.detail);
                this.isLoadingHdiNews = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.hdiNewsData = {} : this.hdiNewsData = { error: error.detail };
                if (callback) callback();
            }
        );
    }

    /**
     * Get Yelp reviews data for the selected site
     */
    getYelpReviewsSummary(siteId: number, callback?: () => void): void {
        this.isLoadingYelpReviews = true;
        this.pestService.getYelpReviewsSummary(siteId).subscribe(
            (response) => {
                if (response.length) {
                    //console.log('Yelp reviews:', response);
                    this.yelpReviewsData = response[0].ai_summary_recommendation;
                } else {
                    this.yelpReviewsData = '';
                }
                this.isLoadingYelpReviews = false;
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching Yelp reviews:', error.detail);
                this.isLoadingYelpReviews = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.yelpReviewsData = {} : this.yelpReviewsData = { error: error.detail };
                if (callback) callback();
            }
        );
    }

    /**
     * Get peer summary data for the selected site
     */
    getPeerSummary(siteId: number, division: string, duration: string, callback?: () => void): void {
        this.isLoadingPeerSummary = true;
        this.pestService.getPeerSummary(siteId, division, duration).subscribe(
            (response) => {
                //console.log('Peer summary:', response);
                this.peerSummaryData = response.summary;
                this.isLoadingPeerSummary = false;
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching peer summary:', error.detail);
                this.isLoadingPeerSummary = false;
                // Set default data in case of error
                error.detail === 'Not Found' ? this.peerSummaryData = {} : this.peerSummaryData = { error: error.detail };
                if (callback) callback();
            }
        );
    }

    getMonthOnMonthData(siteId: number, callback?: () => void): void {
        this.isLoadingMonthOnMonth = true;
        this.pestService.getMonthOnMonthData(siteId).subscribe(
            (response) => {
                console.log('Month on Month data:', response);
                this.monthOnMonthData = Array.isArray(response) ? response : [];
                // Reset to default filter and prepare chart data
                this.selectedTimeFilter = '12';
                this.prepareChartData();
                this.isLoadingMonthOnMonth = false;
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching Month on Month data:', error.detail);
                this.monthOnMonthData = [];
                this.isLoadingMonthOnMonth = false;
                if (callback) callback();
            }
        );
    }

    /**
     * Load all external insights data and update cards once all requests complete
     */
    loadExternalInsights(siteId: number, division: string): void {
        let completedRequests = 0;
        const totalRequests = 6;

        const checkAllComplete = () => {
            completedRequests++;
            if (completedRequests === totalRequests) {
                this.updateExternalInsights();
            }
        };

        // Start all three requests
        this.getPeerSummary(siteId, division, 'weekly', checkAllComplete);
        this.getYelpReviewsSummary(siteId, checkAllComplete);
        this.getHdiFindingsSummary(siteId, checkAllComplete);
        this.getHdiNewsData(siteId, checkAllComplete);
        this.getMonthOnMonthData(siteId, checkAllComplete);
        this.getServiceData(siteId, checkAllComplete);
    }

    updateExternalInsights() {
        this.externalStatCards.forEach(stat => {
            if (stat.label.includes('Pest issues')) {
                stat.content = this.peerSummaryData ? this.peerSummaryData : 'No Data Found';
            } else if (stat.label.includes('HDI findings')) {
                stat.content = this.hdiFindingsData || this.hdiFindingsData.length ? this.hdiFindingsData : 'No Data Found';
                stat.news = this.hdiNewsData || this.hdiNewsData.length ? this.hdiNewsData : 'No Data Found';
            } else if (stat.label.includes('Yelp reviews')) {
                stat.content = this.yelpReviewsData || this.yelpReviewsData.length ? this.yelpReviewsData : 'No Data Found';
            }
        });
        console.log(this.externalStatCards)
    }

    /**
     * Prepare chart data from month-on-month response
     */
    prepareChartData(): void {
        if (!this.monthOnMonthData || this.monthOnMonthData.length === 0) {
            return;
        }

        // Filter data based on selected time period
        const filteredData = this.filterDataByTimeRange(this.monthOnMonthData, this.selectedTimeFilter);

        // Extract unique months for x-axis labels and sort in descending order
        const uniqueMonths = filteredData.map(item => item.VisitMonth).filter((value, index, self) => self.indexOf(value) === index);
        this.chartLabels = uniqueMonths.sort((a, b) => {
            // Convert month strings to Date objects for proper sorting
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });

        // Define the count fields we want to display
        const countFields = ['PestCount', 'PrepCount', 'SanitationCount', 'StructuralCount'];
        const colors = ['#E53E3E', '#D69E2E', '#38A169', '#9C27B0'];

        // Create datasets for each count field
        this.chartDatasets = countFields.map((field, index) => {
            const data = this.chartLabels.map(month => {
                const monthData = filteredData.find(item => item.VisitMonth === month);
                return monthData ? (monthData[field] || 0) : 0;
            });

            return {
                label: this.formatFieldName(field),
                data: data,
                backgroundColor: colors[index],
                borderColor: colors[index],
                borderWidth: 2,
                tension: 0.1,
                visible: true // Default to visible
            };
        });

        // Calculate max value for chart scaling using visible datasets
        this.updateChartMaxValue();

        // Check for overflow after data is prepared
        setTimeout(() => {
            this.checkChartOverflow();
        }, 200);
    }

    /**
     * Format field names for display
     */
    formatFieldName(fieldName: string): string {
        return fieldName
            .replace(/_Count/g, '')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Filter data based on selected time range
     */
    filterDataByTimeRange(data: any[], monthsBack: string): any[] {
        const months = parseInt(monthsBack);
        const currentDate = new Date();
        const cutoffDate = new Date();
        cutoffDate.setMonth(currentDate.getMonth() - months);

        return data.filter((item: any) => {
            const itemDate = new Date(item.VisitMonth);
            return itemDate >= cutoffDate;
        });
    }

    /**
     * Handle time filter change
     */
    onTimeFilterChange(filterValue: string): void {
        this.selectedTimeFilter = filterValue;
        this.prepareChartData();
    }

    /**
     * Toggle dataset visibility in chart
     */
    toggleDatasetVisibility(dataset: any): void {
        dataset.visible = !dataset.visible;
        // Recalculate max value considering only visible datasets
        this.updateChartMaxValue();
    }

    /**
     * Update chart max value based on visible datasets
     */
    private updateChartMaxValue(): void {
        const visibleDatasets = this.chartDatasets.filter(dataset => dataset.visible);
        if (visibleDatasets.length > 0) {
            this.maxChartValue = Math.max(
                ...visibleDatasets.flatMap(dataset => dataset.data)
            );
        } else {
            this.maxChartValue = 0;
        }
    }

    /**
     * Get Y-axis tick marks for the chart
     */
    getYAxisTicks(): number[] {
        if (this.maxChartValue === 0) return [0];

        const step = Math.ceil(this.maxChartValue / 5);
        const ticks = [];
        for (let i = this.maxChartValue; i >= 0; i -= step) {
            ticks.push(i);
        }
        return ticks;
    }

    /**
     * Calculate bar height as percentage for CSS
     */
    getBarHeight(value: number): number {
        if (this.maxChartValue === 0) return 0;
        return (value / this.maxChartValue) * 100;
    }

    /**
     * Generate SVG polyline points for line chart
     */
    getLinePoints(data: number[]): string {
        if (!data || data.length === 0) return '';

        return data.map((value, index) => {
            const x = index * 100 + 50; // 100px spacing + 50px offset for centering
            const y = 300 - (this.getBarHeight(value) * 3); // Invert Y and scale to SVG height
            return `${x},${y}`;
        }).join(' ');
    }

    /**
     * Check if chart content overflows and needs scrolling
     */
    ngAfterViewInit(): void {
        // Check for chart overflow after view initialization
        setTimeout(() => {
            this.checkChartOverflow();
        }, 100);
    }

    /**
     * Check if the chart plot area has horizontal overflow
     */
    checkChartOverflow(): void {
        const plotArea = document.querySelector('.chart-plot-area') as HTMLElement;
        const chartContainer = document.querySelector('.chart-container') as HTMLElement;

        if (plotArea && chartContainer) {
            const hasOverflow = plotArea.scrollWidth > plotArea.clientWidth;

            if (hasOverflow) {
                chartContainer.classList.add('has-overflow');
            } else {
                chartContainer.classList.remove('has-overflow');
            }
        }
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
    getRiskScores(siteId: number): void {
        let completedCalls = 0;
        const totalCalls = 3;

        const checkAllCallsComplete = () => {
            completedCalls++;
            if (completedCalls === totalCalls) {
                this.isLoadingRiskBreakdown = false;
                this.isLoadingContributingFactors = false;
            }
        };

        this.pestService.getRiskScores(siteId).subscribe(
            (response) => {
                this.internalRiskScore = response.Internal_Risk_Score;
                this.externalRiskScore = response.External_Risk_Score;
                this.overallRiskScore = response.Overall_Risk_Score;
                if (this.overallRiskScore > 70) {
                    this.showHighRiskWarning();
                }
                checkAllCallsComplete();
            },
            (error) => {
                console.error('Error fetching risk scores:', error);
                checkAllCallsComplete();
            });

        this.pestService.getExternalRiskFactors(siteId).subscribe(
            (response) => {
                console.log('External risk factors response:', response);
                this.processRiskFactors(response, 'external');
                this.processContributingFactors(response, 'external');
                checkAllCallsComplete();
            },
            (error) => {
                console.error('Error fetching external risk factors:', error);
                this.externalRiskFactors = [];
                checkAllCallsComplete();
            }
        );

        this.pestService.getInternalRiskFactors(siteId).subscribe(
            (response) => {
                console.log('Internal risk factors response:', response);
                this.processRiskFactors(response, 'internal');
                this.processContributingFactors(response, 'internal');
                checkAllCallsComplete();
            },
            (error) => {
                console.error('Error fetching internal risk factors:', error);
                this.internalRiskFactors = [];
                checkAllCallsComplete();
            }
        );
    }

    processContributingFactors(response: any, type: 'internal' | 'external'): void {
        if (type === 'external') {
            this.externalRiskContributingFactors = [];
        } else {
            this.internalRiskContributingFactors = [];
        }

        if (!response || typeof response !== 'object') {
            console.warn('Invalid response format for external risk factors');
            return;
        }

        // Extract risk categories and scores from the response
        // Assuming response has properties like risk_category_1, risk_category_2, etc. and score_1, score_2, etc.
        const categories: string[] = [];
        const scores: number[] = [];
        const color = '#3182CE';
        // Find all risk category and score properties
        Object.keys(response).forEach(key => {
            if (key.startsWith('reason_')) {
                const index = parseInt(key.replace('reason_', ''));
                categories[index - 1] = response[key];
            } else if (key.startsWith('percent_')) {
                const index = parseInt(key.replace('percent_', ''));
                scores[index - 1] = response[key];
            }
        });

        if (type === 'external') {
            // Create structured objects
            for (let i = 0; i < Math.max(categories.length, scores.length); i++) {
                if (categories[i] && scores[i] !== undefined) {
                    this.externalRiskContributingFactors.push({
                        reason: categories[i],
                        percent: scores[i],
                        color: color
                    });
                }
            }
        } else {
            // Create structured objects
            for (let i = 0; i < Math.max(categories.length, scores.length); i++) {
                if (categories[i] && scores[i] !== undefined) {
                    this.internalRiskContributingFactors.push({
                        reason: categories[i],
                        percent: scores[i],
                        color: color
                    });
                }
            }
        }

        console.log('Processed external risk contributing factors:', this.externalRiskContributingFactors);
        console.log('Processed internal risk contributing factors:', this.internalRiskContributingFactors);

        // Update the displayed contributing factors
        this.updateDisplayedContributingFactors();
    }

    /**
     * Process external risk factors response and create structured object
     */
    private processRiskFactors(response: any, type: 'internal' | 'external'): void {
        if (type === 'external') {
            this.externalRiskFactors = [];
        } else {
            this.internalRiskFactors = [];
        }

        if (!response || typeof response !== 'object') {
            console.warn('Invalid response format for external risk factors');
            return;
        }

        // Extract risk categories and scores from the response
        // Assuming response has properties like risk_category_1, risk_category_2, etc. and score_1, score_2, etc.
        const categories: string[] = [];
        const scores: number[] = [];

        // Find all risk category and score properties
        Object.keys(response).forEach(key => {
            if (key.startsWith('risk_category_')) {
                const index = parseInt(key.replace('risk_category_', ''));
                categories[index - 1] = response[key];
            } else if (key.startsWith('score_')) {
                const index = parseInt(key.replace('score_', ''));
                scores[index - 1] = response[key];
            }
        });

        // Create structured objects
        if (type === 'external') {
            for (let i = 0; i < Math.max(categories.length, scores.length); i++) {
                if (categories[i] && scores[i] !== undefined) {
                    this.externalRiskFactors.push({
                        riskCategory: categories[i],
                        score: scores[i]
                    });
                }
            }
        } else {
            for (let i = 0; i < Math.max(categories.length, scores.length); i++) {
                if (categories[i] && scores[i] !== undefined) {
                    this.internalRiskFactors.push({
                        riskCategory: categories[i],
                        score: scores[i]
                    });
                }
            }
        }
        console.log('Processed external risk factors:', this.externalRiskFactors);
        console.log('Processed internal risk factors:', this.internalRiskFactors);
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
     * Handle contributing factors toggle change
     */
    onContributingFactorsToggle(event: any): void {
        this.selectedContributingFactorsView = event.value;
        this.updateDisplayedContributingFactors();
    }

    /**
     * Update displayed contributing factors based on selected toggle
     */
    updateDisplayedContributingFactors(): void {
        if (this.selectedContributingFactorsView === 'external') {
            this.contributingFactors = this.externalRiskContributingFactors || [];
        } else {
            this.contributingFactors = this.internalRiskContributingFactors || [];
        }

        // If no data available, show default message
        if (this.contributingFactors.length === 0) {
            this.contributingFactors = [{
                name: `No ${this.selectedContributingFactorsView} contributing factors found`,
                percentage: 0,
                color: '#666',
                icon: 'info',
                subtext: `No ${this.selectedContributingFactorsView} contributing factors data available for this site`
            }];
        }
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

    getServiceData(siteId: number, callback?: () => void) {
        this.pestService.getServiceData(siteId).subscribe(
            (response) => {
                console.log('Service data:', response);
                if (callback) callback();
            },
            (error) => {
                console.error('Error fetching service data:', error);
                if (callback) callback();
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

        // Add typing indicator immediately
        this.chatMessages.push({
            text: '...',
            isUser: false,
            timestamp: new Date(),
            isTyping: true
        });
        this.scrollChatToBottom();

        // Generate bot response
        this.generateBotResponse(userMessage);
    }

    /**
     * Generate bot response based on user message
     */
    private generateBotResponse(userMessage: string): void {
        //const message = userMessage.toLowerCase();

        // if (message.includes('risk') || message.includes('score')) {
        //     // Handle risk-related questions immediately
        //     setTimeout(() => {
        //         this.replaceBotTypingMessage(`Your current overall risk score is ${this.overallRiskScore}. External risk is ${this.externalRiskScore} and internal risk is ${this.internalRiskScore}. Would you like me to explain what factors contribute to these scores?`);
        //     }, 500);
        // } else {
            // Handle general questions with API call
            this.pestService.getChatbotResponse(this.chatbotHistory, userMessage, this.selectedSiteId.site_code).subscribe(
                (response) => {
                    console.log('Chatbot response:', response);
                    // Update chat history for context
                    this.chatbotHistory.push({ role: 'user', content: userMessage });
                    this.chatbotHistory.push({ role: 'assistant', content: response.content });
                    this.replaceBotTypingMessage(response.content || 'I apologize, but I couldn\'t generate a response at this time. Please try again.');
                },
                (error) => {
                    console.error('Error getting chatbot response:', error);
                    this.replaceBotTypingMessage('I apologize, but I\'m experiencing technical difficulties. Please try again later.');
                }
            );
        //}
    }

    /**
     * Replace the typing indicator with the actual bot response
     */
    private replaceBotTypingMessage(responseText: string): void {
        // Find and remove the typing message
        const typingMessageIndex = this.chatMessages.findIndex(msg => msg.isTyping);
        if (typingMessageIndex !== -1) {
            this.chatMessages.splice(typingMessageIndex, 1);
        }

        // Add the actual response
        this.chatMessages.push({
            text: responseText,
            isUser: false,
            timestamp: new Date()
        });

        this.scrollChatToBottom();
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