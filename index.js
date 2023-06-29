const fs = require('fs')
const jimp = require('jimp')

// 按指定数分割数组
const changeArrGroup = (arr, spliceNum) => {
  const newArr = []
  for (let i = 0; i < arr.length; i += spliceNum) {
    let tempArr = []
    for (let j = 0; j < spliceNum && i + j < arr.length; j++) {
      tempArr.push(arr[i + j])
    }
    newArr.push(tempArr)
  }
  // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:newArr`, newArr)
  return newArr
}

// 清空目标文件夹
const emptyDir = (path) => {
  try {
    const files = fs.readdirSync(path)
    files.forEach((file) => {
      const filePath = `${path}/${file}`
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        emptyDir(filePath)
      } else {
        fs.unlinkSync(filePath)
      }
    })
  } catch (error) {}
}

// 批量读取文件
const getFilesAndFoldersInDir = (path) => {
  const items = fs.readdirSync(path)
  const result = []
  items.forEach((item) => {
    const itemPath = `${path}/${item}`
    const stat = fs.statSync(itemPath)
    if (stat.isDirectory()) {
      // 文件夹
      let data = { type: 'folder', name: item }
      let children = getFilesAndFoldersInDir(itemPath)
      if (children && children.length) {
        data.children = children
      }
      result.push(data)
    } else {
      // 文件
      result.push({ type: 'file', name: item })
    }
  })
  // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:result`, result)
  return result
}

// 批量处理图片
const cutImgs = async (folderName = '', options = {}) => {
  const { spliceNum = 1, cutFunc = () => {}, outSuffixName = 'out', debug = false } = options
  let elapsed = new Date().getTime()
  const imgDir = `${__dirname}/${folderName}` // 图片目录
  const outDri = `${__dirname}/${folderName}_${outSuffixName}` // 图片输出目录
  const outDriAll = `${__dirname}/imgs_${outSuffixName}_all` // 全部图片输出目录
  emptyDir(outDri) // 清空文件夹
  emptyDir(outDriAll) // 清空文件夹
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:正在清空文件夹`, `${outDri}`)
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:正在清空文件夹`, `${outDriAll}`)
  await new Promise((a) => setTimeout(() => a(true), 1000))

  // 处理单张图片
  const cutImg = async (imgInfo) => {
    const { index, name, filePath, newFilePath } = imgInfo
    return new Promise(async (resolve, reject) => {
      const image = await jimp.read(filePath)
      // image.quality(100) // 质量
      // image.crop(0, 0, 1820, 1024) // 剪切
      // image.cover(1920, 1080) // 尺寸
      // image.resize(3840, 1080) // 尺寸
      // image.cover(3840, 2160) // 尺寸
      cutFunc(image) // 加载传入的处理规则
      await image.writeAsync(newFilePath) // 写到同等目录
      await image.writeAsync(`${outDriAll}/${name}`) // 写入到一个文件夹内
      if (debug) {
        console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:完成第[${index}]张图片${name}`, `=>`, newFilePath)
      }
      resolve(imgInfo)
    })
  }

  let img_list = [] // 汇总所有待处理图片
  let index = 0 // 处理顺序
  // 生成待处理图片方法
  const initFuncs = async (_imgDir, _outDri) => {
    const file_list = getFilesAndFoldersInDir(_imgDir) // 读取文件夹图片
    for (const item of file_list) {
      // 是文件夹并且存在子文件
      if (item.type === 'folder' && item.children) {
        await initFuncs(`${_imgDir}/${item.name}`, `${_outDri}/${item.name}`)
      } else {
        index = index + 1
        const filePath = `${_imgDir}/${item.name}`
        const newFilePath = `${_outDri}/${item.name}`
        const imgInfo = { index, filePath, newFilePath, ...item }
        img_list.push(imgInfo)
      }
    }
  }
  await initFuncs(imgDir, outDri) // 生成任务队列
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:正在处理${img_list.length}张图片`)
  img_list = changeArrGroup(img_list, spliceNum) // 图片分组
  // 遍历所有图片
  for (const imgs of img_list) {
    // 批次处理图片
    const indexs = Array.from(imgs, (item) => item.index)
    if (debug) {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:开始处理[${indexs}]`)
    }
    const arr = Array.from(imgs, (item) => cutImg(item))
    await Promise.all(arr) // 等待当前批次处理完成
  }
  elapsed = new Date().getTime() - elapsed // 总计耗时
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:处理完成,${spliceNum}张/次处理,耗时${elapsed / 1000}s`, `${index}张`)
}

// 处理steam的个人信息壁纸
const init = async () => {
  const cutFunc = (image) => {
    image.quality(100) // 质量
    // image.cover(1920, 1080) // 尺寸
    image.cover(16, 9) // 尺寸
    // image.cover(160, 90) // 尺寸
  }
  // await cutImgs('imgs', { cutFunc, spliceNum: 1, outSuffixName: 'out_1' })
  await cutImgs('imgs', { cutFunc, spliceNum: 5, outSuffixName: 'out_5' })
  // await cutImgs('imgs', { cutFunc, spliceNum: 20, outSuffixName: 'out_20' })
  // await cutImgs('imgs', { cutFunc, spliceNum: 50, outSuffixName: 'out_50' })
  // await cutImgs('imgs', { cutFunc, spliceNum: 100, outSuffixName: 'out_100' })
  // await cutImgs('imgs', { cutFunc, spliceNum: 200, outSuffixName: 'out_200' })
}
init()
