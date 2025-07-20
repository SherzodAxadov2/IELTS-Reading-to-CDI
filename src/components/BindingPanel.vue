<template>
  <div class="border-l pl-4 h-full overflow-auto">
    <h2 class="font-semibold mb-2">Enter answers</h2>
    <details
      v-for="qid in questionIds"
      :key="qid"
      :open="active===qid"
      @toggle="handleToggle(qid, $event)"
      class="mb-4 border rounded bg-gray-50 dark:bg-gray-900"
    >
      <summary class="cursor-pointer px-3 py-2 text-sm font-medium">
        {{ qid }} – Answer to the question
      </summary>
      <div class="p-3">
      <label class="block text-xs mb-1">Select section type</label>
      <select
        v-model="bindings[qid].type"
        class="w-full border rounded px-2 py-1 text-gray-800 dark:text-gray-900"
      >
        <option disabled value="">-- choose --</option>
        <option value="input">INPUT</option>
        <option value="select">SELECT</option>
        <option value="radio">RADIO</option>
        <option value="checkbox">CHECKBOX</option>
      </select>

      <template v-if="requiresOptions(bindings[qid].type)">
        <label class="block text-xs mt-2 mb-1">Options (comma-separated)</label>
        <input
          type="text"
          v-model="bindings[qid].options"
          class="w-full border rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
          placeholder="red,green,blue"
        />
      </template>

      <label class="block text-xs mt-2 mb-1">Correct answer{{
        bindings[qid].type === 'checkbox' ? 's (comma-separated)' : ''
      }}</label>
      <label class="block text-xs mt-2 mb-1">Answer</label>
      <template v-if="bindings[qid].type==='input'">
        <input
          type="text"
          v-model="bindings[qid].answer"
          class="w-full border rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
          placeholder="e.g. Paris"
        />
      </template>
      <template v-else-if="['select','radio'].includes(bindings[qid].type)">
        <select
          v-model="bindings[qid].answer"
          class="w-full border rounded px-2 py-1 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
        >
          <option v-for="opt in optionList(bindings[qid].options)" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </template>
      <template v-else-if="bindings[qid].type==='checkbox'">
        <select
          multiple
          v-model="multiAnswers[qid]"
          class="w-full border rounded px-2 py-1 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 h-24"
        >
          <option v-for="opt in optionList(bindings[qid].options)" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </template>
    </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

const props = defineProps<{
  questionIds: number[];
  modelValue: Record<string, {
    type: string;
    options: string;
    answer: string;
  }>;
}>();
const emit = defineEmits<(e: 'update:modelValue', value: typeof props.modelValue) => void>();

// local reactive copy
const bindings = reactive<Record<string, any>>({ ...props.modelValue });
// for checkbox multi-select
const multiAnswers = reactive<Record<string,string[]>>({});
watch(
  multiAnswers,
  () => {
    Object.entries(multiAnswers).forEach(([k, arr])=>{
      bindings[k].answer = (arr as string[]).join(',');
    });
  },
  {deep:true}
);


// ensure defaults for incoming ids
watch(
  () => props.questionIds,
  (ids) => {
    ids.forEach((id:number)=>{
      if(!bindings[id]) bindings[id]={type:'',options:'',answer:''};
    });
  },
  { immediate:true }
);

watch(
  () => props.modelValue,
  (newVal) => {
    Object.assign(bindings, newVal);
  }
);

watch(
  bindings,
  () => {
    emit('update:modelValue', { ...bindings });
  },
  { deep: true }
);

const active = ref<number|null>(null);
function handleToggle(id:number,e:Event){
  const open=(e.target as HTMLDetailsElement).open;
  if(open){
    active.value=id;
  } else if(active.value===id){
    active.value=null;
  }
}

function optionList(opts:string){
  return opts.split(',').map(o=>o.trim()).filter(Boolean);
}

function requiresOptions(t: string) {
  return ['select', 'radio', 'checkbox'].includes(t);
}
</script>

<style scoped>
select:invalid {
  color: gray;
}
</style>
