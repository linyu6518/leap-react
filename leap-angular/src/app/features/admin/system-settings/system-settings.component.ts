import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  generalForm: FormGroup;
  securityForm: FormGroup;
  notificationForm: FormGroup;
  dataRetentionForm: FormGroup;

  selectedTab = 0;

  constructor(private fb: FormBuilder) {
    this.generalForm = this.fb.group({
      systemName: ['LEAP - Liquidity Explain & Analytics Platform', Validators.required],
      timezone: ['America/New_York', Validators.required],
      dateFormat: ['MM/DD/YYYY', Validators.required],
      currency: ['USD', Validators.required],
      reportingPeriod: ['Daily', Validators.required]
    });

    this.securityForm = this.fb.group({
      sessionTimeout: [30, [Validators.required, Validators.min(5), Validators.max(120)]],
      passwordExpiry: [90, [Validators.required, Validators.min(30), Validators.max(365)]],
      maxLoginAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      mfaEnabled: [true],
      ipWhitelisting: [false]
    });

    this.notificationForm = this.fb.group({
      emailEnabled: [true],
      emailServer: ['smtp.tdbank.com', Validators.required],
      emailPort: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      notifyThresholdBreach: [true],
      notifyWorkflowStatus: [true],
      notifySystemAlerts: [true]
    });

    this.dataRetentionForm = this.fb.group({
      auditLogRetention: [2, [Validators.required, Validators.min(1)]],
      reportDataRetention: [7, [Validators.required, Validators.min(1)]],
      workflowHistoryRetention: [3, [Validators.required, Validators.min(1)]],
      autoArchive: [true],
      compressionEnabled: [true]
    });
  }

  ngOnInit(): void {
    // Load settings from backend would go here
  }

  saveGeneralSettings(): void {
    if (this.generalForm.valid) {
      console.log('Saving general settings:', this.generalForm.value);
      alert('General settings saved successfully');
    }
  }

  saveSecuritySettings(): void {
    if (this.securityForm.valid) {
      console.log('Saving security settings:', this.securityForm.value);
      alert('Security settings saved successfully');
    }
  }

  saveNotificationSettings(): void {
    if (this.notificationForm.valid) {
      console.log('Saving notification settings:', this.notificationForm.value);
      alert('Notification settings saved successfully');
    }
  }

  saveDataRetentionSettings(): void {
    if (this.dataRetentionForm.valid) {
      console.log('Saving data retention settings:', this.dataRetentionForm.value);
      alert('Data retention settings saved successfully');
    }
  }

  testEmailConnection(): void {
    const emailServer = this.notificationForm.get('emailServer')?.value;
    const emailPort = this.notificationForm.get('emailPort')?.value;
    console.log('Testing email connection:', emailServer, emailPort);
    alert('Email connection test successful!');
  }

  resetToDefaults(): void {
    if (confirm('Reset all settings to default values? This cannot be undone.')) {
      this.generalForm.reset({
        systemName: 'LEAP - Liquidity Explain & Analytics Platform',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        reportingPeriod: 'Daily'
      });

      this.securityForm.reset({
        sessionTimeout: 30,
        passwordExpiry: 90,
        maxLoginAttempts: 3,
        mfaEnabled: true,
        ipWhitelisting: false
      });

      this.notificationForm.reset({
        emailEnabled: true,
        emailServer: 'smtp.tdbank.com',
        emailPort: 587,
        notifyThresholdBreach: true,
        notifyWorkflowStatus: true,
        notifySystemAlerts: true
      });

      this.dataRetentionForm.reset({
        auditLogRetention: 2,
        reportDataRetention: 7,
        workflowHistoryRetention: 3,
        autoArchive: true,
        compressionEnabled: true
      });

      alert('Settings reset to default values');
    }
  }

  exportSettings(): void {
    const settings = {
      general: this.generalForm.value,
      security: this.securityForm.value,
      notification: this.notificationForm.value,
      dataRetention: this.dataRetentionForm.value
    };
    console.log('Exporting settings:', settings);
    alert('Settings exported to JSON');
  }
}
