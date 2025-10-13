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
        return this.http.get(`${this.baseUrl}/sites/?id=default`);
    }

    getSelectedSiteDetails(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/sites/${siteId}?delimiter=%2C&encoding=utf-8`);
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
     * Get peer summary data for a specific site
     * @param siteId - The site ID to get peer comparison for
     * @returns Observable with peer summary data
     */
    getHdiFindings(siteId: number, division: string, duration: string): Observable<any> {
        const requestBody = {
            site_key: siteId,
            summary_type: duration,
            division: division
        };
        return this.http.post(`${this.baseUrl}/summary/peer-summary`, requestBody);
    }
}