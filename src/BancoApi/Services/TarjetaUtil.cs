namespace BancoApi.Services;

internal static class TarjetaUtil
{
    public static string NormalizarNumero(string numero) =>
        new(numero.Where(char.IsDigit).ToArray());

    public static string NormalizarCvv(string cvv) => cvv.Trim();
}
