#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#if __has_include("CareConfig.h")
#include "CareConfig.h"
#else
#include "config.example.h"
#endif

inline int64_t eventTime() {
  time_t t = time(nullptr);
  return t > 1700000000 ? int64_t(t) : 0;
}

// Network operations live only in a FreeRTOS task, never in sensor/button loop().
class CareNetwork {
  unsigned long attemptAt = 0;
  unsigned long switchAt = 0;
  int network = 0;
  int failures = 0;
  bool started = false;
public:
  void begin() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);
    WiFi.persistent(false);
    configTime(0, 0, "pool.ntp.org", "time.google.com");
  }
  bool ready() {
    unsigned long now = millis();
    if (WiFi.status() == WL_CONNECTED) return true;
    if (!started || now - attemptAt >= 12000) {
      if (started) network = 1 - network;
      started = true;
      attemptAt = now;
      WiFi.disconnect();
      WiFi.begin(WIFI_SSIDS[network], WIFI_PASSWORDS[network]);
      Serial.printf("Wi-Fi: tentativa da rede %d\n", network + 1);
    }
    return false;
  }
  bool sync(JsonDocument &request, JsonDocument &response) {
    if (!ready()) return false;
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
    if (ok) failures = 0;
    else if (++failures >= 3 && millis() - switchAt >= 20000) {
      // Association alone does not prove Internet/API reachability (e.g. captive portal).
      switchAt = millis();
      failures = 0;
      network = 1 - network;
      attemptAt = millis();
      started = true;
      WiFi.disconnect();
      WiFi.begin(WIFI_SSIDS[network], WIFI_PASSWORDS[network]);
      Serial.printf("API inacessivel: alternando para rede %d\n", network + 1);
    }
    return ok;
  }
};
