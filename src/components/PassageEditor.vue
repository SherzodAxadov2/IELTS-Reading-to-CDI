<template>
  <div class="h-full flex flex-col">
    <h2 class="font-semibold mb-2">Passage</h2>
    <EditorContent :editor="editor" class="border rounded flex-1 overflow-auto" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditorStore } from "../stores/useEditorStore";

const store = useEditorStore();

const editor = useEditor({
  content: store.passageHtml,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Type or paste the reading passage here…',
    }),
  ],
  onUpdate({ editor }) {
    store.setPassage(editor.getHTML());
  },
});

onMounted(() => {
  if (editor.value) editor.value.commands.focus("end");
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.ProseMirror {
  padding: 0.5rem;
  min-height: 300px;
}
</style>
