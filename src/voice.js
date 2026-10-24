// Voz en español. Usa el plugin nativo de Capacitor (TTS del sistema Android)
// y cae al Web Speech API cuando corre en el navegador.
import { TextToSpeech } from "@capacitor-community/text-to-speech";

function isNative() {
  return !!window.Capacitor?.isNativePlatform?.();
}

let warmed = false;

/** Dispara una vez tras un gesto del usuario para "despertar" la síntesis. */
export async function warmVoice() {
  if (warmed) return;
  warmed = true;
  try {
    if (isNative()) {
      await TextToSpeech.speak({ text: " ", lang: "es-ES", rate: 1.0 });
    } else if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  } catch {
    /* no pasa nada */
  }
}

/** Dice un texto. No bloquea el timer: se dispara y seguimos. */
export async function say(text) {
  if (!text) return;
  try {
    if (isNative()) {
      // stop() evita que una frase larga pise a la siguiente.
      try { await TextToSpeech.stop(); } catch {}
      await TextToSpeech.speak({
        text,
        lang: "es-ES",
        rate: 1.05,
        pitch: 1.0,
        volume: 1.0,
        category: "playback",
      });
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";
      u.rate = 1.05;
      const v = window.speechSynthesis
        .getVoices()
        .find((x) => x.lang && x.lang.toLowerCase().startsWith("es"));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* sin voz disponible: la app sigue funcionando igual */
  }
}
