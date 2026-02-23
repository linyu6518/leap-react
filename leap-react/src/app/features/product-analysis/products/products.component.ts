import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  productsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.productsForm = this.fb.group({
      region: ['', Validators.required],
      segment: ['', Validators.required],
      prior: ['', Validators.required],
      current: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // 不设置默认值，以显示 placeholder
  }

  onView(): void {
    if (this.productsForm.valid) {
      const formValue = this.productsForm.value;
      this.router.navigate(['/product/deposits'], {
        queryParams: {
          region: formValue.region,
          segment: formValue.segment,
          prior: formValue.prior ? new Date(formValue.prior).toISOString() : '',
          current: formValue.current ? new Date(formValue.current).toISOString() : ''
        }
      });
    }
  }
}
