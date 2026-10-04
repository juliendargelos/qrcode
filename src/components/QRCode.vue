<script setup lang="ts">
  import { computed, type ComputedRef } from 'vue'
  import * as corners from '@/utils/corners'
  import * as cornerCells from '@/utils/corner-cells'
  import * as cells from '@/utils/cells'

  export interface QRCodeProps {
    idPrefix?: string
    data?: boolean[][]
    size?: number
    margin?: number
    background?: {
      color?: string
      opacity?: number
    }
    cell?: {
      color?: string
      opacity?: number
      spacing?: number
      radius?: number
      merge?: boolean
      groovy?: boolean
    },
    corner?: {
      color?: string
      opacity?: number
      radius?: number
      groovy?: boolean
    },
    cornerCell?: {
      color?: string
      opacity?: number
      radius?: number
      clip?: boolean
    }
    logo?: {
      url?: string
      svgSource?: string
      size?: number
      margin?: number
    }
  }

  export interface QRCodeExpose {
    maximumCellRadius: ComputedRef<number>
    maximumCellSpacing: ComputedRef<number>
    maximumCornerRadius: ComputedRef<number>
    maximumCornerCellRadius: ComputedRef<number>
    maximumLogoSize: ComputedRef<number>
    maximumLogoMargin: ComputedRef<number>
  }

  const props = withDefaults(defineProps<QRCodeProps>(), {
    idPrefix: 'q',
    margin: 0,
    data: () => []
  })

  const ids = new Map<string, number>()

  const matrixSize = computed(() => props.data.length)

  const logo = computed(() => {
    if (
      (!props.logo?.url && !props.logo?.svgSource) ||
      (props.logo?.size || 0) <= 0
    ) {
      return
    }

    const size = props.logo.size!

    const viewBox = props.logo.svgSource?.match(/viewBox="([^"]+)"/)?.[1] || undefined
    const [rawSvgWidth, rawSvgHeight] = viewBox?.split(' ').slice(2) || []
    const svgWidth = parseFloat(rawSvgWidth || '') || 0
    const svgHeight = parseFloat(rawSvgHeight || '') || 0
    const scale = size / Math.max(svgWidth, svgHeight)

    const svgSource = props.logo.svgSource?.replace(/<svg([^>]*)>/, (
      `<svg$1 transform="translate(${
        svgWidth > svgHeight ? 0 : (size - svgWidth * scale) / 2
      } ${
        svgWidth > svgHeight ? (size - svgHeight * scale) / 2 : 0
      }) scale(${scale})" transform-origin="0 0">`
    ))

    return {
      size,
      margin: props.logo.margin || 0,
      url: props.logo.url,
      svgSource,
      viewBox
    }
  })

  const size = computed(() => !props.size || props.size < 0
    ? matrixSize.value
    : props.size
  )

  const cellSize = computed(() => (
    size.value / matrixSize.value
  ))

  const holeSize = computed(() => {
    if (!logo.value) {
      return 0
    }

    return Math.ceil(logo.value.size + logo.value.margin * 2)
  })

  const margin = computed(() => (
    Math.max(0, props.margin) * cellSize.value
  ))

  const background = computed(() => ({
    color: '#fff',
    opacity: 1,
    ...props.background
  }))

  const cell = computed(() => ({
    color: '#000',
    opacity: 1,
    spacing: 0,
    merge: false,
    groovy: false,
    ...props.cell,
    radius: (props.cell?.radius || 0) * cellSize.value
  }))

  const corner = computed(() => ({
    color: '#000',
    opacity: 1,
    groovy: false,
    ...props.corner,
    radius: (props.corner?.radius || 0) * cellSize.value
  }))

  const cornerCell = computed(() => ({
    color: '#000',
    opacity: 1,
    clip: true,
    ...props.cornerCell,
    radius: (props.cornerCell?.radius || 0) * cellSize.value
  }))

  const maximumCellSpacing = computed(() => (
    cells.maximumSpacing(cellSize.value)
  ))

  const cellSpacing = computed(() => (
    Math.max(0, Math.min(maximumCellSpacing.value, cell.value.spacing))
  ))

  const maximumCellRadius = computed(() => (
    cells.maximumRadius(cellSize.value, cellSpacing.value)
  ))

  const cellRadius = computed(() => (
    Math.max(0, Math.min(maximumCellRadius.value, cell.value.radius))
  ))

  const maximumCornerRadius = computed(() => (
    corners.maximumRadius(cellSize.value)
  ))

  const minimumCornerCellRadius = computed(() => cornerCell.value.clip
    ? cornerCells.minimumRadius(cellSize.value, corner.value.radius)
    : 0
  )

  const maximumCornerCellRadius = computed(() => (
    cornerCells.maximumRadius(cellSize.value)
  ))

  const cornerCellRadius = computed(() => (
    Math.max(
      minimumCornerCellRadius.value,
      Math.min(maximumCornerCellRadius.value, cornerCell.value.radius)
    )
  ))

  const cornerPath = computed(() => (
    corners.path(cellSize.value, corner.value.radius, corner.value.groovy)
  ))

  const cellsPath = computed(() => (
    cells.path(
      props.data,
      cellSize.value,
      cellRadius.value,
      cell.value.groovy,
      cell.value.merge,
      cell.value.spacing,
      holeSize.value
    )
  ))

  defineExpose<QRCodeExpose>({
    maximumCellRadius: computed(() => cellSize.value / 2),
    maximumCellSpacing,
    maximumCornerRadius,
    maximumCornerCellRadius,
    maximumLogoSize: computed(() => (
      matrixSize.value - corners.SIZE * 2
    )),
    maximumLogoMargin: computed(() => (
      Math.floor((matrixSize.value - corners.SIZE * 2) / 2)
    ))
  })

  function id(id: string) {
    let index = ids.get(id)

    if (index === undefined) {
      index = ids.size
      ids.set(id, index)
    }

    return `${props.idPrefix}${index}`
  }
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size + margin * 2"
    :height="size + margin * 2"
    :viewBox="`0 0 ${size + margin * 2} ${size + margin * 2}`"
  >
    <defs>
      <symbol :id="id('corner')">
        <path :d="cornerPath"/>
      </symbol>
      <symbol
        v-if="logo?.svgSource"
        v-html="logo.svgSource"
        :id="id('logo')"
        :viewBox="logo.viewBox"
      />
    </defs>
    <rect
      v-if="background.opacity > 0"
      width="100%"
      height="100%"
      :fill="background.color"
      v-bind="{
        ...(background.opacity < 1 ? { 'fill-opacity': background.opacity } : null)
      }"
    />
    <g
      :fill="corner.color"
      fill-rule="nonzero"
      v-bind="{
        ...(corner.opacity < 1 ? { 'fill-opacity': corner.opacity } : null),
        ...(margin > 0 ? { transform: `translate(${margin} ${margin})` } : null)
      }"
    >
      <use
        v-for="(position, index) in corners.POSITIONS"
        :key="index"
        :href="`#${id('corner')}`"
        :x="position.x * (size - cellSize * corners.SIZE)"
        :y="position.y * (size - cellSize * corners.SIZE)"
      />
    </g>
    <g
      :fill="cornerCell.color"
      v-bind="{
        ...(cornerCell.opacity < 1 ? { 'fill-opacity': cornerCell.opacity } : null),
        ...(margin > 0 ? { transform: `translate(${margin} ${margin})` } : null)
      }"
    >
      <template
        v-for="(position, index) in corners.POSITIONS"
        :key="index"
      >
        <rect
          v-if="cornerCellRadius < maximumCornerCellRadius"
          :x="position.x * (size - cellSize * corners.SIZE) + cellSize * 2"
          :y="position.y * (size - cellSize * corners.SIZE) + cellSize * 2"
          :width="cellSize * 3"
          :height="cellSize * 3"
          v-bind="cornerCellRadius <= 0 ? null : {
            rx: cornerCellRadius,
            ry: cornerCellRadius
          }"
        />
        <circle
          v-else
          :cx="position.x * (size - cellSize * corners.SIZE) + cellSize * 3.5"
          :cy="position.y * (size - cellSize * corners.SIZE) + cellSize * 3.5"
          :r="cellSize * 1.5"
        />
      </template>
    </g>
    <path
      v-if="cellsPath"
      :d="cellsPath"
      :fill="cell.color"
      v-bind="{
        ...(cell.opacity < 1 ? { 'fill-opacity': cell.opacity } : null),
        ...(margin > 0 ? { transform: `translate(${margin} ${margin})` } : null)
      }"
    />
    <use
      v-if="logo?.svgSource"
      :href="`#${id('logo')}`"
      :width="logo.size"
      :height="logo.size"
      :x="(size - logo.size) / 2"
      :y="(size - logo.size) / 2"
    />
    <image
      v-else-if="logo?.url"
      :href="logo.url"
      :width="logo.size * cellSize"
      :height="logo.size * cellSize"
      :x="(size - logo.size * cellSize) / 2"
      :y="(size - logo.size * cellSize) / 2"
    />
  </svg>
</template>
