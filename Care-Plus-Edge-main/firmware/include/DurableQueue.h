#pragma once
#include <Arduino.h>
#include <LittleFS.h>
#include <esp_system.h>
#include <stddef.h>
#include <memory>

constexpr uint16_t QUEUE_CAPACITY = 128;
enum EventKind : uint8_t { CARE_STEPS, CARE_WATER, CARE_CONFIRM, CARE_CANCEL, CARE_SOS };
const char *EVENT_NAMES[] = {"steps", "water", "confirm", "cancel", "sos"};
struct PendingEvent {
  char id[37];
  char selection[37];
  int64_t occurredAt;
  uint16_t steps;
  uint8_t kind;
  bool sealed;
};
struct QueueState {
  uint32_t magic;
  uint32_t version;
  uint32_t checksum;
  char generation[37];
  char selection[37];
  uint16_t count;
  bool overflow;
  PendingEvent events[QUEUE_CAPACITY];
};

// Two CRC-protected snapshots. A torn write leaves the previous committed slot intact.
// Mount failure never formats the user's queue. IDs and payload seals survive reboot.
class DurableQueue {
  QueueState state{};
  int slot = 0;
  bool healthy = false;
  static uint32_t crc(const QueueState &s) {
    const uint8_t *bytes = reinterpret_cast<const uint8_t *>(&s);
    uint32_t c = 0xFFFFFFFF;
    for (size_t i = 0; i < sizeof(s); ++i) {
      uint8_t value = (i >= offsetof(QueueState, checksum) && i < offsetof(QueueState, checksum) + 4) ? 0 : bytes[i];
      c ^= value;
      for (int b = 0; b < 8; ++b) c = (c >> 1) ^ (0xEDB88320 & -(c & 1));
    }
    return ~c;
  }
  bool read(int which, QueueState &s) {
    File f = LittleFS.open(which ? "/queue-b.bin" : "/queue-a.bin", "r");
    if (!f) return false;
    bool ok = f.size() == sizeof(s) && f.read(reinterpret_cast<uint8_t *>(&s), sizeof(s)) == sizeof(s);
    f.close();
    return ok && s.magic == 0x43415232 && s.count <= QUEUE_CAPACITY && s.checksum == crc(s);
  }
  bool commit(const QueueState &next) {
    auto candidateStorage = std::unique_ptr<QueueState>(new QueueState(next));
    auto &candidate = *candidateStorage;
    candidate.magic = 0x43415232;
    candidate.version = state.version + 1;
    candidate.checksum = crc(candidate);
    int target = 1 - slot;
    File f = LittleFS.open(target ? "/queue-b.bin" : "/queue-a.bin", "w");
    if (!f) { healthy = false; return false; }
    bool ok = f.write(reinterpret_cast<const uint8_t *>(&candidate), sizeof(candidate)) == sizeof(candidate);
    f.flush();
    f.close();
    auto checkStorage = std::unique_ptr<QueueState>(new QueueState{});
    auto &check = *checkStorage;
    if (!ok || !read(target, check) || check.version != candidate.version) { healthy = false; return false; }
    state = candidate;
    slot = target;
    return true;
  }
public:
  bool begin(const char *initial) {
    if (!LittleFS.begin(false)) return false;
    auto aStorage = std::unique_ptr<QueueState>(new QueueState{});
    auto bStorage = std::unique_ptr<QueueState>(new QueueState{});
    auto &a = *aStorage; auto &b = *bStorage;
    bool aok = read(0, a), bok = read(1, b);
    if (aok || bok) {
      slot = bok && (!aok || b.version > a.version) ? 1 : 0;
      state = slot ? b : a;
      healthy = true;
      return true;
    }
    // Corrupt existing files require explicit recovery, never silently clear progress.
    if (LittleFS.exists("/queue-a.bin") || LittleFS.exists("/queue-b.bin")) return false;
    strlcpy(state.generation, initial, sizeof(state.generation));
    healthy = commit(state);
    return healthy;
  }
  bool ok() const { return healthy; }
  const QueueState &get() const { return state; }
  bool enqueue(EventKind kind, int64_t at) {
    if (!healthy) return false;
    auto nextStorage = std::unique_ptr<QueueState>(new QueueState(state));
    auto &next = *nextStorage;
    // Aggregate only unsent steps of the same day. Sealed payloads are immutable.
    if (kind == CARE_STEPS && next.count > 0) {
      PendingEvent &last = next.events[next.count - 1];
      if (last.kind == CARE_STEPS && !last.sealed && last.steps < 1000 &&
          ((last.occurredAt == 0 && at == 0) || (last.occurredAt > 0 && at > 0 && (last.occurredAt - 10800) / 86400 == (at - 10800) / 86400))) {
        ++last.steps;
        return commit(next);
      }
    }
    if (next.count >= QUEUE_CAPACITY) {
      if (!state.overflow) { next.overflow = true; commit(next); }
      return false;
    }
    PendingEvent &e = next.events[next.count++];
    memset(&e, 0, sizeof(e));
    snprintf(e.id, sizeof(e.id), "%08lx-%08lx-%08lx-%08lx", (unsigned long)esp_random(), (unsigned long)esp_random(), (unsigned long)esp_random(), (unsigned long)esp_random());
    e.kind = kind;
    e.steps = kind == CARE_STEPS ? 1 : 0;
    e.occurredAt = at;
    strlcpy(e.selection, next.selection, sizeof(e.selection));
    return commit(next);
  }
  bool seal(unsigned n) {
    auto nextStorage = std::unique_ptr<QueueState>(new QueueState(state));
    auto &next = *nextStorage;
    bool changed = false;
    for (unsigned i = 0; i < n && i < next.count; ++i) {
      if (!next.events[i].sealed) { next.events[i].sealed = true; changed = true; }
    }
    return !changed || commit(next);
  }
  bool acknowledge(const char *id) {
    if (!healthy || state.count == 0 || strcmp(state.events[0].id, id)) return false;
    auto nextStorage = std::unique_ptr<QueueState>(new QueueState(state));
    auto &next = *nextStorage;
    memmove(next.events, next.events + 1, (next.count - 1) * sizeof(PendingEvent));
    --next.count;
    memset(&next.events[next.count], 0, sizeof(PendingEvent));
    return commit(next);
  }
  bool synchronize(const char *generation, const char *selection) {
    if (!healthy) return false;
    if (!strcmp(state.generation, generation) && !strcmp(state.selection, selection)) return true;
    auto nextStorage = std::unique_ptr<QueueState>(new QueueState(state));
    auto &next = *nextStorage;
    if (strcmp(next.generation, generation)) {
      Serial.printf("Nova sessao: invalidando %u eventos anteriores.\n", next.count);
      memset(&next, 0, sizeof(next));
      strlcpy(next.generation, generation, sizeof(next.generation));
    }
    strlcpy(next.selection, selection, sizeof(next.selection));
    return commit(next);  // generation + queue cleared atomically in one snapshot
  }
};
