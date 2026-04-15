import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/proveedores_catalog.dart';
import '../domain/rrna_resultado.dart';
import 'capture_controller.dart';
import 'widgets/codigo_scan_widgets.dart';

/// Asistente: guías, recepción / cliente-proveedor, bultos, etiquetas simuladas, packing list (placeholder).
class CaptureFlowPage extends StatelessWidget {
  const CaptureFlowPage({super.key});

  static const Color _progressTrack = Color(0xFFE5E2DC);

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final ok = await _confirmarSalir(context);
        if (ok && context.mounted) context.pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(c.esRecinto ? 'Captura — Recinto' : 'Captura — Bodega'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () async {
              final ok = await _confirmarSalir(context);
              if (ok && context.mounted) context.pop();
            },
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (c.step + 1) / c.stepCount,
                        minHeight: 6,
                        backgroundColor: _progressTrack,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    c.stepLabel,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: c.esRecinto ? _RecintoBody(step: c.step) : _BodegaBody(step: c.step),
              ),
            ),
            const _BottomBar(),
          ],
        ),
      ),
    );
  }

  static Future<bool> _confirmarSalir(BuildContext context) async {
    final r = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Salir de la captura?'),
        content: const Text('Se perderá el progreso no enviado al servidor.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Salir')),
        ],
      ),
    );
    return r ?? false;
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    final step = c.step;

    if (c.esRecinto && step == 2 && c.recintoVistaFotosBulto) {
      return Material(
        elevation: 8,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                OutlinedButton(
                  onPressed: () => _confirmarVolverAEscaneo(context, c),
                  child: const Text('Volver a escaneo'),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      );
    }

    if (c.esRecinto && step == 2 && !c.recintoVistaFotosBulto) {
      return Material(
        elevation: 8,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (step > 0)
                  OutlinedButton(onPressed: () => c.anterior(), child: const Text('Atrás'))
                else
                  const SizedBox(width: 88),
                const Spacer(),
              ],
            ),
          ),
        ),
      );
    }

    return Material(
      elevation: 8,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (step > 0)
                OutlinedButton(onPressed: () => c.anterior(), child: const Text('Atrás'))
              else
                const SizedBox(width: 88),
              const Spacer(),
              FilledButton(
                onPressed: () => _onSiguiente(context, c),
                child: Text(step >= c.stepCount - 1 ? 'Finalizar' : 'Siguiente'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static Future<void> _confirmarVolverAEscaneo(BuildContext context, CaptureController c) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Volver al escaneo?'),
        content: const Text('Se descartará el bulto en curso y las fotos no guardadas.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Volver')),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      c.volverAEscaneoRecintoDescartar();
    }
  }

  static void _onSiguiente(BuildContext context, CaptureController c) {
    final messenger = ScaffoldMessenger.of(context);

    if (c.esRecinto) {
      switch (c.step) {
        case 0:
          if (c.guias.isEmpty) {
            messenger.showSnackBar(const SnackBar(content: Text('Agrega al menos una guía.')));
            return;
          }
          break;
        case 1:
          final msgRec = c.validarRecepcionRecintoMensaje();
          if (msgRec != null) {
            messenger.showSnackBar(SnackBar(content: Text(msgRec)));
            return;
          }
          break;
        case 2:
          messenger.showSnackBar(
            const SnackBar(
              content: Text(
                'Completa cada bulto con fotos y «Cerrar bulto». Usa «Cerrar previo» para ir a documentos.',
              ),
            ),
          );
          return;
        case 3:
          c.reiniciarCaptura();
          if (context.mounted) context.pop();
          messenger.showSnackBar(
            const SnackBar(content: Text('Listo para integrar packing list / PDF / IA con la API.')),
          );
          return;
      }
    } else {
      switch (c.step) {
        case 0:
          if (c.bultos.isEmpty) {
            messenger.showSnackBar(
              const SnackBar(content: Text('Escanea el bulto 1 (código 14 u 23 caracteres).')),
            );
            return;
          }
          break;
        case 1:
          if (c.guias.isEmpty) {
            messenger.showSnackBar(const SnackBar(content: Text('Agrega las guías del mismo recibo.')));
            return;
          }
          break;
        case 2:
          final msgBod = c.validarBodegaClienteProveedorMensaje();
          if (msgBod != null) {
            messenger.showSnackBar(SnackBar(content: Text(msgBod)));
            return;
          }
          break;
        case 3:
          if (!c.puedeCerrarEtiquetas) {
            messenger.showSnackBar(
              const SnackBar(
                content: Text('Cada bulto requiere al menos una foto de etiqueta (simulada).'),
              ),
            );
            return;
          }
          break;
        case 4:
          c.reiniciarCaptura();
          if (context.mounted) context.pop();
          messenger.showSnackBar(
            const SnackBar(content: Text('Listo para integrar packing list / PDF / IA con la API.')),
          );
          return;
      }
    }

    if (c.step < c.stepCount - 1) {
      c.siguiente();
    }
  }
}

class _RecintoBody extends StatelessWidget {
  const _RecintoBody({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return switch (step) {
      0 => const _GuiasStep(esRecinto: true),
      1 => const _RecepcionRecintoStep(),
      2 => const _RecintoCapturaBultosCicloStep(),
      3 => const _PackingListPlaceholder(),
      _ => const SizedBox.shrink(),
    };
  }
}

class _BodegaBody extends StatelessWidget {
  const _BodegaBody({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return switch (step) {
      0 => const _PrimerBultoBodegaStep(),
      1 => const _GuiasStep(esRecinto: false),
      2 => const _ClienteProveedorBodegaStep(),
      3 => const _BultosAdicionalesBodegaStep(),
      4 => const _PackingListPlaceholder(),
      _ => const SizedBox.shrink(),
    };
  }
}

class _GuiasStep extends StatelessWidget {
  const _GuiasStep({required this.esRecinto});

  final bool esRecinto;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          esRecinto ? 'Guías de arribo' : 'Guías del mismo recibo',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          esRecinto
              ? 'Ingresa o escanea los números de guía. Mismo cliente se validará vía API.'
              : 'Todas las guías deben corresponder al mismo cliente.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        const GuiaScanRow(),
        const SizedBox(height: 16),
        if (c.guias.isEmpty)
          Text('Sin guías aún.', style: TextStyle(color: AppColors.textSecondary))
        else
          ...c.guias.map(
            (g) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(g),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () => c.quitarGuia(g),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _RecepcionRecintoStep extends StatelessWidget {
  const _RecepcionRecintoStep();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Confirmar recepción', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Proveedor obligatorio. Resto validado contra SAFE / API.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          key: ValueKey<String>('prov_rec_${c.proveedorRecintoCodigo ?? ""}_${kCatalogoProveedores.length}'),
          isExpanded: true,
          initialValue: c.proveedorRecintoCodigo != null &&
                  kCatalogoProveedores.any((p) => p.codigo == c.proveedorRecintoCodigo)
              ? c.proveedorRecintoCodigo
              : null,
          decoration: const InputDecoration(
            labelText: 'Proveedor *',
            prefixIcon: Icon(Icons.business_outlined),
          ),
          items: kCatalogoProveedores
              .map(
                (p) => DropdownMenuItem(
                  value: p.codigo,
                  child: Text(p.nombre, overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: c.setProveedorRecinto,
        ),
        const SizedBox(height: 20),
        _SwitchTile('¿Tiene documentos?', c.tieneDocumentos, c.setTieneDocumentos),
        _SwitchTile('¿Requiere transportista?', c.requiereTransportista, c.setRequiereTransportista),
        _SwitchTile('¿Llegó por tránsito?', c.llegoTransito, c.setLlegoTransito),
        _SwitchTile('¿Tiene daños?', c.tieneDanos, c.setTieneDanos),
        const _TarimaRrnaBlock(),
        const SizedBox(height: 4),
        _SwitchTile('¿Rojo en reconocimiento?', c.rojoReconocimiento, c.setRojoReconocimiento),
        _SwitchTile('¿Es maquinaria?', c.esMaquinaria, c.setEsMaquinaria),
      ],
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile(this.label, this.value, this.onChanged);

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(label, style: const TextStyle(fontSize: 15)),
      value: value,
      onChanged: onChanged,
      contentPadding: EdgeInsets.zero,
    );
  }
}

class _TarimaRrnaBlock extends StatelessWidget {
  const _TarimaRrnaBlock();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SwitchTile('¿Requiere tarima?', c.requiereTarima, c.setRequiereTarima),
        if (c.requiereTarima)
          SwitchListTile(
            title: const Text('Tarima verificada / capturada'),
            subtitle: const Text('Obligatorio cuando la carga requiere tarima.'),
            value: c.tarimaVerificada,
            onChanged: c.setTarimaVerificada,
            contentPadding: EdgeInsets.zero,
          ),
        _SwitchTile('¿Revisión o solicitud RRNA?', c.revisionRrna, c.setRevisionRrna),
        if (c.revisionRrna) ...[
          const SizedBox(height: 8),
          Text('Resultado RRNA', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          SegmentedButton<ResultadoRrnaRevision>(
            segments: const [
              ButtonSegment(
                value: ResultadoRrnaRevision.cumple,
                label: Text('Cumple'),
              ),
              ButtonSegment(
                value: ResultadoRrnaRevision.noCumple,
                label: Text('No cumple'),
              ),
            ],
            emptySelectionAllowed: true,
            selected: c.resultadoRrna != null ? {c.resultadoRrna!} : <ResultadoRrnaRevision>{},
            onSelectionChanged: (s) {
              if (s.isEmpty) {
                c.setResultadoRrna(null);
              } else {
                c.setResultadoRrna(s.first);
              }
            },
          ),
        ],
      ],
    );
  }
}

class _RecintoCapturaBultosCicloStep extends StatelessWidget {
  const _RecintoCapturaBultosCicloStep();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    if (c.recintoVistaFotosBulto) {
      return const _RecintoFotosPendientePanel();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Guía y bultos', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Elige guía, escanea un bulto y pulsa «Fotos». Tras simular fotos, «Cerrar bulto» vuelve aquí. '
          'Cuando termines todos los bultos, usa «Cerrar previo» para packing list / factura.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.35),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          key: ValueKey<String>('guia_${c.guias.join('|')}_${c.guiaActiva ?? ''}'),
          isExpanded: true,
          initialValue: c.guiaActiva != null && c.guias.contains(c.guiaActiva) ? c.guiaActiva : null,
          decoration: const InputDecoration(
            labelText: 'Guía para este bulto *',
            prefixIcon: Icon(Icons.local_shipping_outlined),
          ),
          items: c.guias
              .map((g) => DropdownMenuItem(value: g, child: Text(g, overflow: TextOverflow.ellipsis)))
              .toList(),
          onChanged: c.setGuiaActiva,
        ),
        const SizedBox(height: 16),
        const RecintoBultoContinuarFotosRow(),
        const SizedBox(height: 20),
        if (c.puedeCerrarPrevioRecinto) ...[
          FilledButton.tonalIcon(
            onPressed: () => c.irADocumentosDesdeRecinto(),
            icon: const Icon(Icons.description_outlined),
            label: const Text('Cerrar previo — documentos (packing / factura)'),
          ),
          const SizedBox(height: 16),
        ] else
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '«Cerrar previo» se habilita cuando hay al menos un bulto cerrado con fotos.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ),
        Text('Bultos cerrados (${c.bultos.length})', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        if (c.bultos.isEmpty)
          Text('Aún no hay bultos cerrados.', style: TextStyle(color: AppColors.textSecondary))
        else
          ...List.generate(
            c.bultos.length,
            (i) {
              final b = c.bultos[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(b.codigo, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                  subtitle: Text(
                    'Ref. ${b.referencia} · Guía ${b.guiaAsociada ?? "—"} · ${b.fotosEtiqueta} foto(s)',
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _RecintoFotosPendientePanel extends StatelessWidget {
  const _RecintoFotosPendientePanel();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    final p = c.recintoPendienteFotos;
    if (p == null) {
      return const Text('Sin bulto en proceso.');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Fotos del bulto', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Simula las fotos de etiqueta que necesites. Luego cierra el bulto para volver a escanear otro.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            title: Text(p.codigo, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
            subtitle: Text('Guía ${p.guiaAsociada} · Ref. ${p.referencia}'),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Chip(
              label: Text('${p.fotosSimuladas} foto(s)'),
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              onPressed: () => c.simularFotoPendienteRecinto(),
              icon: const Icon(Icons.camera_alt_outlined, size: 18),
              label: const Text('Simular foto'),
            ),
          ],
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: () {
            final err = c.cerrarBultoRecinto();
            if (err != null && context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
            }
          },
          icon: const Icon(Icons.check_circle_outline),
          label: const Text('Cerrar bulto'),
        ),
      ],
    );
  }
}

class _PrimerBultoBodegaStep extends StatelessWidget {
  const _PrimerBultoBodegaStep();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Bulto 1 (amarillo)', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Debes iniciar siempre por el bulto 1 de la referencia. Código 14 u 23 caracteres.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        if (c.referenciaSesion != null)
          Card(
            color: AppColors.primary.withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.tag, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Referencia detectada: ${c.referenciaSesion}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 16),
        if (c.bultos.isEmpty) const BultoScanRow(exigeGuia: false) else const SizedBox.shrink(),
        if (c.bultos.isNotEmpty)
          Card(
            child: ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.green),
              title: Text(c.bultos.first.codigo, style: const TextStyle(fontFamily: 'monospace')),
              subtitle: Text('Referencia ${c.bultos.first.referencia}'),
            ),
          ),
      ],
    );
  }
}

class _BultosAdicionalesBodegaStep extends StatelessWidget {
  const _BultosAdicionalesBodegaStep();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Resto de bultos', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Orden esperado: bulto ${c.bodegaBultoEsperado}. Misma referencia ${c.referenciaSesion ?? "—"}.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        const BultoScanRow(exigeGuia: false),
        const SizedBox(height: 16),
        ...List.generate(
          c.bultos.length,
          (i) {
            final b = c.bultos[i];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(child: Text('${b.numeroOrden}')),
                title: Text(b.codigo, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                subtitle: Text('Ref. ${b.referencia}'),
              ),
            );
          },
        ),
        const SizedBox(height: 20),
        Text('Fotos de etiqueta (simuladas)', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Text(
          'Mínimo 1 foto por bulto antes de continuar.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 8),
        ...List.generate(c.bultos.length, (i) {
          final b = c.bultos[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bulto ${b.numeroOrden}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text(b.codigo, style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                      ],
                    ),
                  ),
                  Chip(label: Text('${b.fotosEtiqueta} foto(s)'), visualDensity: VisualDensity.compact),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () => c.simularFotoEtiquetaParaBulto(i),
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                    label: const Text('Simular'),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _ClienteProveedorBodegaStep extends StatelessWidget {
  const _ClienteProveedorBodegaStep();

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CaptureController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Cliente y proveedor', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(
          'Confirma contra la referencia. Desajuste se alertará vía API; aquí solo captura.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: c.clienteController,
          decoration: const InputDecoration(
            labelText: 'Cliente *',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          key: ValueKey<String>('prov_bod_${c.proveedorBodegaCodigo ?? ""}_${kCatalogoProveedores.length}'),
          isExpanded: true,
          initialValue: c.proveedorBodegaCodigo != null &&
                  kCatalogoProveedores.any((p) => p.codigo == c.proveedorBodegaCodigo)
              ? c.proveedorBodegaCodigo
              : null,
          decoration: const InputDecoration(
            labelText: 'Proveedor *',
            prefixIcon: Icon(Icons.business_outlined),
          ),
          items: kCatalogoProveedores
              .map(
                (p) => DropdownMenuItem(
                  value: p.codigo,
                  child: Text(p.nombre, overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: c.setProveedorBodega,
        ),
        const SizedBox(height: 16),
        SwitchListTile(
          title: const Text('Cumple NOM'),
          value: c.cumpleNom,
          onChanged: c.setCumpleNom,
          contentPadding: EdgeInsets.zero,
        ),
        const SizedBox(height: 8),
        const _TarimaRrnaBlock(),
      ],
    );
  }
}

class _PackingListPlaceholder extends StatelessWidget {
  const _PackingListPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Packing list / factura', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Text(
          'Aquí irá el flujo: ¿tiene documento? → ¿tomar fotos? → número de hojas → cámara hoja por hoja → '
          'PDF → envío a IA. Cuarentena documental si responde no.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
        ),
        const SizedBox(height: 20),
        const ListTile(
          leading: Icon(Icons.info_outline),
          title: Text('Pulsa Finalizar para volver al inicio'),
        ),
      ],
    );
  }
}
