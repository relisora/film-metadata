import { watch } from 'vue'
import { useFilmSettings } from '#imports'

type Identifier = string

interface ExposureLocation {
  latitude: number
  longitude: number
  accuracy: number
}

export interface ExposureEntry {
  id: Identifier
  timestamp: string
  cameraId?: Identifier
  cameraName?: string
  lensId?: Identifier
  lensName?: string
  lensFocalLength?: number
  filmStockId?: Identifier
  filmStockName?: string
  filmStockIso?: number
  note?: string
  shutterSpeed?: string
  aperture?: string
  location?: ExposureLocation
}

interface AddExposureInput {
  note?: string
  shutterSpeed?: string
  aperture?: string
}

interface AddExposureResult {
  entry: ExposureEntry
  locationCaptured: boolean
  locationError?: Error
}

const EXPOSURE_STORAGE_KEY = 'film-metadata/exposures-v1'

const createId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`)

const captureLocation = () =>
  new Promise<ExposureLocation>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported in this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        reject(error)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    )
  })

function sanitizeExposureEntry(item: unknown): ExposureEntry | null {
  if (typeof item !== 'object' || item === null) return null

  const entry = { ...(item as ExposureEntry) }

  const rawFocalLength = (item as any).lensFocalLength
  if (rawFocalLength !== undefined && rawFocalLength !== null && rawFocalLength !== '') {
    const parsed = Number(rawFocalLength)
    entry.lensFocalLength = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  } else {
    entry.lensFocalLength = undefined
  }

  return entry
}

export function useExposureLog() {
  const exposures = useState<ExposureEntry[]>('film-exposure-log', () => [])
  const hydrated = useState('film-exposure-log-hydrated', () => false)
  const { settings, currentCamera, currentLens, currentFilmStock } = useFilmSettings()

  if (import.meta.client && !hydrated.value) {
    const raw = window.localStorage.getItem(EXPOSURE_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          exposures.value = parsed
            .map((item) => sanitizeExposureEntry(item))
            .filter((entry): entry is ExposureEntry => Boolean(entry))
        }
      } catch (error) {
        console.warn('Failed to parse stored exposures', error)
      }
    }
    hydrated.value = true
  }

  if (import.meta.client) {
    watch(
      exposures,
      (value) => {
        window.localStorage.setItem(EXPOSURE_STORAGE_KEY, JSON.stringify(value))
      },
      { deep: true }
    )
  }

  async function addExposure(input: AddExposureInput = {}): Promise<AddExposureResult> {
    const timestamp = new Date().toISOString()

    let location: ExposureLocation | undefined
    let locationError: Error | undefined

    if (import.meta.client && settings.value.locationEnabled) {
      try {
        location = await captureLocation()
      } catch (error) {
        locationError = error instanceof Error ? error : new Error('Failed to capture location.')
      }
    }

    const entry: ExposureEntry = {
      id: createId(),
      timestamp,
      cameraId: settings.value.currentCameraId,
      cameraName: currentCamera.value?.name,
      lensId: settings.value.currentLensId,
      lensName: currentLens.value?.name,
  lensFocalLength: currentLens.value?.focalLength,
      filmStockId: settings.value.currentFilmStockId,
      filmStockName: currentFilmStock.value?.name,
      filmStockIso: currentFilmStock.value?.iso,
      note: input.note?.trim() || undefined,
      shutterSpeed: input.shutterSpeed?.trim() || undefined,
      aperture: input.aperture?.trim() || undefined,
      location: location ?? undefined
    }

    exposures.value = [entry, ...exposures.value]

    return {
      entry,
      locationCaptured: Boolean(location),
      locationError
    }
  }

  function removeExposure(id: Identifier) {
    exposures.value = exposures.value.filter((exposure) => exposure.id !== id)
  }

  return {
    exposures,
    addExposure,
    removeExposure
  }
}
