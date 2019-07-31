(() => {
  console.log(navigator.mediaDevices)
  const errorEl = document.querySelector('#error-msg')
  const video = document.querySelector('#video')
  const deviceOpts = {
    audio:false,
    video: {facingMode: {exact: 'environment' }}
  }
  navigator.mediaDevices.getUserMedia(deviceOpts).then(stream => {
    errorEl.textContent = errorEl.textContent + '\nsuccess' 
    const videoTracks = stream.getVideoTracks()

    stream.onremovetrack = () => console.log('stream ended')
    window.stream = stream
    video.srcObject = stream
  }).catch(e => {
    errorEl.textContent = errorEl.textContent + '\n' + e 
  })
})()
