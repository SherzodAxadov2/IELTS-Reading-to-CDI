<template>
  <div class="h-full flex flex-col">
    <h2 class="font-semibold mb-2">Passage</h2>
    <TinyEditor v-model="store.passageHtml" placeholder="Type or paste the reading passage here…" />
  </div>
</template>

<script setup lang="ts">
import TinyEditor from "./TinyEditor.vue";
import { useEditorStore } from "../stores/useEditorStore";
const store = useEditorStore();
</script>
