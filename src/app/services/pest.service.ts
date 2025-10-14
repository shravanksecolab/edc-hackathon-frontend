import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PestService {
    private baseUrl = 'https://edc-pesterminator-backend-fyafbfgpa4hdekgx.eastus2-01.azurewebsites.net';

    constructor(private http: HttpClient) { }

    /**
     * Get user sites from the API
     * @returns Observable with the API response
     */
    getUserSitesList(): Observable<any> {
        return this.http.get(`${this.baseUrl}/sites?id=default`);
    }

    getSelectedSiteDetails(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/sites/${siteId}`);
    }

    getRiskScores(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/risk/site?site_id=${siteId}`);
    }

    getExternalRiskFactors(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/risk/external-ai-risk-categories?site_key=${siteId}`);
    }

    getInternalRiskFactors(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/risk/internal-ai-risk-categories?site_key=${siteId}`);
    }

    /**
     * Get peer summary data for a specific site
     * @param siteId - The site ID to get peer comparison for
     * @returns Observable with peer summary data
     */
    getPeerSummary(siteId: number, division: string, duration: string): Observable<any> {
        const requestBody = {
            site_key: siteId,
            summary_type: duration,
            division: division
        };
        return this.http.post(`${this.baseUrl}/summary/peer-summary`, requestBody);
    }

    /**
     * Get HDI Findings data for a specific site
     * @param siteId - The site ID to get HDI findings for
     * @returns Observable with HDI findings data
     */
    getHdiFindingsSummary(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/summary/hdi-ai-summary?site_key=${siteId}`);
    }

    /**
     * Get Yelp Reviews data for a specific site
     * @param siteId - The site ID to get Yelp reviews for
     * @returns Observable with Yelp reviews data
     */
    getYelpReviewsSummary(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/summary/yelp-summary?site_key=${siteId}`);
    }

    /**
     * Get MOM data for a specific site
     * @param siteId - The site ID to get MOM data for
     * @returns Observable with MOM data
     */
    getMonthOnMonthData(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/mom-service/?site_key=${siteId}`);
    }

    /**
     * Get HDI News for a specific site
     * @param siteId - The site ID to get HDI News for
     * @returns Observable with HDI News data
     */
    getHdiNewsData(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/summary/external-hdi-news?site_key=${siteId}`);
    }

    getChatbotResponse(history: any, question: string, siteId: number): Observable<any> {
        let requestBody = {
            history: history,
            question: question,
            site_key: siteId
        };
        return this.http.post(`${this.baseUrl}/ai/process`, requestBody);
    }

    getServiceData(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/service-data/internal?site_key=${siteId}`);
    }
}