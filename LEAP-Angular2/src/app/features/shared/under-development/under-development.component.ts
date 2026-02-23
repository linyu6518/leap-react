import { Component } from '@angular/core'

@Component({
  selector: 'app-under-development',
  standalone: true,
  template: `
    <div class="under-development-container">
      <div class="under-development-content">
        <svg
          class="under-development-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            stroke="currentColor"
            stroke-width="0.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <h2 class="under-development-title">Under Development</h2>
        <p class="under-development-message">
          This feature is currently under development. Please check back later.
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./under-development.component.scss'],
})
export class UnderDevelopmentComponent {}
