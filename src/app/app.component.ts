import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
    <div class="app-container">
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .app-container {
      min-height: 100vh;
    }
    main {
      padding: 0rem;
    }
  `]
})
export class AppComponent {
    
}