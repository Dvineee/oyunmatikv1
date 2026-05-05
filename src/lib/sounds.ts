const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  message: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
};

export const playSound = (type: keyof typeof SOUNDS) => {
  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Audio play blocked:', e));
  } catch (e) {
    console.error('Sound error:', e);
  }
};
