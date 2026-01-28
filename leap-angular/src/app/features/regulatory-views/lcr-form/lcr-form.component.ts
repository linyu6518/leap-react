import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lcr-form',
  templateUrl: './lcr-form.component.html',
  styleUrls: ['./lcr-form.component.scss']
})
export class LcrFormComponent implements OnInit {
  lcrForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.lcrForm = this.fb.group({
      enterprise: ['', Validators.required],
      segment: ['', Validators.required],
      prior: ['', Validators.required],
      current: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // 设置默认值
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 0); // 上个月的最后一天
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 0); // 当前月的最后一天
    
    this.lcrForm.patchValue({
      enterprise: 'Enterprise',
      segment: 'Enterprise',
      prior: lastMonth,
      current: currentMonth
    });
  }

  onView(): void {
    if (this.lcrForm.valid) {
      const formValue = this.lcrForm.value;
      this.router.navigate(['/regulatory/lcr/detail'], {
        queryParams: {
          enterprise: formValue.enterprise, // Keep enterprise for backward compatibility
          region: formValue.enterprise, // Also pass as region for query-panel
          segment: formValue.segment,
          prior: formValue.prior ? new Date(formValue.prior).toISOString() : '',
          current: formValue.current ? new Date(formValue.current).toISOString() : ''
        }
      });
    }
  }
}
