#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <atomic>
#include <time.h>
#include <mbedtls/sha256.h>
#include "CareDeviceConfig.h"
#include "CareWifiCore.h"
#include "CareWifiPage.h"

// One task owns Wi-Fi changes, Preferences, DNS and HTTP. Neither the sensor loop
// nor the HTTPS task handles local clients or waits for a configuration form.
class CareWifi {
  struct ApiResult { uint32_t epoch; bool ok; };
  carewifi::Model model;
  Preferences preferences;
  WebServer server{IPAddress(192, 168, 4, 1), 80};
  DNSServer dns;
  QueueHandle_t results = nullptr;
  std::atomic<bool> connected{false};
  std::atomic<uint32_t> epoch{0};
  bool storageOpen = false, portal = false, attempted = false, everApi = false;
  bool scanRunning = false, scanLaunched = false, applyDeferred = false;
  bool joining = false;
  carewifi::Network joinTarget;
  uint32_t scanRequestedAt = 0;
  uint32_t bootAt = 0, attemptAt = 0, lastApi = 0, switchAt = 0, connectedAt = 0;
  uint32_t recoveredAt = 0, portalAttemptAt = 0, lastApiEpoch = 0;
  unsigned network = 0, failures = 0;
  String expectedSSID, portalSSID, portalPassword, nonce, trialMessage;
  String scanCache = "[]", scanError;

  static void task(void *arg) { static_cast<CareWifi *>(arg)->run(); }
  static bool clockValid() { return time(nullptr) > 1700000000; }
  static String randomToken() {
    char token[33];
    for (unsigned i = 0; i < 4; ++i) snprintf(token + i * 8, 9, "%08x", unsigned(esp_random()));
    return String(token);
  }
  void makePortalIdentity() {
    portalSSID = "CarePlus-";
    for (unsigned i = 0; DEVICE_ID[i] && portalSSID.length() < 32; ++i) {
      char c = DEVICE_ID[i];
      portalSSID += ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                     (c >= '0' && c <= '9') || c == '-' || c == '_') ? c : '-';
    }
    // Domain separation: this is not the backend token or its stored hash.
    String material = String("careplus-wifi-portal-v1:") + DEVICE_TOKEN;
    uint8_t digest[32];
    if (mbedtls_sha256_ret(reinterpret_cast<const uint8_t *>(material.c_str()), material.length(), digest, 0)) return;
    char password[21];
    for (unsigned i = 0; i < 10; ++i) snprintf(password + i * 2, 3, "%02x", digest[i]);
    portalPassword = password;
    memset(digest, 0, sizeof(digest));
    memset(password, 0, sizeof(password));
  }
  void loadSettings() {
    for (unsigned i = 0; i < 2; ++i) {
      const char *ssid = WIFI_SSIDS[i], *password = WIFI_PASSWORDS[i];
      carewifi::makeNetwork(ssid, strlen(ssid), password, strlen(password), !strlen(password), model.settings.networks[i]);
    }
    carewifi::seal(model.settings);
    storageOpen = preferences.begin("care-wifi", false);
    if (!storageOpen) {
      Serial.println("Wi-Fi: NVS indisponivel; redes compiladas preservadas.");
      return;
    }
    if (!preferences.isKey("settings")) return;
    size_t size = preferences.getBytesLength("settings");
    if (!size) return;
    carewifi::Settings saved;
    if (size == sizeof(saved) && preferences.getBytes("settings", &saved, sizeof(saved)) == sizeof(saved) && carewifi::validSettings(saved)) {
      model.settings = saved;
      Serial.println("Wi-Fi: redes recuperadas da memoria.");
    } else Serial.println("Wi-Fi: configuracao NVS invalida; usando redes compiladas, sem apagar armazenamento.");
  }
  bool persist(const carewifi::Settings &settings) {
    if (!storageOpen) storageOpen = preferences.begin("care-wifi", false);
    // One committed blob: both slots remain consistent across interrupted writes.
    return storageOpen && preferences.putBytes("settings", &settings, sizeof(settings)) == sizeof(settings);
  }
  void attempt(const carewifi::Network &target) {
    connected.store(false);
    connectedAt = recoveredAt = 0;
    uint32_t next = epoch.load() + 1;
    if (!next) ++next;
    epoch.store(next);
    if (model.testing()) model.epoch = next;
    WiFi.disconnect(false, false);  // Never erase NVS credentials or touch LittleFS.
    expectedSSID = target.enabled ? target.ssid : "";
    attemptAt = millis();
    attempted = true;
    joinTarget = target;
    joining = target.enabled;
    Serial.printf("Wi-Fi: tentativa %s\n", model.testing() ? "da rede em configuracao" : (network ? "da rede alternativa" : "da rede principal"));
  }
  void joinTick(uint32_t now) {
    // Wait for the old association to end before beginning the new one. In
    // particular, changing the password of the same SSID must not be validated
    // using a connection authenticated with the old password.
    if (!joining || uint32_t(now - attemptAt) < 200 || WiFi.status() == WL_CONNECTED) return;
    WiFi.begin(joinTarget.ssid, joinTarget.open ? nullptr : joinTarget.password);
    memset(joinTarget.password, 0, sizeof(joinTarget.password));
    joining = false;
  }
  void normalAttempt(bool alternate) {
    if (alternate) network = 1 - network;
    if (!model.settings.networks[network].enabled && model.settings.networks[1 - network].enabled) network = 1 - network;
    attempt(model.settings.networks[network]);
  }
  void rollback(const String &reason, carewifi::Trial result = carewifi::Trial::Error) {
    model.finish(result, millis());
    trialMessage = reason;
    applyDeferred = false;
    failures = 0;
    normalAttempt(false);
  }
  bool localRequest(bool requireHost = true) {
    const IPAddress ip = server.client().remoteIP();
    if (!portal || server.client().localIP() != IPAddress(192, 168, 4, 1) ||
        ip[0] != 192 || ip[1] != 168 || ip[2] != 4) return false;
    const String host = server.hostHeader();
    return !requireHost || host == "192.168.4.1" || host == "192.168.4.1:80";
  }
  void headers() {
    server.sendHeader("Cache-Control", "no-store");
    server.sendHeader("X-Content-Type-Options", "nosniff");
    server.sendHeader("Referrer-Policy", "no-referrer");
    server.sendHeader("Content-Security-Policy", String("default-src 'none'; script-src 'nonce-") + nonce +
                      "'; style-src 'nonce-" + nonce + "'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  }
  void error(int status, const char *message) {
    JsonDocument data;
    data["error"] = message;
    sendJSON(status, data);
  }
  void sendJSON(int status, const JsonDocument &data) {
    String body;
    serializeJson(data, body);
    headers();
    server.send(status, "application/json; charset=utf-8", body);
  }
  bool authorize(bool mutation = false) {
    if (!localRequest()) { error(403, "Conecte o celular a rede CarePlus e abra http://192.168.4.1."); return false; }
    const String origin = server.header("Origin");
    if (origin.length() && origin != "http://192.168.4.1" && origin != "http://192.168.4.1:80") {
      error(403, "Origem da requisicao invalida."); return false;
    }
    if (mutation && (server.header("X-Care-CSRF") != nonce ||
                     !server.header("Content-Type").startsWith("application/json"))) {
      error(403, "Reabra a pagina de configuracao antes de salvar."); return false;
    }
    return true;
  }
  static const char *trialName(carewifi::Trial trial) {
    switch (trial) {
      case carewifi::Trial::Testing: return "testing";
      case carewifi::Trial::Saved: return "saved";
      case carewifi::Trial::Error: return "error";
      case carewifi::Trial::Cancelled: return "cancelled";
      default: return "idle";
    }
  }
  void routes() {
    const char *keys[] = {"Origin", "X-Care-CSRF", "Content-Type"};
    server.collectHeaders(keys, 3);
    server.on("/", HTTP_GET, [this]() {
      if (!localRequest(false)) { error(403, "Acesso somente pela rede de configuracao."); return; }
      if (!localRequest()) { redirect(); return; }
      String page = FPSTR(CARE_WIFI_PAGE);
      page.replace("%NONCE%", nonce);
      headers();
      server.send(200, "text/html; charset=utf-8", page);
    });
    server.on("/api/status", HTTP_GET, [this]() {
      if (!authorize()) return;
      JsonDocument data;
      data["device"] = DEVICE_ID;
      data["portal"] = portalSSID;
      data["connected"] = connected.load();
      data["ssid"] = connected.load() ? expectedSSID : "";
      data["api_recent"] = everApi && lastApiEpoch == epoch.load() && uint32_t(millis() - lastApi) < 15000;
      data["trial"] = trialName(model.trial);
      data["message"] = trialMessage;
      const uint32_t elapsed = millis() - model.startedAt;
      data["remaining"] = model.testing() && elapsed < carewifi::TRIAL_MS ? (carewifi::TRIAL_MS - elapsed + 999) / 1000 : 0;
      JsonArray slots = data["slots"].to<JsonArray>();
      for (const auto &n : model.settings.networks) {
        JsonObject item = slots.add<JsonObject>();
        item["ssid"] = n.enabled ? n.ssid : "";
        item["open"] = bool(n.open);
      }
      sendJSON(200, data);  // No network password, device token or pending events.
    });
    server.on("/api/save", HTTP_POST, [this]() {
      if (!authorize(true)) return;
      if (model.testing()) { error(409, "Aguarde ou cancele a tentativa atual."); return; }
      if (scanRunning) { error(409, "Aguarde a busca de redes terminar."); return; }
      String body = server.arg("plain");
      JsonDocument data;
      if (body.length() > 512 || deserializeJson(data, body) || !data["slot"].is<int>() ||
          !data["ssid"].is<const char *>() || !data["password"].is<const char *>() || !data["open"].is<bool>()) {
        error(400, "Formulario invalido."); return;
      }
      JsonString ssid = data["ssid"].as<JsonString>(), password = data["password"].as<JsonString>();
      const int slot = data["slot"].as<int>();
      carewifi::Network candidate;
      if (slot < 0 || slot > 1 || !carewifi::makeNetwork(ssid.c_str(), ssid.size(), password.c_str(), password.size(), data["open"].as<bool>(), candidate)) {
        error(400, "Use nome de 1 a 32 bytes e senha de 8 a 63 caracteres ASCII (ou PSK hexadecimal de 64). Marque explicitamente se a rede nao tiver senha."); return;
      }
      if (!model.start(unsigned(slot), candidate, millis())) { error(409, "Tentativa em andamento."); return; }
      memset(candidate.password, 0, sizeof(candidate.password));
      trialMessage = "Testando Wi-Fi e acesso a API.";
      applyDeferred = true;  // Send HTTP response before changing the radio channel.
      JsonDocument reply;
      reply["testing"] = true;
      sendJSON(202, reply);
    });
    server.on("/api/cancel", HTTP_POST, [this]() {
      if (!authorize(true)) return;
      if (model.testing()) rollback("Tentativa cancelada. Redes anteriores preservadas.", carewifi::Trial::Cancelled);
      JsonDocument reply; reply["cancelled"] = true; sendJSON(200, reply);
    });
    server.on("/api/scan", HTTP_POST, [this]() {
      if (!authorize(true)) return;
      if (model.testing()) { error(409, "Aguarde a tentativa de conexao terminar."); return; }
      if (!scanRunning) {
        // An association in progress can reject scans. Pause only an unconnected
        // STA, then start asynchronously on a later tick, keeping the AP alive.
        if (!connected.load()) {
          WiFi.disconnect(false, false);
          expectedSSID = "";
          attempted = false;
          joining = false;
          memset(joinTarget.password, 0, sizeof(joinTarget.password));
        }
        scanRunning = true;
        scanLaunched = false;
        scanRequestedAt = millis();
        scanError = "";
      }
      JsonDocument reply; reply["running"] = scanRunning; sendJSON(202, reply);
    });
    server.on("/api/networks", HTTP_GET, [this]() {
      if (!authorize()) return;
      JsonDocument reply;
      JsonDocument networks;
      deserializeJson(networks, scanCache);
      reply["networks"] = networks.as<JsonArray>();
      reply["running"] = scanRunning;
      reply["error"] = scanError;
      sendJSON(200, reply);
    });
    server.onNotFound([this]() {
      if (!localRequest(false)) { error(403, "Acesso somente pela rede de configuracao."); return; }
      if (server.method() == HTTP_GET) redirect();
      else error(404, "Rota nao encontrada.");
    });
  }
  void redirect() {
    headers();
    server.sendHeader("Location", "http://192.168.4.1/");
    server.send(302, "text/plain", "Abra http://192.168.4.1/");
  }
  void openPortal() {
    portalAttemptAt = millis();
    if (portalPassword.length() < 8) return;
    WiFi.mode(WIFI_AP_STA);
    if (!WiFi.softAPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0)) ||
        !WiFi.softAP(portalSSID.c_str(), portalPassword.c_str(), 1, 0, 2)) {
      Serial.println("Wi-Fi: falha ao abrir configuracao local; tentando novamente em 60s."); return;
    }
    nonce = randomToken();
    model.trial = carewifi::Trial::Idle;
    trialMessage = "";
    dns.setTTL(30);
    if (!dns.start(53, "*", IPAddress(192,168,4,1))) Serial.println("Wi-Fi: DNS local indisponivel; use http://192.168.4.1.");
    server.begin();
    portal = true;
    Serial.printf("Configurar Wi-Fi: conecte a %s e abra http://192.168.4.1 (senha no pacote privado).\n", portalSSID.c_str());
  }
  void closePortal() {
    server.close();
    dns.stop();
    WiFi.softAPdisconnect(true);
    portal = false;
    nonce = "";
    if (scanRunning) scanRunning = false;
    WiFi.scanDelete();
    Serial.println("Wi-Fi: configuracao local encerrada; acesso a API confirmado.");
  }
  void scanTick() {
    if (!scanRunning) return;
    if (!scanLaunched) {
      if (uint32_t(millis() - scanRequestedAt) < 300) return;
      scanLaunched = true;
      if (WiFi.scanNetworks(true, false, false, 150) != WIFI_SCAN_RUNNING) {
        scanRunning = false;
        scanError = "Nao foi possivel buscar redes. Tente novamente ou digite o nome.";
      }
      return;
    }
    int count = WiFi.scanComplete();
    if (count == WIFI_SCAN_RUNNING) return;
    scanRunning = false;
    JsonDocument data;
    JsonArray list = data.to<JsonArray>();
    if (count < 0) scanError = "Busca indisponivel. Tente novamente ou digite o nome.";
    else {
      scanError = "";
      for (int i = 0; i < count && list.size() < 20; ++i) {
        String ssid = WiFi.SSID(i);
        if (!ssid.length()) continue;
        bool duplicate = false;
        for (JsonObject old : list) if (old["ssid"].as<String>() == ssid) duplicate = true;
        if (duplicate) continue;
        JsonObject item = list.add<JsonObject>();
        item["ssid"] = ssid;
        item["rssi"] = WiFi.RSSI(i);
        item["secured"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
      }
    }
    scanCache = "";
    serializeJson(data, scanCache);
    WiFi.scanDelete();
  }
  void processResults(uint32_t now) {
    ApiResult result;
    while (xQueueReceive(results, &result, 0) == pdTRUE) {
      if (result.epoch != epoch.load()) continue;
      if (result.ok) {
        if (!everApi || lastApiEpoch != result.epoch || uint32_t(now - lastApi) >= 15000) recoveredAt = now;
        everApi = true;
        lastApi = now;
        lastApiEpoch = result.epoch;
        failures = 0;
        if (model.accepts(result.epoch)) {
          auto next = model.proposed();
          bool saved = persist(next);
          network = model.slot;
          model.confirm(result.epoch, saved, now);
          if (saved) {
            trialMessage = "Rede salva e acesso a API confirmado. Volte ao site.";
            Serial.println("Wi-Fi: nova rede validada e salva; progresso preservado.");
          } else {
            trialMessage = "Conectou, mas nao foi possivel salvar na memoria. Redes anteriores preservadas; tente novamente.";
            normalAttempt(false);
          }
          memset(next.networks[0].password, 0, sizeof(next.networks[0].password));
          memset(next.networks[1].password, 0, sizeof(next.networks[1].password));
        }
      } else if (!model.testing()) {
        ++failures;
      }
    }
  }
  void run() {
    bootAt = millis();
    loadSettings();
    makePortalIdentity();
    routes();
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    for (;;) {
      uint32_t now = millis();
      if (!scanRunning) joinTick(now);
      bool up = !joining && expectedSSID.length() && WiFi.status() == WL_CONNECTED &&
                WiFi.SSID() == expectedSSID && uint32_t(WiFi.localIP()) != 0;
      if (up && !connected.load()) connectedAt = now;
      connected.store(up);
      processResults(now);
      scanTick();
      if (model.expired(now)) rollback("Nao foi possivel confirmar a API em 60 segundos. Confira nome, senha, banda 2,4 GHz e acesso a internet. Redes anteriores preservadas.");
      else if (model.testing()) {
        if (applyDeferred && uint32_t(now - model.startedAt) >= 350) { applyDeferred = false; attempt(model.candidate); }
        else if (!applyDeferred && !up && uint32_t(now - attemptAt) >= carewifi::ATTEMPT_MS) attempt(model.candidate);
      } else if (!scanRunning) {
        if (!attempted || (!up && uint32_t(now - attemptAt) >= carewifi::ATTEMPT_MS)) normalAttempt(attempted);
        else if (up && ((failures >= 3 && uint32_t(now - switchAt) >= 20000) ||
                        (!clockValid() && uint32_t(now - connectedAt) >= 25000))) {
          switchAt = now;
          failures = 0;
          normalAttempt(true);
        }
      }
      if (!portal && uint32_t(now - (everApi ? lastApi : bootAt)) >= carewifi::PORTAL_AFTER_MS &&
          (!portalAttemptAt || uint32_t(now - portalAttemptAt) >= carewifi::PORTAL_AFTER_MS)) openPortal();
      if (portal) {
        dns.processNextRequest();
        server.handleClient();
        const bool recent = everApi && lastApiEpoch == epoch.load() && uint32_t(now - lastApi) < 15000;
        if (!model.testing() && !scanRunning && recent &&
            ((model.trial == carewifi::Trial::Saved && uint32_t(now - model.finishedAt) >= 30000) ||
             (WiFi.softAPgetStationNum() == 0 && uint32_t(now - recoveredAt) >= 30000))) closePortal();
      }
      vTaskDelay(pdMS_TO_TICKS(10));
    }
  }
public:
  bool begin() {
    results = xQueueCreate(6, sizeof(ApiResult));
    if (!results) { Serial.println("ERRO: fila de diagnostico Wi-Fi nao criada."); return false; }
    if (xTaskCreate(task, "wifi-config", 8192, this, 1, nullptr) != pdPASS) {
      vQueueDelete(results); results = nullptr;
      Serial.println("ERRO: tarefa de configuracao Wi-Fi nao criada."); return false;
    }
    return true;
  }
  bool ready() const { return connected.load(); }
  uint32_t requestEpoch() const {
    // Do not tag a request from the old network with a newly incremented epoch.
    if (!connected.load()) return 0;
    uint32_t current = epoch.load();
    return connected.load() ? current : 0;
  }
  void reportAPI(bool ok, uint32_t connection) {
    if (results) { ApiResult result{connection, ok}; xQueueSend(results, &result, 0); }
  }
};
