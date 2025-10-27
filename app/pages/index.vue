<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

const { settings, currentCamera, currentLens, currentFilmStock } =
  useFilmSettings();
const { exposures, addExposure, removeExposure } = useExposureLog();
const toast = useToast();

const isModalOpen = ref(false);
const isSaving = ref(false);

const formState = reactive({
  note: "",
  shutterSpeed: "",
  aperture: "",
});

const CUSTOM_SHUTTER_VALUE = "__custom_shutter";
const CUSTOM_APERTURE_VALUE = "__custom_aperture";

const shutterSpeedOptions = computed(() =>
  [
    "1s",
    "1/2",
    "1/4",
    "1/8",
    "1/15",
    "1/30",
    "1/60",
    "1/125",
    "1/250",
    "1/500",
    "1/1000",
    CUSTOM_SHUTTER_VALUE,
  ].map((value) => ({
    value,
    label: value === CUSTOM_SHUTTER_VALUE ? "Custom…" : value,
  }))
);

const apertureOptions = computed(() =>
  [
    "f/1.4",
    "f/2",
    "f/2.8",
    "f/4",
    "f/5.6",
    "f/8",
    "f/11",
    "f/16",
    "f/22",
    CUSTOM_APERTURE_VALUE,
  ].map((value) => ({
    value,
    label: value === CUSTOM_APERTURE_VALUE ? "Custom…" : value,
  }))
);

const selectedShutterSpeed = ref<string>("");
const customShutterSpeed = ref("");
const selectedAperture = ref<string>("");
const customAperture = ref("");

const formatFocalLength = (value?: number | null) =>
  value === undefined || value === null ? "" : `${value.toString()} mm`;

const sortedExposures = computed(() =>
  [...exposures.value].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
);

watch(
  selectedShutterSpeed,
  (value) => {
    formState.shutterSpeed =
      value === CUSTOM_SHUTTER_VALUE ? customShutterSpeed.value : value || "";
  },
  { immediate: true }
);

watch(customShutterSpeed, (value) => {
  if (selectedShutterSpeed.value === CUSTOM_SHUTTER_VALUE) {
    formState.shutterSpeed = value;
  }
});

watch(
  selectedAperture,
  (value) => {
    formState.aperture =
      value === CUSTOM_APERTURE_VALUE ? customAperture.value : value || "";
  },
  { immediate: true }
);

watch(customAperture, (value) => {
  if (selectedAperture.value === CUSTOM_APERTURE_VALUE) {
    formState.aperture = value;
  }
});

const formatDate = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));

const formatLocation = (location: {
  latitude: number;
  longitude: number;
  accuracy: number;
}) =>
  `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(
    5
  )} (±${Math.round(location.accuracy)} m)`;

function openModal() {
  formState.note = "";
  customShutterSpeed.value = "";
  customAperture.value = "";
  selectedShutterSpeed.value = "";
  selectedAperture.value = "";
  isModalOpen.value = true;
}

async function handleSave() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    const result = await addExposure({
      note: formState.note,
      shutterSpeed: formState.shutterSpeed,
      aperture: formState.aperture,
    });

    isModalOpen.value = false;
    toast.add({
      title: "Exposure logged",
      description: result.locationCaptured
        ? "Saved with current location."
        : result.locationError
        ? "Exposure saved. Location could not be captured."
        : "Exposure saved.",
    });

    if (result.locationError) {
      console.warn("Location capture failed", result.locationError);
    }
  } catch (error) {
    toast.add({
      title: "Unable to log exposure",
      description:
        error instanceof Error ? error.message : "Something went wrong.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}

function handleDelete(id: string) {
  removeExposure(id);
  toast.add({ title: "Exposure removed" });
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold">Log a Film Exposure</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Current setup and recent exposure activity.
            </p>
          </div>
          <UButton color="primary" size="lg" @click="openModal">
            Log exposure
          </UButton>
        </div>
      </template>

      <dl class="grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Camera</dt>
          <dd class="text-base font-medium">
            {{ currentCamera?.name || "Not selected" }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Lens</dt>
          <dd class="text-base font-medium">
            {{ currentLens?.name || "Not selected" }}
            <span
              v-if="currentLens?.focalLength !== undefined"
              class="text-sm text-gray-500"
            >
              · {{ formatFocalLength(currentLens.focalLength) }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Film stock</dt>
          <dd class="text-base font-medium">
            {{ currentFilmStock?.name || "Not selected" }}
            <span v-if="currentFilmStock" class="text-sm text-gray-500">
              · ISO {{ currentFilmStock.iso }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">
            Location capture
          </dt>
          <dd class="text-base font-medium">
            {{ settings.locationEnabled ? "Enabled" : "Disabled" }}
          </dd>
        </div>
      </dl>
    </UCard>

    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Recent exposures</h2>
        <span class="text-sm text-gray-500 dark:text-gray-400"
          >{{ exposures.length }} total</span
        >
      </div>

      <div v-if="sortedExposures.length" class="space-y-3">
        <UCard v-for="entry in sortedExposures" :key="entry.id">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(entry.timestamp) }}
              </p>
              <div class="space-y-1">
                <p class="font-medium">
                  {{ entry.cameraName || "Camera not set" }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  <span v-if="entry.lensName">Lens: {{ entry.lensName }}</span>
                  <span v-if="entry.lensFocalLength !== undefined" class="ml-2">
                    Focal: {{ formatFocalLength(entry.lensFocalLength) }}
                  </span>
                  <span v-if="entry.shutterSpeed" class="ml-2"
                    >Shutter: {{ entry.shutterSpeed }}</span
                  >
                  <span v-if="entry.aperture" class="ml-2"
                    >Aperture: {{ entry.aperture }}</span
                  >
                </p>
                <p
                  v-if="entry.filmStockName"
                  class="text-sm text-gray-600 dark:text-gray-300"
                >
                  Film: {{ entry.filmStockName
                  }}<span v-if="entry.filmStockIso">
                    · ISO {{ entry.filmStockIso }}</span
                  >
                </p>
                <p
                  v-if="entry.note"
                  class="text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ entry.note }}
                </p>
                <p v-if="entry.location" class="text-xs text-gray-500">
                  {{ formatLocation(entry.location) }}
                </p>
              </div>
            </div>
            <UButton
              color="error"
              variant="ghost"
              size="xs"
              icon="i-ph-trash"
              @click="handleDelete(entry.id)"
            />
          </div>
        </UCard>
      </div>
      <UAlert v-else icon="i-ph-info" color="primary" variant="soft">
        Tap “Log exposure” to add your first frame.
      </UAlert>
    </section>

    <ClientOnly>
      <UModal v-model:open="isModalOpen" :dismissible="false">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Exposure details</h3>
                <UButton
                  icon="i-ph-x"
                  variant="ghost"
                  :disabled="isSaving"
                  @click="isModalOpen = false"
                />
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Shutter speed" name="shutterSpeed">
                  <div class="space-y-2">
                    <USelectMenu
                      v-model="selectedShutterSpeed"
                      :items="shutterSpeedOptions"
                      value-key="value"
                      placeholder="Select shutter speed"
                    />
                    <UInput
                      v-if="selectedShutterSpeed === CUSTOM_SHUTTER_VALUE"
                      id="shutterSpeedCustom"
                      v-model="customShutterSpeed"
                      placeholder="Custom shutter speed"
                    />
                  </div>
                </UFormField>
                <UFormField label="Aperture" name="aperture">
                  <div class="space-y-2">
                    <USelectMenu
                      v-model="selectedAperture"
                      :items="apertureOptions"
                      value-key="value"
                      placeholder="Select aperture"
                    />
                    <UInput
                      v-if="selectedAperture === CUSTOM_APERTURE_VALUE"
                      id="apertureCustom"
                      v-model="customAperture"
                      placeholder="Custom aperture"
                    />
                  </div>
                </UFormField>
              </div>

              <UFormField label="Notes" name="note">
                <UTextarea
                  id="note"
                  v-model="formState.note"
                  placeholder="Lighting, scene notes, metering details..."
                  :rows="3"
                  auto-resize
                />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton
                  variant="ghost"
                  :disabled="isSaving"
                  @click="isModalOpen = false"
                  >Cancel</UButton
                >
                <UButton
                  color="primary"
                  :loading="isSaving"
                  @click="handleSave"
                >
                  Save exposure
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>
