import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/capture/presentation/capture_controller.dart';
import '../features/capture/presentation/capture_flow_page.dart';
import '../features/session/presentation/session_controller.dart';
import '../features/session/presentation/ubicacion_selection_page.dart';
import '../features/shell/home_page.dart';

GoRouter createAppRouter({
  required AuthController auth,
  required SessionController session,
}) {
  final refresh = Listenable.merge([auth, session]);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final authed = auth.isAuthenticated;
      final ubic = session.hasUbicacion;

      if (!authed) {
        return loc == '/login' ? null : '/login';
      }
      if (!ubic) {
        return loc == '/ubicacion' ? null : '/ubicacion';
      }
      if (loc == '/login' || loc == '/ubicacion') {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/ubicacion',
        builder: (context, state) => const UbicacionSelectionPage(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/captura',
        builder: (context, state) {
          final session = context.read<SessionController>().session;
          if (session == null) {
            return const Scaffold(body: Center(child: Text('Sin ubicación de trabajo')));
          }
          return ChangeNotifierProvider(
            create: (_) => CaptureController(workSession: session),
            child: const CaptureFlowPage(),
          );
        },
      ),
    ],
  );
}
