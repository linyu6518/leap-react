import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core'

/**
 * 数字翻动效果组件，与 React AnimatedNumber 行为一致：
 * 使用 requestAnimationFrame + easeOutCubic 从当前显示值滚动到目标值。
 */
@Component({
  selector: 'app-animated-number',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ displayValue() }}`,
})
export class AnimatedNumberComponent implements OnChanges, OnDestroy {
  @Input() value: number = 0
  @Input() duration: number = 1000
  @Input() decimals: number = 0

  displayValue = signal<string>('0')

  private previousValue: number | null = null
  private animationFrameId: number | null = null
  private currentDisplay = 0

  ngOnChanges(): void {
    this.animateTo(this.value)
  }

  ngOnDestroy(): void {
    this.cancelAnimation()
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private animateTo(endValue: number): void {
    if (endValue == null || Number.isNaN(endValue)) return
    if (this.previousValue === endValue) return

    this.cancelAnimation()

    const startValue = this.currentDisplay
    const valueRange = Math.abs(endValue - startValue)
    const dynamicDuration =
      valueRange > 1000 ? Math.min(this.duration * 1.2, 2000) : this.duration

    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / dynamicDuration, 1)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const current =
        startValue + (endValue - startValue) * easeOutCubic
      this.currentDisplay = current
      this.displayValue.set(current.toFixed(this.decimals))

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate)
      } else {
        this.currentDisplay = endValue
        this.displayValue.set(endValue.toFixed(this.decimals))
        this.previousValue = endValue
        this.animationFrameId = null
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }
}
