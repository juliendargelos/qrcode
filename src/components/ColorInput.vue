<script setup lang="ts">
  import { computed } from 'vue'

  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText
  } from '@/components/ui/input-group'

  export interface ColorInputProps {

  }

  const props = defineProps<ColorInputProps>()

  const model = defineModel<string>({ default: '#ffffff' })
  const opacity = defineModel<number>('opacity', { default: 1 })

  const opacityDisplayValue = computed({
    get: () => Math.round(opacity.value * 10000) / 100,
    set: (value) => { opacity.value = value / 100 }
  })
</script>

<template>
  <InputGroup>
    <div class="w-[50px]!">
      <InputGroupInput
        type="color"
        class="top-[0.5px] left-[-4.5px] relative pr-0"
        v-model="model"
      />
    </div>
    <InputGroupInput
      type="text"
      v-model="model"
    />
    <div class="flex justify-end items-center pr-3">
      <InputGroupText class="w-fit mr-2">
        Opacity
      </InputGroupText>
      <InputGroupInput
        type="number"
        class="w-[40px] text-end pl-0 pr-1 [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        :step="0.01"
        :min="0"
        :max="100"
        v-model="opacityDisplayValue"
      />
      <InputGroupText>
        %
      </InputGroupText>
    </div>
  </InputGroup>
</template>
