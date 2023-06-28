const { index, func, parentPort } = require('worker_threads')

// console.log(`Write-up on how ${workerData} wants to chill with the big boys`)
parentPort.postMessage({ index, status: 'Done' })
