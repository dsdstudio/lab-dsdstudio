(() => {
  window.navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  
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

  checkCameraSupport()
  navigator.mediaDevices.getUserMedia(deviceOpts).then(stream => {
    log('success')
    const video = document.querySelector('video')
    const videoTracks = stream.getVideoTracks()

    stream.onremovetrack = () => console.log('stream ended')
    window.stream = stream
    video.srcObject = stream

    video.onloadedmetadata = (e) => video.play()
  }).catch(e => log(e))
  
  function log(s) {
    errorEl.innerHTML = errorEl.innerHTML + `\n${s}`
  }
  function checkCameraSupport() {
    if (navigator.mediaDevices) log('Media device supported')
    else log('Media device not supported')
  }
})()
