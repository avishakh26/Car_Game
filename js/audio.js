// ============================================================
// AUDIO.JS — Music player: auto-loads MP3s from project root
// ============================================================

const Audio = (() => {
  const el = document.getElementById('audioEl');
  let tracks = [];
  let current = 0;
  let isPlaying = false;

  el.volume = 0.7;
  el.addEventListener('ended', () => next());

  // All MP3 filenames in d:/car/ (same folder as index.html)
  const DEFAULT_FILES = [
    "'Bhar Do Jholi Meri'  LYRICAL  Adnan Sami Pritam  Bajrangi Bhaijaan  Lyrics Fizz.mp3",
    "A.R. Rahman - Tum Tak Best Lyric VideoRaanjhanaaSonam KapoorDhanushJaved Ali.mp3",
    "Aaj Din Chadheya - Lyrical Video  Saif Ali Khan, Deepika P  Love Aaj Kal  Rahat Fateh Ali Khan.mp3",
    "Abhi Na Jao Chhod Kar  Audio Song  अभ न जओ छड़कर  Mohammed Rafi  Asha Bhosle  Hum Dono.mp3",
    "Chaudhary   Amit Trivedi feat Mame Khan, Coke Studio @ MTV Season 2 #jiralkhokhar.mp3",
    "Ei To Hethay Kunja Chhayay with lyrics  এই ত হথয় কঞজছয়য়   Kishore Kumar  Ruma Devi.mp3",
    "Hum Tere Pyar Main Sara Alam Kho Baithe-Dil Ek Mandir.mp3",
    "Itna Na Mujhse Tu Pyaar Badha (Duet) - HD Video  Chhaya(1961)  Lata Mangeshkar  Sunil D, Asha P.mp3",
    "Jahan Mein Aesa Kaun Hai  Hum Dono  Asha Bhosle  Dev Anand  Sahir Ludhianvi  Old Is Gold.mp3",
    "LEVEL FIVE - TUMI (Official Lyric Video).mp3",
    "Long Distance Love  Coke Studio Bangla  Season 3  Ankan X Afrin  Shuvendu.mp3",
    "Mere Mehboob Qayamat Hogi  (Original) - Mr. X In Bombay - Kishore Kumar's Greatest Hits - Old Songs.mp3",
    "Mere Samne Wali Khidki Mein - Padosan - Saira Banu, Sunil Dutt & Kishore Kumar - Old Hindi Songs.mp3",
    "Pyaasa Movie Sad Song - Humne Toh Bas Kaliyan Maangi Kaanto Ka Haar Mila - Hemant Kumar - Guru Dutt.mp3",
    "Stephen Sanchez, Em Beihold - Until I Found You (Lyrics)(I would never fall in love again).mp3",
    "yung kai - blue (Lyrics).mp3",
  ];

  function _name(f) { return f.replace(/\.mp3$/i, ''); }

  function updateTrackDisplay() {
    const nameEl = document.getElementById('trackName');
    if (!nameEl) return;
    nameEl.textContent = tracks.length ? tracks[current].name : 'No music loaded';
    const btn = document.getElementById('playPauseBtn');
    if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
  }

  function playCurrent() {
    if (!tracks.length) return;
    el.src = tracks[current].url;
    el.play().then(() => { isPlaying = true; updateTrackDisplay(); }).catch(err => {
      console.warn('Audio play blocked:', err);
    });
  }

  // Called on "Begin Journey" click — respects browser autoplay policy
  function startPlayback() {
    if (tracks.length > 0 && !isPlaying) {
      playCurrent();
    }
  }

  function loadFiles(files) {
    tracks.forEach(t => { if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); });
    tracks = [];
    Array.from(files).forEach(f => {
      tracks.push({ name: _name(f.name), url: URL.createObjectURL(f) });
    });
    current = 0;
    if (tracks.length) playCurrent();
    updateTrackDisplay();
  }

  function next() {
    if (!tracks.length) return;
    current = (current + 1) % tracks.length;
    playCurrent();
  }

  function prev() {
    if (!tracks.length) return;
    current = (current - 1 + tracks.length) % tracks.length;
    playCurrent();
  }

  function togglePlay() {
    if (!tracks.length) return;
    if (isPlaying) { el.pause(); isPlaying = false; }
    else { el.play().then(() => { isPlaying = true; }); }
    updateTrackDisplay();
  }

  function setVolume(v) { el.volume = parseFloat(v); }

  function init() {
    // Probe each file — add to playlist only if it can load
    // Shuffle order first for variety
    const shuffled = [...DEFAULT_FILES].sort(() => Math.random() - 0.5);
    let probed = 0;
    shuffled.forEach(filename => {
      const probe = new window.Audio();
      probe.preload = 'metadata';

      probe.addEventListener('loadedmetadata', () => {
        tracks.push({ name: _name(filename), url: filename });
        probed++;
        if (probed === 1) updateTrackDisplay(); // Show first loaded track
      }, { once: true });

      probe.addEventListener('error', () => {
        // File couldn't be loaded (normal on file:// for some browsers)
        // Fall through — won't be added to playlist
      }, { once: true });

      probe.src = filename;
      probe.load();
    });

    updateTrackDisplay();
  }

  return { init, loadFiles, next, prev, togglePlay, setVolume, startPlayback };
})();
