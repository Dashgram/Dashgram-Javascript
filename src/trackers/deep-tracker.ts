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
   * Tracks ALL available Telegram WebApp events
   */
  private setupTelegramTracking(): void {
    const webApp = (window as any).Telegram?.WebApp

    // Helper to track event with data
    const trackEvent = (eventName: string, data?: any) => {
      this.track(`telegram_${eventName}`, data || {})
    }

    // Theme and appearance events
    // Official event: themeChanged
    // No payload; read values from WebApp.colorScheme and WebApp.themeParams
    const unsubTheme = subscribeToTelegramEvent("themeChanged", () => {
      trackEvent("theme_changed", {
        color_scheme: webApp?.colorScheme,
        theme_params: webApp?.themeParams
      })
    })
    this.unsubscribers.push(unsubTheme)

    // Viewport events
    // Official event: viewportChanged
    // Payload: {isStateStable: boolean}
    const unsubViewport = subscribeToTelegramEvent("viewportChanged", (eventData: any) => {
      trackEvent("viewport_changed", {
        is_state_stable: eventData?.isStateStable,
        is_expanded: webApp?.isExpanded,
        viewport_height: webApp?.viewportHeight,
        viewport_stable_height: webApp?.viewportStableHeight
      })
    })
    this.unsubscribers.push(unsubViewport)

    // Safe area events (Bot API 7.10+)
    // Official event: safeAreaChanged
    // No payload; read values from WebApp.safeAreaInset
    const unsubSafeArea = subscribeToTelegramEvent("safeAreaChanged", () => {
      trackEvent("safe_area_changed", {
        safe_area: webApp?.safeAreaInset
      })
    })
    this.unsubscribers.push(unsubSafeArea)

    // Official event: contentSafeAreaChanged (Bot API 7.10+)
    // No payload; read values from WebApp.contentSafeAreaInset
    const unsubContentSafeArea = subscribeToTelegramEvent("contentSafeAreaChanged", () => {
      trackEvent("content_safe_area_changed", {
        content_safe_area: webApp?.contentSafeAreaInset
      })
    })
    this.unsubscribers.push(unsubContentSafeArea)

    // Visibility events
    // Note: activated/deactivated events (Bot API 8.0+) track app visibility state
    // The isVisible property on WebApp can be read directly but there's no separate visibilityChanged event

    // Button events
    // Official event: backButtonClicked (Bot API 6.1+)
    // No payload
    const unsubBackButton = subscribeToTelegramEvent("backButtonClicked", () => {
      trackEvent("back_button_clicked", {})
    })
    this.unsubscribers.push(unsubBackButton)

    // Official event: mainButtonClicked
    // No payload; read button text from WebApp.MainButton.text
    const unsubMainButton = subscribeToTelegramEvent("mainButtonClicked", () => {
      trackEvent("main_button_clicked", {
        button_text: webApp?.MainButton?.text
      })
    })
    this.unsubscribers.push(unsubMainButton)

    // Invoice events
    // Note: invoiceClosed is the official event (Bot API 6.1+)
    // Official payload: {url: string, status: 'paid' | 'cancelled' | 'failed' | 'pending'}
    const unsubInvoice = subscribeToTelegramEvent("invoiceClosed", (eventData: any) => {
      trackEvent("invoice_closed", {
        url: eventData?.url,
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubInvoice)

    // Popup events (Bot API 6.2+)
    // Official event: popupClosed
    // Payload: {button_id: string | null}
    const unsubPopup = subscribeToTelegramEvent("popupClosed", (eventData: any) => {
      trackEvent("popup_closed", {
        button_id: eventData?.button_id
      })
    })
    this.unsubscribers.push(unsubPopup)

    // QR code events (Bot API 6.4+)
    // Official event: qrTextReceived
    // Payload: {data: string}
    const unsubQrText = subscribeToTelegramEvent("qrTextReceived", (eventData: any) => {
      trackEvent("qr_text_received", {
        data: eventData?.data
      })
    })
    this.unsubscribers.push(unsubQrText)

    // Official event: scanQrPopupClosed (Bot API 6.4+)
    // No payload
    const unsubScanQr = subscribeToTelegramEvent("scanQrPopupClosed", () => {
      trackEvent("scan_qr_popup_closed", {})
    })
    this.unsubscribers.push(unsubScanQr)

    // Clipboard events (Bot API 6.4+)
    // Official event: clipboardTextReceived
    // Payload: {data: string | null} (null if clipboard is empty or permission denied)
    const unsubClipboard = subscribeToTelegramEvent("clipboardTextReceived", (eventData: any) => {
      trackEvent("clipboard_text_received", {
        data: eventData?.data
      })
    })
    this.unsubscribers.push(unsubClipboard)

    // Permission events
    // Official event: writeAccessRequested (Bot API 6.9+)
    // Payload: {status: 'allowed' | 'cancelled'}
    const unsubWriteAccess = subscribeToTelegramEvent("writeAccessRequested", (eventData: any) => {
      trackEvent("write_access_requested", {
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubWriteAccess)

    // File download events (Bot API 8.0+)
    // Official event: fileDownloadRequested
    // Payload: {status: 'downloading' | 'cancelled'}
    const unsubFileDownload = subscribeToTelegramEvent("fileDownloadRequested", (eventData: any) => {
      trackEvent("file_download_requested", {
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubFileDownload)

    // Custom method events (Bot API 6.9+)
    // Official event: customMethodInvoked
    // Payload: {req_id: string, result?: any, error?: string}
    const unsubCustomMethod = subscribeToTelegramEvent("customMethodInvoked", (eventData: any) => {
      trackEvent("custom_method_invoked", {
        req_id: eventData?.req_id,
        result: eventData?.result,
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubCustomMethod)

    // Fullscreen events (Bot API 8.0+)
    // Official event: fullscreenChanged
    // Payload: {isFullscreen: boolean}
    const unsubFullscreen = subscribeToTelegramEvent("fullscreenChanged", (eventData: any) => {
      trackEvent("fullscreen_changed", {
        is_fullscreen: eventData?.isFullscreen
      })
    })
    this.unsubscribers.push(unsubFullscreen)

    // Official event: fullscreenFailed
    // Payload: {error: 'UNSUPPORTED' | 'ALREADY_FULLSCREEN'}
    const unsubFullscreenFailed = subscribeToTelegramEvent("fullscreenFailed", (eventData: any) => {
      trackEvent("fullscreen_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubFullscreenFailed)

    // Home screen events (Bot API 8.0+)
    // Official event: homeScreenAdded
    // No payload
    const unsubHomeScreenAdded = subscribeToTelegramEvent("homeScreenAdded", () => {
      trackEvent("home_screen_added", {})
    })
    this.unsubscribers.push(unsubHomeScreenAdded)

    // Official event: homeScreenChecked
    // Payload: {status: 'unsupported' | 'unknown' | 'added' | 'missed'}
    const unsubHomeScreenChecked = subscribeToTelegramEvent("homeScreenChecked", (eventData: any) => {
      trackEvent("home_screen_checked", {
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubHomeScreenChecked)

    // Prepared message events (Bot API 8.0+)
    // Official event: preparedMessageSent
    // No payload (message was sent successfully)
    const unsubPreparedMessageSent = subscribeToTelegramEvent("preparedMessageSent", () => {
      trackEvent("prepared_message_sent", {})
    })
    this.unsubscribers.push(unsubPreparedMessageSent)

    // Official event: preparedMessageFailed
    // Payload: {error: 'UNSUPPORTED' | 'MESSAGE_EXPIRED' | 'MESSAGE_SEND_FAILED' | 'USER_DECLINED' | 'UNKNOWN_ERROR'}
    const unsubPreparedMessageFailed = subscribeToTelegramEvent("preparedMessageFailed", (eventData: any) => {
      trackEvent("prepared_message_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubPreparedMessageFailed)

    // Emoji status events (Bot API 8.0+)
    // Official event: emojiStatusSet
    // No payload (status was set successfully)
    const unsubEmojiStatusSet = subscribeToTelegramEvent("emojiStatusSet", () => {
      trackEvent("emoji_status_set", {})
    })
    this.unsubscribers.push(unsubEmojiStatusSet)

    // Official event: emojiStatusFailed
    // Payload: {error: 'UNSUPPORTED' | 'SUGGESTED_EMOJI_INVALID' | 'DURATION_INVALID' | 'USER_DECLINED' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'}
    const unsubEmojiStatusFailed = subscribeToTelegramEvent("emojiStatusFailed", (eventData: any) => {
      trackEvent("emoji_status_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubEmojiStatusFailed)

    // Official event: emojiStatusAccessRequested
    // Payload: {status: 'allowed' | 'cancelled'}
    const unsubEmojiStatusAccess = subscribeToTelegramEvent("emojiStatusAccessRequested", (eventData: any) => {
      trackEvent("emoji_status_access_requested", {
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubEmojiStatusAccess)

    // Settings button events (Bot API 6.1+)
    // Official event: settingsButtonClicked
    // No payload
    const unsubSettingsButton = subscribeToTelegramEvent("settingsButtonClicked", () => {
      trackEvent("settings_button_clicked", {})
    })
    this.unsubscribers.push(unsubSettingsButton)

    // Secondary button events (Bot API 7.10+)
    // Official event: secondaryButtonClicked
    // No payload
    const unsubSecondaryButton = subscribeToTelegramEvent("secondaryButtonClicked", () => {
      trackEvent("secondary_button_clicked", {})
    })
    this.unsubscribers.push(unsubSecondaryButton)

    // Share message events (Bot API 8.0+)
    // Official event: shareMessageSent
    // No payload (message was shared successfully)
    const unsubShareMessageSent = subscribeToTelegramEvent("shareMessageSent", () => {
      trackEvent("share_message_sent", {})
    })
    this.unsubscribers.push(unsubShareMessageSent)

    // Official event: shareMessageFailed
    // Payload: {error: 'UNSUPPORTED' | 'MESSAGE_EXPIRED' | 'MESSAGE_SEND_FAILED' | 'USER_DECLINED' | 'UNKNOWN_ERROR'}
    const unsubShareMessageFailed = subscribeToTelegramEvent("shareMessageFailed", (eventData: any) => {
      trackEvent("share_message_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubShareMessageFailed)

    // Location events (Bot API 8.0+)
    // Official event: locationManagerUpdated
    // Fires when LocationManager object is updated
    const unsubLocationManager = subscribeToTelegramEvent("locationManagerUpdated", () => {
      const locationManager = webApp?.LocationManager
      trackEvent("location_manager_updated", {
        is_inited: locationManager?.isInited,
        is_location_available: locationManager?.isLocationAvailable,
        is_access_requested: locationManager?.isAccessRequested,
        is_access_granted: locationManager?.isAccessGranted
      })
    })
    this.unsubscribers.push(unsubLocationManager)

    // Official event: locationRequested (Bot API 8.0+)
    // Payload: {locationData?: LocationData} where LocationData has latitude, longitude, etc.
    const unsubLocationRequested = subscribeToTelegramEvent("locationRequested", (eventData: any) => {
      trackEvent("location_requested", {
        available: eventData?.available !== false,
        latitude: eventData?.latitude,
        longitude: eventData?.longitude,
        altitude: eventData?.altitude,
        course: eventData?.course,
        speed: eventData?.speed,
        horizontal_accuracy: eventData?.horizontal_accuracy,
        vertical_accuracy: eventData?.vertical_accuracy,
        course_accuracy: eventData?.course_accuracy,
        speed_accuracy: eventData?.speed_accuracy
      })
    })
    this.unsubscribers.push(unsubLocationRequested)

    // Accelerometer events (Bot API 8.0+)
    // Official events: accelerometerStarted, accelerometerStopped, accelerometerChanged, accelerometerFailed
    const unsubAccelerometerStarted = subscribeToTelegramEvent("accelerometerStarted", () => {
      trackEvent("accelerometer_started", {})
    })
    this.unsubscribers.push(unsubAccelerometerStarted)

    const unsubAccelerometerStopped = subscribeToTelegramEvent("accelerometerStopped", () => {
      trackEvent("accelerometer_stopped", {})
    })
    this.unsubscribers.push(unsubAccelerometerStopped)

    // accelerometerChanged fires with no payload; read values from Accelerometer object
    const unsubAccelerometerChanged = subscribeToTelegramEvent("accelerometerChanged", () => {
      const accelerometer = webApp?.Accelerometer
      trackEvent("accelerometer_changed", {
        x: accelerometer?.x,
        y: accelerometer?.y,
        z: accelerometer?.z
      })
    })
    this.unsubscribers.push(unsubAccelerometerChanged)

    // accelerometerFailed payload: {error: 'UNSUPPORTED'}
    const unsubAccelerometerFailed = subscribeToTelegramEvent("accelerometerFailed", (eventData: any) => {
      trackEvent("accelerometer_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubAccelerometerFailed)

    // Device orientation events (Bot API 8.0+)
    // Official events: deviceOrientationStarted, deviceOrientationStopped, deviceOrientationChanged, deviceOrientationFailed
    const unsubDeviceOrientationStarted = subscribeToTelegramEvent("deviceOrientationStarted", () => {
      trackEvent("device_orientation_started", {})
    })
    this.unsubscribers.push(unsubDeviceOrientationStarted)

    const unsubDeviceOrientationStopped = subscribeToTelegramEvent("deviceOrientationStopped", () => {
      trackEvent("device_orientation_stopped", {})
    })
    this.unsubscribers.push(unsubDeviceOrientationStopped)

    // deviceOrientationChanged fires with no payload; read values from DeviceOrientation object
    const unsubDeviceOrientationChanged = subscribeToTelegramEvent("deviceOrientationChanged", () => {
      const deviceOrientation = webApp?.DeviceOrientation
      trackEvent("device_orientation_changed", {
        absolute: deviceOrientation?.absolute,
        alpha: deviceOrientation?.alpha,
        beta: deviceOrientation?.beta,
        gamma: deviceOrientation?.gamma
      })
    })
    this.unsubscribers.push(unsubDeviceOrientationChanged)

    // deviceOrientationFailed payload: {error: 'UNSUPPORTED'}
    const unsubDeviceOrientationFailed = subscribeToTelegramEvent("deviceOrientationFailed", (eventData: any) => {
      trackEvent("device_orientation_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubDeviceOrientationFailed)

    // Gyroscope events (Bot API 8.0+)
    // Official events: gyroscopeStarted, gyroscopeStopped, gyroscopeChanged, gyroscopeFailed
    const unsubGyroscopeStarted = subscribeToTelegramEvent("gyroscopeStarted", () => {
      trackEvent("gyroscope_started", {})
    })
    this.unsubscribers.push(unsubGyroscopeStarted)

    const unsubGyroscopeStopped = subscribeToTelegramEvent("gyroscopeStopped", () => {
      trackEvent("gyroscope_stopped", {})
    })
    this.unsubscribers.push(unsubGyroscopeStopped)

    // gyroscopeChanged fires with no payload; read values from Gyroscope object
    const unsubGyroscopeChanged = subscribeToTelegramEvent("gyroscopeChanged", () => {
      const gyroscope = webApp?.Gyroscope
      trackEvent("gyroscope_changed", {
        x: gyroscope?.x,
        y: gyroscope?.y,
        z: gyroscope?.z
      })
    })
    this.unsubscribers.push(unsubGyroscopeChanged)

    // gyroscopeFailed payload: {error: 'UNSUPPORTED'}
    const unsubGyroscopeFailed = subscribeToTelegramEvent("gyroscopeFailed", (eventData: any) => {
      trackEvent("gyroscope_failed", {
        error: eventData?.error
      })
    })
    this.unsubscribers.push(unsubGyroscopeFailed)

    // Contact events (Bot API 6.9+)
    // Official event: contactRequested
    // Payload: {status: 'sent' | 'cancelled'}
    const unsubContactRequested = subscribeToTelegramEvent("contactRequested", (eventData: any) => {
      trackEvent("contact_requested", {
        status: eventData?.status
      })
    })
    this.unsubscribers.push(unsubContactRequested)

    // App state events (Bot API 8.0+)
    // Official event: activated
    // Fires when Mini App becomes active (user switches to it)
    // No payload
    const unsubActivated = subscribeToTelegramEvent("activated", () => {
      trackEvent("activated", {})
    })
    this.unsubscribers.push(unsubActivated)

    // Official event: deactivated (Bot API 8.0+)
    // Fires when Mini App becomes inactive (user switches away)
    // No payload
    const unsubDeactivated = subscribeToTelegramEvent("deactivated", () => {
      trackEvent("deactivated", {})
    })
    this.unsubscribers.push(unsubDeactivated)

    // Biometric events (Bot API 7.2+)
    // Official event: biometricManagerUpdated
    // Fires when BiometricManager object is updated
    const unsubBiometricManager = subscribeToTelegramEvent("biometricManagerUpdated", () => {
      const biometricManager = webApp?.BiometricManager
      trackEvent("biometric_manager_updated", {
        is_inited: biometricManager?.isInited,
        is_biometric_available: biometricManager?.isBiometricAvailable,
        biometric_type: biometricManager?.biometricType,
        is_access_requested: biometricManager?.isAccessRequested,
        is_access_granted: biometricManager?.isAccessGranted,
        is_biometric_token_saved: biometricManager?.isBiometricTokenSaved,
        device_id: biometricManager?.deviceId
      })
    })
    this.unsubscribers.push(unsubBiometricManager)

    // Official event: biometricAuthRequested (Bot API 7.2+)
    // Payload: {isAuthenticated: boolean, biometricToken?: string}
    const unsubBiometricAuth = subscribeToTelegramEvent("biometricAuthRequested", (eventData: any) => {
      trackEvent("biometric_auth_requested", {
        is_authenticated: eventData?.isAuthenticated,
        biometric_token: eventData?.biometricToken
      })
    })
    this.unsubscribers.push(unsubBiometricAuth)

    // Official event: biometricTokenUpdated (Bot API 7.2+)
    // Payload: {isUpdated: boolean}
    const unsubBiometricToken = subscribeToTelegramEvent("biometricTokenUpdated", (eventData: any) => {
      trackEvent("biometric_token_updated", {
        is_updated: eventData?.isUpdated
      })
    })
    this.unsubscribers.push(unsubBiometricToken)

    // Note: Cloud storage operations (CloudStorage.setItem, getItem, etc.) use callbacks,
    // not WebApp.onEvent() events. Storage tracking is done via method patching if needed.

    // Patch webApp methods to track their calls
    this.patchWebAppMethods(webApp, trackEvent)
  }

  /**
   * Patch Telegram WebApp methods to track their calls
   * Prevents double-patching by checking if method is already patched
   */
  private patchWebAppMethods(webApp: any, trackEvent: (eventName: string, data?: any) => void): void {
    if (!webApp) return

    // Check if already patched (prevent double-patching)
    if ((webApp.openLink as any)?._dashgramPatched) {
      return
    }

    // Track openLink calls
    if (webApp.openLink && typeof webApp.openLink === "function") {
      const originalOpenLink = webApp.openLink.bind(webApp)
      const patchedOpenLink = (url: string, options?: any) => {
        trackEvent("open_link", {
          url: url,
          options: options
        })
        return originalOpenLink(url, options)
      }
      patchedOpenLink._dashgramPatched = true
      webApp.openLink = patchedOpenLink
    }

    // Track openTelegramLink calls
    if (webApp.openTelegramLink && typeof webApp.openTelegramLink === "function") {
      const originalOpenTelegramLink = webApp.openTelegramLink.bind(webApp)
      const patchedOpenTelegramLink = (url: string) => {
        trackEvent("open_telegram_link", {
          url: url
        })
        return originalOpenTelegramLink(url)
      }
      patchedOpenTelegramLink._dashgramPatched = true
      webApp.openTelegramLink = patchedOpenTelegramLink
    }

    // Track switchInlineQuery calls
    if (webApp.switchInlineQuery && typeof webApp.switchInlineQuery === "function") {
      const originalSwitchInlineQuery = webApp.switchInlineQuery.bind(webApp)
      const patchedSwitchInlineQuery = (query: string, chooseChatTypes?: string[]) => {
        trackEvent("switch_inline_query", {
          query: query,
          choose_chat_types: chooseChatTypes
        })
        return originalSwitchInlineQuery(query, chooseChatTypes)
      }
      patchedSwitchInlineQuery._dashgramPatched = true
      webApp.switchInlineQuery = patchedSwitchInlineQuery
    }

    // Track shareStory calls
    if (webApp.shareToStory && typeof webApp.shareToStory === "function") {
      const originalShareToStory = webApp.shareToStory.bind(webApp)
      const patchedShareToStory = (mediaUrl: string, params?: any) => {
        trackEvent("share_story", {
          media_url: mediaUrl,
          params: params
        })
        return originalShareToStory(mediaUrl, params)
      }
      patchedShareToStory._dashgramPatched = true
      webApp.shareToStory = patchedShareToStory
    }

    // Track close calls (session end)
    if (webApp.close && typeof webApp.close === "function") {
      const originalClose = webApp.close.bind(webApp)
      const patchedClose = (options?: any) => {
        trackEvent("webapp_close", {
          return_back: options?.return_back
        })
        // Also track as session_end
        this.track("session_end", {
          reason: "webapp_close"
        })
        return originalClose(options)
      }
      patchedClose._dashgramPatched = true
      webApp.close = patchedClose
    }

    // Track exitFullscreen calls
    if (webApp.exitFullscreen && typeof webApp.exitFullscreen === "function") {
      const originalExitFullscreen = webApp.exitFullscreen.bind(webApp)
      const patchedExitFullscreen = () => {
        trackEvent("webapp_exit_fullscreen", {})
        return originalExitFullscreen()
      }
      patchedExitFullscreen._dashgramPatched = true
      webApp.exitFullscreen = patchedExitFullscreen
    }

    // Track openInvoice calls (triggers invoice_opened event)
    if (webApp.openInvoice && typeof webApp.openInvoice === "function") {
      const originalOpenInvoice = webApp.openInvoice.bind(webApp)
      const patchedOpenInvoice = (slug: string, callback?: (status: string) => void) => {
        trackEvent("open_invoice", {
          slug: slug
        })
        return originalOpenInvoice(slug, callback)
      }
      patchedOpenInvoice._dashgramPatched = true
      webApp.openInvoice = patchedOpenInvoice
    }

    // Track requestAccess calls (triggers write_access_requested event)
    if (webApp.requestAccess && typeof webApp.requestAccess === "function") {
      const originalRequestAccess = webApp.requestAccess.bind(webApp)
      const patchedRequestAccess = (accessType: string, callback?: (status: string) => void) => {
        trackEvent("request_access", {
          access_type: accessType
        })
        return originalRequestAccess(accessType, callback)
      }
      patchedRequestAccess._dashgramPatched = true
      webApp.requestAccess = patchedRequestAccess
    }

    // Track requestContact calls (triggers contact_requested event)
    if (webApp.requestContact && typeof webApp.requestContact === "function") {
      const originalRequestContact = webApp.requestContact.bind(webApp)
      const patchedRequestContact = (callback?: (status: string) => void) => {
        trackEvent("request_contact", {})
        return originalRequestContact(callback)
      }
      patchedRequestContact._dashgramPatched = true
      webApp.requestContact = patchedRequestContact
    }

    // Track requestPhone calls (triggers phone_requested event)
    if (webApp.requestPhone && typeof webApp.requestPhone === "function") {
      const originalRequestPhone = webApp.requestPhone.bind(webApp)
      const patchedRequestPhone = (callback?: (status: string) => void) => {
        trackEvent("request_phone", {})
        return originalRequestPhone(callback)
      }
      patchedRequestPhone._dashgramPatched = true
      webApp.requestPhone = patchedRequestPhone
    }

    // Track requestLocation calls (triggers location_requested event)
    if (webApp.requestLocation && typeof webApp.requestLocation === "function") {
      const originalRequestLocation = webApp.requestLocation.bind(webApp)
      const patchedRequestLocation = (callback?: (status: string, location?: any) => void) => {
        trackEvent("request_location", {})
        return originalRequestLocation(callback)
      }
      patchedRequestLocation._dashgramPatched = true
      webApp.requestLocation = patchedRequestLocation
    }

    // Track checkLocation calls (triggers location_checked event)
    if (webApp.checkLocation && typeof webApp.checkLocation === "function") {
      const originalCheckLocation = webApp.checkLocation.bind(webApp)
      const patchedCheckLocation = (callback?: (isAvailable: boolean, location?: any) => void) => {
        trackEvent("check_location", {})
        return originalCheckLocation(callback)
      }
      patchedCheckLocation._dashgramPatched = true
      webApp.checkLocation = patchedCheckLocation
    }
  }
}
