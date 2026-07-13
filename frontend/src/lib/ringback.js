let audio = null;

export const startRingback = () => {
  if (!audio) {
    audio = new Audio("/sounds/ringback.mp3");
    audio.loop = true;
  }

  audio.currentTime = 0;

  audio.play().catch(() => {});
};

export const stopRingback = () => {
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
};