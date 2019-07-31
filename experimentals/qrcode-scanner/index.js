(() => {
  const errorEl = document.querySelector('#error-msg')
  const deviceOpts = {
    audio:false,
    video: {
      width: 1280,
      height: 720,
      frameRate: { ideal: 10, max: 30 },
      facingMode: { exact: 'environment' }
    }
  }
  navigator.mediaDevices.getUserMedia(deviceOpts).then(stream => {
    errorEl.textContent = errorEl.textContent + '\nsuccess' 
    const video = document.querySelector('video')
    const videoTracks = stream.getVideoTracks()

    stream.onremovetrack = () => console.log('stream ended')
    window.stream = stream
    video.srcObject = stream
  }).catch(e => {
    errorEl.textContent = errorEl.textContent + '\n' + e 
  })
})()
