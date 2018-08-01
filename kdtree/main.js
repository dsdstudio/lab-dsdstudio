const canvas = (() => {
  const c = document.getElementsByTagName('canvas')[0]
  c.width = window.innerWidth, c.height = c.clientHeight
  return c
})()
const context = canvas.getContext('2d')

let data = {
  strokes: {}
}
const normalize = (x) => x + 0.5
const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))

canvas.addEventListener('mousedown', ({clientX, clientY}) => {
  let stroke = {color:'#fff', lineWidth: 1, points: [], start:null, end: null, id: Date.now()}
  var previousPoint = {x: clientX, y:clientY}
  const w = canvas.width, h = canvas.height
  stroke.start = previousPoint
  data.strokes[stroke.id] = stroke
  context.save()
  context.strokeStyle = stroke.color
  context.lineWidth = stroke.lineWidth
  context.moveTo(normalize(previousPoint.x), normalize(previousPoint.y))
  
  const mouseDownHandler = ({clientX, clientY}) => {
    let p = {x: clientX, y: clientY}
    stroke.points.push(p)
    context.lineTo(normalize(p.x), normalize(p.y))
    context.stroke()
    console.log('distance', distance(stroke.start, p))
  }

  const mouseUpHandler = ({clientX, clientY}) => {
    stroke.end = {x: clientX, y: clientY}
    canvas.removeEventListener('mousemove', mouseDownHandler)
    canvas.removeEventListener('mouseup', mouseUpHandler)
  }
  canvas.addEventListener('mouseup', mouseUpHandler)
  canvas.addEventListener('mousemove', mouseDownHandler)
})

function render(strokes) {
  context.clearRect(0, 0, canvas.width, canvas.height)
  for (let k in strokes) {
    context.save()
    context.strokeStyle = strokes[k].color
    context.lineWidth = strokes[k].lineWidth
    let previousPoint = strokes[k].start
    context.moveTo(normalize(previousPoint.x), normalize(previousPoint.y))
    strokes[k].points.forEach((p) => {
      context.lineTo(normalize(p.x), normalize(p.y))
    })
    context.stroke()
    context.restore()
  }
}

window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth, canvas.height = canvas.clientHeight
  render(data.strokes)
})
