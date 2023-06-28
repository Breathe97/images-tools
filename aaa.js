const fc = () => new Promise((res, err) => {
  console.log('res')
  res('return')
})

  
let v = fc()
