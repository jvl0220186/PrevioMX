import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/capture/presentation/capture_input_mode_controller.dart';
import '../features/session/presentation/session_controller.dart';

class PrevioMxApp extends StatelessWidget {
  const PrevioMxApp({
    super.key,
    required this.authController,
    required this.sessionController,
    required this.captureInputModeController,
    required this.router,
  });

  final AuthController authController;
  final SessionController sessionController;
  final CaptureInputModeController captureInputModeController;
  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: authController),
        ChangeNotifierProvider<SessionController>.value(value: sessionController),
        ChangeNotifierProvider<CaptureInputModeController>.value(value: captureInputModeController),
      ],
      child: MaterialApp.router(
        title: 'Previo MX',
        theme: buildAppTheme(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
