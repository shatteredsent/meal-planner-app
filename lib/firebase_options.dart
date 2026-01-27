import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show kIsWeb;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    throw UnsupportedError(
      'DefaultFirebaseOptions are not supported for this platform.',
    );
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBaX86hPSdbaLj_nECvc2C_aCKLInqtkKo',
    appId: '1:933624721032:web:bf908843cc2301ca5a793d',
    messagingSenderId: '933624721032',
    projectId: 'mealplannerapp-65b06',
    storageBucket: 'mealplannerapp-65b06.appspot.com',
  );
}
