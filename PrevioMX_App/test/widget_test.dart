import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:previo_mx_app/core/theme/app_theme.dart';

void main() {
  test('buildAppTheme retorna ThemeData', () {
    expect(buildAppTheme(), isA<ThemeData>());
  });
}
