export default defineAppConfig({
  toaster: {
    position: 'top-right' as const,
    duration: 3000,
    max: 5,
    expand: false
  },
  theme: {
    radius: 0.25,
    blackAsPrimary: false
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    }
  }
})