<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center mb-2">
      <h2 class="font-semibold flex-1">Questions</h2>
      <button
        @click="insertPlaceholder"
        class="text-sm px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Add question placeholder"
      >
        ➕
      </button>
    </div>
    <TinyEditor v-model="store.questionsHtml" placeholder="Write questions here…" />
    <p class="text-sm text-gray-500 mt-2">
      Tip: use placeholders [[1]], [[2]] to mark answer positions – click ➕ to insert.
    </p>
  </div>
</template>

<script setup lang="ts">
import TinyEditor from "./TinyEditor.vue";
import { useEditorStore } from "../stores/useEditorStore";
const store = useEditorStore();

// insert [[n]] at cursor position
function insertPlaceholder() {
  // determine next index
  const regex = /\[\[(\d+)]]/g;
  let max = 0;
  let m;
  while ((m = regex.exec(store.questionsHtml))) {
    max = Math.max(max, Number(m[1]));
  }
  const next = max + 1;
  // use TinyMCE API if editor active
  // @ts-ignore
  const ed = window.tinymce?.activeEditor;
  if (ed) {
    ed.insertContent(`[[${next}]]`);
    ed.focus();
  } else {
    // fallback append at end
    store.questionsHtml += ` [[${next}]]`;
  }
}
</script>
