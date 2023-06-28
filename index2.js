const { Worker } = require('worker_threads')

const runSerice = (workerData) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData })
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker Thread stopped with exit code ${code}`))
    })
  })
}

const run = async () => {
  const result = await runSerice('Tunde Ednut')
  console.log(result)
}

run().catch((err) => console.error(err))
