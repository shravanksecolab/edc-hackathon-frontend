// Required for Angular multi-browser support
import { BrowserModule } from '@angular/platform-browser';

// Required for Angular
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Required for routing
import { RouterModule } from '@angular/router';

// Required modules and components for this application
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';

// Angular Material modules
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Forms module for ngModel
import { FormsModule } from '@angular/forms';

// HTTP modules required by MSAL
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// Required for MSAL
import { MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalBroadcastService, MsalGuard, MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalRedirectComponent, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            // 'Application (client) ID' of app registration in the Microsoft Entra admin center - this value is a GUID
            clientId: "99048e17-d7cd-475f-a561-2b348e70da91",
            // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>
            authority: "https://login.microsoftonline.com/c1eb5112-7946-4c9d-bc57-40040cfe3a91",
            // Must be the same redirectUri as what was provided in your app registration.
            redirectUri: "https://brave-desert-06ee8da0f.2.azurestaticapps.net",
        },
        cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: isIE
        }
    });
}

// MSAL Interceptor is required to request access tokens in order to access the protected resource (Graph)
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, Array<string>>();
    protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap
    };
}

// MSAL Guard is required to protect routes and require authentication before accessing protected routes
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: ['user.read']
        }
    };
}

// Create an NgModule that contains the routes and MSAL configurations
@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        WarningDialogComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        RouterModule.forRoot(routes),
        HttpClientModule,
        MsalModule.forRoot(
            new PublicClientApplication({
                auth: {
                    clientId: "99048e17-d7cd-475f-a561-2b348e70da91",
                    authority: "https://login.microsoftonline.com/c1eb5112-7946-4c9d-bc57-40040cfe3a91",
                    redirectUri: "https://brave-desert-06ee8da0f.2.azurestaticapps.net",
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: isIE
                }
            }),
            {
                interactionType: InteractionType.Redirect,
                authRequest: {
                    scopes: ['user.read']
                }
            },
            {
                interactionType: InteractionType.Redirect,
                protectedResourceMap: new Map([
                    ['https://graph.microsoft.com/v1.0/me', ['user.read']]
                ])
            }
        ),
        MatBadgeModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatToolbarModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSelectModule,
        MatTooltipModule,
        MatOptionModule,
        MatDividerModule,
        FormsModule
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MSALGuardConfigFactory
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MSALInterceptorConfigFactory
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }