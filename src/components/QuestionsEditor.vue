<template>
  <div class="h-full flex flex-col">
    <h2 class="font-semibold mb-2">Questions</h2>
    <EditorContent :editor="editor" class="border rounded flex-1 overflow-auto" />
    <p class="text-sm text-gray-500 mt-2">
      Tip: represent an answer placeholder with <code>[q1]</code>, <code>[q2]</code>, etc. We'll add rich components later.
    </p>
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
  content: store.questionsHtml,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Write questions here – use [q1], [q2] placeholders…',
    }),
  ],
  onUpdate({ editor }) {
    store.setQuestions(editor.getHTML());
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
