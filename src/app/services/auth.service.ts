import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isLoggedIn = false;
    private currentUser: string | null = null;

    // Mock login method - replace with actual authentication logic
    // login(email: string, password: string): Observable<boolean> {
    //     // Simulate API call with delay
    //     return of(this.authenticateUser(email, password)).pipe(delay(1500));
    // }

    // private authenticateUser(email: string, password: string): boolean {
    //     // Mock authentication - in real app, call your backend API
    //     const validCredentials = [
    //         { email: 'admin@admin.com', password: 'admin123' },
    //         { email: 'user@user.com', password: 'user456' },
    //         { email: 'test@test.com', password: 'test789' }
    //     ];

    //     const isValid = validCredentials.some(
    //         cred => cred.email === email && cred.password === password
    //     );

    //     if (isValid) {
    //         this.isLoggedIn = true;
    //         this.currentUser = email;
    //         localStorage.setItem('isLoggedIn', 'true');
    //         localStorage.setItem('currentUser', email);
    //     }

    //     return isValid;
    // }

    // logout(): void {
    //     this.isLoggedIn = false;
    //     this.currentUser = null;
    //     localStorage.removeItem('isLoggedIn');
    //     localStorage.removeItem('currentUser');
    // }

    // isAuthenticated(): boolean {
    //     if (typeof localStorage !== 'undefined') {
    //         const stored = localStorage.getItem('isLoggedIn');
    //         this.isLoggedIn = stored === 'true';
    //         this.currentUser = localStorage.getItem('currentUser');
    //     }
    //     return this.isLoggedIn;
    // }

    // getCurrentUser(): string | null {
    //     if (typeof localStorage !== 'undefined') {
    //         return localStorage.getItem('currentUser');
    //     }
    //     return this.currentUser;
    // }
}