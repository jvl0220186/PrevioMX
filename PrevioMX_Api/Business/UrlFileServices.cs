namespace PrevioMX_Api.Business
{
    public static class UrlFileServices
    {
        public static string ExtracFileNameFromUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return string.Empty;

            var uri = new Uri(url);

            // Obtiene solo la parte del path de la URL
            string path = uri.AbsolutePath;

            // Extrae el nombre del archivo
            return Path.GetFileName(path);
        }
    }
}
