const canvas = (() => {
  const c = document.getElementsByTagName('canvas')[0]
  c.width = window.innerWidth, c.height = c.clientHeight
  return c
})()
const context = canvas.getContext('2d')
context.strokeStyle = '#fff'
context.lineWidth = 1

let data = {
  strokes: {}
}
const normalize = (x) => x + 0.5

canvas.addEventListener('mousedown', ({clientX, clientY}) => {
  let stroke = {color:'#fff', lineWidth: 1, points: [], start:null, end: null, id: Date.now()}
  var previousPoint = {x: clientX, y:clientY}
  context.moveTo(normalize(previousPoint.x), normalize(previousPoint.y))
  stroke.start = previousPoint
  const mouseDownHandler = ({clientX, clientY}) => {
    let p = {x: clientX, y: clientY}
    stroke.points.push(p)
    context.lineTo(normalize(p.x), normalize(p.y))
    context.stroke()
  }

  const mouseUpHandler = ({clientX, clientY}) => {
    stroke.end = {x: clientX, y: clientY}
    data.strokes[stroke.id] = stroke
    canvas.removeEventListener('mousemove', mouseDownHandler)
    canvas.removeEventListener('mouseup', mouseUpHandler)
    console.log(data)
  }
  canvas.addEventListener('mouseup', mouseUpHandler)
  canvas.addEventListener('mousemove', mouseDownHandler)
})
