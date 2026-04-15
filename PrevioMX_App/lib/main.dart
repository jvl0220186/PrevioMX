import 'package:flutter/material.dart';

import 'app/app_router.dart';
import 'app/previo_mx_app.dart';
import 'core/network/api_client.dart';
import 'core/storage/auth_session_storage.dart';
import 'core/storage/capture_input_mode_storage.dart';
import 'core/storage/session_preferences_storage.dart';
import 'features/capture/presentation/capture_input_mode_controller.dart';
import 'features/auth/data/auth_api.dart';
import 'features/auth/presentation/auth_controller.dart';
import 'features/session/data/ubicacion_api.dart';
import 'features/session/data/ubicacion_repository.dart';
import 'features/session/presentation/session_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final authSessionStorage = AuthSessionStorage();
  final apiClient = ApiClient(tokenStorage: authSessionStorage.tokenStorage);
  final authApi = AuthApi(apiClient.dio);
  final authController = AuthController(
    authApi: authApi,
    storage: authSessionStorage,
  );

  final ubicacionApi = UbicacionApi(apiClient.dio);
  final ubicacionRepository = UbicacionRepository(api: ubicacionApi);
  final sessionPreferencesStorage = SessionPreferencesStorage();
  final sessionController = SessionController(
    ubicacionRepository: ubicacionRepository,
    storage: sessionPreferencesStorage,
  );

  final captureInputModeStorage = CaptureInputModeStorage();
  final captureInputModeController = CaptureInputModeController(storage: captureInputModeStorage);

  await authController.restoreSession();
  await sessionController.restoreFromStorage();
  await captureInputModeController.load();

  final router = createAppRouter(auth: authController, session: sessionController);

  runApp(
    PrevioMxApp(
      authController: authController,
      sessionController: sessionController,
      captureInputModeController: captureInputModeController,
      router: router,
    ),
  );
}
