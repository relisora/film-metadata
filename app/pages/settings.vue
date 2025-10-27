<script setup lang="ts">
import { computed, reactive, ref } from "vue";

const {
  settings,
  addCamera,
  removeCamera,
  setCurrentCamera,
  addLens,
  removeLens,
  setCurrentLens,
  addFilmStock,
  removeFilmStock,
  setCurrentFilmStock,
  setLocationPreference,
} = useFilmSettings();

const toast = useToast();

const cameraForm = reactive({ name: "" });
const lensForm = reactive<{ name: string; focalLength: number | null }>({
  name: "",
  focalLength: null,
});
const filmForm = reactive({ name: "", iso: 400, format: "" });

const isRequestingLocation = ref(false);
const locationEnabled = computed(() => settings.value.locationEnabled);

function resetCameraForm() {
  cameraForm.name = "";
}

function resetLensForm() {
  lensForm.name = "";
  lensForm.focalLength = null;
}

function resetFilmForm() {
  filmForm.name = "";
  filmForm.iso = 400;
  filmForm.format = "";
}

function submitCamera() {
  if (!cameraForm.name.trim()) {
    toast.add({ title: "Camera name is required", color: "warning" });
    return;
  }
  addCamera({ name: cameraForm.name });
  resetCameraForm();
  toast.add({ title: "Camera added" });
}

function submitLens() {
  if (!lensForm.name.trim()) {
    toast.add({ title: "Lens name is required", color: "warning" });
    return;
  }
  const focalLength = lensForm.focalLength;

  if (
    focalLength !== null &&
    (!Number.isFinite(focalLength) || focalLength <= 0)
  ) {
    toast.add({
      title: "Invalid focal length",
      description: "Please enter a positive number in millimeters.",
      color: "warning",
    });
    return;
  }

  addLens({ name: lensForm.name, focalLength: focalLength ?? undefined });
  resetLensForm();
  toast.add({ title: "Lens added" });
}

function submitFilm() {
  if (!filmForm.name.trim()) {
    toast.add({ title: "Film name is required", color: "warning" });
    return;
  }
  if (!Number.isFinite(Number(filmForm.iso))) {
    toast.add({ title: "ISO must be a number", color: "warning" });
    return;
  }
  addFilmStock({
    name: filmForm.name,
    iso: Number(filmForm.iso),
    format: filmForm.format,
  });
  resetFilmForm();
  toast.add({ title: "Film stock added" });
}

function makeActive(type: "camera" | "lens" | "film", id: string) {
  switch (type) {
    case "camera":
      setCurrentCamera(id);
      toast.add({ title: "Current camera updated" });
      break;
    case "lens":
      setCurrentLens(id);
      toast.add({ title: "Current lens updated" });
      break;
    case "film":
      setCurrentFilmStock(id);
      toast.add({ title: "Current film updated" });
      break;
  }
}

function removeItem(type: "camera" | "lens" | "film", id: string) {
  switch (type) {
    case "camera":
      removeCamera(id);
      toast.add({ title: "Camera removed" });
      break;
    case "lens":
      removeLens(id);
      toast.add({ title: "Lens removed" });
      break;
    case "film":
      removeFilmStock(id);
      toast.add({ title: "Film removed" });
      break;
  }
}

async function toggleLocation() {
  if (locationEnabled.value) {
    setLocationPreference(false);
    toast.add({ title: "Location capture disabled" });
    return;
  }

  if (!import.meta.client) {
    return;
  }

  isRequestingLocation.value = true;
  try {
    await new Promise<void>((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });

    setLocationPreference(true);
    toast.add({ title: "Location capture enabled" });
  } catch (error) {
    setLocationPreference(false);
    toast.add({
      title: "Location permission needed",
      description:
        error instanceof Error
          ? error.message
          : "Enable location in your browser settings.",
      color: "warning",
    });
  } finally {
    isRequestingLocation.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold">Capture defaults</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Define your gear once to reuse it whenever you log a frame.
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-8">
        <div class="grid gap-6 lg:grid-cols-3">
          <section class="space-y-4">
            <header>
              <h2 class="text-lg font-semibold">Cameras</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Add every body you shoot with.
              </p>
            </header>
            <div class="space-y-3">
              <UFormField label="Name" name="cameraName">
                <UInput
                  id="cameraName"
                  v-model="cameraForm.name"
                  placeholder="Contax T2"
                />
              </UFormField>
              <UButton color="primary" block @click="submitCamera"
                >Add camera</UButton
              >
            </div>
            <UAlert
              v-if="!settings.cameras.length"
              icon="i-ph-camera"
              variant="soft"
              color="neutral"
            >
              No cameras yet. Add one to get started.
            </UAlert>
            <UCard
              v-for="camera in settings.cameras"
              :key="camera.id"
              variant="subtle"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium">{{ camera.name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="settings.currentCameraId === camera.id"
                    color="primary"
                    >Active</UBadge
                  >
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-ph-check"
                    @click="makeActive('camera', camera.id)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-ph-trash"
                    @click="removeItem('camera', camera.id)"
                  />
                </div>
              </div>
            </UCard>
          </section>

          <section class="space-y-4">
            <header>
              <h2 class="text-lg font-semibold">Lenses</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Keep track of your go-to glass.
              </p>
            </header>
            <div class="space-y-3">
              <UFormField label="Name" name="lensName">
                <UInput
                  id="lensName"
                  v-model="lensForm.name"
                  placeholder="Zeiss 45mm"
                />
              </UFormField>
              <UFormField
                label="Focal length"
                name="lensFocalLength"
                description="Enter the focal length in millimeters (mm)."
              >
                <UInput
                  id="lensFocalLength"
                  v-model.number="lensForm.focalLength"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="45"
                />
              </UFormField>
              <UButton color="primary" block @click="submitLens"
                >Add lens</UButton
              >
            </div>
            <UAlert
              v-if="!settings.lenses.length"
              icon="i-ph-aperture"
              variant="soft"
              color="neutral"
            >
              No lenses yet. Add one to get started.
            </UAlert>
            <UCard
              v-for="lens in settings.lenses"
              :key="lens.id"
              variant="subtle"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium">{{ lens.name }}</p>
                  <p
                    v-if="lens.focalLength !== undefined"
                    class="text-sm text-gray-500"
                  >
                    {{ lens.focalLength }} mm
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="settings.currentLensId === lens.id"
                    color="primary"
                    >Active</UBadge
                  >
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-ph-check"
                    @click="makeActive('lens', lens.id)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-ph-trash"
                    @click="removeItem('lens', lens.id)"
                  />
                </div>
              </div>
            </UCard>
          </section>

          <section class="space-y-4">
            <header>
              <h2 class="text-lg font-semibold">Film stocks</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Track the emulsions you love.
              </p>
            </header>
            <div class="space-y-3">
              <UFormField label="Name" name="filmName">
                <UInput
                  id="filmName"
                  v-model="filmForm.name"
                  placeholder="Portra 400"
                />
              </UFormField>
              <UFormField label="ISO" name="filmIso">
                <UInput
                  id="filmIso"
                  v-model="filmForm.iso"
                  type="number"
                  min="1"
                />
              </UFormField>
              <UFormField label="Format" name="filmFormat">
                <UInput
                  id="filmFormat"
                  v-model="filmForm.format"
                  placeholder="35mm, 120, large format"
                />
              </UFormField>
              <UButton color="primary" block @click="submitFilm"
                >Add film</UButton
              >
            </div>
            <UAlert
              v-if="!settings.filmStocks.length"
              icon="i-ph-film-strip"
              variant="soft"
              color="neutral"
            >
              No film stocks yet. Add one to get started.
            </UAlert>
            <UCard
              v-for="film in settings.filmStocks"
              :key="film.id"
              variant="subtle"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium">{{ film.name }}</p>
                  <p class="text-sm text-gray-500">
                    ISO {{ film.iso }}
                    <span v-if="film.format"> · {{ film.format }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="settings.currentFilmStockId === film.id"
                    color="primary"
                    >Active</UBadge
                  >
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-ph-check"
                    @click="makeActive('film', film.id)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-ph-trash"
                    @click="removeItem('film', film.id)"
                  />
                </div>
              </div>
            </UCard>
          </section>
        </div>

        <section class="space-y-4">
          <header>
            <h2 class="text-lg font-semibold">Location capture</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Store GPS data with each exposure to remember where you shot it.
            </p>
          </header>
          <UCard variant="subtle">
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="space-y-1">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{
                    locationEnabled
                      ? "Location capture is currently enabled."
                      : "Location capture is currently disabled."
                  }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    locationEnabled
                      ? "Disable this if you prefer not to record GPS data."
                      : "Enable this to request permission and log your shooting spots."
                  }}
                </p>
              </div>
              <UButton
                variant="ghost"
                :loading="isRequestingLocation"
                @click="toggleLocation"
              >
                <UIcon
                  :name="
                    locationEnabled
                      ? 'i-ph-map-pin-line-duotone'
                      : 'i-ph-map-pin-line'
                  "
                  class="mr-2"
                />
                {{ locationEnabled ? "Disable location" : "Enable location" }}
              </UButton>
            </div>
          </UCard>
        </section>
      </div>
    </UCard>
  </div>
</template>
