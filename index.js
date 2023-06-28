const fs = require('fs')
const Jimp = require('jimp')

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
      let data = {
        // 文件夹
        type: 'folder',
        name: item
      }
      let children = getFilesAndFoldersInDir(itemPath)
      if (children && children.length) {
        data.children = children
      }
      result.push(data)
    } else {
      // 文件
      result.push({
        type: 'file',
        name: item
      })
    }
  })
  // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:result`, result)
  return result
}

// 批量处理图片
const cutImgs = async (folderName = '', options = {}) => {
  const { spliceNum = 1, cutFunc = () => {} } = options
  let elapsed = new Date().getTime()
  const imgDir = `${__dirname}/${folderName}` // 图片目录
  const outDri = `${__dirname}/${folderName}_out` // 图片输出目录
  emptyDir(outDri) // 清空文件夹

  // 处理单张图片
  const cutImg = (name, { _imgDir, _outDri, index }) => {
    const filePath = `${_imgDir}/${name}`
    const newFilePath = `${_outDri}/${name}`
    return async () => {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:处理第[${index}]张图片${name}`, `=>`, newFilePath)
      const image = await Jimp.read(filePath)
      // image.quality(100) // 质量
      // image.crop(0, 0, 1820, 1024) // 剪切
      // image.cover(1920, 1080) // 尺寸
      // image.resize(3840, 1080) // 尺寸
      // image.cover(3840, 2160) // 尺寸
      cutFunc(image) // 加载传入的处理规则
      // await new Promise((a) => setTimeout(() => a(true), 3000))
      await image.writeAsync(newFilePath)
    }
  }

  let index = 0 // 处理顺序
  let funcs = [] // 汇总所有待处理图片
  // 生成待处理图片方法
  const initFuncs = async (_imgDir, _outDri) => {
    const list_imgs = getFilesAndFoldersInDir(_imgDir) // 读取文件夹图片
    for (const item of list_imgs) {
      // 是文件夹并且存在子文件
      if (item.type === 'folder' && item.children) {
        _imgDir = `${_imgDir}/${item.name}`
        _outDri = `${_outDri}/${item.name}`
        await initFuncs(_imgDir, _outDri)
      } else {
        index = index + 1
        const func = cutImg(item.name, { index, _imgDir, _outDri })
        funcs.push(func)
      }
    }
  }
  await initFuncs(imgDir, outDri) // 生成任务队列
  funcs = changeArrGroup(funcs, spliceNum) // 拆分任务队列
  // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:funcs`, funcs)
  // 执行所有任务队列
  for (const list of funcs) {
    // 任务某一队列
    await new Promise((resolve, reject) => {
      let count = list.length
      for (const funcs_item of list) {
        let work = async () => {
          await funcs_item()
          count -= 1
          if (count === 0) {
            resolve(true)
          }
        }
        work()
      }
    })
  }
  elapsed = new Date().getTime() - elapsed // 总计耗时
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:处理完成,耗时${elapsed / 1000}s`, `${index}张`)
}

// 处理饥荒加载页面壁纸
{
  const cutFunc = (image) => {
    image.quality(100) // 质量
    image.crop(0, 0, 1820, 1024) // 剪切
    image.cover(1920, 1080) // 尺寸
  }
  // cutImgs('imgs', { cutFunc })
}

// 处理steam的个人信息壁纸
{
  const cutFunc = (image) => {
    image.quality(100) // 质量
    image.cover(1920, 1080) // 尺寸
  }
  cutImgs('imgs', { cutFunc, spliceNum: 3 })
}
