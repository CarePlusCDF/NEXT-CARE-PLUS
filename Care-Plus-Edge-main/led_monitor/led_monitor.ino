// ESP32 comum, RGB R25/G26/B27. All color rules are owned by the backend.
#include "../firmware/include/CareNetwork.h"

constexpr int RED_PIN = 25, GREEN_PIN = 26, BLUE_PIN = 27;
SemaphoreHandle_t lightMutex;
struct LightState {
  char generation[37] = "";
  char desiredRevision[100] = "";
  char desiredColor[16] = "apagada";
  char appliedRevision[100] = "";
  char appliedColor[16] = "apagada";
  uint8_t rgb[3] = {0, 0, 0};
  unsigned long lastResponse = 0;
  bool received = false;
} light;

void setRGB(int r, int g, int b) {
  analogWrite(RED_PIN, RGB_COMMON_ANODE ? 255 - r : r);
  analogWrite(GREEN_PIN, RGB_COMMON_ANODE ? 255 - g : g);
  analogWrite(BLUE_PIN, RGB_COMMON_ANODE ? 255 - b : b);
}

void communicate(void *) {
  CareNetwork network;
  network.begin();
  for (;;) {
    if (network.ready()) {
      JsonDocument request, response;
      xSemaphoreTake(lightMutex, portMAX_DELAY);
      request["generation"] = light.generation;
      if (strlen(light.appliedRevision)) {
        request["applied"]["revision"] = light.appliedRevision;
        request["applied"]["color"] = light.appliedColor;
      }
      xSemaphoreGive(lightMutex);
      if (network.sync(request, response)) {
        xSemaphoreTake(lightMutex, portMAX_DELAY);
        strlcpy(light.generation, response["generation"] | "", sizeof(light.generation));
        strlcpy(light.desiredRevision, response["desired"]["revision"] | "", sizeof(light.desiredRevision));
        strlcpy(light.desiredColor, response["desired"]["cor"] | "apagada", sizeof(light.desiredColor));
        for (int i = 0; i < 3; ++i) light.rgb[i] = response["desired"]["rgb"][i].as<uint8_t>();
        light.lastResponse = millis();
        light.received = true;
        xSemaphoreGive(lightMutex);
      }
    }
    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  setRGB(0, 0, 0);
  lightMutex = xSemaphoreCreateMutex();
  strlcpy(light.generation, INITIAL_GENERATION, sizeof(light.generation));
  if (xTaskCreate(communicate, "https", 8192, nullptr, 1, nullptr) != pdPASS) Serial.println("ERRO: tarefa HTTPS nao criada.");
}

void loop() {
  xSemaphoreTake(lightMutex, portMAX_DELAY);
  bool stale = !light.received || millis() - light.lastResponse > OFFLINE_LAMP_MS;
  if (stale) {
    setRGB(0, 0, 0);
    // An offline safety shutdown is not an ACK of the requested color.
    light.appliedRevision[0] = '\0';
    strlcpy(light.appliedColor, "apagada", sizeof(light.appliedColor));
  } else if (strcmp(light.desiredRevision, light.appliedRevision)) {
    setRGB(light.rgb[0], light.rgb[1], light.rgb[2]);
    // This ACK only exists after the GPIO writes, and is sent on the next sync.
    strlcpy(light.appliedRevision, light.desiredRevision, sizeof(light.appliedRevision));
    strlcpy(light.appliedColor, light.desiredColor, sizeof(light.appliedColor));
    Serial.printf("Cor aplicada: %s\n", light.appliedColor);
  }
  xSemaphoreGive(lightMutex);
  delay(10);
}
