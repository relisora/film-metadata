<script setup lang="ts">
const appConfig = useAppConfig();
</script>

<template>
  <NuxtLayout :toaster="appConfig.toaster">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>
