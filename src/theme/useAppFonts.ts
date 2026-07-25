/**
 * Loads the Archivo family the Modernist system is built on.
 *
 * Returns `true` once the faces are ready (or once loading has failed — we
 * never block the app on a font, the platform sans is an acceptable fallback).
 */
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });

  return loaded || !!error;
}
