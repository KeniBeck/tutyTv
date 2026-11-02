#!/usr/bin/env bash
#
# Genera un IPK de TutyTV a partir de source/usr.
#
# Uso:
#   ./tools/build-ipk.sh                 # usa la version actual de appinfo.json
#   ./tools/build-ipk.sh 1.6.6           # cambia la version a 1.6.6 y compila
#   ./tools/build-ipk.sh 1.6.6 salida.ipk
#
# El IPK por defecto se guarda en la carpeta padre de source/ (junto al
# instalador INSTALAR-TUTYTV.sh).

set -euo pipefail

APP_ID="com.webosflux.xuptertv.fidelity"
SVC_ID="${APP_ID}.service"

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
APP_DIR="${ROOT}/usr/palm/applications/${APP_ID}"
PKG_DIR="${ROOT}/usr/palm/packages/${APP_ID}"
SVC_DIR="${ROOT}/usr/palm/services/${SVC_ID}"

VERSION="${1:-}"
OUT="${2:-}"

for cmd in tar sed du awk bsdtar gzip; do
    command -v "$cmd" >/dev/null 2>&1 || {
        echo "Falta el programa: $cmd" >&2
        exit 1
    }
done

validate_ipk() {
    local ipk="$1"
    local tmp
    tmp=$(mktemp -d "${TMPDIR:-/tmp}/tuty-validate.XXXXXX")
    trap 'rm -rf "$tmp"' RETURN

    # 1) Estructura AR esperada en orden exacto.
    mapfile -t members < <(bsdtar -tf "$ipk")
    if [ "${#members[@]}" -ne 3 ] || [ "${members[0]}" != "debian-binary" ] || [ "${members[1]}" != "control.tar.gz" ] || [ "${members[2]}" != "data.tar.gz" ]; then
        echo "IPK invalido: miembros AR inesperados." >&2
        printf 'Miembros detectados: %s\n' "${members[*]}" >&2
        return 1
    fi

    # 2) Evita encabezados GNU ar con nombre terminado en '/'.
    if file "$ipk" | grep -q 'control\.tar\.gz/'; then
        echo "IPK invalido: cabecera AR incompatible (control.tar.gz/)." >&2
        return 1
    fi

    bsdtar -xOf "$ipk" debian-binary > "${tmp}/debian-binary"
    bsdtar -xOf "$ipk" control.tar.gz > "${tmp}/control.tar.gz"
    bsdtar -xOf "$ipk" data.tar.gz > "${tmp}/data.tar.gz"

    # 3) Integridad base.
    if [ "$(cat "${tmp}/debian-binary")" != "2.0" ]; then
        echo "IPK invalido: debian-binary no contiene '2.0'." >&2
        return 1
    fi
    gzip -t "${tmp}/control.tar.gz"
    gzip -t "${tmp}/data.tar.gz"

    # 4) Integridad TAR y rutas seguras.
    tar -tzf "${tmp}/control.tar.gz" > "${tmp}/control.list"
    tar -tzf "${tmp}/data.tar.gz" > "${tmp}/data.list"

    if ! grep -qx 'control' "${tmp}/control.list"; then
        echo "IPK invalido: falta archivo control dentro de control.tar.gz." >&2
        return 1
    fi

    if grep -E -q '^/' "${tmp}/data.list"; then
        echo "IPK invalido: hay rutas absolutas en data.tar.gz." >&2
        return 1
    fi
    if grep -E -q '(^|/)\.\.(|/)' "${tmp}/data.list"; then
        echo "IPK invalido: hay rutas con '..' en data.tar.gz." >&2
        return 1
    fi

    for required in \
        "usr/palm/applications/${APP_ID}/appinfo.json" \
        "usr/palm/packages/${APP_ID}/packageinfo.json" \
        "usr/palm/services/${SVC_ID}/services.json"; do
        if ! grep -qx "$required" "${tmp}/data.list"; then
            echo "IPK invalido: falta archivo obligatorio $required" >&2
            return 1
        fi
    done

    # 5) Coherencia minima de metadatos.
    tar -xOf "${tmp}/control.tar.gz" control > "${tmp}/control"
    if ! grep -q "^Package: ${APP_ID}$" "${tmp}/control"; then
        echo "IPK invalido: Package en control no coincide." >&2
        return 1
    fi
    if ! grep -q "^Version: ${VERSION}$" "${tmp}/control"; then
        echo "IPK invalido: Version en control no coincide con ${VERSION}." >&2
        return 1
    fi

    local appinfo packageinfo services
    appinfo=$(tar -xOf "${tmp}/data.tar.gz" "usr/palm/applications/${APP_ID}/appinfo.json")
    packageinfo=$(tar -xOf "${tmp}/data.tar.gz" "usr/palm/packages/${APP_ID}/packageinfo.json")
    services=$(tar -xOf "${tmp}/data.tar.gz" "usr/palm/services/${SVC_ID}/services.json")

    if command -v jq >/dev/null 2>&1; then
        jq -e . >/dev/null <<< "$appinfo"
        jq -e . >/dev/null <<< "$packageinfo"
        jq -e . >/dev/null <<< "$services"

        [ "$(jq -r '.id' <<< "$appinfo")" = "$APP_ID" ] || { echo "IPK invalido: appinfo.id no coincide." >&2; return 1; }
        [ "$(jq -r '.version' <<< "$appinfo")" = "$VERSION" ] || { echo "IPK invalido: appinfo.version no coincide." >&2; return 1; }
        [ "$(jq -r '.id' <<< "$packageinfo")" = "$APP_ID" ] || { echo "IPK invalido: packageinfo.id no coincide." >&2; return 1; }
        [ "$(jq -r '.app' <<< "$packageinfo")" = "$APP_ID" ] || { echo "IPK invalido: packageinfo.app no coincide." >&2; return 1; }
        [ "$(jq -r '.services[0]' <<< "$packageinfo")" = "$SVC_ID" ] || { echo "IPK invalido: packageinfo.services[0] no coincide." >&2; return 1; }
        [ "$(jq -r '.id' <<< "$services")" = "$SVC_ID" ] || { echo "IPK invalido: services.id no coincide." >&2; return 1; }
    else
        grep -q "\"id\"[[:space:]]*:[[:space:]]*\"${APP_ID}\"" <<< "$appinfo" || { echo "IPK invalido: appinfo.id no coincide." >&2; return 1; }
        grep -q "\"version\"[[:space:]]*:[[:space:]]*\"${VERSION}\"" <<< "$appinfo" || { echo "IPK invalido: appinfo.version no coincide." >&2; return 1; }
        grep -q "\"id\"[[:space:]]*:[[:space:]]*\"${APP_ID}\"" <<< "$packageinfo" || { echo "IPK invalido: packageinfo.id no coincide." >&2; return 1; }
        grep -q "\"app\"[[:space:]]*:[[:space:]]*\"${APP_ID}\"" <<< "$packageinfo" || { echo "IPK invalido: packageinfo.app no coincide." >&2; return 1; }
        grep -q "\"${SVC_ID}\"" <<< "$packageinfo" || { echo "IPK invalido: packageinfo.services no coincide." >&2; return 1; }
        grep -q "\"id\"[[:space:]]*:[[:space:]]*\"${SVC_ID}\"" <<< "$services" || { echo "IPK invalido: services.id no coincide." >&2; return 1; }
    fi

    echo "Validacion OK: estructura, integridad y metadatos correctos."
}

if [ ! -f "${ROOT}/control" ] || [ ! -f "${ROOT}/debian-binary" ] || [ ! -d "${ROOT}/usr" ]; then
    echo "No encuentro control, debian-binary o usr/ dentro de ${ROOT}" >&2
    exit 1
fi

if [ -z "$VERSION" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${APP_DIR}/appinfo.json" | head -n 1)
fi
[ -n "$VERSION" ] || { echo "No pude detectar la version." >&2; exit 1; }

if [ -z "$OUT" ]; then
    OUT="$(dirname -- "$ROOT")/${APP_ID}_${VERSION}_all.ipk"
fi
case "$OUT" in
    /*) ;;
    *) OUT="$(pwd)/${OUT}" ;;
esac

echo "Version: $VERSION"
echo "Origen : $ROOT"
echo "Salida : $OUT"

# Actualiza la version en todos los sitios que la usan.
sed -i -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]*(\")/\1${VERSION}\2/" "${APP_DIR}/appinfo.json"
sed -i -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]*(\")/\1${VERSION}\2/" "${PKG_DIR}/packageinfo.json"
if [ -f "${SVC_DIR}/package.json" ]; then
    sed -i -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]*(\")/\1${VERSION}\2/" "${SVC_DIR}/package.json"
fi
sed -i -E "s/^Version: .*/Version: ${VERSION}/" "${ROOT}/control"
sed -i -E "s/(<div class=\"welcome-version\">v)[^<]*(<\/div>)/\1${VERSION}\2/" "${APP_DIR}/index.html"

SIZE=$(du -sb "${ROOT}/usr" | awk '{print $1}')
sed -i -E "s/^Installed-Size: .*/Installed-Size: ${SIZE}/" "${ROOT}/control"

BUILD_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tuty-build.XXXXXX")
trap 'rm -rf "$BUILD_DIR"' EXIT

tar --format=ustar --owner=0 --group=0 --numeric-owner -cf "${BUILD_DIR}/control.tar" -C "$ROOT" control
tar --format=ustar --owner=0 --group=0 --numeric-owner -cf "${BUILD_DIR}/data.tar" -C "$ROOT" usr
gzip -n -9 "${BUILD_DIR}/control.tar"
gzip -n -9 "${BUILD_DIR}/data.tar"
cp "${ROOT}/debian-binary" "${BUILD_DIR}/debian-binary"

rm -f "$OUT"
(
    cd "$BUILD_DIR"
    # AR en formato BSD para maximizar compatibilidad con extractores webOS.
    bsdtar -cf "$OUT" --format ar --uid 0 --gid 0 --numeric-owner debian-binary control.tar.gz data.tar.gz
)

validate_ipk "$OUT"

echo ""
echo "IPK generado."
bsdtar -tf "$OUT"
ls -lh "$OUT"
