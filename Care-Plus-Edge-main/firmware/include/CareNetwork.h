#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include <memory>
#include <new>
#include "CareDeviceConfig.h"
#include "CareWifi.h"

inline int64_t eventTime() {
  time_t t = time(nullptr);
  return t > 1700000000 ? int64_t(t) : 0;
}

// Network operations live only in a FreeRTOS task, never in sensor/button loop().
class CareNetwork {
  std::unique_ptr<CareWifi> wifi;
public:
  void begin() {
    // The portal's server/settings do not consume the HTTPS task's stack.
    wifi.reset(new (std::nothrow) CareWifi());
    if (wifi) wifi->begin();
    else Serial.println("ERRO: memoria insuficiente para iniciar Wi-Fi.");
  }
  bool ready() {
    return wifi && wifi->ready();
  }
  bool sync(JsonDocument &request, JsonDocument &response) {
    if (!ready()) return false;
    const uint32_t connection = wifi->requestEpoch();
    if (!connection) return false;
    if (!String(API_BASE).startsWith("https://") || String(DEVICE_TOKEN).startsWith("PASTE") || eventTime() == 0) {
      Serial.println("HTTPS aguardando configuracao/horario NTP valido.");
      return false;
    }
    WiFiClientSecure tls;
    tls.setCACert(ROOT_CA);
    tls.setHandshakeTimeout(6);
    HTTPClient http;
    http.setConnectTimeout(4000);
    http.setTimeout(5000);
    bool ok = false;
    String url = String(API_BASE) + "/devices/" + DEVICE_ID + "/sync";
    if (http.begin(tls, url)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
      String body;
      serializeJson(request, body);
      int status = http.POST(body);
      if (status == 200) {
        DeserializationError error = deserializeJson(response, http.getString());
        ok = !error && response["generation"].is<const char *>() && response["desired"].is<JsonObject>();
      }
      if (!ok) Serial.printf("API: falha HTTP %d (fila preservada)\n", status);
      http.end();
    }
    wifi->reportAPI(ok, connection);
    return ok;
  }
};
