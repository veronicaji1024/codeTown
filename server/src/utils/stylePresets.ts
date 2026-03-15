export function describeVisualPreset(preset: string | null | undefined): string {
  if (!preset) return '现代简洁'

  const presetGuide: Record<string, string> = {
    'warm-hand-drawn': '温馨手绘：温暖色系、轻松手写质感、柔和插画感',
    'minimal-white': '简约现代：大量留白、清爽浅色、干净排版',
    'retro-european': '复古欧式：古典装饰元素、深色调、典雅排版',
    'candy-vivid': '活力糖果：高饱和色彩、明快对比、俏皮动效',
  }

  return presetGuide[preset] || preset
}
