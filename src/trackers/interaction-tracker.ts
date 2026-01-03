import { BaseTracker } from "./base-tracker"
import type { Config } from "../core/config"
import type { TrackCallback } from "./base-tracker"
import { throttle } from "../utils/helpers"
import { getElementSelector, getElementText } from "../utils/helpers"
import { getCurrentPath, getPageTitle, getCurrentUrl } from "../utils/device"

/**
 * Interaction tracker (Level 2)
 * Tracks: screen_view, button_click, link_click, form_submit, input_focus, input_change,
 *         copy, cut, paste, text_select, errors
 */
export class InteractionTracker extends BaseTracker {
  private unsubscribers: (() => void)[] = []
  private lastPath: string = ""
  private inputValues = new Map<HTMLElement, string>()

  constructor(config: Config, trackCallback: TrackCallback) {
    super(config, trackCallback, 2)
  }

  protected setup(): void {
    if (typeof window === "undefined") {
      return
    }

    // Track initial screen view
    this.trackScreenView()

    // Setup tracking
    this.setupHistoryTracking()
    this.setupClickTracking()
    this.setupFormTracking()
    this.setupInputTracking()
    this.setupClipboardTracking()
    this.setupSelectionTracking()
    this.setupErrorTracking()
  }

  protected teardown(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }

  /**
   * Track screen view
   */
  private trackScreenView(): void {
    const path = getCurrentPath()

    if (path === this.lastPath) {
      return
    }

    this.lastPath = path

    this.track("screen_view", {
      path,
      url: getCurrentUrl(),
      title: getPageTitle(),
      referrer: document.referrer || "direct"
    })
  }

  /**
   * Setup history tracking (for SPAs)
   */
  private setupHistoryTracking(): void {
    // Patch pushState and replaceState
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    const trackOnHistoryChange = () => {
      this.trackScreenView()
    }

    history.pushState = function (...args) {
      originalPushState.apply(history, args)
      trackOnHistoryChange()
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args)
      trackOnHistoryChange()
    }

    // Listen to popstate (back/forward buttons)
    window.addEventListener("popstate", trackOnHistoryChange)

    this.unsubscribers.push(() => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener("popstate", trackOnHistoryChange)
    })
  }

  /**
   * Setup click tracking
   */
  private setupClickTracking(): void {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target) return

      // Find closest interactive element
      const button = target.closest('button, [role="button"], a')

      if (button) {
        const tagName = button.tagName.toLowerCase()
        const isLink = tagName === "a"

        if (isLink) {
          const anchor = button as HTMLAnchorElement
          const href = anchor.href
          const isExternal = href ? this.isExternalLink(href) : false

          this.track("link_click", {
            element: getElementSelector(button),
            text: getElementText(button),
            href: href || undefined,
            target: anchor.target || undefined,
            is_external: isExternal,
            is_download: anchor.hasAttribute("download")
          })
        } else {
          this.track("button_click", {
            element: getElementSelector(button),
            text: getElementText(button)
          })
        }
      }
    }

    document.addEventListener("click", handleClick, { capture: true })

    this.unsubscribers.push(() => {
      document.removeEventListener("click", handleClick, { capture: true })
    })
  }

  /**
   * Check if a URL is external
   */
  private isExternalLink(url: string): boolean {
    try {
      const linkUrl = new URL(url, window.location.href)
      return linkUrl.origin !== window.location.origin
    } catch {
      return false
    }
  }

  /**
   * Setup form tracking
   */
  private setupFormTracking(): void {
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement
      if (!form) return

      this.track("form_submit", {
        form_id: form.id || undefined,
        form_name: form.name || undefined,
        form_action: form.action || undefined,
        form_method: form.method || undefined
      })
    }

    document.addEventListener("submit", handleSubmit, { capture: true })

    this.unsubscribers.push(() => {
      document.removeEventListener("submit", handleSubmit, { capture: true })
    })
  }

  /**
   * Setup input tracking (focus and change)
   */
  private setupInputTracking(): void {
    // Track input focus
    const handleFocus = throttle((event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (!target) return

      const tagName = target.tagName.toLowerCase()
      if (["input", "textarea", "select"].includes(tagName)) {
        const input = target as HTMLInputElement

        // Store initial value for change detection
        this.inputValues.set(target, input.value || "")

        this.track("input_focus", {
          element: getElementSelector(input),
          input_type: input.type || tagName,
          input_name: input.name || undefined,
          input_id: input.id || undefined
        })
      }
    }, 1000)

    // Track input change (on blur, only if value changed)
    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (!target) return

      const tagName = target.tagName.toLowerCase()
      if (["input", "textarea", "select"].includes(tagName)) {
        const input = target as HTMLInputElement
        const previousValue = this.inputValues.get(target)
        const currentValue = input.value || ""

        // Only track if value actually changed
        if (previousValue !== undefined && previousValue !== currentValue) {
          this.track("input_change", {
            element: getElementSelector(input),
            input_type: input.type || tagName,
            input_name: input.name || undefined,
            input_id: input.id || undefined,
            had_value: previousValue.length > 0,
            has_value: currentValue.length > 0
          })
        }

        this.inputValues.delete(target)
      }
    }

    document.addEventListener("focus", handleFocus, { capture: true })
    document.addEventListener("blur", handleBlur, { capture: true })

    this.unsubscribers.push(() => {
      document.removeEventListener("focus", handleFocus, { capture: true })
      document.removeEventListener("blur", handleBlur, { capture: true })
      this.inputValues.clear()
    })
  }

  /**
   * Setup clipboard tracking (copy, cut, paste)
   */
  private setupClipboardTracking(): void {
    const handleCopy = (_event: ClipboardEvent) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString() || ""

      this.track("copy", {
        text_length: selectedText.length,
        has_selection: selectedText.length > 0
      })
    }

    const handleCut = (_event: ClipboardEvent) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString() || ""

      this.track("cut", {
        text_length: selectedText.length,
        has_selection: selectedText.length > 0
      })
    }

    const handlePaste = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData("text") || ""
      const target = event.target as HTMLElement

      this.track("paste", {
        text_length: pastedText.length,
        target_element: target ? getElementSelector(target) : undefined
      })
    }

    document.addEventListener("copy", handleCopy)
    document.addEventListener("cut", handleCut)
    document.addEventListener("paste", handlePaste)

    this.unsubscribers.push(() => {
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("cut", handleCut)
      document.removeEventListener("paste", handlePaste)
    })
  }

  /**
   * Setup text selection tracking
   */
  private setupSelectionTracking(): void {
    let selectionTimeout: any

    const handleSelectionChange = () => {
      // Debounce selection events
      clearTimeout(selectionTimeout)
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString() || ""

        if (selectedText.length > 0) {
          this.track("text_select", {
            text_length: selectedText.length
          })
        }
      }, 500)
    }

    document.addEventListener("selectionchange", handleSelectionChange)

    this.unsubscribers.push(() => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      clearTimeout(selectionTimeout)
    })
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // Track JavaScript errors
    const handleError = (event: ErrorEvent) => {
      this.track("js_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    }

    window.addEventListener("error", handleError)

    this.unsubscribers.push(() => {
      window.removeEventListener("error", handleError)
    })

    // Track unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      this.track("unhandled_rejection", {
        reason: String(event.reason),
        promise: String(event.promise)
      })
    }

    window.addEventListener("unhandledrejection", handleRejection)

    this.unsubscribers.push(() => {
      window.removeEventListener("unhandledrejection", handleRejection)
    })
  }
}
