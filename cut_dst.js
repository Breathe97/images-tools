import { cutImgs } from './cut_imgs.js'

// 处理饥荒开屏壁纸为 1920*1080
const init = async () => {
  const cutFunc = (image) => {
    image.quality(100) // 质量
    image.cover(1920, 1080) // 尺寸
  }
  await cutImgs('imgs', { cutFunc, spliceNum: 5, outSuffixName: 'dst_bg' })
}
init()
