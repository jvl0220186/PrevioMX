import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_controller.dart';
import '../data/models/ubicacion_dto.dart';
import '../domain/work_session.dart';
import 'session_controller.dart';

class UbicacionSelectionPage extends StatefulWidget {
  const UbicacionSelectionPage({super.key});

  @override
  State<UbicacionSelectionPage> createState() => _UbicacionSelectionPageState();
}

class _UbicacionSelectionPageState extends State<UbicacionSelectionPage> {
  UbicacionDto? _selected;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SessionController>().loadOpciones();
    });
  }

  Future<void> _continuar() async {
    final sel = _selected;
    if (sel == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona una ubicación (RN_03).')),
      );
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final session = context.read<SessionController>();
    await session.confirmarUbicacion(sel);
    if (session.errorMessage != null) {
      messenger.showSnackBar(SnackBar(content: Text(session.errorMessage!)));
      return;
    }
    router.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final sessionCtl = context.watch<SessionController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ubicación de trabajo'),
        leading: IconButton(
          icon: const Icon(Icons.logout),
          tooltip: 'Cerrar sesión',
          onPressed: () async {
            final router = GoRouter.of(context);
            final auth = context.read<AuthController>();
            final sess = context.read<SessionController>();
            await auth.logout();
            await sess.clear();
            if (context.mounted) router.go('/login');
          },
        ),
      ),
      body: sessionCtl.isLoading && sessionCtl.opciones.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  'Selecciona el recinto o bodega donde operarás (ID_01).',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                ),
                const SizedBox(height: 20),
                if (sessionCtl.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Material(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          sessionCtl.errorMessage!,
                          style: TextStyle(color: Colors.orange.shade900),
                        ),
                      ),
                    ),
                  ),
                ...sessionCtl.opciones.map((u) {
                  final selected = _selected?.id == u.id;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      onTap: () => setState(() => _selected = u),
                      leading: Icon(
                        selected ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: selected ? AppColors.primary : AppColors.textSecondary,
                      ),
                      title: Text(u.nombre),
                      subtitle: Text(
                        '${u.perfil.displayName}'
                        '${u.idNumericoRecinto != null ? ' · ID ${u.idNumericoRecinto}' : ''}'
                        '${u.flujoTerrestre ? ' · Terrestre' : ' · Aéreo'}',
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: sessionCtl.isLoading ? null : _continuar,
                  child: const Text('Confirmar ubicación'),
                ),
              ],
            ),
    );
  }
}
