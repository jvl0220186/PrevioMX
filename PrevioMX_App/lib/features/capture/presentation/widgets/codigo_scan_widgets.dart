import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../barcode_scanner_page.dart';
import '../capture_controller.dart';
import '../capture_input_mode_controller.dart';

Future<String?> abrirLectorCamara(BuildContext context) {
  return Navigator.of(context).push<String>(
    MaterialPageRoute(builder: (_) => const BarcodeScannerPage()),
  );
}

/// Fila para capturar guías: escáner + Enter o botón cámara.
class GuiaScanRow extends StatelessWidget {
  const GuiaScanRow({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    final useCamera = context.watch<CaptureInputModeController>().useCameraForCodes;

    void agregar() => c.agregarGuia();

    Future<void> desdeCamara() async {
      final code = await abrirLectorCamara(context);
      if (!context.mounted || code == null) return;
      c.agregarGuiaCodigo(code);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: c.guiaController,
                decoration: InputDecoration(
                  labelText: 'Número de guía',
                  hintText: useCamera ? 'Opcional: escribe o usa cámara' : 'Escanear y pulsar Enter',
                  prefixIcon: const Icon(Icons.qr_code_scanner_outlined),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => agregar(),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: agregar,
              style: FilledButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: const Icon(Icons.add),
            ),
          ],
        ),
        if (useCamera) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: desdeCamara,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Escanear con cámara (QR / barras)'),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Modo scanner: usa la pistola; el Enter del teclado agrega la guía.',
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
            ),
          ),
      ],
    );
  }
}

/// Fila para capturar código de bulto.
class BultoScanRow extends StatelessWidget {
  const BultoScanRow({required this.exigeGuia, super.key});

  final bool exigeGuia;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    final useCamera = context.watch<CaptureInputModeController>().useCameraForCodes;

    void registrar() {
      final err = c.registrarBultoEscaneado(exigeGuia: exigeGuia);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }

    Future<void> desdeCamara() async {
      final code = await abrirLectorCamara(context);
      if (!context.mounted || code == null) return;
      final err = c.registrarBultoDesdeTexto(code, exigeGuia: exigeGuia);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: c.bultoController,
                decoration: InputDecoration(
                  labelText: 'Código de bulto',
                  hintText: useCamera ? '14 o 23 caracteres (o cámara)' : '14 o 23 caracteres — Enter',
                  prefixIcon: const Icon(Icons.inventory_2_outlined),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => registrar(),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: registrar,
              style: FilledButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: const Icon(Icons.add),
            ),
          ],
        ),
        if (useCamera) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: desdeCamara,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Escanear con cámara (QR / barras)'),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Modo scanner: pistola envía el código y Enter registra el bulto.',
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
            ),
          ),
      ],
    );
  }
}

/// Recinto: escanea bulto y **Fotos** para ir a simular fotos antes de cerrar el bulto.
class RecintoBultoContinuarFotosRow extends StatelessWidget {
  const RecintoBultoContinuarFotosRow({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    final useCamera = context.watch<CaptureInputModeController>().useCameraForCodes;

    void continuar() {
      final err = c.iniciarFotosDelBultoRecinto();
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }

    Future<void> desdeCamara() async {
      final code = await abrirLectorCamara(context);
      if (!context.mounted || code == null) return;
      final err = c.iniciarFotosDelBultoRecintoDesdeTexto(code);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: c.bultoController,
                decoration: InputDecoration(
                  labelText: 'Código de bulto',
                  hintText: useCamera ? '14 o 23 caracteres (o cámara)' : '14 o 23 — Enter o botón Fotos',
                  prefixIcon: const Icon(Icons.inventory_2_outlined),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => continuar(),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: continuar,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16)),
              child: const Text('Fotos'),
            ),
          ],
        ),
        if (useCamera) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: desdeCamara,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Escanear con cámara (QR / barras)'),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Modo scanner: escanea al campo; Enter o «Fotos» abre la pantalla de fotos del bulto.',
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
            ),
          ),
      ],
    );
  }
}
