#pragma once
// Portable policy/data: also exercised by the native tests, without an ESP32.
#include <stdint.h>
#include <stddef.h>
#include <string.h>

namespace carewifi {
constexpr uint32_t SETTINGS_MAGIC = 0x43574946;
constexpr uint32_t SETTINGS_VERSION = 1;
constexpr uint32_t PORTAL_AFTER_MS = 60000;
constexpr uint32_t ATTEMPT_MS = 12000;
constexpr uint32_t TRIAL_MS = 60000;

struct Network {
  char ssid[33] = {};
  char password[65] = {};
  uint8_t open = 0;
  uint8_t enabled = 0;
};
struct Settings {
  uint32_t magic = SETTINGS_MAGIC;
  uint32_t version = SETTINGS_VERSION;
  Network networks[2];
  uint32_t checksum = 0;
};
static_assert(sizeof(Network) == 100, "Stable NVS layout required");
static_assert(sizeof(Settings) == 212, "Stable NVS layout required");

inline uint32_t crc32(const void *data, size_t size) {
  uint32_t crc = 0xffffffffU;
  const auto *bytes = static_cast<const uint8_t *>(data);
  for (size_t i = 0; i < size; ++i) {
    crc ^= bytes[i];
    for (unsigned bit = 0; bit < 8; ++bit) crc = (crc >> 1) ^ (0xedb88320U & (0U - (crc & 1U)));
  }
  return ~crc;
}
inline void seal(Settings &settings) {
  settings.checksum = crc32(&settings, offsetof(Settings, checksum));
}
inline bool makeNetwork(const char *ssid, size_t ssidSize, const char *password,
                        size_t passwordSize, bool open, Network &out) {
  if (!ssid || !password || ssidSize == 0 || ssidSize > 32 || passwordSize > 64) return false;
  for (size_t i = 0; i < ssidSize; ++i) if (uint8_t(ssid[i]) < 32 || uint8_t(ssid[i]) == 127) return false;
  if (open) {
    if (passwordSize) return false;
  } else {
    if (passwordSize < 8) return false;
    for (size_t i = 0; i < passwordSize; ++i) {
      unsigned char c = password[i];
      if (c < 32 || c > 126) return false;
      if (passwordSize == 64 && !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))) return false;
    }
  }
  Network result;
  memcpy(result.ssid, ssid, ssidSize);
  memcpy(result.password, password, passwordSize);
  result.open = open ? 1 : 0;
  result.enabled = 1;
  out = result;
  return true;
}
inline bool validSettings(const Settings &settings) {
  if (settings.magic != SETTINGS_MAGIC || settings.version != SETTINGS_VERSION ||
      settings.checksum != crc32(&settings, offsetof(Settings, checksum))) return false;
  for (const auto &net : settings.networks) {
    if (net.enabled > 1 || net.open > 1) return false;
    if (!net.enabled) continue;
    const char *ssidEnd = static_cast<const char *>(memchr(net.ssid, 0, sizeof(net.ssid)));
    const char *passEnd = static_cast<const char *>(memchr(net.password, 0, sizeof(net.password)));
    Network checked;
    if (!ssidEnd || !passEnd || !makeNetwork(net.ssid, ssidEnd - net.ssid, net.password,
                                           passEnd - net.password, net.open, checked)) return false;
  }
  return true;
}

enum class Trial { Idle, Testing, Saved, Error, Cancelled };
class Model {
public:
  Settings settings;
  Network candidate;
  unsigned slot = 0;
  uint32_t startedAt = 0;
  uint32_t finishedAt = 0;
  uint32_t epoch = 0;
  Trial trial = Trial::Idle;

  bool testing() const { return trial == Trial::Testing; }
  bool start(unsigned targetSlot, const Network &network, uint32_t now) {
    Network checked;
    if (testing() || targetSlot > 1 || network.enabled != 1 || network.open > 1 ||
        !memchr(network.ssid, 0, sizeof(network.ssid)) ||
        !memchr(network.password, 0, sizeof(network.password)) ||
        !makeNetwork(network.ssid, strlen(network.ssid), network.password,
                     strlen(network.password), network.open, checked)) return false;
    slot = targetSlot;
    candidate = checked;
    startedAt = now;
    epoch = 0;  // No result from the previous connection may validate this trial.
    trial = Trial::Testing;
    return true;
  }
  bool accepts(uint32_t resultEpoch) const { return testing() && epoch && resultEpoch == epoch; }
  bool expired(uint32_t now) const { return testing() && uint32_t(now - startedAt) >= TRIAL_MS; }
  Settings proposed() const {
    Settings result = settings;
    result.networks[slot] = candidate;
    seal(result);
    return result;
  }
  bool confirm(uint32_t resultEpoch, bool persisted, uint32_t now) {
    if (!accepts(resultEpoch)) return false;
    if (persisted) settings = proposed();
    finish(persisted ? Trial::Saved : Trial::Error, now);
    return persisted;
  }
  void finish(Trial result, uint32_t now) {
    trial = result;
    finishedAt = now;
    memset(candidate.password, 0, sizeof(candidate.password));
    epoch = 0;
  }
};
}  // namespace carewifi
