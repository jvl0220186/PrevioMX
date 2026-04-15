import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Pantalla completa: lee QR o código de barras y devuelve el texto en [Navigator.pop].
class BarcodeScannerPage extends StatefulWidget {
  const BarcodeScannerPage({super.key});

  @override
  State<BarcodeScannerPage> createState() => _BarcodeScannerPageState();
}

class _BarcodeScannerPageState extends State<BarcodeScannerPage> {
  bool _cerrado = false;

  void _onDetect(BarcodeCapture capture) {
    if (_cerrado || !mounted) return;
    for (final b in capture.barcodes) {
      final raw = b.rawValue ?? b.displayValue;
      if (raw != null && raw.trim().isNotEmpty) {
        _cerrado = true;
        Navigator.of(context).pop<String>(raw.trim());
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Escanear código'),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(onDetect: _onDetect),
          Positioned(
            left: 16,
            right: 16,
            bottom: 32,
            child: Card(
              color: Colors.black87,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  'Apunta al QR o código de barras. Se cerrará al leer el primer código válido.',
                  style: TextStyle(color: Colors.grey.shade200, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
