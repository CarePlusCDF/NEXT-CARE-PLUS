#include "CareWifiCore.h"
#include <assert.h>
#include <stdio.h>
using namespace carewifi;

static Network network(const char *ssid, const char *password = "example-pass") {
  Network result;
  assert(makeNetwork(ssid, strlen(ssid), password, strlen(password), false, result));
  return result;
}
static Model initial() {
  Model model;
  model.settings.networks[0] = network("Casa");
  model.settings.networks[1] = network("Celular", "hotspot-pass");
  seal(model.settings);
  return model;
}
int main() {
  Network out;
  assert(!makeNetwork("", 0, "password", 8, false, out));
  assert(!makeNetwork("x", 1, "short", 5, false, out));
  assert(!makeNetwork("x", 1, "", 0, false, out));
  assert(makeNetwork("Feira aberta", 12, "", 0, true, out));
  assert(!makeNetwork("x", 1, "password", 8, true, out));
  assert(!makeNetwork("bad\nssid", 8, "password", 8, false, out));
  assert(!makeNetwork("bad\0ssid", 8, "password", 8, false, out));
  assert(!makeNetwork("x", 1, "pass\0word", 9, false, out));
  assert(makeNetwork("Feira \xc3\xa7", 8, "password", 8, false, out));
  assert(makeNetwork("12345678901234567890123456789012", 32, "password", 8, false, out));
  assert(!makeNetwork("123456789012345678901234567890123", 33, "password", 8, false, out));
  const char *hex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  assert(makeNetwork("x", 1, hex, 64, false, out));
  char invalidPsk[65]; memset(invalidPsk, 'z', 64); invalidPsk[64] = 0;
  assert(!makeNetwork("x", 1, invalidPsk, 64, false, out));

  auto model = initial();
  assert(validSettings(model.settings));
  auto corrupt = model.settings;
  corrupt.networks[1].password[0] ^= 1;
  assert(!validSettings(corrupt));
  corrupt = model.settings;
  corrupt.version = 999; seal(corrupt);
  assert(!validSettings(corrupt));
  corrupt = model.settings;
  memset(corrupt.networks[0].ssid, 'x', sizeof(corrupt.networks[0].ssid)); seal(corrupt);
  assert(!validSettings(corrupt));
  corrupt = model.settings;
  corrupt.networks[0].open = 1; seal(corrupt);
  assert(!validSettings(corrupt));

  const Settings original = model.settings;
  const auto feira = network("Feira", "senha-feira");
  assert(!model.start(2, feira, 100));
  assert(model.start(0, feira, 100));
  assert(memcmp(&model.settings, &original, sizeof(original)) == 0);
  assert(!model.accepts(0));
  assert(!model.accepts(1)); // Result from old connection, before applying candidate.
  assert(!model.confirm(1, true, 101));
  model.epoch = 2;
  assert(!model.start(1, feira, 200)); // A second browser cannot replace a live trial.
  assert(!model.confirm(1, true, 200));
  assert(model.testing());
  assert(!model.expired(60099));
  assert(model.expired(60100));
  model.finish(Trial::Error, 60100);
  assert(memcmp(&model.settings, &original, sizeof(original)) == 0);
  assert(model.candidate.password[0] == 0);

  assert(model.start(0, feira, 70000));
  model.epoch = 3;
  assert(!model.confirm(3, false, 71000)); // NVS failure must not replace either slot.
  assert(model.trial == Trial::Error);
  assert(memcmp(&model.settings, &original, sizeof(original)) == 0);

  assert(model.start(0, feira, 80000));
  model.epoch = 4;
  const auto proposed = model.proposed();
  assert(validSettings(proposed));
  assert(strcmp(proposed.networks[0].ssid, "Feira") == 0);
  assert(memcmp(&proposed.networks[1], &original.networks[1], sizeof(Network)) == 0);
  assert(model.confirm(4, true, 81000));
  assert(validSettings(model.settings));
  assert(memcmp(&model.settings, &proposed, sizeof(proposed)) == 0);
  assert(!model.confirm(4, true, 82000));
  assert(model.candidate.password[0] == 0);

  // Saved data is independent of a model/task reboot and retains both slots.
  Model rebooted;
  memcpy(&rebooted.settings, &model.settings, sizeof(Settings));
  assert(validSettings(rebooted.settings));
  assert(strcmp(rebooted.settings.networks[0].ssid, "Feira") == 0);
  assert(strcmp(rebooted.settings.networks[1].ssid, "Celular") == 0);
  assert(rebooted.start(1, network("Outra rede"), 0xfffffff0U));
  assert(!rebooted.expired(uint32_t(0xfffffff0U + TRIAL_MS - 1)));
  assert(rebooted.expired(uint32_t(0xfffffff0U + TRIAL_MS)));
  rebooted.finish(Trial::Cancelled, 60000);
  assert(strcmp(rebooted.settings.networks[1].ssid, "Celular") == 0);

  puts("Wi-Fi core: validation, CRC/reboot, timeout/wrap, stale response, rollback, NVS failure, slot preservation and commit passed.");
}
