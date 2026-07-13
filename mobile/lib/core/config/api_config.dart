/// API configuration for Campus Hub mobile.
///
/// Change [host] to your machine IP when testing on a physical device.
/// - Android emulator: `10.0.2.2`
/// - iOS simulator: `localhost`
/// - Physical device: your PC's LAN IP (e.g. `192.168.100.4`)
class ApiConfig {
  static const String host = '192.168.100.4';
  static const int port = 5000;

  static String get baseUrl => 'http://$host:$port';
  static String get apiUrl => '$baseUrl/api';
  static String get socketUrl => baseUrl;

  static String mediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final normalized = path.startsWith('/') ? path : '/$path';
    if (normalized.startsWith('/uploads')) return '$baseUrl$normalized';
    return '$baseUrl/uploads$normalized';
  }
}
