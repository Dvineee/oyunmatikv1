const SOUNDS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8b8a72803.mp3',
  success: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
  error: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8badf9f8b.mp3',
  message: 'https://cdn.pixabay.com/audio/2022/03/24/audio_3389c9527f.mp3',
};

export const playSound = (type: keyof typeof SOUNDS) => {
  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.2;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Sessizce başarısız ol (Tarayıcı kısıtlamaları nedeniyle)
      });
    }
  } catch (e) {
    // Ses hatası kritik değil
  }
};
