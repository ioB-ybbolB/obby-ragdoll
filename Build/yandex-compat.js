/*
 * Local/static-host compatibility layer for the Yandex Games bridge used by
 * this Unity build. The original Yandex WebGL template was not included with
 * the build files, so the generated Unity framework otherwise references
 * globals that do not exist (LogStyledMessage, InitGame, ads, cloud saves,
 * leaderboards, payments, etc.).
 *
 * This shim keeps the standalone GitHub Pages build playable. Platform-only
 * services degrade gracefully instead of crashing the Unity runtime.
 */

var NO_DATA = "no data";
var ysdk = null;
var initYSDK = true;
var initGame = false;
var ygGameInstance = null;

var environmentData = JSON.stringify({
  language: navigator.language || "en",
  domain: location.hostname || "local",
  deviceType: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
  isMobile: /mobile/i.test(navigator.userAgent),
  isDesktop: !/mobile|tablet/i.test(navigator.userAgent),
  isTablet: /tablet/i.test(navigator.userAgent),
  isTV: /tv/i.test(navigator.userAgent),
  appID: "standalone",
  browserLang: navigator.language || "en",
  payload: new URLSearchParams(location.search).get("payload") || "",
  platform: navigator.platform || "",
  browser: navigator.userAgent || ""
});

var playerData = JSON.stringify({
  playerAuth: "rejected",
  playerName: "unauthorized",
  playerId: "unauthorized",
  playerPhoto: "no data",
  payingStatus: "unknown"
});

var paymentsData = NO_DATA;
var cloudSaves = NO_DATA;
try {
  cloudSaves = localStorage.getItem("obby-ragdoll-cloud-save") || NO_DATA;
} catch (_) {}

var __ygCompatQueue = [];

function LogStyledMessage(message, style) {
  console.log("%c" + message, style || "color:#FFDF73;background:#454545");
}

function __ygCompatSend(method, arg) {
  var instance = ygGameInstance || window.unityInstance;
  if (!instance || typeof instance.SendMessage !== "function") {
    __ygCompatQueue.push([method, arg]);
    return false;
  }
  try {
    if (typeof arg === "undefined") instance.SendMessage("YG2Instance", method);
    else instance.SendMessage("YG2Instance", method, String(arg));
    return true;
  } catch (error) {
    console.warn("Yandex compatibility message failed:", method, error);
    return false;
  }
}

function YG2Instance(method, arg) {
  return __ygCompatSend(method, arg);
}

function SetYandexCompatUnityInstance(instance) {
  ygGameInstance = instance;
  window.ygGameInstance = instance;
  var queued = __ygCompatQueue.splice(0);
  for (var i = 0; i < queued.length; i++) {
    __ygCompatSend(queued[i][0], queued[i][1]);
  }
}

function InitGame() {
  initGame = true;
  initYSDK = true;
  __ygCompatSend("SetEnvirData", environmentData);
  __ygCompatSend("SetAuth", playerData);
  __ygCompatSend("SetLoadSaves", cloudSaves);
  __ygCompatSend("InitSDKComplete");
}

function RequestingEnvironmentData() {
  __ygCompatSend("SetEnvirData", environmentData);
  return Promise.resolve(environmentData);
}

function InitPlayer() {
  __ygCompatSend("SetAuth", playerData);
  return Promise.resolve(playerData);
}

function OpenAuthDialog() {
  console.warn("Yandex authentication is unavailable on this standalone host.");
  return Promise.resolve(playerData);
}

function SaveCloud(jsonData, flush) {
  cloudSaves = jsonData || NO_DATA;
  try { localStorage.setItem("obby-ragdoll-cloud-save", cloudSaves); } catch (_) {}
}

function LoadCloud() {
  try { cloudSaves = localStorage.getItem("obby-ragdoll-cloud-save") || NO_DATA; } catch (_) {}
  __ygCompatSend("SetLoadSaves", cloudSaves);
  return Promise.resolve(cloudSaves);
}

function InterAdvShow() {
  // No ad provider is available on the standalone host; immediately release gameplay.
  __ygCompatSend("CloseInterAdv", "true");
}

function RewardedAdvShow(id) {
  // Do not grant a paid/ad reward without an ad provider; just report the unavailable ad.
  console.warn("Rewarded ads are unavailable on this standalone host.");
  __ygCompatSend("ErrorRewardedAdv");
  __ygCompatSend("CloseRewardedAdv");
}

function StickyAdActivity(show) {
  // Intentionally a no-op outside Yandex Games.
}

function BuyPayments(id) {
  console.warn("Purchases are unavailable on this standalone host.");
  __ygCompatSend("OnPurchaseFailed", id || "");
}

function ConsumePurchases(onPurchaseSuccess) {
  // No pending Yandex purchases exist on a standalone host.
}

function SetLeaderboard(name, score, extraData) {
  // Leaderboards are unavailable without Yandex Games.
}

function GetLeaderboard(nameLB, quantityTop, quantityAround, photoSize, auth) {
  var empty = {
    technoName: nameLB || "",
    isDefault: false,
    isInvertSortOrder: false,
    decimalOffset: 0,
    type: "",
    entries: NO_DATA,
    ranks: [],
    photos: [],
    names: [],
    scores: [],
    uniqueIDs: [],
    extraDataArray: []
  };
  __ygCompatSend("LeaderboardEntries", JSON.stringify(empty));
}
