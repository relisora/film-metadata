<template>
  <UApp>
    <UHeader :ui="{ root: 'border-b border-gray-200 dark:border-gray-800' }">
      <UContainer class="flex items-center justify-between py-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-ph-camera" class="text-primary-500" />
          <span class="font-semibold">Film Metadata Logger</span>
        </div>
        <nav class="flex items-center gap-2">
          <UButton to="/" variant="ghost" color="primary">Log</UButton>
          <UButton to="/exposures" variant="ghost" color="primary"
            >History</UButton
          >
          <UButton to="/settings" variant="ghost" color="primary"
            >Settings</UButton
          >
        </nav>
      </UContainer>
    </UHeader>
    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>
  </UApp>
</template>
