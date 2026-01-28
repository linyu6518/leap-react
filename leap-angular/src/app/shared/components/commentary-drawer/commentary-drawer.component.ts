import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface Commentary {
  id: number;
  user: string;
  timestamp: Date;
  content: string;
}

@Component({
  selector: 'app-commentary-drawer',
  templateUrl: './commentary-drawer.component.html',
  styleUrls: ['./commentary-drawer.component.scss']
})
export class CommentaryDrawerComponent implements OnInit {
  @Input() isOpen = false;
  @Input() historyComments: Commentary[] = [];
  @Input() productName = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  commentForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.commentForm.valid) {
      this.save.emit(this.commentForm.value.content);
      this.commentForm.reset();
    }
  }

  onCancel(): void {
    this.commentForm.reset();
    this.close.emit();
  }
}
