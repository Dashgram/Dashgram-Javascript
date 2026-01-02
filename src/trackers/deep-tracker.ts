import { BaseTracker } from "./base-tracker"
import type { Config } from "../core/config"
import type { TrackCallback } from "./base-tracker"
import { throttle } from "../utils/helpers"
import { getScrollDepth } from "../utils/device"
import { subscribeToTelegramEvent } from "../utils/telegram"

/**
 * Deep tracker (Level 3)
 * Tracks: scroll_depth, element_visible, rage_click, long_task, web_vitals, Telegram events
 */
export class DeepTracker extends BaseTracker {
  private unsubscribers: (() => void)[] = []
  private observers: Array<IntersectionObserver | PerformanceObserver> = []
  private clickTracker = new Map<Element, { count: number; timer: any }>()
  private maxScrollDepth = 0

  constructor(config: Config, trackCallback: TrackCallback) {
    super(config, trackCallback, 3)
  }

  protected setup(): void {
    if (typeof window === "undefined") {
      return
    }

    this.setupScrollTracking()
    this.setupVisibilityTracking()
    this.setupRageClickTracking()
    this.setupLongTaskTracking()
    this.setupWebVitals()
    this.setupTelegramTracking()
  }

  protected teardown(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []

    this.observers.forEach(observer => observer.disconnect())
    this.observers = []

    this.clickTracker.clear()
  }

  /**
   * Setup scroll depth tracking
   */
  private setupScrollTracking(): void {
    const handleScroll = throttle(() => {
      const depth = getScrollDepth()

      // Track milestones: 25%, 50%, 75%, 100%
      if (depth > this.maxScrollDepth) {
        this.maxScrollDepth = depth

        const milestones = [25, 50, 75, 100]
        const milestone = milestones.find(m => depth >= m && this.maxScrollDepth - depth < m)

        if (milestone) {
          this.track("scroll_depth", {
            depth: milestone,
            max_depth: this.maxScrollDepth
          })
        }
      }
    }, 500)

    window.addEventListener("scroll", handleScroll, { passive: true })

    this.unsubscribers.push(() => {
      window.removeEventListener("scroll", handleScroll)
    })
  }

  /**
   * Setup element visibility tracking
   */
  private setupVisibilityTracking(): void {
    if (!("IntersectionObserver" in window)) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target
            const selector = element.getAttribute("data-track-visible")

            if (selector) {
              this.track("element_visible", {
                element: selector,
                intersection_ratio: entry.intersectionRatio
              })

              // Stop observing after first visibility
              observer.unobserve(element)
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    // Observe elements with data-track-visible attribute
    document.querySelectorAll("[data-track-visible]").forEach(element => {
      observer.observe(element)
    })

    this.observers.push(observer)

    // Also observe dynamically added elements (with MutationObserver)
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) {
            if (node.hasAttribute("data-track-visible")) {
              observer.observe(node)
            }
            node.querySelectorAll("[data-track-visible]").forEach(el => {
              observer.observe(el)
            })
          }
        })
      })
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    this.unsubscribers.push(() => {
      mutationObserver.disconnect()
    })
  }

  /**
   * Setup rage click tracking
   */
  private setupRageClickTracking(): void {
    const RAGE_THRESHOLD = 5 // 5 clicks
    const RAGE_TIMEOUT = 2000 // within 2 seconds

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target) return

      const tracker = this.clickTracker.get(target)

      if (tracker) {
        tracker.count++
        clearTimeout(tracker.timer)

        if (tracker.count >= RAGE_THRESHOLD) {
          this.track("rage_click", {
            element: target.tagName.toLowerCase(),
            click_count: tracker.count
          })

          this.clickTracker.delete(target)
        } else {
          tracker.timer = setTimeout(() => {
            this.clickTracker.delete(target)
          }, RAGE_TIMEOUT)
        }
      } else {
        const timer = setTimeout(() => {
          this.clickTracker.delete(target)
        }, RAGE_TIMEOUT)

        this.clickTracker.set(target, { count: 1, timer })
      }
    }

    document.addEventListener("click", handleClick)

    this.unsubscribers.push(() => {
      document.removeEventListener("click", handleClick)
    })
  }

  /**
   * Setup long task tracking
   */
  private setupLongTaskTracking(): void {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            this.track("long_task", {
              duration: Math.round(entry.duration),
              start_time: Math.round(entry.startTime)
            })
          }
        }
      })

      observer.observe({ entryTypes: ["longtask"] })
      this.observers.push(observer)
    } catch (error) {
      // longtask might not be supported
      this.log("Long task tracking not supported")
    }
  }

  /**
   * Setup Web Vitals tracking
   */
  private setupWebVitals(): void {
    if (!("PerformanceObserver" in window)) {
      return
    }

    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any

        this.track("web_vital_lcp", {
          value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
          element: lastEntry.element?.tagName.toLowerCase()
        })
      })

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(lcpObserver)
    } catch (error) {
      this.log("LCP tracking not supported")
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.track("web_vital_fid", {
            value: Math.round(entry.processingStart - entry.startTime),
            event_type: entry.name
          })
        })
      })

      fidObserver.observe({ entryTypes: ["first-input"] })
      this.observers.push(fidObserver)
    } catch (error) {
      this.log("FID tracking not supported")
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0

    try {
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
      })

      clsObserver.observe({ entryTypes: ["layout-shift"] })
      this.observers.push(clsObserver)

      // Report CLS on page hide
      const reportCLS = () => {
        if (clsValue > 0) {
          this.track("web_vital_cls", {
            value: Math.round(clsValue * 1000) / 1000
          })
        }
      }

      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          reportCLS()
        }
      })

      this.unsubscribers.push(() => {
        reportCLS()
      })
    } catch (error) {
      this.log("CLS tracking not supported")
    }
  }

  /**
   * Setup Telegram WebApp event tracking
   */
  private setupTelegramTracking(): void {
    // Track theme changes
    const unsubTheme = subscribeToTelegramEvent("themeChanged", () => {
      this.track("telegram_theme_changed", {})
    })

    this.unsubscribers.push(unsubTheme)

    // Track viewport changes
    const unsubViewport = subscribeToTelegramEvent("viewportChanged", () => {
      this.track("telegram_viewport_changed", {
        is_expanded: (window as any).Telegram?.WebApp?.isExpanded
      })
    })

    this.unsubscribers.push(unsubViewport)

    // Track back button clicks
    const unsubBack = subscribeToTelegramEvent("backButtonClicked", () => {
      this.track("telegram_back_button_clicked", {})
    })

    this.unsubscribers.push(unsubBack)

    // Track main button clicks
    const unsubMain = subscribeToTelegramEvent("mainButtonClicked", () => {
      this.track("telegram_main_button_clicked", {})
    })

    this.unsubscribers.push(unsubMain)
  }
}
