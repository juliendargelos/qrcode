<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Slider } from '@/components/ui/slider'
  import { Input } from '@/components/ui/input'

  export interface RangeInputProps {
    id?: string
    min?: number
    max?: number
    step?: number
  }

  const props = defineProps<RangeInputProps>()

  const model = defineModel<number>({ default: 0 })

  const sliderModel = ref([model.value])

  watch(model, (value) => {
    sliderModel.value[0] = value
  })

  watch(() => sliderModel.value[0], (value) => {
    model.value = value
  })
</script>

<template>
  <div class="grow-1 shrink-1 flex gap-2 items-center">
    <Input
      class="grow-0 w-[65px] [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
      type="number"
      :id="id"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      v-model="model"
    />
    <Slider
      :min="props.min"
      :max="props.max"
      :step="props.step"
      v-model="sliderModel"
    />
  </div>
</template>
