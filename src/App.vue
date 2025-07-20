<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header
      class="px-6 py-3 flex justify-between items-center border-b bg-white dark:bg-gray-800 gap-4"
    >
      <h1 class="font-semibold text-gray-800 dark:text-gray-100">
        Reading ➜ CDI Draft
      </h1>
      <div class="flex items-center gap-4">
        <!-- Timer (preview mode only) -->
        <div
          v-if="store.previewMode"
          class="flex items-center gap-3 select-none"
        >
          <!-- time badge -->
          <div
            class="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-mono text-sm min-w-[4.5rem] text-center"
          >
            {{ formattedTime }}
          </div>

          <!-- play / pause button -->
          <button
            @click="toggleTimer"
            :aria-label="timerRunning ? 'Pause timer' : 'Play timer'"
            class="w-9 h-9 p-1 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 flex items-center justify-center"
          >
            <PlayIcon v-if="!timerRunning" class="w-5 h-5" aria-hidden="true" />
            <PauseIcon v-else class="w-5 h-5" aria-hidden="true" />
          </button>

          <!-- reset button -->
          <button
            @click="resetTimer"
            aria-label="Reset timer"
            class="w-9 h-9 p-1 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 flex items-center justify-center"
          >
            <ArrowPathIcon class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <!-- Theme switch -->
        <button @click="toggleTheme" class="text-xl">
          {{ isDark ? "🌞" : "🌙" }}
        </button>
        <!-- Preview toggle -->
        <button
          class="px-4 py-2 rounded-md text-base border text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="store.togglePreview()"
        >
          {{ store.previewMode ? "Back to editors" : "Render preview" }}
        </button>
        <!-- Export HTML button -->
        <button
          :disabled="isDownloading"
          @click="handleExport"
          class="px-4 py-2 rounded-md text-base border bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {{ isDownloading ? "Exporting…" : "Export HTML" }}
        </button>
      </div>
    </header>

    <!-- Body -->
    <main class="flex-1 overflow-auto text-gray-800 dark:text-gray-100">
      <!-- Tabs -->
      <div v-if="!store.previewMode" class="px-4 pt-3">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="px-4 py-2 mr-2 rounded-full text-base border"
          :class="
            activeTab === tab
              ? 'bg-gray-200 dark:bg-gray-700'
              : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
      <div
        v-if="!store.previewMode && activeTab === 'Paragraph'"
        class="p-4 h-full"
      >
        <PassageEditor />
      </div>
      <div
        v-if="!store.previewMode && activeTab === 'Questions'"
        class="grid md:grid-cols-2 gap-4 p-4 h-full"
      >
        <QuestionsEditor />
        <BindingPanel :question-ids="questionIds" v-model="bindings" />
      </div>
      <div v-if="store.previewMode" class="grid md:grid-cols-2 h-full">
        <section class="p-4 overflow-auto" v-html="store.passageHtml"></section>
        <aside
          ref="previewAside"
          class="border-l p-4 overflow-auto"
          v-html="renderedQuestionsHtml"
        ></aside>
      </div>
      <footer
        v-if="store.previewMode"
        class="fixed inset-x-0 bottom-0 border-t flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-3 text-base"
      >
        <div class="flex gap-2 overflow-auto">
          <span
            v-for="id in questionIds"
            :key="id"
            class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold"
            :class="badgeClasses[id]"
            >{{ id }}</span
          >
        </div>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 border rounded-md text-base hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="resetAnswers"
          >
            Reset
          </button>
          <button
            class="px-4 py-2 border rounded-md text-base bg-blue-600 text-white hover:bg-blue-700"
            @click="submitAnswers"
          >
            Submit
          </button>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import PassageEditor from "./components/PassageEditorTiny.vue";
import QuestionsEditor from "./components/QuestionsEditorTiny.vue";
import BindingPanel from "./components/BindingPanel.vue";

import { useEditorStore } from "./stores/useEditorStore";

import {
  ref,
  computed,
  reactive,
  onMounted,
  watch as vueWatch,
  nextTick,
  onUnmounted,
} from "vue";

// heroicons
import { PlayIcon, PauseIcon, ArrowPathIcon } from "@heroicons/vue/24/solid";
import { useAdvancedHtmlDownload } from "./composables/useAdvancedHtmlDownload";

const store = useEditorStore();

// download composable
const { isDownloading, downloadPageWithFullFunctionality } =
  useAdvancedHtmlDownload();
const handleExport = () => {
  downloadPageWithFullFunctionality({ filename: "reading-preview.html" });
};

// answer state for preview
const answers = reactive<Record<number, string[] | string>>({});
const submitted = ref(false);

// ---------------- Theme Switcher ----------------
const isDark = ref(
  localStorage.getItem("theme") === "dark" ||
    document.documentElement.classList.contains("dark")
);
function applyTheme() {
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
}
applyTheme();
function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme();
  // force page reload so TinyMCE and any non-reactive libs pick up the new theme in production
  location.reload();
}


// ---------------- Timer (preview only) ----------------
const INITIAL_SEC = 20 * 60;
const timerRemaining = ref(INITIAL_SEC);
const timerRunning = ref(false);
let timerId: number | null = null;

const formattedTime = computed(() => {
  const m = String(Math.floor(timerRemaining.value / 60)).padStart(2, "0");
  const s = String(timerRemaining.value % 60).padStart(2, "0");
  return `${m}:${s}`;
});

function tick() {
  timerRemaining.value--;
  if (timerRemaining.value <= 0) {
    pauseTimer();
  }
}
function playTimer() {
  if (timerRunning.value) return;
  timerRunning.value = true;
  timerId = setInterval(tick, 1000) as unknown as number;
}
function pauseTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  timerRunning.value = false;
}
function toggleTimer() {
  timerRunning.value ? pauseTimer() : playTimer();
}
function resetTimer() {
  pauseTimer();
  timerRemaining.value = INITIAL_SEC;
}

onUnmounted(pauseTimer);
vueWatch(
  () => store.previewMode,
  (val) => {
    if (!val) pauseTimer();
  }
);

function resetAnswers() {
  Object.keys(answers).forEach((k) => delete answers[Number(k)]);
  submitted.value = false;
  // clear DOM controls
  const el = previewAside.value as HTMLElement | null;
  if (el) {
    el.querySelectorAll("input[data-qid], select[data-qid]").forEach(
      (ctrl: any) => {
        if (ctrl.tagName === "INPUT") ctrl.value = "";
        if (ctrl.tagName === "SELECT") ctrl.selectedIndex = 0;
      }
    );
  }
}
function submitAnswers() {
  submitted.value = true;
}
const badgeClasses = computed<Record<number, string>>(() => {
  const cls: Record<number, string> = {};
  questionIds.value.forEach((id) => {
    const val = answers[id];
    const isEmpty =
      !val ||
      (Array.isArray(val) && val.length === 0) ||
      (typeof val === "string" && val === "");
    cls[id] = isEmpty
      ? "!bg-gray-300 !text-gray-800"
      : !submitted.value
      ? "!bg-amber-500 !text-white"
      : "!bg-green-600 !text-white";
  });
  return cls;
});

function statusClass(id: number) {
  const val = answers[id];
  const isEmpty =
    !val ||
    (Array.isArray(val) && val.length === 0) ||
    (typeof val === "string" && val === "");
  if (isEmpty) return "!bg-gray-300 !text-gray-800";
  if (!submitted.value) return "!bg-amber-500 !text-white";
  // after submit and filled
  return "!bg-green-600 !text-white";
}

const previewAside = ref<HTMLElement | null>(null);

function attachListeners() {
  const el = previewAside.value;
  if (!el) return;
  // remove existing listeners by cloning element listeners map (simplified)
  el.querySelectorAll("input[data-qid], select[data-qid]").forEach(
    (ctrl: any) => {
      const old = ctrl.__listener;
      if (old) ctrl.removeEventListener("input", old);
      if (old) ctrl.removeEventListener("change", old);
      const handler = () => {
        const qid = Number(ctrl.getAttribute("data-qid"));
        if (ctrl.tagName === "SELECT" && (ctrl as HTMLSelectElement).multiple) {
          const sel = Array.from(
            (ctrl as HTMLSelectElement).selectedOptions
          ).map((o) => o.value);
          answers[qid] = sel;
        } else {
          answers[qid] = (ctrl as HTMLInputElement | HTMLSelectElement).value;
        }
      };
      ctrl.__listener = handler;
      ctrl.addEventListener("input", handler);
      ctrl.addEventListener("change", handler);
    }
  );
}

const tabs = ["Paragraph", "Questions"];
const activeTab = ref("Paragraph");

const bindings = ref<Record<number, any>>({});

const renderedQuestionsHtml = computed(() => {
  let html = store.questionsHtml;
  const inputClass =
    "border rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800";
  const selectClass =
    "border rounded px-2 py-1 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800";
  return html.replace(/\[\[(\d+)]]/g, (match, idStr) => {
    const id = Number(idStr);
    const b = bindings.value[id] || { type: "input", options: "" };
    const opts = b.options
      .split(",")
      .map((o: string) => o.trim())
      .filter(Boolean);
    switch (b.type) {
      case "select":
      case "radio": {
        const optionsHtml = opts
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("");
        return `<select data-qid="${id}" class="${selectClass}"><option value="" disabled selected hidden>Select...</option>${optionsHtml}</select>`;
      }
      case "checkbox": {
        const optionsHtml = opts
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("");
        return `<select multiple data-qid="${id}" class="${selectClass} h-24"><option value="" disabled selected hidden>Select...</option>${optionsHtml}</select>`;
      }
      default:
        return `<input data-qid="${id}" type="text" class="${inputClass}" placeholder=""/>`;
    }
  });
});

// after html computed so dependency exists
vueWatch(renderedQuestionsHtml, () => nextTick(attachListeners));

const questionIds = computed(() => {
  const ids = new Set<number>();
  const regex = /\[\[(\d+)]]/g;
  let m;
  while ((m = regex.exec(store.questionsHtml))) {
    ids.add(Number(m[1]));
  }
  ids.forEach((id) => {
    if (!bindings.value[id])
      bindings.value[id] = { type: "", options: "", answer: "" };
  });
  return Array.from(ids).sort((a, b) => a - b);
});
</script>

<style scoped>
main {
  min-height: 0; /* allow children overflow-auto to work in flex column */
}
</style>
