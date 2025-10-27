import { computed, watch } from 'vue'

type Identifier = string

interface Camera {
  id: Identifier
  name: string
}

interface Lens {
  id: Identifier
  name: string
  focalLength?: number
}

interface FilmStock {
  id: Identifier
  name: string
  iso: number
  format?: string
}

interface FilmSettingsState {
  cameras: Camera[]
  lenses: Lens[]
  filmStocks: FilmStock[]
  currentCameraId?: Identifier
  currentLensId?: Identifier
  currentFilmStockId?: Identifier
  locationEnabled: boolean
}

const SETTINGS_STORAGE_KEY = 'film-metadata/settings-v1'

const defaultState = (): FilmSettingsState => ({
  cameras: [],
  lenses: [],
  filmStocks: [],
  currentCameraId: undefined,
  currentLensId: undefined,
  currentFilmStockId: undefined,
  locationEnabled: false
})

const createId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`)

function sanitizeCameras(items: unknown): Camera[] {
  if (!Array.isArray(items)) return []
  const output: Camera[] = []
  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const name = String((item as any).name ?? '').trim()
    if (!name) continue
    output.push({
      id: String((item as any).id ?? createId()),
      name
    })
  }
  return output
}

function sanitizeLenses(items: unknown): Lens[] {
  if (!Array.isArray(items)) return []
  const output: Lens[] = []
  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const name = String((item as any).name ?? '').trim()
    if (!name) continue
    let focalLength: number | undefined
    const rawFocalLength = (item as any).focalLength
    if (rawFocalLength !== undefined && rawFocalLength !== null && rawFocalLength !== '') {
      const parsed = Number(rawFocalLength)
      if (Number.isFinite(parsed) && parsed > 0) {
        focalLength = parsed
      }
    }
    output.push({
      id: String((item as any).id ?? createId()),
      name,
      focalLength
    })
  }
  return output
}

function sanitizeFilmStocks(items: unknown): FilmStock[] {
  if (!Array.isArray(items)) return []
  const output: FilmStock[] = []
  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const name = String((item as any).name ?? '').trim()
    if (!name) continue
    const iso = Number.isFinite((item as any).iso)
      ? Math.max(1, Math.round(Number((item as any).iso)))
      : 100
    const format = (item as any).format ? String((item as any).format).trim() : undefined
    output.push({
      id: String((item as any).id ?? createId()),
      name,
      iso,
      format
    })
  }
  return output
}

export function useFilmSettings() {
  const state = useState<FilmSettingsState>('film-settings', defaultState)
  const hydrated = useState('film-settings-hydrated', () => false)

  if (import.meta.client && !hydrated.value) {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const {
          rollLabel: _rollLabel,
          cameras: rawCameras,
          lenses: rawLenses,
          filmStocks: rawFilmStocks,
          ...rest
        } = parsed

        state.value = {
          ...defaultState(),
          ...rest,
          cameras: sanitizeCameras(rawCameras),
          lenses: sanitizeLenses(rawLenses),
          filmStocks: sanitizeFilmStocks(rawFilmStocks)
        }
      } catch (error) {
        console.warn('Failed to parse stored film settings', error)
        state.value = defaultState()
      }
    }
    hydrated.value = true
  }

  if (import.meta.client) {
    watch(
      state,
      (value) => {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value))
      },
      { deep: true }
    )
  }

  const currentCamera = computed(() =>
    state.value.cameras.find((camera) => camera.id === state.value.currentCameraId)
  )
  const currentLens = computed(() =>
    state.value.lenses.find((lens) => lens.id === state.value.currentLensId)
  )
  const currentFilmStock = computed(() =>
    state.value.filmStocks.find((film) => film.id === state.value.currentFilmStockId)
  )

  function addCamera(payload: { name: string }) {
    state.value.cameras = [
      ...state.value.cameras,
      { id: createId(), name: payload.name.trim() }
    ]
    if (!state.value.currentCameraId) {
      state.value.currentCameraId = state.value.cameras[0]?.id
    }
  }

  function removeCamera(id: Identifier) {
    state.value.cameras = state.value.cameras.filter((camera) => camera.id !== id)
    if (state.value.currentCameraId === id) {
      state.value.currentCameraId = state.value.cameras[0]?.id
    }
  }

  function setCurrentCamera(id?: Identifier) {
    state.value.currentCameraId = id
  }

  function addLens(payload: { name: string; focalLength?: number }) {
    const focalLength = payload.focalLength && payload.focalLength > 0 ? payload.focalLength : undefined
    state.value.lenses = [
      ...state.value.lenses,
      {
        id: createId(),
        name: payload.name.trim(),
        focalLength
      }
    ]
    if (!state.value.currentLensId) {
      state.value.currentLensId = state.value.lenses[0]?.id
    }
  }

  function removeLens(id: Identifier) {
    state.value.lenses = state.value.lenses.filter((lens) => lens.id !== id)
    if (state.value.currentLensId === id) {
      state.value.currentLensId = state.value.lenses[0]?.id
    }
  }

  function setCurrentLens(id?: Identifier) {
    state.value.currentLensId = id
  }

  function addFilmStock(payload: { name: string; iso: number; format?: string }) {
    state.value.filmStocks = [
      ...state.value.filmStocks,
      {
        id: createId(),
        name: payload.name.trim(),
        iso: Number.isFinite(payload.iso) ? Math.max(1, Math.round(payload.iso)) : 100,
        format: payload.format?.trim() || undefined
      }
    ]
    if (!state.value.currentFilmStockId) {
      state.value.currentFilmStockId = state.value.filmStocks[0]?.id
    }
  }

  function removeFilmStock(id: Identifier) {
    state.value.filmStocks = state.value.filmStocks.filter((film) => film.id !== id)
    if (state.value.currentFilmStockId === id) {
      state.value.currentFilmStockId = state.value.filmStocks[0]?.id
    }
  }

  function setCurrentFilmStock(id?: Identifier) {
    state.value.currentFilmStockId = id
  }

  function setLocationPreference(enabled: boolean) {
    state.value.locationEnabled = enabled
  }

  return {
    settings: state,
    currentCamera,
    currentLens,
    currentFilmStock,
    addCamera,
    removeCamera,
    setCurrentCamera,
    addLens,
    removeLens,
    setCurrentLens,
    addFilmStock,
    removeFilmStock,
    setCurrentFilmStock,
    setLocationPreference
  }
}
