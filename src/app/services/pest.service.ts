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
        return this.http.get(`${this.baseUrl}/sites/?id=default&delimiter=%2C&encoding=utf-8`);
    }

    getSelectedSiteDetails(siteId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/sites/${siteId}?delimiter=%2C&encoding=utf-8`);
    }
}