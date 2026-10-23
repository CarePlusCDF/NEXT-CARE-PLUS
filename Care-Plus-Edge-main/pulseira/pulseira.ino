// ESP32-C3 Super Mini. BTN1=agua, BTN2=confirmar, BTN3=cancelar, BTN4=CARE_SOS.
// GPIO7 drives the 1027 vibrator. A transistor driver and flyback diode are recommended.
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <atomic>
#include "../firmware/include/CareNetwork.h"
#include "../firmware/include/DurableQueue.h"

constexpr int SDA_PIN = 1, SCL_PIN = 3;
constexpr int VIBRATION_PIN = 7;
constexpr unsigned VIBRATION_PULSE_MS = 150;
constexpr unsigned SOS_VIBRATION_INTERVAL_MS = 7000;
// Enabled per build; the main wristband currently has a motor wired directly to GPIO7.
#ifndef CARE_VIBRATION_ENABLED
#define CARE_VIBRATION_ENABLED 0
#endif
#ifndef CARE_CANCEL_PIN
#define CARE_CANCEL_PIN 10
#endif
constexpr int BUTTON_PINS[] = {5, 4, CARE_CANCEL_PIN, 21};
constexpr EventKind BUTTON_EVENTS[] = {CARE_WATER, CARE_CONFIRM, CARE_CANCEL, CARE_SOS};
constexpr unsigned DEBOUNCE_MS = 40;
Adafruit_MPU6050 mpu;
DurableQueue pending;
SemaphoreHandle_t queueMutex;
std::atomic<bool> sensorOK{false};
std::atomic<bool> sosActive{false};
struct ButtonState { bool raw = false, stable = false, fired = false; unsigned long changed = 0, pressed = 0; } buttons[4];
unsigned long lastSample = 0, lastStep = 0, windowStart = 0, sensorRetry = 0;
unsigned long vibrationStarted = 0, lastSosVibration = 0;
bool vibrating = false, wasSosActive = false;
uint32_t stepsWindow = 0;
float gravity = 9.81f;
bool rearmed = true;

void record(EventKind kind) {
  xSemaphoreTake(queueMutex, portMAX_DELAY);
  bool saved = pending.enqueue(kind, eventTime());
  xSemaphoreGive(queueMutex);
  if (!saved) Serial.println("ATENCAO: evento nao salvo. Fila cheia ou armazenamento indisponivel; reconecte/verifique.");
  else if (kind != CARE_STEPS) Serial.printf("Botao salvo na fila: %s\n", EVENT_NAMES[kind]);
}

void vibrate(unsigned long now) {
  vibrationStarted = now;
  vibrating = true;
  if (CARE_VIBRATION_ENABLED) digitalWrite(VIBRATION_PIN, HIGH);
}

void updateVibration(unsigned long now) {
  bool active = sosActive.load();
  if (active && !wasSosActive) lastSosVibration = now;
  if (active && now - lastSosVibration >= SOS_VIBRATION_INTERVAL_MS) {
    lastSosVibration = now;
    vibrate(now);
  }
  wasSosActive = active;
  if (vibrating && now - vibrationStarted >= VIBRATION_PULSE_MS) {
    if (CARE_VIBRATION_ENABLED) digitalWrite(VIBRATION_PIN, LOW);
    vibrating = false;
  }
}

void readButtons(unsigned long now) {
  for (int i = 0; i < 4; ++i) {
    bool active = digitalRead(BUTTON_PINS[i]) == (BUTTON_ACTIVE_LOW ? LOW : HIGH);
    auto &b = buttons[i];
    if (active != b.raw) { b.raw = active; b.changed = now; }
    if (now - b.changed >= DEBOUNCE_MS && b.stable != b.raw) {
      b.stable = b.raw;
      b.fired = false;
      if (b.stable) {
        b.pressed = now;
        vibrate(now);
      }
    }
    if (b.stable && !b.fired && (i != 3 || now - b.pressed >= SOS_HOLD_MS)) {
      b.fired = true;  // release is required even if held indefinitely or network fails
      if (i == 3) sosActive.store(true);
      record(BUTTON_EVENTS[i]);
    }
  }
}

void startSensor() {
  sensorOK = mpu.begin(0x68, &Wire);
  if (sensorOK) {
    mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
    mpu.setGyroRange(MPU6050_RANGE_250_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    gravity = 9.81f;
    rearmed = true;
  }
  Serial.println(sensorOK ? "MPU6050 pronto em SDA1/SCL3, 0x68." : "MPU6050 indisponivel; botoes e rede continuam ativos.");
}

void communicate(void *) {
  CareNetwork network;
  network.begin();
  for (;;) {
    if (network.ready()) {
      JsonDocument request, response;
      xSemaphoreTake(queueMutex, portMAX_DELAY);
      if (!pending.ok()) {
        xSemaphoreGive(queueMutex);
        Serial.println("Fila indisponivel. Nenhum evento sera enviado ate recuperar o armazenamento.");
        vTaskDelay(pdMS_TO_TICKS(2000));
        continue;
      }
      unsigned n = min(unsigned(pending.get().count), 32U);
      bool sealed = pending.seal(n);
      request["generation"] = pending.get().generation;
      request["queue_depth"] = pending.get().count;
      request["queue_full"] = pending.get().overflow;
      request["sensor_ok"] = sensorOK.load();
      JsonArray events = request["events"].to<JsonArray>();
      for (unsigned i = 0; i < n; ++i) {
        const auto &e = pending.get().events[i];
        JsonObject obj = events.add<JsonObject>();
        obj["id"] = e.id;
        obj["type"] = EVENT_NAMES[e.kind];
        obj["steps"] = e.steps;
        if (e.occurredAt > 0) obj["occurred_at"] = e.occurredAt;
        else obj["occurred_at"] = nullptr;
        obj["selection_token"] = e.selection;
      }
      xSemaphoreGive(queueMutex);
      if (sealed && network.sync(request, response)) {
        xSemaphoreTake(queueMutex, portMAX_DELAY);
        // Only server outcomes remove events; a lost HTTP response keeps sealed IDs for retry.
        if (!response["reset_required"].as<bool>()) {
          for (JsonObject outcome : response["outcomes"].as<JsonArray>()) {
            Serial.printf("Evento %s: %s\n", outcome["id"].as<const char *>(), outcome["result"].as<const char *>());
            if (!pending.acknowledge(outcome["id"] | "")) break;
          }
        }
        pending.synchronize(response["generation"] | "", response["selection"]["token"] | "");
        xSemaphoreGive(queueMutex);
        // Red is reserved for an active SOS in the backend desired state.
        sosActive.store(strcmp(response["desired"]["cor"] | "", "vermelha") == 0);
        Serial.printf("Passos do dia confirmados no servidor: %u\n", response["steps"].as<unsigned>());
      }
    }
    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}

void setup() {
  Serial.begin(115200);
  if (CARE_VIBRATION_ENABLED) {
    digitalWrite(VIBRATION_PIN, LOW);
    pinMode(VIBRATION_PIN, OUTPUT);
  } else Serial.println("Vibracall desativado neste build.");
  queueMutex = xSemaphoreCreateMutex();
  for (int pin : BUTTON_PINS) pinMode(pin, BUTTON_ACTIVE_LOW ? INPUT_PULLUP : INPUT_PULLDOWN);
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);
  Wire.setTimeOut(30);
  startSensor();
  if (!pending.begin(INITIAL_GENERATION)) Serial.println("ERRO de LittleFS. Nao formatar: veja o guia de recuperacao.");
  if (xTaskCreate(communicate, "https", 12288, nullptr, 1, nullptr) != pdPASS) Serial.println("ERRO: tarefa HTTPS nao criada.");
}

void loop() {
  unsigned long now = millis();
  readButtons(now);
  updateVibration(now);
  if (!sensorOK && now - sensorRetry >= 5000) { sensorRetry = now; startSensor(); }
  if (sensorOK && now - lastSample >= 25) {
    lastSample = now;
    sensors_event_t a, g, temp;
    if (mpu.getEvent(&a, &g, &temp)) {
      float magnitude = sqrtf(a.acceleration.x * a.acceleration.x + a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z);
      gravity = 0.95f * gravity + 0.05f * magnitude;
      float dynamic = magnitude - gravity;
      if (fabsf(dynamic) < STEP_REARM) rearmed = true;
      if (rearmed && dynamic > STEP_TRIGGER && now - lastStep >= STEP_MIN_MS) {
        rearmed = false;
        lastStep = now;
        ++stepsWindow;
        record(CARE_STEPS);
      }
    } else sensorOK = false;
  }
  if (now - windowStart >= 30000) {
    Serial.printf("Janela de inatividade (30s): %u passos. SOS %s.\n", stepsWindow, sosActive.load() ? "ativo" : "inativo");
    stepsWindow = 0;  // This is never the daily total or the persistent event queue.
    windowStart = now;
  }
  delay(5);
}
