/* Obby Ragdoll same-origin API bridge.
 * Deploy this file NEXT TO obby_ragdoll_local_api.html on your own site.
 *
 * Register a real ad provider by calling:
 *   ObbyAPI.registerAds({
 *     showRewarded({ id, onOpen, onRewarded, onClose, onError }) { ... },
 *     showInterstitial({ onOpen, onClose, onError }) { ... }
 *   });
 *
 * A reward is issued only when onRewarded() is called by that provider.
 * For game QA only: set window.OBBY_AD_TEST_MODE = true BEFORE this script.
 * Test mode shows a labeled, non-monetized demo dialog.
 */
(function (global) {
  'use strict';
  const api = global.ObbyAPI || (global.ObbyAPI = {});
  const ads = api.ads || (api.ads = {});
  let provider = null;

  api.registerAds = function registerAds(realProvider) {
    if (!realProvider || typeof realProvider !== 'object') {
      throw new TypeError('An ad provider object is required');
    }
    provider = realProvider;
    return api;
  };

  api.getAdStatus = function getAdStatus() {
    const current = provider || global.ObbyAdProvider;
    return {
      rewarded: !!(current && (typeof current.showRewarded === 'function' || typeof current.showRewardedVideo === 'function')),
      interstitial: !!(current && (typeof current.showInterstitial === 'function' || typeof current.showFullscreenAdv === 'function')),
      testMode: global.OBBY_AD_TEST_MODE === true
    };
  };

  function callProvider(kind, callbacks) {
    const current = provider || global.ObbyAdProvider;
    if (!current) return false;
    const commonCallbacks = {
      onOpen: callbacks.onOpen,
      onRewarded: callbacks.onRewarded,
      onClose: callbacks.onClose,
      onError: callbacks.onError
    };
    if (kind === 'rewarded') {
      if (typeof current.showRewarded === 'function') {
        return { called: true, result: current.showRewarded(callbacks) };
      }
      // Yandex-compatible real SDK adapter. Unlike showBanner, this has
      // an explicit onRewarded callback from the advertising platform.
      if (typeof current.showRewardedVideo === 'function') {
        return { called: true, result: current.showRewardedVideo({ callbacks: commonCallbacks }) };
      }
    } else {
      if (typeof current.showInterstitial === 'function') {
        return { called: true, result: current.showInterstitial(callbacks) };
      }
      if (typeof current.showFullscreenAdv === 'function') {
        return { called: true, result: current.showFullscreenAdv({ callbacks: commonCallbacks }) };
      }
    }
    return false;
  }

  // Explicit local QA mode: no ad inventory, no real ad shown or monetized.
  // Testing must be intentionally enabled by the site developer.
  function showDemoReward(callbacks) {
    if (!global.document || !global.document.body) {
      callbacks.onError?.(new Error('Test ad cannot open without a document'));
      return;
    }
    const d = global.document;
    const wrap = d.createElement('div');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Test rewarded ad');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.88);color:white;font:16px system-ui,Arial,sans-serif;text-align:center;';
    const card = d.createElement('div');
    card.style.cssText = 'width:min(420px,96vw);border:1px solid #666;border-radius:12px;padding:24px;background:#171717;box-shadow:0 20px 45px rgba(0,0,0,.3);';
    const heading = d.createElement('h2');
    heading.textContent = 'Reward test — not a real advertisement';
    heading.style.cssText = 'margin:0 0 12px;font-size:20px;';
    const info = d.createElement('p');
    info.style.cssText = 'line-height:1.5;color:#ddd;';
    const cancel = d.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.style.cssText = 'padding:10px 18px;cursor:pointer;border:1px solid #999;border-radius:8px;background:#333;color:white;';
    card.append(heading, info, cancel);
    wrap.appendChild(card);
    d.body.appendChild(wrap);
    let active = true;
    let remaining = 5;
    const close = () => {
      if (!active) return;
      active = false;
      wrap.remove();
      callbacks.onClose?.();
    };
    cancel.addEventListener('click', close);
    callbacks.onOpen?.();
    function tick() {
      if (!active) return;
      info.textContent = 'Test reward available in ' + remaining + ' second' + (remaining === 1 ? '' : 's') + '.';
      if (remaining === 0) {
        callbacks.onRewarded?.();
        close();
        return;
      }
      remaining -= 1;
      global.setTimeout(tick, 1000);
    }
    tick();
  }

  // Do not replace functions installed by an existing, real same-origin API.
  if (typeof ads.showRewarded !== 'function') {
    ads.showRewarded = function showRewarded(callbacks = {}) {
      const called = callProvider('rewarded', callbacks);
      if (called) return called.result;
      if (global.OBBY_AD_TEST_MODE === true) return showDemoReward(callbacks);
      callbacks.onError?.(new Error('No real rewarded ad provider registered in API.js'));
    };
  }

  if (typeof ads.showInterstitial !== 'function') {
    ads.showInterstitial = function showInterstitial(callbacks = {}) {
      const called = callProvider('interstitial', callbacks);
      if (called) return called.result;
      callbacks.onClose?.(false);
    };
  }
}(window));
