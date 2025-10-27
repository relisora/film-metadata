<script setup lang="ts">
const navItems = [
  { label: "Log", to: "/", icon: "i-ph-plus-circle" },
  { label: "History", to: "/exposures", icon: "i-ph-clock-counter-clockwise" },
  { label: "Settings", to: "/settings", icon: "i-ph-gear" },
];

const route = useRoute();

const isActive = (target: string) => {
  if (target === "/") {
    return route.path === "/";
  }

  return route.path.startsWith(target);
};
</script>

<template>
  <UApp>
    <UMain>
      <UContainer class="py-6 pb-24">
        <div class="mb-6 flex items-center gap-2">
          <UIcon name="i-ph-camera" class="text-primary-500" />
          <span class="text-lg font-semibold">Film Metadata Logger</span>
        </div>
        <slot />
      </UContainer>
    </UMain>
    <nav
      class="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 shadow-inner backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
    >
      <UContainer class="py-2">
        <div class="flex items-center justify-between gap-1">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :variant="isActive(item.to) ? 'solid' : 'ghost'"
            color="primary"
            size="lg"
            class="flex-1 flex-col gap-1 py-2"
          >
            <UIcon :name="item.icon" class="text-lg" />
            <span class="text-xs font-medium">{{ item.label }}</span>
          </UButton>
        </div>
      </UContainer>
    </nav>
  </UApp>
</template>
