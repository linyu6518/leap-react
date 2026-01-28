import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() sidebarOpened = true;
  @Output() toggle = new EventEmitter<void>();

  toggleSidebar(): void {
    this.toggle.emit();
  }
}
