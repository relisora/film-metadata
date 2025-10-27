<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

const {
  settings,
  currentCamera,
  currentLens,
  currentFilmStock,
  setCurrentLens,
} = useFilmSettings();
const { exposures, addExposure } = useExposureLog();
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

const lensOptions = computed(() =>
  settings.value.lenses.map((lens) => ({
    id: lens.id,
    label: lens.focalLength
      ? `${lens.name} (${lens.focalLength} mm)`
      : lens.name,
  }))
);

const hasLenses = computed(() => lensOptions.value.length > 0);

const selectedLensId = ref<string | undefined>(currentLens.value?.id);
const selectedShutterSpeed = ref<string>("");
const customShutterSpeed = ref("");
const selectedAperture = ref<string>("");
const customAperture = ref("");

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

watch(currentLens, (lens) => {
  if (!isModalOpen.value) {
    selectedLensId.value = lens?.id;
  }
});

watch(selectedLensId, (id) => {
  setCurrentLens(id);
});

function openModal() {
  formState.note = "";
  customShutterSpeed.value = "";
  customAperture.value = "";
  selectedLensId.value = currentLens.value?.id;
  selectedShutterSpeed.value = "";
  selectedAperture.value = "";
  isModalOpen.value = true;
}

function clearShutterSelection() {
  selectedShutterSpeed.value = "";
  customShutterSpeed.value = "";
}

function clearApertureSelection() {
  selectedAperture.value = "";
  customAperture.value = "";
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
        </div>
      </template>

      <dl class="grid gap-4 sm:grid-cols-2">
        <div>
          <dd class="text-base font-medium">
            {{ currentCamera?.name || "Not selected" }}
          </dd>
        </div>
        <div>
          <dd class="text-base font-medium">
            {{ currentFilmStock?.name || "Not selected" }}
            <span v-if="currentFilmStock" class="text-sm text-gray-500">
              · ISO {{ currentFilmStock.iso }}
            </span>
          </dd>
        </div>
        <div>
          <dd class="text-base font-medium">
            Location {{ settings.locationEnabled ? "Enabled" : "Disabled" }}
          </dd>
        </div>
        <div>
          <dd class="text-base font-medium">
            {{ exposures.length }} Frame(s) logged
          </dd>
        </div>
      </dl>
    </UCard>
    <UButton
      color="primary"
      size="xl"
      class="w-full py-4 text-base font-semibold"
      @click="openModal"
    >
      Log exposure
    </UButton>

    <ClientOnly>
      <UModal
        v-model:open="isModalOpen"
        :dismissible="false"
        title="Exposure details"
        close-icon="i-ph-x"
        :close="{ variant: 'ghost', disabled: isSaving }"
        :ui="{ body: 'space-y-4' }"
      >
        <template #body>
          <UFormField label="Lens" name="lens">
            <div class="space-y-1">
              <USelectMenu
                v-model="selectedLensId"
                :items="lensOptions"
                value-key="id"
                placeholder="Select lens"
                size="lg"
                class="w-full"
                :disabled="!hasLenses"
              />
              <p v-if="!hasLenses" class="text-xs text-gray-500">
                Add lenses in Settings to pick them here.
              </p>
            </div>
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Shutter speed" name="shutterSpeed">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <USelectMenu
                    v-model="selectedShutterSpeed"
                    :items="shutterSpeedOptions"
                    value-key="value"
                    placeholder="Select shutter speed"
                    size="lg"
                    class="flex-1"
                  />
                  <UButton
                    v-if="selectedShutterSpeed"
                    icon="i-ph-x"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    class="self-stretch"
                    aria-label="Clear shutter speed"
                    @click="clearShutterSelection"
                  />
                </div>
                <UInput
                  v-if="selectedShutterSpeed === CUSTOM_SHUTTER_VALUE"
                  id="shutterSpeedCustom"
                  v-model="customShutterSpeed"
                  placeholder="Custom shutter speed"
                  class="w-full"
                />
              </div>
            </UFormField>
            <UFormField label="Aperture" name="aperture">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <USelectMenu
                    v-model="selectedAperture"
                    :items="apertureOptions"
                    value-key="value"
                    placeholder="Select aperture"
                    size="lg"
                    class="flex-1"
                  />
                  <UButton
                    v-if="selectedAperture"
                    icon="i-ph-x"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    class="self-stretch"
                    aria-label="Clear aperture"
                    @click="clearApertureSelection"
                  />
                </div>
                <UInput
                  v-if="selectedAperture === CUSTOM_APERTURE_VALUE"
                  id="apertureCustom"
                  v-model="customAperture"
                  placeholder="Custom aperture"
                  class="w-full"
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
              class="w-full"
            />
          </UFormField>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              :disabled="isSaving"
              @click="isModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton color="primary" :loading="isSaving" @click="handleSave">
              Save exposure
            </UButton>
          </div>
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>
