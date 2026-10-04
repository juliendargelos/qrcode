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

  const svgSource = `
    <svg width="19px" height="13px" viewBox="0 0 19 13" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <path fill="#ff0000" d="M3.46533962,10.0625301 L7.98055849,10.0625301 L7.98055849,11.2242714 C7.98055849,12.3920038 8.54347075,12.9489189 9.7291566,12.9489189 L15.6636075,12.9489189 C16.8493057,12.9489189 17.4182396,12.3920038 17.4182396,11.2242714 L17.4182396,7.47556321 C17.4182396,6.30783208 16.8493057,5.75091698 15.6636075,5.75091698 L14.4240698,5.75091698 L14.4240698,1.90638774 C14.4240698,0.672785849 13.7952868,0.05 12.5437302,0.05 L3.46533962,0.05 C2.20778585,0.05 1.585,0.672785849 1.585,1.90638774 L1.585,8.21212358 C1.585,9.44572547 2.20778585,10.0625301 3.46533962,10.0625301 Z M3.4773217,9.09840472 C2.87847547,9.09840472 2.5491217,8.78102075 2.5491217,8.15823491 L2.5491217,1.96028868 C2.5491217,1.33750283 2.87847547,1.0141217 3.4773217,1.0141217 L12.5317113,1.0141217 C13.1185509,1.0141217 13.4598623,1.33750283 13.4598623,1.96028868 L13.4598623,5.75091698 L9.7291566,5.75091698 C8.54347075,5.75091698 7.98055849,6.30783208 7.98055849,7.47556321 L7.98055849,9.09840472 L3.4773217,9.09840472 Z M3.80069057,1.87645094 C3.56714434,1.87645094 3.38748679,2.03812925 3.38748679,2.25372075 C3.38748679,2.37946509 3.42940566,2.4693 3.52522547,2.56510755 L4.79474906,3.8346434 L4.23184906,4.3975434 C3.93841698,4.69097547 4.11807453,5.06824528 4.52528113,5.13411604 L6.51939528,5.43951792 C6.79486038,5.48143679 7.00445472,5.27184245 6.96853302,4.99637736 L6.66311887,2.99626604 C6.59724811,2.57708962 6.2199783,2.39743208 5.92056132,2.70284623 L5.35766132,3.26574623 L4.09412264,1.99621038 C4.00428774,1.90638774 3.91446509,1.87645094 3.80069057,1.87645094 Z"/>
    </svg>
  `
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
