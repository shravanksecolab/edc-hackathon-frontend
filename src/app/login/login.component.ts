import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
//import { AuthService } from '../services/auth.service';
// Required for MSAL
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType, InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <header>
      <h1 class="mb-0">{{ title }}</h1>
    </header>
    <div class="center-content" *ngIf="!isCheckingAuth">
      <mat-card class="login-container">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
          <mat-card-subtitle>Please enter your credentials</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width">
              <mat-label>Email</mat-label>
              <input matInput
                     type="email"
                     formControlName="email"
                     placeholder="Enter your email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <!-- <mat-form-field class="full-width">
              <mat-label>Password</mat-label>
              <input matInput
                     [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password"
                     placeholder="Enter your password">
              <button mat-icon-button
                      matSuffix
                      type="button"
                      (click)="hidePassword = !hidePassword"
                      [attr.aria-label]="'Hide password'"
                      [attr.aria-pressed]="hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters long
              </mat-error>
            </mat-form-field> -->

            <div class="login-actions">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="loginForm.invalid || isLoading"
                      class="full-width">
                <span *ngIf="!isLoading">Login</span>
                <span *ngIf="isLoading">Logging in...</span>
              </button>
            </div>
          </form>
          
          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <!-- Loading state while checking authentication -->
    <div class="center-content" *ngIf="isCheckingAuth">
      <mat-card class="login-container">
        <mat-card-content class="loading-content">
          <div class="loading-spinner">
            <mat-icon>hourglass_empty</mat-icon>
          </div>
          <p>Checking authentication...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .center-content {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .login-container {
      max-width: 400px;
      width: 100%;
      margin: 1rem;
    }
    header {
      background-color: #006BD3;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }
    
    .login-actions {
      margin-top: 1.5rem;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 1rem;
      text-align: center;
      font-size: 14px;
    }
    
    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    mat-card-title,
    mat-card-subtitle {
      text-align: center;
      margin: 0 auto;
    }
    
    .loading-content {
      text-align: center;
      padding: 2rem;
    }
    
    .loading-spinner {
      margin-bottom: 1rem;
    }
    
    .loading-spinner mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      animation: spin 2s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  title = 'Pesterminators';
  private fb = inject(FormBuilder);
  private router = inject(Router);
  //private authService = inject(AuthService);
  loginDisplay = false;
  tokenExpiration: string = '';
  private readonly _destroying$ = new Subject<void>();
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  isCheckingAuth = true; // Add loading state for auth check

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      //password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Don't check accounts immediately - wait for MSAL to initialize
  }

  // onSubmit(): void {
  //     if (this.loginForm.valid) {
  //         this.isLoading = true;
  //         this.errorMessage = '';

  //         const { email, password } = this.loginForm.value;

  //         this.authService.login(email, password).subscribe({
  //             next: (success) => {
  //                 this.isLoading = false;
  //                 if (success) {
  //                     this.router.navigate(['/dashboard']);
  //                 } else {
  //                     this.errorMessage = 'Invalid email or password';
  //                 }
  //             },
  //             error: (error) => {
  //                 this.isLoading = false;
  //                 this.errorMessage = 'Login failed. Please try again.';
  //                 console.error('Login error:', error);
  //             }
  //         });
  //     }
  // }

  ngOnInit(): void {
    // Wait for MSAL to be initialized before doing any operations
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        // MSAL is now initialized and ready
        this.checkExistingAuthentication();
      });

    // Listen for successful login events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        const payload = result.payload as AuthenticationResult;
        this.authService.instance.setActiveAccount(payload.account);
        // Redirect to dashboard after successful login
        this.router.navigate(['/dashboard']);
      });

    // Handle token acquisition success
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe(msg => {
        this.tokenExpiration = (msg.payload as any).expiresOn;
        localStorage.setItem('tokenExpiration', this.tokenExpiration);
      });
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }

  checkExistingAuthentication() {
    this.setLoginDisplay();
    this.isCheckingAuth = false; // Stop loading indicator

    // Check if user is already logged in and redirect immediately
    if (this.loginDisplay) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Modified onSubmit to use the root redirect URI
  onSubmit() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({
        ...this.msalGuardConfig.authRequest,
        redirectUri: 'https://brave-desert-06ee8da0f.2.azurestaticapps.net'  // Use the registered redirect URI
      } as RedirectRequest);
    } else {
      this.authService.loginRedirect({
        scopes: ['user.read'],
        redirectUri: 'https://brave-desert-06ee8da0f.2.azurestaticapps.net'   // Use the registered redirect URI
      });
    }
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}