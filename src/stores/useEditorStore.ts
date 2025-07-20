import { defineStore } from "pinia";

export const useEditorStore = defineStore("editor", {
  state: () => ({
    passageHtml: "",
    questionsHtml: "",
    previewMode: false,
  }),
  actions: {
    setPassage(html: string) {
      this.passageHtml = html;
    },
    setQuestions(html: string) {
      this.questionsHtml = html;
    },
    togglePreview(value?: boolean) {
      this.previewMode = value ?? !this.previewMode;
    },
  },
});
