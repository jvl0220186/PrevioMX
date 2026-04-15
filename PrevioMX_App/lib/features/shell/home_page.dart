import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../auth/presentation/auth_controller.dart';
import '../session/domain/work_session.dart';
import '../session/presentation/session_controller.dart';
import '../../core/theme/app_theme.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final session = context.watch<SessionController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Previo MX'),
        actions: [
          TextButton(
            onPressed: () async {
              await auth.logout();
              await session.clear();
              if (context.mounted) context.go('/login');
            },
            child: const Text('Salir'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Hola, ${auth.user?.usuario ?? ''}',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            auth.user?.correoElectronico ?? '',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sesión de trabajo', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(session.session?.ubicacionNombre ?? '—'),
                  const SizedBox(height: 4),
                  Text(
                    '${session.session?.perfil.displayName ?? ''} · Equipo: ${auth.user?.equipo ?? '—'}',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),
          FilledButton.icon(
            onPressed: () => context.push('/captura'),
            icon: const Icon(Icons.camera_alt_outlined),
            label: const Text('Captura de etiquetas y documentos'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/ubicacion'),
            icon: const Icon(Icons.swap_horiz),
            label: const Text('Cambiar ubicación'),
          ),
          const SizedBox(height: 32),
          Text(
            'Captura: guías, recepción o cliente/proveedor, escaneo de bultos (14/23 caracteres), '
            'fotos simuladas y placeholder de packing list. La validación con API irá en siguientes entregas.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
