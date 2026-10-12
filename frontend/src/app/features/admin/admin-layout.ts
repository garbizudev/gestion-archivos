import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, MatIconModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" class="admin-tabs">
      <a
        mat-tab-link
        routerLink="usuarios"
        routerLinkActive
        #users="routerLinkActive"
        [active]="users.isActive"
      >
        <mat-icon>group</mat-icon>
        Usuarios
      </a>
      <a
        mat-tab-link
        routerLink="areas"
        routerLinkActive
        #areas="routerLinkActive"
        [active]="areas.isActive"
      >
        <mat-icon>apartment</mat-icon>
        Áreas
      </a>
    </nav>
    <mat-tab-nav-panel #panel>
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  styles: `
    .admin-tabs {
      margin-bottom: 24px;
      --mat-tab-active-indicator-color: var(--ga-accent);
    }

    mat-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `,
})
export class AdminLayout {}
