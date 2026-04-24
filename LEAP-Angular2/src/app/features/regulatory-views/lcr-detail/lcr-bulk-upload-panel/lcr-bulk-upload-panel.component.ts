import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'

export interface LcrBulkUploadSubmitPayload {
  reportingDate: Date
  calcId: string
  file: File
}

@Component({
  selector: 'app-lcr-bulk-upload-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDatePickerModule],
  templateUrl: './lcr-bulk-upload-panel.component.html',
  styleUrl: './lcr-bulk-upload-panel.component.scss',
})
export class LcrBulkUploadPanelComponent implements OnChanges {
  @Input() visible = false
  @Output() readonly closed = new EventEmitter<void>()
  @Output() readonly downloadTemplate = new EventEmitter<void>()
  @Output() readonly submitted = new EventEmitter<LcrBulkUploadSubmitPayload>()

  reportingDate: Date | null = null
  calcId = ''
  calcIdFocus = false
  selectedFile: File | null = null
  selectedFileName = ''
  submitAttempted = false
  dropzoneActive = false
  private dropzoneEnterDepth = 0

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.submitAttempted = false
      this.selectedFile = null
      this.selectedFileName = ''
      this.reportingDate = null
      this.calcId = ''
      this.resetDropzoneDragState()
    }
  }

  private resetDropzoneDragState(): void {
    this.dropzoneEnterDepth = 0
    this.dropzoneActive = false
  }

  fileSizeLabel(file: File): string {
    const n = file.size
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`
    return `${(n / (1024 * 1024)).toFixed(1)}MB`
  }

  /** Uppercase suffix for badge (e.g. CSV, XLSX), max 4 chars */
  fileExtensionLabel(file: File): string {
    const m = file.name.match(/\.([^.]+)$/)
    if (!m) return 'FILE'
    return m[1].toUpperCase().slice(0, 4)
  }

  clearFile(): void {
    this.selectedFile = null
    this.selectedFileName = ''
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) {
      this.close()
    }
  }

  close(): void {
    this.closed.emit()
  }

  onDownloadTemplate(): void {
    this.downloadTemplate.emit()
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    this.applyFile(file)
    input.value = ''
  }

  private applyFile(file: File | null): void {
    this.selectedFile = file
    this.selectedFileName = file?.name ?? ''
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.dropzoneEnterDepth += 1
    this.dropzoneActive = true
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    this.dropzoneActive = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.dropzoneEnterDepth -= 1
    if (this.dropzoneEnterDepth <= 0) {
      this.dropzoneEnterDepth = 0
      this.dropzoneActive = false
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.resetDropzoneDragState()
    const file = event.dataTransfer?.files?.[0] ?? null
    if (file) this.applyFile(file)
  }

  isAcceptableDataFile(file: File | null): boolean {
    return !!file && /\.(xlsx|csv)$/i.test(file.name)
  }

  onSubmit(): void {
    this.submitAttempted = true
    const id = this.calcId?.trim() ?? ''
    const file = this.selectedFile
    if (!this.reportingDate || !id || !this.isAcceptableDataFile(file)) return
    this.submitted.emit({
      reportingDate: this.reportingDate,
      calcId: id,
      file: file!,
    })
    this.submitAttempted = false
    this.close()
  }
}
