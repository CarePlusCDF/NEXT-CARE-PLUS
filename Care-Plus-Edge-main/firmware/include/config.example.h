#pragma once
// Copy to CareConfig.h (ignored by Git). These are NOT Supabase credentials.
static const char *WIFI_SSIDS[] = {"WIFI_PRINCIPAL", "HOTSPOT_CELULAR"};
static const char *WIFI_PASSWORDS[] = {"SENHA_PRINCIPAL", "SENHA_HOTSPOT"};
static const char *API_BASE = "https://YOUR-API.onrender.com";
// Provision each ID with manage.py. Both devices belong to the same account.
#ifdef CONFIG_IDF_TARGET_ESP32C3
static const char *DEVICE_ID = "pulseira-001";
#else
static const char *DEVICE_ID = "luminaria-001";
#endif
static const char *DEVICE_TOKEN = "PASTE_DEVICE_TOKEN";
static const char *INITIAL_GENERATION = "PASTE_INITIAL_GENERATION";
// Root CA PEM for YOUR API's certificate chain. Do not use setInsecure().
static const char ROOT_CA[] = R"PEM(-----BEGIN CERTIFICATE-----
PASTE_THE_ROOT_CA_BASE64_HERE
-----END CERTIFICATE-----
)PEM";
// Default assumes buttons connect GPIO to GND. Check actual wiring before flashing.
constexpr bool BUTTON_ACTIVE_LOW = true;
constexpr bool RGB_COMMON_ANODE = false;
constexpr unsigned SOS_HOLD_MS = 1500;
constexpr float STEP_TRIGGER = 1.5f;  // m/sÂ² relative to filtered gravity; calibrate on wrist.
constexpr float STEP_REARM = 0.4f;
constexpr unsigned STEP_MIN_MS = 350;
constexpr unsigned OFFLINE_LAMP_MS = 15000;
