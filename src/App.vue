<script setup lang="ts">
  import 'vue-sonner/style.css'

  import { ref, shallowRef, useTemplateRef, computed, useId, watchEffect, watch, nextTick } from 'vue'
  import { toast } from 'vue-sonner'
  import { useColorMode, usePreferredColorScheme } from '@vueuse/core'
  import { encode, type QrCodeGenerateResult } from 'uqr'
  import { DownloadIcon, XIcon } from '@lucide/vue'
  import { Card, CardContent } from '@/components/ui/card'
  import { Textarea } from '@/components/ui/textarea'
  import { Input } from '@/components/ui/input'
  import { Switch } from '@/components/ui/switch'
  import { Toaster } from '@/components/ui/sonner'
  import { Button } from '@/components/ui/button'

  import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectItem
  } from '@/components/ui/select'

  import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription
  } from '@/components/ui/field'

  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/components/ui/accordion'

  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'

  import {
    InputGroup,
    InputGroupText,
    InputGroupInput
  } from '@/components/ui/input-group'

  import ColorModeToggle from '@/components/ColorModeToggle.vue'
  import ColorInput from '@/components/ColorInput.vue'
  import RangeInput from '@/components/RangeInput.vue'
  import QRCode from '@/components/QRCode.vue'

  const PRESETS = {
    'basic': {
      cornerRadius: 0,
      cornerGroovy: false,
      cornerCellRadius: 0,
      cellSpacing: 0,
      cellRadius: 0,
      cellMerge: 'none',
    },
    'rounded': {
      cornerRadius: 0.75,
      cornerGroovy: false,
      cornerCellRadius: 0.5,
      cellSpacing: 0,
      cellRadius: 0.3,
      cellMerge: 'straight',
    },
    'groovy': {
      cornerRadius: 1.5,
      cornerGroovy: true,
      cornerCellRadius: 0.75,
      cellSpacing: 0,
      cellRadius: 0.5,
      cellMerge: 'groovy',
    },
    'dots': {
      cornerRadius: 3,
      cornerGroovy: false,
      cornerCellRadius: 0.75,
      cellSpacing: 0.2,
      cellRadius: 0.5,
      cellMerge: 'none',
    },
    'squares': {
      cornerRadius: 0,
      cornerGroovy: false,
      cornerCellRadius: 0,
      cellSpacing: 0.2,
      cellRadius: 0,
      cellMerge: 'none',
    },
    'rounded-squares': {
      cornerRadius: 0.75,
      cornerGroovy: false,
      cornerCellRadius: 0.5,
      cellSpacing: 0.2,
      cellRadius: 0.2,
      cellMerge: 'none',
    }
  } as const

  let context: CanvasRenderingContext2D | undefined

  const id = useId()
  const colorModeSetting = useColorMode()
  const preferredColorScheme = usePreferredColorScheme()

  const colorMode = computed(() => {
    if (
      colorModeSetting.value === 'dark' ||
      colorModeSetting.value === 'light'
    ) {
      return colorModeSetting.value
    }

    return preferredColorScheme.value === 'no-preference'
      ? 'dark'
      : preferredColorScheme.value
  })

  const qrCodeComponent = useTemplateRef('qrCodeComponent')
  const qrCodeRendererComponent = useTemplateRef('qrCodeRendererComponent')
  const logoImageInputComponent = useTemplateRef('logoImageInputComponent')

  const data = ref('')
  const qrCode = shallowRef<QrCodeGenerateResult>()
  const rendering = ref(false)

  const preset = ref<keyof typeof PRESETS | undefined>('basic')
  const size = ref<number>()
  const margin = ref<number>()

  const ecc = ref<'L' | 'M' | 'Q' | 'H'>('M')
  const maskPattern = ref<-1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(-1)
  const boostEcc = ref(true)
  const minVersion = ref(1)
  const maxVersion = ref(40)

  const backgroundColor = ref('#ffffff')
  const backgroundOpacity = ref(1)

  const foregroundColor = ref('#000000')
  const foregroundOpacity = ref(1)

  const cornerColor = ref('#000000')
  const cornerOpacity = ref(1)
  const cornerRadius = ref(0)
  const cornerGroovy = ref(false)

  const cornerCellColor = ref('#000000')
  const cornerCellOpacity = ref(1)
  const cornerCellRadius = ref(0)
  const cornerCellClip = ref(true)

  const cellColor = ref('#000000')
  const cellOpacity = ref(1)
  const cellSpacing = ref(0)
  const cellRadius = ref(0)
  const cellMerge = ref<'none' | 'straight' | 'groovy'>('none')

  const logoUrl = ref<string>()
  const logoSvgSource = ref<string>()
  const logoSize = ref(4)
  const logoMargin = ref(0)
  const hasLogoImageFile = ref(false)

  const invalidMaxVersion = ref(false)

  watchEffect(() => {
    invalidMaxVersion.value = false

    try {
      qrCode.value = encode(data.value, {
        ecc: ecc.value,
        maskPattern: maskPattern.value,
        boostEcc: boostEcc.value,
        minVersion: minVersion.value,
        maxVersion: maxVersion.value,
        border: 0
      })
    } catch (error: any) {
      console.error(error)

      if (error instanceof RangeError && error.message === 'Data too long') {
        invalidMaxVersion.value = true
        toast.error('Data too long for the specified maximum version')
      } else {
        toast.error(error.toString())
      }
    }
  })

  let updatingPreset = false

  watch(foregroundColor, (foregroundColor) => {
    cornerColor.value = foregroundColor
    cornerCellColor.value = foregroundColor
    cellColor.value = foregroundColor
  })

  watch(foregroundOpacity, (foregroundOpacity) => {
    cornerOpacity.value = foregroundOpacity
    cornerCellOpacity.value = foregroundOpacity
    cellOpacity.value = foregroundOpacity
  })

  watch(preset, (preset) => {
    if (preset === undefined) {
      return
    }

    updatingPreset = true
    nextTick(() => {
      updatingPreset = false
    })

    const options = PRESETS[preset]

    cornerRadius.value = options.cornerRadius
    cornerGroovy.value = options.cornerGroovy
    cornerCellRadius.value = options.cornerCellRadius
    cellSpacing.value = options.cellSpacing
    cellRadius.value = options.cellRadius
    cellMerge.value = options.cellMerge
  }, {
    immediate: true
  })

  function clearPreset() {
    if (updatingPreset) {
      return
    }

    preset.value = undefined
  }

  function download(file: File) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(file)

    a.href = url
    a.download = file.name
    a.style.position = 'absolute'
    a.style.opacity = '0'
    a.style.pointerEvents = 'none'

    document.body.appendChild(a)

    a.click()

    document.body.removeChild(a)

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function downloadPNG() {
    try {
      const source = await renderSVG()
      const renderingSize = !size.value || size.value < 0
        ? 512
        : Math.round(size.value)

      context ||= document.createElement('canvas').getContext('2d')!

      context.canvas.width = renderingSize
      context.canvas.height = renderingSize

      const svgBlob = new Blob([source], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()

        image.onload = () => resolve(image)
        image.onerror = (error) => reject(error)
        image.src = url
      })

      context.clearRect(0, 0, renderingSize, renderingSize)
      context.drawImage(image, 0, 0, renderingSize, renderingSize)

      URL.revokeObjectURL(url)

      const blob = await new Promise<Blob>((resolve, reject) => {
        context!.canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        })
      })

      const file = new File([blob], 'qr-code.png', { type: 'image/png' })

      download(file)
    } catch (error) {
      console.error(error)
      toast.error('Failed to render PNG: ' + error)
      return
    }
  }

  async function downloadSVG() {
    try {
      const source = await renderSVG()
      download(new File([source], 'qr-code.svg', { type: 'image/svg+xml' }))
    } catch (error) {
      console.error(error)
      toast.error('Failed to render SVG: ' + error)
    }
  }

  async function renderSVG() {
    rendering.value = true

    while (!qrCodeRendererComponent.value) {
      await nextTick()
    }

    const source = qrCodeRendererComponent.value.$el.outerHTML.replace(/<!--v-if-->/g, '')

    rendering.value = false

    return source
  }

  async function onLogoImageInput() {
    const input: HTMLInputElement = logoImageInputComponent.value?.$el

    if (!input) {
      return
    }

    const file = input.files?.item(0)

    hasLogoImageFile.value = !!file
    logoUrl.value = undefined
    logoSvgSource.value = undefined

    if (!file) {
      return
    }

    const reader = new FileReader()

    if (file.type === 'image/svg+xml') {
      reader.onload = () => {
        logoSvgSource.value = reader.result as string
      }

      reader.readAsText(file)
    } else {
      reader.onload = () => {
        logoUrl.value = reader.result as string
      }

      reader.readAsDataURL(file)
    }
  }

  function clearLogoImageInput() {
    const input: HTMLInputElement = logoImageInputComponent.value?.$el

    if (input) {
      input.files = null
      input.value = ''
    }

    hasLogoImageFile.value = false
    logoUrl.value = undefined
    logoSvgSource.value = undefined
  }
</script>

<template>
  <div>
    <Toaster
      :theme="colorMode"
      position="top-center"
      rich-colors
    />
    <div
      v-if="rendering"
      class="hidden"
    >
      <QRCode
        ref="qrCodeRendererComponent"
        :size="size"
        :data="qrCode!.data"
        :margin="margin"
        :background="{
          color: backgroundColor,
          opacity: backgroundOpacity
        }"
        :cell="{
          color: cellColor,
          opacity: cellOpacity,
          radius: cellRadius,
          spacing: cellSpacing,
          merge: cellMerge !== 'none',
          groovy: cellMerge === 'groovy'
        }"
        :corner="{
          color: cornerColor,
          opacity: cornerOpacity,
          radius: cornerRadius,
          groovy: cornerGroovy
        }"
        :corner-cell="{
          color: cornerCellColor,
          opacity: cornerCellOpacity,
          radius: cornerCellRadius,
          clip: cornerCellClip
        }"
        :logo="{
          size: logoSize,
          margin: logoMargin,
          url: logoUrl,
          svgSource: logoSvgSource
        }"
      />
    </div>
    <div class="p-6 gap-6 md:p-12 flex flex-col min-h-dvh">
      <div class="w-full max-w-md mx-auto flex md:w-fit md:fixed md:top-6 md:right-6">
        <ColorModeToggle class="self-end ml-auto"/>
      </div>
      <Card class="w-full max-w-md mx-auto my-auto">
        <CardContent class="flex flex-col gap-4">
          <Card class="relative w-full max-w-60 mx-auto">
            <div
              class="w-full h-full absolute top-0 left-0"
              :style="{
                backgroundColor,
                opacity: backgroundOpacity
              }"
            />
            <CardContent>
              <QRCode
                ref="qrCodeComponent"
                class="w-full h-auto relative"
                :data="qrCode!.data"
                :background="{
                  opacity: 0
                }"
                :cell="{
                  color: cellColor,
                  opacity: cellOpacity,
                  radius: cellRadius,
                  spacing: cellSpacing,
                  merge: cellMerge !== 'none',
                  groovy: cellMerge === 'groovy'
                }"
                :corner="{
                  color: cornerColor,
                  opacity: cornerOpacity,
                  radius: cornerRadius,
                  groovy: cornerGroovy
                }"
                :corner-cell="{
                  color: cornerCellColor,
                  opacity: cornerCellOpacity,
                  radius: cornerCellRadius,
                  clip: cornerCellClip
                }"
                :logo="{
                  size: logoSize,
                  margin: logoMargin,
                  url: logoUrl,
                  svgSource: logoSvgSource
                }"
              />
            </CardContent>
          </Card>
          <form class="flex flex-col gap-4">
            <Field>
              <Textarea
                class="resize-y"
                placeholder="Enter data to encode"
                v-model="data"
              />
            </Field>

            <Field>
              <FieldLabel :for="`${id}-preset`">
                Preset
              </FieldLabel>
              <Select
                :id="`${id}-preset`"
                v-model="preset"
              >
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Custom"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="basic">
                      Basic
                    </SelectItem>
                    <SelectItem value="rounded">
                      Rounded
                    </SelectItem>
                    <SelectItem value="groovy">
                      Groovy
                    </SelectItem>
                    <SelectItem value="dots">
                      Dots
                    </SelectItem>
                    <SelectItem value="squares">
                      Squares
                    </SelectItem>
                    <SelectItem value="rounded-squares">
                      Rounded squares
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Accordion type="multiple">
              <AccordionItem value="background">
                <AccordionTrigger class="font-semibold">Common</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldLabel class="min-w-[70px] grow-0!">
                        Background
                      </FieldLabel>
                      <ColorInput
                        type="color"
                        v-model="backgroundColor"
                        v-model:opacity="backgroundOpacity"
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field orientation="horizontal" class="items-baseline mt-4">
                      <FieldLabel class="min-w-[70px] grow-0!">
                        Foreground
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <ColorInput
                          type="color"
                          v-model="foregroundColor"
                          v-model:opacity="foregroundOpacity"
                        />
                        <FieldDescription>
                          Foreground colors can also be set individually in the "Cells", "Corner" and "Corner cells" sections.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cells">
                <AccordionTrigger class="font-semibold">Cells</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldLabel class="min-w-[60px] grow-0!">
                        Color
                      </FieldLabel>
                      <ColorInput
                        type="color"
                        v-model="cellColor"
                        v-model:opacity="cellOpacity"
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel :for="`${id}-cell-radius`" class="min-w-[60px] grow-0!">
                        Radius
                      </FieldLabel>
                      <RangeInput
                        :id="`${id}-cell-radius`"
                        :min="0"
                        :max="qrCodeComponent?.maximumCellRadius"
                        :step="0.01"
                        v-model="cellRadius"
                        @update:model-value="clearPreset"
                      />
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-cell-spacing`" class="min-w-[60px]  grow-0!">
                        Spacing
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <RangeInput
                          :id="`${id}-cell-spacing`"
                          :min="0"
                          :max="qrCodeComponent?.maximumCellSpacing"
                          :step="0.01"
                          v-model="cellSpacing"
                          @update:model-value="clearPreset"
                        />
                        <FieldDescription v-if="cellSpacing > 0.5" class="text-destructive text-wrap!">
                          High spacing values may prevent the QR code from being scanned correctly.
                        </FieldDescription>
                      </div>
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-cell-merge`" class="min-w-[60px]">
                        Merge
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <Select
                          :id="`${id}-cell-merge`"
                          v-model="cellMerge"
                          @update:model-value="clearPreset"
                        >
                          <SelectTrigger class="w-full">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">
                                None
                              </SelectItem>
                              <SelectItem value="straight">
                                Straight
                              </SelectItem>
                              <SelectItem value="groovy">
                                Groovy
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Merge style only applies when spacing is 0 and radius isn't 0.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="corners">
                <AccordionTrigger class="font-semibold">Corners</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldLabel class="min-w-[60px] grow-0!">
                        Color
                      </FieldLabel>
                      <ColorInput
                        type="color"
                        v-model="cornerColor"
                        v-model:opacity="cornerOpacity"
                      />
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-corner-radius`" class="min-w-[60px]  grow-0!">
                        Radius
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <RangeInput
                          :id="`${id}-corner-radius`"
                          :min="0"
                          :max="qrCodeComponent?.maximumCornerRadius"
                          :step="0.01"
                          v-model="cornerRadius"
                          @update:model-value="clearPreset"
                        />
                        <FieldDescription v-if="cornerRadius > 3" class="text-destructive text-wrap!">
                          High radius values may prevent the QR code from being scanned correctly.
                        </FieldDescription>
                      </div>
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-corner-groovy`" class="min-w-[60px]">
                        Groovy
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <Switch
                          :id="`${id}-corner-groovy`"
                          v-model="cornerGroovy"
                        />
                        <FieldDescription>
                          Applies when radius is not 0.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="corner-cells">
                <AccordionTrigger class="font-semibold">Corner cells</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldLabel class="min-w-[60px] grow-0!">
                        Color
                      </FieldLabel>
                      <ColorInput
                        type="color"
                        v-model="cornerCellColor"
                        v-model:opacity="cornerCellOpacity"
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel :for="`${id}-corner-cell-radius`" class="min-w-[60px] grow-0!">
                        Radius
                      </FieldLabel>
                      <RangeInput
                        :id="`${id}-corner-cell-radius`"
                        :min="0"
                        :max="qrCodeComponent?.maximumCornerCellRadius"
                        :step="0.01"
                        v-model="cornerCellRadius"
                        @update:model-value="clearPreset"
                      />
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-corner-cell-clip`" class="min-w-[60px]">
                        Clip
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <Switch
                          :id="`${id}-corner-cell-clip`"
                          v-model="cornerCellClip"
                        />
                        <FieldDescription>
                          Automatically clip the cell radius to fit the corner inner radius.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="logo">
                <AccordionTrigger class="font-semibold">Logo</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel class="min-w-[60px] grow-0!">
                        Image
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <InputGroup>
                          <InputGroupInput
                            type="file"
                            ref="logoImageInputComponent"
                            accept="image/*"
                            @input="onLogoImageInput"
                          />
                          <Button
                            v-show="hasLogoImageFile"
                            @click="clearLogoImageInput"
                            variant="ghost"
                            type="button"
                          >
                            <XIcon/>
                          </Button>
                        </InputGroup>
                        <FieldDescription>
                          SVG images are embedded as vectors and bitmap images are embedded as base64 data.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                  <FieldGroup class="mt-4">
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-logo-size`" class="min-w-[60px]">
                        Size
                      </FieldLabel>

                      <div class="grow shrink w-full flex flex-col gap-2">
                        <RangeInput
                          :id="`${id}-logo-size`"
                          :min="0"
                          :max="qrCodeComponent?.maximumLogoSize"
                          :step="0.01"
                          v-model="logoSize"
                        />
                        <FieldDescription>
                          Logo size, measured in module unit and can be fractional.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                  <FieldGroup class="mt-4">
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-logo-margin`" class="min-w-[60px]">
                        Margin
                      </FieldLabel>

                      <div class="grow shrink w-full flex flex-col gap-2">
                        <RangeInput
                          :id="`${id}-logo-margin`"
                          :min="0"
                          :max="qrCodeComponent?.maximumLogoMargin"
                          :step="0.01"
                          v-model="logoMargin"
                        />
                        <FieldDescription>
                          Logo margin, measured in module unit.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion type="multiple">
              <AccordionItem value="encoding">
                <AccordionTrigger class="font-semibold">Encoding</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <FieldLabel :for="`${id}-min-version`" class="min-w-[120px]">
                        Minimum version
                      </FieldLabel>
                      <Select
                        :id="`${id}-min-version`"
                        v-model="minVersion"
                      >
                        <SelectTrigger class="w-full">
                          <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              v-for="n in 40"
                              :key="n"
                              :value="n"
                            >
                              {{ n }}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel :for="`${id}-max-version`" class="min-w-[120px]">
                        Maximum version
                      </FieldLabel>
                      <Select
                        :id="`${id}-max-version`"
                        v-model="maxVersion"
                      >
                        <SelectTrigger
                          class="w-full"
                          :aria-invalid="invalidMaxVersion"
                        >
                          <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              v-for="n in 40"
                              :key="n"
                              :value="n"
                            >
                              {{ n }}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-mask-pattern`" class="min-w-[120px]">
                        Mask pattern
                      </FieldLabel>
                      <div class="grow shrink w-full">
                        <Select
                          :id="`${id}-mask-pattern`"
                          v-model="maskPattern"
                        >
                          <SelectTrigger class="w-full">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem :value="-1">
                                Auto
                              </SelectItem>
                              <SelectItem
                                v-for="n in 8"
                                :key="n"
                                :value="n - 1"
                              >
                                {{ n - 1 }}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-ecc`" class="min-w-[120px]">
                        Error correction level
                      </FieldLabel>
                      <div class="grow shrink w-full">
                        <Select
                          :id="`${id}-ecc`"
                          v-model="ecc"
                        >
                          <SelectTrigger class="w-full">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="L">
                                L (7%)
                              </SelectItem>
                              <SelectItem value="M">
                                M (15%)
                              </SelectItem>
                              <SelectItem value="Q">
                                Q (25%)
                              </SelectItem>
                              <SelectItem value="H">
                                H (30%)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </Field>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-boost-ecc`" class="min-w-[120px]">
                        Boost ECC
                      </FieldLabel>
                      <div class="grow shrink w-full flex flex-col gap-2">
                        <Switch
                          :id="`${id}-boost-ecc`"
                          v-model="boostEcc"
                        />
                        <FieldDescription>
                          Boost the error correction level to the maximum allowed by the version and size.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rendering">
                <AccordionTrigger class="font-semibold">Rendering</AccordionTrigger>
                <AccordionContent class="pt-1">
                  <FieldGroup>
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-size`" class="min-w-[60px]">
                        Size
                      </FieldLabel>

                      <div class="grow shrink w-full flex flex-col gap-2">
                        <InputGroup>
                          <InputGroupInput
                            placeholder="Optimal"
                            :id="`${id}-size`"
                            type="number"
                            :min="0"
                            class="[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                            v-model="size"
                          />
                          <InputGroupText class="pr-2">px</InputGroupText>
                        </InputGroup>
                        <FieldDescription>
                          When set to "Optimal" or 0, the rendering size will be calculated for pixel-accurate SVG with 1x1px modules. If exported to PNG, it will default to 512px.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                  <FieldGroup class="mt-4">
                    <Field orientation="horizontal" class="items-baseline">
                      <FieldLabel :for="`${id}-margin`" class="min-w-[60px]">
                        Margin
                      </FieldLabel>

                      <div class="grow shrink w-full flex flex-col gap-2">
                        <InputGroup>
                          <InputGroupInput
                            placeholder="No margin"
                            :id="`${id}-margin`"
                            type="number"
                            :min="0"
                            :step="0.01"
                            class="[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                            v-model="margin"
                          />
                          <InputGroupText class="pr-2">modules</InputGroupText>
                        </InputGroup>
                        <FieldDescription>
                          Adds a margin around the rendered image, measured in module unit and can be fractional.
                        </FieldDescription>
                      </div>
                    </Field>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="default" size="lg" class="w-full">
                <DownloadIcon/> Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="downloadSVG">SVG</DropdownMenuItem>
              <DropdownMenuItem @click="downloadPNG">PNG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
