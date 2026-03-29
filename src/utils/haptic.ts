/**
 * Cross-platform haptic feedback.
 *
 * Android / most browsers  → navigator.vibrate()
 * iOS 18+ PWA workaround   → clicking a <label> for a hidden <input type="checkbox" switch>
 *   fires a light haptic even from JS, discovered via:
 *   reddit.com/r/PWA/comments/1o69ymd/haptic_feedback_in_pwas_on_ios/
 */

let _label: HTMLLabelElement | null = null;

function getIosHapticLabel(): HTMLLabelElement | null {
  if (_label) return _label;
  try {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('switch', '');     // WebKit switch variant triggers haptic
    cb.id = '__haptic_sw__';
    cb.setAttribute('aria-hidden', 'true');
    cb.setAttribute('tabindex', '-1');
    cb.style.cssText =
      'position:fixed;top:-200%;left:-200%;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(cb);

    const lbl = document.createElement('label');
    lbl.htmlFor = '__haptic_sw__';
    lbl.setAttribute('aria-hidden', 'true');
    lbl.style.cssText =
      'position:fixed;top:-200%;left:-200%;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(lbl);

    _label = lbl;
  } catch {
    // Non-browser environment — silently ignore
  }
  return _label;
}

export function triggerHaptic(ms = 8): void {
  // Standard Vibration API (Android, Chromium-based browsers)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
    return;
  }
  // iOS 18+ PWA fallback
  getIosHapticLabel()?.click();
}
