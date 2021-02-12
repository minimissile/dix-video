let isAutoPlay = localStorage.isAutoPlay || false
let playbackRate = localStorage.playbackRate || 1

function getVideoElements() {
  return [].slice.call(document.getElementsByTagName('video'))
}

function getAudioElements() {
  return [].slice.call(document.getElementsByTagName('audio'))
}

function summary(sendResponse) {
  console.log('summary', isAutoPlay, playbackRate)
  if (playbackRate !== null) {
    sendResponse({
      status: "success",
      isAutoPlay: /^true$/i.test(isAutoPlay),
      playbackRate: playbackRate * 1,
    })
  }
}

// 设置视频播放速率
function setElementPlaybackRate(el, playbackRate) {
  el.playbackRate = playbackRate
}

function setPlaybackRate(request, sendResponse) {
  const videos = getVideoElements()
  const audios = getAudioElements()
  playbackRate = request.newPlaybackRate
  localStorage.playbackRate = playbackRate

  videos.forEach(function (video) {
    setElementPlaybackRate(video, playbackRate)
  });

  audios.forEach(function (audio) {
    setElementPlaybackRate(audio, playbackRate)
  });

  summary(sendResponse)
}

async function videoplayel(e) {
  await setElementPlaybackRate(e.target, playbackRate)

  chrome.runtime.sendMessage({
    info: 'play',
    playbackRate: playbackRate * 1,
    isAutoPlay: /^true$/i.test(isAutoPlay)
  }, res => {
    // 答复
    console.log(res)
  })
}

async function audioplayel(e) {
  await setElementPlaybackRate(e.target, playbackRate)
}

// 视频播放结束监听
async function videoplayelEnd(e) {
  localStorage.playbackRate = 1
  await setElementPlaybackRate(e.target, 1)

  chrome.runtime.sendMessage({
    info: 'play',
    playbackRate: 1,
    isAutoPlay: /^true$/i.test(isAutoPlay)
  }, res => {
    // 答复
    console.log(res)
  })
}


// 测试连续视频自动播放
async function test(request, sendResponse) {
  const videos = await getVideoElements()
  const audios = await getAudioElements()
  isAutoPlay = request.value
  localStorage.isAutoPlay = isAutoPlay

  // 如果需要连续自动播放
  if (isAutoPlay) {
    for (let i = 0; i < videos.length; i++) {
      videos[i].playbackRate = playbackRate
      await videos[i].addEventListener('play', videoplayel)
      await videos[i].removeEventListener('ended', videoplayelEnd)
    }

    for (let j = 0; j < audios.length; j++) {
      audios[j].playbackRate = playbackRate
      await audios[j].addEventListener('play', audioplayel)
    }
  } else {
    for (let i = 0; i < videos.length; i++) {
      await videos[i].removeEventListener('play', videoplayel)
      await videos[i].addEventListener('ended', videoplayelEnd)
    }

    for (let j = 0; j < audios.length; j++) {
      await audios[j].removeEventListener('play', videoplayel)
    }
  }

  if (sendResponse) {
    sendResponse({
      status: "success",
      isAutoPlay: /^true$/i.test(isAutoPlay),
      playbackRate: playbackRate * 1,
    })
  }
}

window.onload = function () {
  test({
    value: /^true$/i.test(localStorage.isAutoPlay)
  })
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
  // 初始化
  if (request.type === 'prc-get-summary') {
    summary(sendResponse)
  } else if (request.type === 'prc-set-playback-rate') {
    // 更新播放速度
    setPlaybackRate(request, sendResponse)
  } else if (request.type === 'autoplay-playback-rate') {
    test(request, sendResponse)
  }
})
