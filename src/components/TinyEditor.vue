<template>
  <Editor api-key="zjbnl8ll74pjzq7ctti99y3r515oxw7sokk8736zbv0oyjzj" :tinymce-script-src="tinymceSrc"
    v-model="localContent"
    :init="initOptions"
    :disabled="disabled"
    @blur="emitUpdate"
    class="w-full h-full"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Editor from "@tinymce/tinymce-vue";
// @ts-ignore - optional typing

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

const localContent = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    if (val !== localContent.value) localContent.value = val;
  }
);

function emitUpdate() {
  emit("update:modelValue", localContent.value);
}

watch(
  localContent,
  (val) => {
    emit("update:modelValue", val);
  }
);

const tinymceSrc = "/node_modules/tinymce/tinymce.min.js";

const dark = document.documentElement.classList.contains("dark");

const contentStyleBase = "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }";
const initOptions = {
  skin: dark ? "oxide-dark" : "oxide",
  content_css: dark ? "dark" : "default",
  content_style: dark ? `${contentStyleBase}; color:#f8fafc; background-color:#1e293b;` : contentStyleBase,
  height: 400,
  menubar: false,
  placeholder: props.placeholder ?? "",
  toolbar_mode: 'sliding',
  plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
  toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
};
</script>
