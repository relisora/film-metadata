<script setup lang="ts">
import { computed } from "vue";

const { exposures, removeExposure } = useExposureLog();
const toast = useToast();

const sortedExposures = computed(() =>
  [...exposures.value].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
);

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

const formatFocalLength = (value?: number | null) =>
  value === undefined || value === null ? "" : `${value.toString()} mm`;

function handleDelete(id: string) {
  removeExposure(id);
  toast.add({ title: "Exposure removed" });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Exposure history</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Review and manage your logged frames.
        </p>
      </div>
      <UButton to="/" color="primary">Log new exposure</UButton>
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
      No exposures logged yet. Start with the “Log exposure” button on the home
      page.
    </UAlert>
  </div>
</template>
