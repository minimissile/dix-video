const MAX_PLAYBACK_RATE = 16.0
const MIN_PLAYBACK_RATE = 0.1
const SHOW_DECIMAL_PLACES = 1
const CSS_CLASS_HIDDEN = 'hidden'
// 播放倍速
let playbackRate = null
// 播放自动加速
let isAutoPlay = null

// 快进递增模型
const PLAYBACK_STEPS = {
  0: 0.1,
  1.9: 0.2,
  2.9: 0.5,
  4.9: 1,
  9.9: 2,
}
const PLAYBACK_THRESHOLDS = Object.keys(PLAYBACK_STEPS).map(Number).sort((a, b) => a - b)

// 重置
function reset() {
  playbackRate = null
  isAutoPlay = null
}

// 控件显示面板
function showEl(el) {
  el.classList.remove(CSS_CLASS_HIDDEN)
}

// 隐藏显示面板
function hideEl(el) {
  el.classList.add(CSS_CLASS_HIDDEN)
}

// 显示加速面板
function showContent() {
  // 无视频提示
  var messageEl = document.getElementById('prc-popup-no-content')
  // 有视频提示
  var contentEl = document.getElementById('prc-popup-content')

  hideEl(messageEl)
  showEl(contentEl)
}

// 显示无视频面板
function showNoContentMessage() {
  var messageEl = document.getElementById('prc-popup-no-content')
  var contentEl = document.getElementById('prc-popup-content')

  showEl(messageEl)
  hideEl(contentEl)
}

// 更新当前加速倍速提示
function renderRate() {
  document.getElementById('prc-rate').innerHTML = formatRate(playbackRate)
}

// 同步播放速度至进度条
function setSRateSlider() {
  document.getElementById('prc-rate-slider').value = playbackRate
}

// 同步自动加速复选框
function setSRateCheck() {
  document.getElementById('autoplay').checked = isAutoPlay
}

function formatRate(rate) {
  return rate.toFixed(SHOW_DECIMAL_PLACES) + 'x'
}

// 绑定事件监听
function addCallbacks() {
  document.getElementById('prc-slower').addEventListener('click', slower)
  document.getElementById('prc-faster').addEventListener('click', faster)
  document.getElementById('prc-rate-05').addEventListener('click', () => setPlaybackRate(0.5))
  document.getElementById('prc-rate-08').addEventListener('click', () => setPlaybackRate(0.8))
  document.getElementById('prc-rate-1').addEventListener('click', () => setPlaybackRate(1.0))
  document.getElementById('prc-rate-15').addEventListener('click', () => setPlaybackRate(1.2))
  document.getElementById('prc-rate-2').addEventListener('click', () => setPlaybackRate(1.5))
  document.getElementById('prc-rate-slider').addEventListener('input', e => setPlaybackRate(e.target.value))
  document.getElementById('autoplay').addEventListener('change', e => autoplaybackRate(e.target.checked))
}

// 更新播放速度
function updatePlaybackRate() {
  chrome.tabs.getSelected(null, function (tab) {
    const options = {
      type: "prc-set-playback-rate",
      newPlaybackRate: playbackRate,
      isAutoPlay: isAutoPlay
    }

    chrome.tabs.sendMessage(tab.id, options, function (response) {
      if (response.status === 'success') {
        playbackRate = response.playbackRate
        isAutoPlay = response.isAutoPlay
        renderRate()
        setSRateSlider()
      }
    });
  });
}

// 自动加速播放
function autoplaybackRate(check) {
  chrome.tabs.getSelected(null, function (tab) {
    const options = {
      type: "autoplay-playback-rate",
      value: check,
    }

    chrome.tabs.sendMessage(tab.id, options, function (response) {
      if (response.status === 'success') {
        playbackRate = response.playbackRate,
          isAutoPlay = response.isAutoPlay
        renderRate()
        setSRateSlider()
        setSRateCheck()
      }
    });
  });
}

function getPaybackRateStep() {
  return PLAYBACK_STEPS[PLAYBACK_THRESHOLDS.find((_, i, arr) =>
    playbackRate >= arr[i] && (i + 1 === arr.length || playbackRate <= arr[i + 1])
  )]
}

// 减速播放
function faster() {
  if (playbackRate >= MAX_PLAYBACK_RATE) return

  playbackRate = Math.round((playbackRate + getPaybackRateStep()) * 10) / 10.0
  updatePlaybackRate()
}

function slower() {
  if (playbackRate <= MIN_PLAYBACK_RATE) return

  playbackRate = Math.round((playbackRate - getPaybackRateStep()) * 10) / 10.0
  updatePlaybackRate()
}

// 设置具体播放速度
function setPlaybackRate(newPlaybackRate) {
  playbackRate = newPlaybackRate
  updatePlaybackRate()
}

function checkForPlaybackResources() {
  reset()
  showNoContentMessage()

  // 发送消息至content
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, {type: "prc-get-summary"}, function (response) {
      if (response && response.status === 'success') {
        playbackRate = response.playbackRate
        isAutoPlay = response.isAutoPlay
        showContent()
        renderRate()
        setSRateSlider()
        setSRateCheck()
      }
    })
  })

  // 接收来之content的消息
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.info === 'play') {
      playbackRate = req.playbackRate
      isAutoPlay = req.isAutoPlay
      renderRate()
      setSRateSlider()
      setSRateCheck()
    }

    sendResponse('我收到了你的来信')
    console.log('接收了来自 content.js的消息', req.info)
  })
}

// 初始化
function init() {
  checkForPlaybackResources()
  addCallbacks()
}

document.addEventListener('DOMContentLoaded', init)
