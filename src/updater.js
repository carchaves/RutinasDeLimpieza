// Auto-actualizacion OTA (live-update) contra el repo PUBLICO en GitHub.
// Modo manual de Capgo: se publica el bundle en la rama `ota`
// (update.json + bundle.zip) y la app lo baja al abrir, sin token porque el
// repo es publico. La app sigue andando offline con su web empaquetada; al
// abrir busca una version nueva, la descarga y la aplica en el proximo arranque.
import { CapacitorUpdater } from "@capgo/capacitor-updater";

const REPO = "carchaves/RutinasDeLimpieza";
const OTA_BRANCH = "ota";
const VKEY = "rutinas-limpieza-ota-version";
const RAW = `https://raw.githubusercontent.com/${REPO}/${OTA_BRANCH}`;

function isNative() {
  return !!window.Capacitor?.isNativePlatform?.();
}

/** Marca el bundle actual como sano (si no, Capgo revierte) y busca uno nuevo. */
export async function initUpdater() {
  if (!isNative()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* bundle base */
  }
  void checkForUpdate();
}

async function checkForUpdate() {
  try {
    const metaR = await fetch(`${RAW}/update.json`, { cache: "no-store" });
    if (!metaR.ok) return;
    const { version, checksum } = await metaR.json();
    if (!version || !checksum) return;
    if (localStorage.getItem(VKEY) === version) return;

    const bundle = await CapacitorUpdater.download({
      url: `${RAW}/bundle.zip`,
      version,
      checksum,
    });
    localStorage.setItem(VKEY, version);
    await CapacitorUpdater.set({ id: bundle.id });
  } catch {
    /* sin conexion / sin update: se reintenta en el proximo arranque */
  }
}
