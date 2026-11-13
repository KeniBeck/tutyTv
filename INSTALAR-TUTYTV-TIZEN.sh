#!/usr/bin/env bash
#
# Instalador de TutyTV para televisores Samsung Tizen (Linux).
#
# Pide la IP de la TV, firma el paquete con un perfil de Tizen Studio
# y lo instala por sdb. No necesita Node.js si ya existe dist/tizen.
#
# Uso normal:
#   ./INSTALAR-TUTYTV-TIZEN.sh
#
# Uso avanzado:
#   ./INSTALAR-TUTYTV-TIZEN.sh --host 192.168.1.50 --profile tuty
#   ./INSTALAR-TUTYTV-TIZEN.sh --rebuild
#   ./INSTALAR-TUTYTV-TIZEN.sh --dry-run
#
# Requisitos:
#   - Tizen Studio con "tizen" y "sdb" (o en ~/tizen-studio).
#   - Perfil de certificado Samsung creado en Certificate Manager.
#   - Modo Desarrollador activo en la TV y la IP de este PC registrada.
#
# Si el script no tiene permiso de ejecucion:
#   chmod +x INSTALAR-TUTYTV-TIZEN.sh

set -u

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
CONFIG_FILE="${SCRIPT_DIR}/instalar-config-tizen.json"
TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/tuty-tizen.XXXXXX") || {
    echo "No se pudo crear una carpeta temporal." >&2
    exit 1
}
cleanup() {
    rm -rf "$TMP_ROOT" 2>/dev/null || true
}
trap cleanup EXIT

TV_HOST=''
PROFILE=''
REBUILD=0
NO_BUILD=0
DRY_RUN=0
NO_PAUSE=0
NO_LAUNCH=0
PROJECT_DIR=''
SIGNED_DIR=''
SIGNED_WGT=''
SERIAL=''
INSTALL_OUT=''
PACKAGE_ID=''
APP_ID=''
CFG_HOST=''
CFG_PROFILE=''

if [ -t 1 ]; then
    C_RESET=$'\033[0m'
    C_CYAN=$'\033[36m'
    C_GREEN=$'\033[32m'
    C_YELLOW=$'\033[33m'
    C_RED=$'\033[31m'
    C_GRAY=$'\033[90m'
    C_WHITE=$'\033[97m'
else
    C_RESET='' C_CYAN='' C_GREEN='' C_YELLOW='' C_RED='' C_GRAY='' C_WHITE=''
fi

line() { printf '  %s\n' '--------------------------------------------------------------------'; }
title() { printf '\n  %s\n' "$*"; }
step() { printf '\n  [%s] %s\n' "$1" "$2"; }
ok() { printf '      %sOK%s   %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '      %s!%s    %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
fail() { printf '      %sX%s    %s\n' "$C_RED" "$C_RESET" "$*"; }
info() { printf '           %s\n' "$*"; }

show_banner() {
    printf '\n'
    printf '   ==================================================================\n'
    printf '      T u t y T V   para   S a m s u n g   T i z e n\n'
    printf '      Instalador automatico para Linux\n'
    printf '   ==================================================================\n'
}

usage() {
    cat <<EOF
Uso: $(basename "$0") [opciones]

  --host IP        IP o nombre del televisor Samsung
  --profile NOMBRE Perfil de firma de Tizen Studio (por defecto, el activo)
  --rebuild        Recompila la app antes de firmar
  --no-build       No recompila aunque pnpm este disponible
  --dry-run        Comprueba todo sin firmar ni tocar la TV
  --no-launch      No abre la app al terminar
  --no-pause       No espera a pulsar ENTER al terminar
  -h, --help       Muestra esta ayuda
EOF
}

pause_end() {
    if [ "$NO_PAUSE" -eq 1 ]; then
        return 0
    fi
    printf '\n'
    read -r -p '   Pulsa ENTER para cerrar esta ventana' _ || true
}

trim() {
    local s="$*"
    s="${s#"${s%%[![:space:]]*}"}"
    s="${s%"${s##*[![:space:]]}"}"
    printf '%s' "$s"
}

read_default() {
    local prompt="$1" def="${2:-}" v
    if [ -n "$def" ]; then
        read -r -p "   ${prompt} [${def}]: " v || true
    else
        read -r -p "   ${prompt}: " v || true
    fi
    if [ -z "$(trim "$v")" ]; then
        printf '%s' "$def"
    else
        trim "$v"
    fi
}

is_ipv4() {
    [[ "$1" =~ ^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$ ]] || return 1
    local o
    for o in "${BASH_REMATCH[@]:1}"; do
        [ "$o" -le 255 ] || return 1
    done
    return 0
}

valid_host() {
    is_ipv4 "$1" && return 0
    [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9.-]{0,62}$ ]]
}

add_tizen_paths() {
    local base
    for base in "${TIZEN_HOME:-}" "$HOME/tizen-studio" "$HOME/Tizen/tizen-studio" \
        "/opt/tizen-studio" "/usr/local/tizen-studio"; do
        [ -n "$base" ] || continue
        if [ -d "$base/tools/ide/bin" ]; then
            PATH="$base/tools/ide/bin:$PATH"
        fi
        if [ -d "$base/tools" ]; then
            PATH="$base/tools:$PATH"
        fi
    done
    export PATH
}

get_local_ipv4() {
    local ip=''
    if command -v ip >/dev/null 2>&1; then
        ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}')
    fi
    if [ -z "$ip" ]; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    printf '%s' "$ip"
}

cfg_get() {
    local file="$1" key="$2"
    [ -f "$file" ] || return 1
    sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$file" | head -n 1 | tr -d '\r'
}

save_config() {
    printf '{\n    "host": "%s",\n    "profile": "%s"\n}\n' \
        "$TV_HOST" "$PROFILE" > "$CONFIG_FILE" 2>/dev/null || true
}

run_build() {
    command -v pnpm >/dev/null 2>&1 || {
        fail 'No encuentro pnpm para recompilar la app.'
        info 'Instala Node.js 20+ y pnpm, o usa --no-build con dist/tizen ya generado.'
        return 1
    }
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        fail 'No encuentro package.json junto al instalador.'
        return 1
    fi
    info 'Generando la app Tizen...'
    info 'Ejecutando: pnpm run build:tizen'
    if ! (cd "$SCRIPT_DIR" && pnpm run build:tizen); then
        fail 'Fallo la compilacion de la app.'
        info 'Revisa que hayas ejecutado "pnpm install" y que zip/unzip esten instalados.'
        return 1
    fi
    ok 'App generada'
    return 0
}

prepare_project() {
    local can_build=0 wgt=''

    step '2/7' 'Preparando la app Tizen'

    if command -v pnpm >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/node_modules" ]; then
        can_build=1
    fi

    if [ "$REBUILD" -eq 1 ]; then
        run_build || {
            pause_end
            exit 1
        }
    elif [ "$NO_BUILD" -eq 0 ] && [ "$can_build" -eq 1 ] && [ "$DRY_RUN" -eq 0 ]; then
        if ! run_build; then
            warn 'Sigo con la build Tizen que ya exista en dist/.'
        fi
    fi

    if [ -f "$SCRIPT_DIR/dist/tizen/config.xml" ]; then
        PROJECT_DIR="$SCRIPT_DIR/dist/tizen"
        ok 'Proyecto Tizen: dist/tizen'
        return 0
    fi

    wgt=$(ls -t "$SCRIPT_DIR"/dist/TutyTV_*.wgt 2>/dev/null | head -n 1 || true)
    if [ -n "$wgt" ] && [ -f "$wgt" ] && command -v unzip >/dev/null 2>&1; then
        info "No hay dist/tizen; reutilizo $(basename "$wgt")."
        mkdir -p "$TMP_ROOT/project"
        if unzip -q "$wgt" -d "$TMP_ROOT/project" && [ -f "$TMP_ROOT/project/config.xml" ]; then
            PROJECT_DIR="$TMP_ROOT/project"
            ok "Proyecto extraido de $(basename "$wgt")"
            return 0
        fi
    fi

    fail 'No encuentro la app Tizen generada.'
    info 'Ejecuta antes: pnpm run build:tizen'
    info 'Necesitas dist/tizen o un archivo dist/TutyTV_*.wgt.'
    return 1
}

parse_package_ids() {
    local flat
    flat=$(tr '\n' ' ' < "$PROJECT_DIR/config.xml" 2>/dev/null || true)
    PACKAGE_ID=$(printf '%s' "$flat" | sed -n 's/.*<widget[^>]*[[:space:]]id="\([^"]*\)".*/\1/p' | head -n 1)
    APP_ID=$(printf '%s' "$flat" | sed -n 's/.*<tizen:application[^>]*[[:space:]]id="\([^"]*\)".*/\1/p' | head -n 1)
    [ -n "$PACKAGE_ID" ] || PACKAGE_ID='TutyTV2027'
    [ -n "$APP_ID" ] || APP_ID="${PACKAGE_ID}.TutyTV"
}

list_profiles() {
    tizen security-profiles list 2>/dev/null | awk 'NR > 1 && $1 != "" && $1 !~ /^\[/ { print $1 }'
}

active_profile() {
    tizen security-profiles list 2>/dev/null | awk '$NF == "O" { print $1; exit }'
}

resolve_profile() {
    local profiles active first
    profiles=$(list_profiles)
    active=$(active_profile)

    if [ -z "$PROFILE" ] && [ -n "$CFG_PROFILE" ]; then
        if printf '%s\n' "$profiles" | grep -Fqx "$CFG_PROFILE"; then
            PROFILE="$CFG_PROFILE"
        else
            warn "El perfil guardado (${CFG_PROFILE}) ya no existe. Uso el activo."
        fi
    fi

    if [ -z "$PROFILE" ]; then
        PROFILE="$active"
    fi

    if [ -z "$PROFILE" ] && [ -n "$profiles" ]; then
        first=$(printf '%s\n' "$profiles" | head -n 1)
        info "Perfiles disponibles: $(printf '%s' "$profiles" | tr '\n' ' ')"
        PROFILE=$(read_default 'Perfil de firma' "$first")
    fi

    if [ -z "$PROFILE" ]; then
        fail 'No hay ningun perfil de firma de Tizen Studio.'
        info 'Abre Tizen Studio > Certificate Manager y crea un certificado Samsung.'
        info 'Debe incluir certificado de autor y de distribuidor, y estar asociado a la TV.'
        info 'Despues vuelve a ejecutar este instalador.'
        return 1
    fi

    if [ -n "$profiles" ] && ! printf '%s\n' "$profiles" | grep -Fqx "$PROFILE"; then
        fail "El perfil de firma '${PROFILE}' no existe."
        info "Perfiles disponibles: $(printf '%s' "$profiles" | tr '\n' ' ')"
        info 'Elige uno con --profile NOMBRE o crea uno en Certificate Manager.'
        return 1
    fi

    ok "Perfil de firma: ${PROFILE}"
    return 0
}

sign_project() {
    SIGNED_DIR="$SCRIPT_DIR/dist/signed"
    step '4/7' 'Firmando la aplicacion'
    info "Firmando con el perfil '${PROFILE}'..."
    if [ "$DRY_RUN" -eq 1 ]; then
        info "[dry-run] tizen package -t wgt -s ${PROFILE} -o dist/signed -- ${PROJECT_DIR}"
        return 0
    fi

    mkdir -p "$SIGNED_DIR" || {
        fail "No puedo crear ${SIGNED_DIR}."
        return 1
    }
    rm -f "$SIGNED_DIR"/*.wgt 2>/dev/null || true

    if ! tizen package -t wgt -s "$PROFILE" -o "$SIGNED_DIR" -- "$PROJECT_DIR"; then
        fail 'No se pudo firmar el paquete.'
        info 'Revisa Certificate Manager: el certificado Samsung puede estar caducado'
        info 'o la TV no estar asociada a tu cuenta Samsung.'
        return 1
    fi

    SIGNED_WGT=$(ls -t "$SIGNED_DIR"/*.wgt 2>/dev/null | head -n 1 || true)
    if [ -z "$SIGNED_WGT" ] || [ ! -f "$SIGNED_WGT" ]; then
        fail "No encuentro el WGT firmado en ${SIGNED_DIR}."
        return 1
    fi

    ok "Firmado: $(basename "$SIGNED_WGT")"
    return 0
}

connect_tv() {
    local attempt serial='' output=''
    step '5/7' 'Conectando con el televisor'

    info "TV: ${TV_HOST}:26101"
    if [ "$DRY_RUN" -eq 1 ]; then
        info "[dry-run] sdb connect ${TV_HOST}:26101"
        return 0
    fi

    command -v sdb >/dev/null 2>&1 || {
        fail 'No encuentro sdb. Instala Tizen Studio o anade tools/ a tu PATH.'
        return 1
    }

    sdb start-server >/dev/null 2>&1 || true
    sdb disconnect "${TV_HOST}:26101" >/dev/null 2>&1 || true

    if command -v timeout >/dev/null 2>&1; then
        output=$(timeout 25 sdb connect "${TV_HOST}:26101" 2>&1) || true
    else
        output=$(sdb connect "${TV_HOST}:26101" 2>&1) || true
    fi
    [ -n "$output" ] && info "$output"

    for ((attempt = 1; attempt <= 20; attempt++)); do
        serial=$(sdb devices 2>/dev/null | awk -v ip="$TV_HOST" 'NR > 1 && $2 == "device" && ($1 == ip || index($1, ip ":") == 1) { print $1; exit }')
        if [ -n "$serial" ]; then
            break
        fi
        sleep 1
    done

    if [ -z "$serial" ] && sdb -s "${TV_HOST}:26101" get-state 2>/dev/null | grep -q '^device'; then
        serial="${TV_HOST}:26101"
    fi

    if [ -z "$serial" ]; then
        fail 'La TV no aparece conectada por sdb.'
        info 'Comprueba:'
        info '  1. En la TV: Apps > 12345 > Developer mode activado.'
        info '  2. La IP de este PC esta registrada en la TV.'
        info '  3. TV y PC estan en la misma red.'
        info '  4. La TV se reinicio despues de activar el modo desarrollador.'
        info "Prueba manual: sdb connect ${TV_HOST}:26101 && sdb devices"
        return 1
    fi

    SERIAL="$serial"
    ok "Conectado: ${SERIAL}"
    return 0
}

try_tizen_install() {
    local rc=0
    INSTALL_OUT=$(tizen install -n "$SIGNED_WGT" -s "$SERIAL" 2>&1)
    rc=$?
    [ -n "$INSTALL_OUT" ] && printf '%s\n' "$INSTALL_OUT" | sed 's/^/           /'
    if [ "$rc" -eq 0 ] && printf '%s' "$INSTALL_OUT" | grep -qiE 'install completed|successfully installed|Installed the package'; then
        return 0
    fi
    return 1
}

install_wgt() {
    local reinstall=''
    step '6/7' 'Instalando en la TV'

    info "Paquete: $(basename "$SIGNED_WGT")"
    if [ "$DRY_RUN" -eq 1 ]; then
        info "[dry-run] tizen install -n ${SIGNED_WGT} -s ${SERIAL:-SERIAL}"
        return 0
    fi

    if try_tizen_install; then
        ok 'Aplicacion instalada'
        return 0
    fi

    if printf '%s' "$INSTALL_OUT" | grep -qiE 'author certificate not match|certificate not match'; then
        info 'La TV tiene instalada una version firmada con otro certificado.'
        reinstall=$(read_default '¿Desinstalar la version anterior y reinstalar? (s/n)' 's')
        if [[ "$reinstall" =~ ^[sS] ]]; then
            info "Desinstalando ${APP_ID}..."
            tizen uninstall -p "$APP_ID" -s "$SERIAL" 2>&1 | sed 's/^/           /' || true
            if try_tizen_install; then
                ok 'Aplicacion instalada'
                return 0
            fi
        fi
    fi

    fail 'No se pudo instalar la aplicacion.'
    info 'Si el error es de firma, revisa Certificate Manager y vuelve a asociar la TV.'
    info 'Si el error es "118, -22", la TV conserva un paquete bloqueado con ese ID.'
    info 'Genera otro ID, por ejemplo: pnpm run build:tizen -- --package-id TutyTV2028'
    info 'Si es de conexion, comprueba que el Modo Desarrollador sigue activo.'
    return 1
}

launch_app() {
    [ "$NO_LAUNCH" -eq 1 ] && return 0
    step '7/7' 'Abriendo TutyTV'
    if [ "$DRY_RUN" -eq 1 ]; then
        info "[dry-run] tizen run -p ${APP_ID} -t ${SERIAL:-SERIAL}"
        return 0
    fi
    if tizen run -p "$APP_ID" -s "$SERIAL" >/dev/null 2>&1; then
        ok 'App abierta en la TV'
    elif tizen run -p "$APP_ID" -t "$SERIAL" >/dev/null 2>&1; then
        ok 'App abierta en la TV'
    elif tizen run -p "$PACKAGE_ID" -s "$SERIAL" >/dev/null 2>&1; then
        ok 'App abierta en la TV'
    else
        warn 'La app se instalo, pero no pude abrirla automaticamente.'
        info 'Abrela desde el menu Apps de la TV.'
    fi
}

while [ $# -gt 0 ]; do
    case "$1" in
        --host|--ip)
            TV_HOST="${2:-}"
            shift 2 || { echo 'Falta el valor de --host' >&2; exit 2; }
            ;;
        --profile)
            PROFILE="${2:-}"
            shift 2 || { echo 'Falta el valor de --profile' >&2; exit 2; }
            ;;
        --rebuild)
            REBUILD=1
            shift
            ;;
        --no-build)
            NO_BUILD=1
            shift
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --no-launch)
            NO_LAUNCH=1
            shift
            ;;
        --no-pause)
            NO_PAUSE=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Opcion desconocida: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

show_banner
add_tizen_paths

# ------------------------------------------------------------------ 1. equipo
step '1/7' 'Comprobando este equipo'

for cmd in awk sed tr unzip; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        fail "Falta el programa obligatorio: $cmd"
        info 'En Debian/Ubuntu: sudo apt install coreutils sed gawk unzip'
        pause_end
        exit 1
    fi
done

if ! command -v tizen >/dev/null 2>&1; then
    fail 'No encuentro el comando "tizen".'
    info 'Instala Tizen Studio con las extensiones de TV.'
    info 'Si ya esta instalado, anade tools/ y tools/ide/bin a tu PATH.'
    pause_end
    exit 1
fi

if ! command -v sdb >/dev/null 2>&1; then
    fail 'No encuentro el comando "sdb".'
    info 'Instala Tizen Studio o anade la carpeta tools/ a tu PATH.'
    pause_end
    exit 1
fi

ok "Tizen CLI: $(tizen version 2>/dev/null | head -n 1)"
ok "sdb: $(sdb version 2>/dev/null | head -n 1)"

if ! command -v zip >/dev/null 2>&1; then
    warn 'No hay "zip": la recompilacion de la app puede fallar.'
    info 'En Debian/Ubuntu: sudo apt install zip'
fi

if ! command -v pnpm >/dev/null 2>&1; then
    warn 'No hay pnpm: se usara la app ya generada en dist/.'
fi

# ------------------------------------------------------------------ 2. proyecto
CFG_HOST=$(cfg_get "$CONFIG_FILE" host || true)
CFG_PROFILE=$(cfg_get "$CONFIG_FILE" profile || true)

if ! prepare_project; then
    pause_end
    exit 1
fi
parse_package_ids
ok "Paquete: ${PACKAGE_ID}   App: ${APP_ID}"

# ------------------------------------------------------------------ 3. la TV
step '3/7' 'Datos del televisor'
LOCAL_IP=$(get_local_ipv4)
[ -n "$LOCAL_IP" ] && info "Este PC tiene la IP: ${LOCAL_IP}"
info 'En la TV: Apps > escribe 12345 > Developer mode > registra la IP del PC.'

if [ -z "$TV_HOST" ] && [ ! -t 0 ]; then
    fail 'Falta la IP del televisor. Usa --host 192.168.1.50.'
    pause_end
    exit 1
fi

if [ -z "$TV_HOST" ]; then
    [ -n "$CFG_HOST" ] && info "La ultima vez funciono con ${CFG_HOST}. Pulsa Enter para repetirla."
    while [ -z "$TV_HOST" ]; do
        v=$(read_default 'IP del televisor Samsung' "$CFG_HOST")
        if [ -z "$v" ]; then
            fail 'Necesito la IP del televisor.'
            continue
        fi
        if ! valid_host "$v"; then
            fail 'Eso no parece una IP. Ejemplo: 192.168.1.50'
            continue
        fi
        TV_HOST="$v"
    done
fi

if ! valid_host "$TV_HOST"; then
    fail "La IP indicada no es valida: ${TV_HOST}"
    pause_end
    exit 1
fi

if is_ipv4 "$TV_HOST" && [ -n "$LOCAL_IP" ] && is_ipv4 "$LOCAL_IP"; then
    if [ "${TV_HOST%.*}" != "${LOCAL_IP%.*}" ]; then
        warn "La TV (${TV_HOST}) no esta en la misma red que este PC (${LOCAL_IP})."
        info 'Si la TV esta en otra red, sdb no podra conectarse.'
    fi
fi
ok "TV: ${TV_HOST}"

# ------------------------------------------------------------------ 4. firma
if ! resolve_profile; then
    pause_end
    exit 1
fi

if ! sign_project; then
    pause_end
    exit 1
fi

if [ "$DRY_RUN" -eq 1 ]; then
    step '5/7' 'Conexion e instalacion'
    info "[dry-run] sdb connect ${TV_HOST}:26101"
    info "[dry-run] tizen install -n ${SIGNED_WGT:-dist/signed/TutyTV.wgt} -s SERIAL"
    info "[dry-run] tizen run -p ${APP_ID} -s SERIAL"
    title 'Comprobacion terminada (dry-run)'
    info 'No se ha tocado la TV.'
    pause_end
    exit 0
fi

# ------------------------------------------------------------------ 5. conexion
if ! connect_tv; then
    retry=$(read_default '¿Reintentar la conexion? (s/n)' 'n')
    if [[ "$retry" =~ ^[sS] ]] && connect_tv; then
        :
    else
        pause_end
        exit 1
    fi
fi

# ------------------------------------------------------------------ 6. instalar
if ! install_wgt; then
    pause_end
    exit 1
fi

save_config
launch_app

title 'LISTO'
info "TV        : ${TV_HOST}"
info "Paquete   : ${PACKAGE_ID}"
info "Firmado   : ${SIGNED_WGT}"
info "Perfil    : ${PROFILE}"
pause_end
