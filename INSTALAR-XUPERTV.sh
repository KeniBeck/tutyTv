#!/usr/bin/env bash
#
# Instalador de XuperTV para televisores LG webOS (Linux).
#
# Equivalente al INSTALAR-XUPERTV.bat / instalar-tv.ps1 de Windows.
# No necesita Node.js ni ares-cli: usa el cliente SSH/OpenSSH del sistema.
#
# Uso normal:
#   ./INSTALAR-XUPERTV.sh
#
# Uso avanzado:
#   ./INSTALAR-XUPERTV.sh --ipk ruta/app.ipk --host 192.168.1.50 --user prisoner --port 9922
#
# Comprobar sin tocar la TV:
#   ./INSTALAR-XUPERTV.sh --dry-run --host 192.168.1.50 --user prisoner
#
# Si el script no tiene permiso de ejecucion:
#   chmod +x INSTALAR-XUPERTV.sh

APP_ID='com.webosflux.xuptertv.fidelity'
SVC_ID="${APP_ID}.service"
APP_DIR="/media/developer/apps/usr/palm/applications/${APP_ID}"
SVC_DIR="/media/developer/apps/usr/palm/services/${SVC_ID}"

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
CONFIG_FILE="${SCRIPT_DIR}/instalar-config.json"

TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/xuper-tv.XXXXXX") || {
    echo "No se pudo crear una carpeta temporal." >&2
    exit 1
}
ASKPASS_SCRIPT="${TMP_ROOT}/askpass.sh"
ASKPASS_FILE="${TMP_ROOT}/tvpass"
KEY_DIR="${TMP_ROOT}/tvkey"
KEY_PATH=''
KEY_IS_RSA=0

TV_HOST=''
TV_USER=''
PORT=0
DETECTED_PORT=0
IPK_ARG=''
DRY_RUN=0
NO_PAUSE=0
USER_EXPLICIT=0
ROOT_MODE=0
USE_KEY=0
TV_PASS=''
AUTH_PROMPTS=3
CFG_HOST=''
CFG_USER=''
CFG_PORT=''
SSH_OPTS=()
CANDIDATES=()
USERS=()
LAST_AUTH_ERROR=''
LAST_TRANSFER_ERROR=''
KEY_ERROR=''
KEY_PATH_RESULT=''
SCP_LEGACY=0

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

cleanup() {
    rm -rf "$TMP_ROOT" 2>/dev/null || true
}
trap cleanup EXIT

cleanup_key() {
    rm -rf "$KEY_DIR" 2>/dev/null || true
    KEY_PATH=''
    USE_KEY=0
}

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
    printf '      X u p e r T V   para   L G   w e b O S\n'
    printf '      Instalador automatico para Linux\n'
    printf '   ==================================================================\n'
}

usage() {
    cat <<EOF
Uso: $(basename "$0") [opciones]

  --ipk RUTA       Paquete .ipk (por defecto se busca junto al instalador)
  --host IP        IP o nombre del televisor
  --user USUARIO   prisoner (Modo Desarrollador), prisioner o root
  --port PUERTO    9922 para Modo Desarrollador, 22 para TV con root
  --dry-run        Comprueba todo sin tocar la TV
  --no-pause       No espera a pulsar ENTER al terminar
  -h, --help       Muestra esta ayuda
EOF
}

pause_end() {
    cleanup_key
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

get_local_ipv4() {
    LOCAL_IPS=()
    local cidr
    if command -v ip >/dev/null 2>&1; then
        while IFS= read -r cidr; do
            [ -n "$cidr" ] && LOCAL_IPS+=("$cidr")
        done < <(ip -o -4 addr show scope global 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="inet"){print $(i+1); exit}}')
    else
        for cidr in $(hostname -I 2>/dev/null); do
            is_ipv4 "$cidr" || continue
            [ "$cidr" = '127.0.0.1' ] && continue
            LOCAL_IPS+=("${cidr}/24")
        done
    fi
}

ip_to_int() {
    local IFS=. a b c d
    read -r a b c d <<< "$1"
    printf '%s' $(( (10#$a << 24) | (10#$b << 16) | (10#$c << 8) | 10#$d ))
}

network_number() {
    local ip="$1" prefix="${2:-24}" val mask
    [[ "$prefix" =~ ^[0-9]+$ ]] || prefix=24
    [ "$prefix" -lt 1 ] && prefix=24
    [ "$prefix" -gt 32 ] && prefix=24
    val=$(ip_to_int "$ip")
    mask=$(( (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF ))
    printf '%s' $(( val & mask ))
}

same_lan() {
    local ip="$1" cidr lip prefix
    is_ipv4 "$ip" || return 1
    for cidr in "${LOCAL_IPS[@]}"; do
        lip="${cidr%/*}"
        prefix="${cidr#*/}"
        [ "$prefix" = "$cidr" ] && prefix=32
        if [ "$(network_number "$ip" "$prefix")" = "$(network_number "$lip" "$prefix")" ]; then
            printf '%s' "$lip"
            return 0
        fi
    done
    return 1
}

test_port() {
    local host="$1" port="$2" t="${3:-3}"
    timeout "$t" bash -c "exec 3<>/dev/tcp/${host}/${port}" 2>/dev/null
}

find_ssh_port() {
    local ip="$1" t="$2"
    shift 2
    local p
    for p in "$@"; do
        [ "$p" -gt 0 ] 2>/dev/null || continue
        if test_port "$ip" "$p" "$t"; then
            printf '%s' "$p"
            return 0
        fi
    done
    printf '0'
}

find_ssh_hosts() {
    local -A byip=()
    local ports=(22 9922)
    local cidr lip base start end h p ip tmpfile
    local -a out=()

    for cidr in "${LOCAL_IPS[@]}"; do
        lip="${cidr%/*}"
        base="${lip%.*}"
        for start in 1 65 129 193; do
            end=$((start + 63))
            [ "$end" -gt 254 ] && end=254
            tmpfile="${TMP_ROOT}/scan.${start}.${RANDOM}"
            : > "$tmpfile"
            for h in $(seq "$start" "$end"); do
                ip="${base}.${h}"
                [ "$ip" = "$lip" ] && continue
                for p in "${ports[@]}"; do
                    (
                        if test_port "$ip" "$p" 1; then
                            printf '%s %s\n' "$ip" "$p" >> "$tmpfile"
                        fi
                    ) &
                done
            done
            sleep 0.4
            wait
            while read -r ip p; do
                [ -n "$ip" ] || continue
                if [ -z "${byip[$ip]:-}" ] || [ "$p" -eq 9922 ]; then
                    byip[$ip]="$p"
                fi
            done < "$tmpfile"
            rm -f "$tmpfile"
        done
    done

    [ ${#byip[@]} -eq 0 ] && return 0
    for ip in "${!byip[@]}"; do
        out+=("${ip} ${byip[$ip]}")
    done
    printf '%s\n' "${out[@]}" | sort -V
}

select_tv_from_scan() {
    if [ ${#LOCAL_IPS[@]} -eq 0 ]; then
        fail 'No encuentro la red de este ordenador.' >&2
        info 'Comprueba que el PC tiene WiFi o cable conectado.' >&2
        return 1
    fi

    title 'Buscando la TV en tu red (unos segundos)...' >&2
    info 'Solo funciona si el Modo Desarrollador esta activo en la TV.' >&2

    local -a found=()
    local entry
    while IFS= read -r entry; do
        [ -n "$entry" ] && found+=("$entry")
    done < <(find_ssh_hosts)

    if [ ${#found[@]} -eq 0 ]; then
        warn 'No he encontrado ningun aparato con el modo desarrollador abierto.' >&2
        info 'Abre la app "Developer Mode" en la TV y comprueba que esta activada.' >&2
        info 'Despues escribe B otra vez, o copia la IP a mano.' >&2
        return 1
    fi

    if [ ${#found[@]} -eq 1 ]; then
        local ip="${found[0]%% *}" p="${found[0]##* }"
        ok "Encontrado: ${ip}  (puerto ${p})" >&2
        local confirm
        confirm=$(read_default 'Es tu televisor? (s/n)' 's')
        if [[ "$confirm" =~ ^[nN] ]]; then
            return 1
        fi
        printf '%s\n' "${found[0]}"
        return 0
    fi

    title 'He encontrado varios aparatos. Cual es tu televisor?' >&2
    local i
    for i in "${!found[@]}"; do
        info "$((i + 1))) ${found[$i]%% *}   (puerto ${found[$i]##* })" >&2
    done
    local pick idx
    pick=$(read_default 'Numero' '1')
    idx="$pick"
    [[ "$idx" =~ ^[0-9]+$ ]] || idx=1
    [ "$idx" -lt 1 ] && idx=1
    [ "$idx" -gt ${#found[@]} ] && idx=${#found[@]}
    printf '%s\n' "${found[$((idx - 1))]}"
}

ssh_supports() {
    ssh -G -o "$1" localhost >/dev/null 2>&1
}

build_ssh_opts() {
    SSH_OPTS=()
    if ssh_supports 'StrictHostKeyChecking=accept-new'; then
        SSH_OPTS+=(-o StrictHostKeyChecking=accept-new)
    else
        SSH_OPTS+=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)
    fi
    SSH_OPTS+=(-o ConnectTimeout=20 -o ServerAliveInterval=15)

    local opt
    for opt in \
        'HostKeyAlgorithms=+ssh-rsa' \
        'KexAlgorithms=+diffie-hellman-group14-sha1' \
        'MACs=+hmac-sha1'
    do
        if ssh_supports "$opt"; then
            SSH_OPTS+=(-o "$opt")
        fi
    done
}

prepare_askpass() {
    if [ ! -f "$ASKPASS_SCRIPT" ]; then
        cat > "$ASKPASS_SCRIPT" <<'ASKPASS_EOF'
#!/bin/sh
cat "$XUPER_ASKPASS_FILE"
ASKPASS_EOF
        chmod 700 "$ASKPASS_SCRIPT"
    fi
    printf '%s\n' "$TV_PASS" > "$ASKPASS_FILE"
    chmod 600 "$ASKPASS_FILE"
    export XUPER_ASKPASS_FILE="$ASKPASS_FILE"
    export SSH_ASKPASS="$ASKPASS_SCRIPT"
    export SSH_ASKPASS_REQUIRE=force
    export DISPLAY="${DISPLAY:-:0}"
}

run_tool() {
    local tool="$1" portflag="$2" port="$3"
    shift 3
    local -a base=("$portflag" "$port" "${SSH_OPTS[@]}")

    if [ "$USE_KEY" -eq 1 ]; then
        base+=(
            -o PreferredAuthentications=publickey
            -o BatchMode=yes
            -o NumberOfPasswordPrompts=0
            -o IdentitiesOnly=yes
            -i "$KEY_PATH"
        )
        if [ "$KEY_IS_RSA" -eq 1 ] && ssh_supports 'PubkeyAcceptedAlgorithms=ssh-rsa'; then
            base+=(-o PubkeyAcceptedAlgorithms=ssh-rsa)
        fi
        "$tool" "${base[@]}" "$@"
    else
        base+=(
            -o PreferredAuthentications=keyboard-interactive,password
            -o NumberOfPasswordPrompts="${AUTH_PROMPTS:-3}"
        )
        prepare_askpass
        if command -v setsid >/dev/null 2>&1; then
            setsid -w "$tool" "${base[@]}" "$@" </dev/null
        else
            "$tool" "${base[@]}" "$@" </dev/null
        fi
    fi
}

get_tv_key() {
    local ip="$1" pass="$2" path head pub
    local ok=0 i

    KEY_ERROR=''
    KEY_PATH_RESULT=''
    if ! test_port "$ip" 9991 4; then
        KEY_ERROR='La TV no abre el puerto 9991 (KEY SERVER).'
        return 1
    fi

    rm -rf "$KEY_DIR"
    mkdir -p "$KEY_DIR" || {
        KEY_ERROR='No se pudo crear la carpeta temporal para la llave.'
        return 1
    }
    path="${KEY_DIR}/webos_rsa"

    for i in 1 2 3; do
        if command -v curl >/dev/null 2>&1; then
            if curl -fsS --max-time 15 -o "$path" "http://${ip}:9991/webos_rsa" 2>/dev/null; then
                if [ -f "$path" ] && [ "$(wc -c < "$path")" -gt 100 ]; then
                    ok=1
                    break
                fi
            else
                KEY_ERROR='No se pudo descargar la llave de la TV.'
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget -q -T 15 -O "$path" "http://${ip}:9991/webos_rsa" 2>/dev/null; then
                if [ -f "$path" ] && [ "$(wc -c < "$path")" -gt 100 ]; then
                    ok=1
                    break
                fi
            else
                KEY_ERROR='No se pudo descargar la llave de la TV.'
            fi
        else
            KEY_ERROR='No hay curl ni wget para descargar la llave de la TV.'
            return 1
        fi
        [ "$i" -lt 3 ] && sleep 2
    done

    if [ "$ok" -ne 1 ]; then
        [ -z "$KEY_ERROR" ] && KEY_ERROR='La TV no entrego su llave de seguridad.'
        return 1
    fi

    head=$(head -n 2 "$path" 2>/dev/null)
    if [[ "$head" != *'PRIVATE KEY'* ]]; then
        KEY_ERROR='Lo que publica la TV no es una llave valida.'
        return 1
    fi
    chmod 600 "$path"

    if [[ "$head" == *'ENCRYPTED'* ]]; then
        if ! ssh-keygen -p -m PEM -P "$pass" -N '' -f "$path" >/dev/null 2>&1; then
            KEY_ERROR='La clave no abre la llave de la TV (passphrase incorrecta).'
            return 1
        fi
    fi

    pub=$(ssh-keygen -y -f "$path" </dev/null 2>/dev/null)
    if [[ ! "$pub" =~ ^ssh-(rsa|ed25519) ]]; then
        KEY_ERROR='La llave de la TV no se pudo leer despues de descifrarla.'
        return 1
    fi
    if [[ "$pub" == ssh-rsa* ]]; then
        KEY_IS_RSA=1
    else
        KEY_IS_RSA=0
    fi

    KEY_PATH_RESULT="$path"
    return 0
}

test_tv_password() {
    local pass="$1" user="$2" rc prev_key
    prev_key="$USE_KEY"
    USE_KEY=0
    TV_PASS="$pass"
    AUTH_PROMPTS=1
    LAST_AUTH_ERROR=$(run_tool ssh -p "$PORT" -o ConnectTimeout=8 "${user}@${TV_HOST}" true 2>&1)
    rc=$?
    USE_KEY="$prev_key"
    return "$rc"
}

test_key_auth() {
    local key="$1" user="$2"
    USE_KEY=1
    KEY_PATH="$key"
    LAST_AUTH_ERROR=$(run_tool ssh -p "$PORT" "${user}@${TV_HOST}" true 2>&1)
    return $?
}

send_file() {
    local local_path="$1" remote_path="$2" out rc
    local target="${TV_USER}@${TV_HOST}"
    local batch="${TMP_ROOT}/sftp.batch"

    LAST_TRANSFER_ERROR=''
    printf 'put "%s" "%s"\nquit\n' "$local_path" "$remote_path" > "$batch"

    if command -v sftp >/dev/null 2>&1; then
        out=$(run_tool sftp -P "$PORT" -b "$batch" "$target" 2>&1)
        rc=$?
        if [ "$rc" -eq 0 ]; then
            return 0
        fi
        LAST_TRANSFER_ERROR="$out"
    fi

    if command -v scp >/dev/null 2>&1; then
        local -a sargs=()
        [ "$SCP_LEGACY" -eq 1 ] && sargs+=(-O)
        out=$(run_tool scp -P "$PORT" "${sargs[@]}" "$local_path" "${target}:${remote_path}" 2>&1)
        rc=$?
        if [ "$rc" -eq 0 ]; then
            return 0
        fi
        LAST_TRANSFER_ERROR="$out"
    fi

    return 1
}

get_ssh_diagnosis() {
    local out
    if [ "$USE_KEY" -eq 1 ]; then
        out=$(run_tool ssh -p "$PORT" -o ConnectTimeout=8 "${TV_USER}@${TV_HOST}" true 2>&1)
    else
        USE_KEY=0
        AUTH_PROMPTS=0
        out=$(run_tool ssh -p "$PORT" -o BatchMode=yes -o NumberOfPasswordPrompts=0 -o ConnectTimeout=8 "${TV_USER}@${TV_HOST}" true 2>&1)
    fi
    printf '%s' "$out"
}

explain_ssh_error() {
    local t="$1"
    if [[ "$t" =~ Permission[[:space:]]denied|Authentication[[:space:]]failed|Too[[:space:]]many[[:space:]]authentication ]]; then
        fail 'La contrasena no es correcta, o el Modo Desarrollador ha caducado.'
        info 'Abre la app "Developer Mode" en la TV y mira la clave que muestra ahora.'
        return 0
    fi
    if [[ "$t" =~ timed[[:space:]]out|No[[:space:]]route[[:space:]]to[[:space:]]host|Connection[[:space:]]refused|Network[[:space:]]is[[:space:]]unreachable|Could[[:space:]]not[[:space:]]resolve ]]; then
        fail 'No consigo hablar con el televisor.'
        info 'Comprueba que la TV esta encendida, en la MISMA red WiFi que este PC'
        info 'y que la IP es la que muestra la app Developer Mode.'
        return 0
    fi
    if [[ "$t" =~ Host[[:space:]]key[[:space:]]verification[[:space:]]failed ]]; then
        fail 'La TV cambio su huella de seguridad.'
        info "Borra su linea en: ${HOME}/.ssh/known_hosts"
        return 0
    fi
    fail 'No se pudo completar la conexion con el televisor.'
    info 'Reinicia la TV, vuelve a activar el Modo Desarrollador y repite.'
}

get_ipk_candidate() {
    local explicit="$1" r f
    if [ -n "$explicit" ]; then
        if [ ! -f "$explicit" ]; then
            fail "No existe el archivo: $explicit" >&2
            return 1
        fi
        realpath "$explicit"
        return 0
    fi

    local -a roots=(
        "$SCRIPT_DIR"
        "${SCRIPT_DIR}/dist"
        "$(dirname -- "$SCRIPT_DIR")"
        "$(dirname -- "$SCRIPT_DIR")/dist"
    )
    local -a list=()
    local -A seen=()

    for r in "${roots[@]}"; do
        [ -d "$r" ] || continue
        while IFS= read -r -d '' f; do
            [ -n "${seen[$f]:-}" ] && continue
            seen[$f]=1
            list+=("$f")
        done < <(find "$r" -maxdepth 1 -type f -iname '*.ipk' -print0 2>/dev/null)
    done

    [ ${#list[@]} -eq 0 ] && return 1

    local -a sorted=()
    mapfile -t sorted < <(
        for f in "${list[@]}"; do
            printf '%s\t%s\n' "$(stat -c %Y "$f" 2>/dev/null || echo 0)" "$f"
        done | sort -rn | cut -f2-
    )
    list=("${sorted[@]}")

    if [ ${#list[@]} -eq 1 ]; then
        printf '%s' "${list[0]}"
        return 0
    fi

    title 'Hay varios paquetes .ipk. Elige el numero:' >&2
    local i
    for i in "${!list[@]}"; do
        local mb
        mb=$(awk -v b="$(stat -c %s "${list[$i]}")" 'BEGIN { printf "%.1f", b / 1048576 }')
        info "$((i + 1))) $(basename "${list[$i]}")  (${mb} MB)" >&2
    done
    local pick idx
    pick=$(read_default 'Numero' '1')
    idx="$pick"
    [[ "$idx" =~ ^[0-9]+$ ]] || idx=1
    [ "$idx" -lt 1 ] && idx=1
    [ "$idx" -gt ${#list[@]} ] && idx=${#list[@]}
    printf '%s' "${list[$((idx - 1))]}"
}

get_ipk_version() {
    local path="$1" tmp data txt
    tmp=$(mktemp -d "${TMP_ROOT}/ipk.XXXXXX") || return 1
    data="${tmp}/data.tar.gz"

    if command -v ar >/dev/null 2>&1; then
        ar p "$path" data.tar.gz > "$data" 2>/dev/null
    elif command -v bsdtar >/dev/null 2>&1; then
        bsdtar -xOf "$path" data.tar.gz > "$data" 2>/dev/null
    else
        rm -rf "$tmp"
        return 1
    fi

    if [ ! -s "$data" ]; then
        rm -rf "$tmp"
        return 1
    fi

    txt=$(tar -xzOf "$data" "usr/palm/applications/${APP_ID}/appinfo.json" 2>/dev/null)
    rm -rf "$tmp"

    sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' <<< "$txt" | head -n 1
}

cfg_get() {
    local file="$1" key="$2"
    [ -f "$file" ] || return 1
    sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$file" | head -n 1 | tr -d '\r'
}

build_users() {
    USERS=()
    if [ "$USER_EXPLICIT" -eq 1 ] && [ -n "$TV_USER" ]; then
        USERS=("$TV_USER")
        return 0
    fi
    local u prev dup
    for u in "$TV_USER" "$CFG_USER" prisoner prisioner; do
        [ -n "$u" ] || continue
        dup=0
        for prev in "${USERS[@]}"; do
            [ "$prev" = "$u" ] && dup=1
        done
        [ "$dup" -eq 0 ] && USERS+=("$u")
    done
}

test_scp_legacy() {
    command -v scp >/dev/null 2>&1 || return 1
    local usage
    usage=$(scp 2>&1 || true)
    [[ "$usage" == *'-O'* ]]
}

save_config() {
    printf '{\n    "host":  "%s",\n    "user":  "%s",\n    "port":  %s\n}\n' \
        "$TV_HOST" "$TV_USER" "$PORT" > "$CONFIG_FILE" 2>/dev/null || true
}

while [ $# -gt 0 ]; do
    case "$1" in
        --ipk|-Ipk)
            IPK_ARG="${2:-}"
            shift 2 || { echo 'Falta el valor de --ipk' >&2; exit 2; }
            ;;
        --host|-TvHost)
            TV_HOST="${2:-}"
            shift 2 || { echo 'Falta el valor de --host' >&2; exit 2; }
            ;;
        --user|-TvUser)
            TV_USER="${2:-}"
            shift 2 || { echo 'Falta el valor de --user' >&2; exit 2; }
            ;;
        --port|-Port)
            PORT="${2:-0}"
            shift 2 || { echo 'Falta el valor de --port' >&2; exit 2; }
            ;;
        --dry-run|-DryRun)
            DRY_RUN=1
            shift
            ;;
        --no-pause|-NoPause)
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

if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    PORT=0
fi

if [ -n "$TV_USER" ]; then
    USER_EXPLICIT=1
    [ "$TV_USER" = 'root' ] && ROOT_MODE=1
fi

show_banner

# ------------------------------------------------------------------ 1. equipo
step '1/6' 'Comprobando este equipo'

for cmd in ssh ssh-keygen tar timeout; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        fail "Falta el programa obligatorio: $cmd"
        info 'En Debian/Ubuntu: sudo apt install openssh-client tar coreutils'
        pause_end
        exit 1
    fi
done

if ! command -v sftp >/dev/null 2>&1 && ! command -v scp >/dev/null 2>&1; then
    fail 'No hay sftp ni scp instalados.'
    info 'En Debian/Ubuntu: sudo apt install openssh-client'
    pause_end
    exit 1
fi

if ! command -v ar >/dev/null 2>&1 && ! command -v bsdtar >/dev/null 2>&1; then
    warn 'No hay "ar" ni "bsdtar": no podre leer la version del paquete .ipk.'
    info 'En Debian/Ubuntu: sudo apt install binutils'
fi

if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    warn 'No hay "curl" ni "wget": si la TV usa KEY SERVER no podre bajar su llave.'
    info 'En Debian/Ubuntu: sudo apt install curl'
fi

if ! command -v setsid >/dev/null 2>&1; then
    warn 'No hay "setsid": la autenticacion por contrasena podria no funcionar.'
    info 'En Debian/Ubuntu: sudo apt install util-linux'
fi

ok 'Cliente SSH disponible'

# ------------------------------------------------------------------ 2. paquete
step '2/6' 'Buscando el paquete de la aplicacion (.ipk)'

if ! ipk_path=$(get_ipk_candidate "$IPK_ARG"); then
    fail 'No encuentro ningun archivo .ipk.'
    info 'El .ipk tiene que estar EN LA MISMA CARPETA que este instalador.'
    info 'Si lo estas abriendo desde dentro del ZIP, primero extrae la carpeta.'
    manual=$(read_default 'Escribe la ruta completa del .ipk' '')
    if [ -n "$manual" ] && [ -f "$manual" ]; then
        ipk_path=$(realpath "$manual")
    else
        pause_end
        exit 1
    fi
fi

ipk_name=$(basename "$ipk_path")
ipk_size=$(awk -v b="$(stat -c %s "$ipk_path")" 'BEGIN { printf "%.1f", b / 1048576 }')
ok "${ipk_name}  (${ipk_size} MB)"

# ------------------------------------------------------------------ 3. la TV
CFG_HOST=$(cfg_get "$CONFIG_FILE" host || true)
CFG_USER=$(cfg_get "$CONFIG_FILE" user || true)
CFG_PORT=$(cfg_get "$CONFIG_FILE" port || true)

step '3/6' 'Datos del televisor'
info 'La IP y la clave las muestra la app "Developer Mode" en la pantalla de la TV.'
info 'Al activar el modo la TV se reinicia, y entonces la IP PUEDE CAMBIAR.'

get_local_ipv4
if [ ${#LOCAL_IPS[@]} -gt 0 ]; then
    local_list=''
    for cidr in "${LOCAL_IPS[@]}"; do
        local_list+="${cidr%/*}, "
    done
    info "Este ordenador esta en: ${local_list%, }"
fi

if [ -z "$TV_HOST" ]; then
    [ -n "$CFG_HOST" ] && info "La ultima vez funciono con ${CFG_HOST}. Pulsa Enter para repetirla."
    intentos=0
    while [ -z "$TV_HOST" ]; do
        v=$(read_default 'IP del televisor (o B para buscarla)' "$CFG_HOST")
        if [ -z "$v" ] || [[ "$v" =~ ^([bB]|buscar|busca)$ ]]; then
            intentos=$((intentos + 1))
            if [ "$intentos" -gt 2 ]; then
                fail 'No consigo dar con la IP del televisor.'
                info 'Mira la app "Developer Mode" en la TV y escribe la IP a mano.'
                pause_end
                exit 1
            fi
            hit=$(select_tv_from_scan) || hit=''
            if [ -n "$hit" ]; then
                TV_HOST="${hit%% *}"
                DETECTED_PORT="${hit##* }"
            fi
            continue
        fi
        if ! valid_host "$v"; then
            fail 'Eso no parece una IP. Ejemplo: 192.168.1.50'
            info 'Si no sabes cual es, escribe B y la busco yo en tu red.'
            continue
        fi
        TV_HOST="$v"
    done
fi

if [ -z "$TV_USER" ]; then
    info 'Tipo de TV:  1) Modo Desarrollador (lo normal)   2) TV con root'
    choice=$(read_default 'Elige 1 o 2' '1')
    if [ "$choice" = '2' ]; then
        TV_USER='root'
        USER_EXPLICIT=1
        ROOT_MODE=1
    fi
fi

if is_ipv4 "$TV_HOST" && [ ${#LOCAL_IPS[@]} -gt 0 ]; then
    if ! same_lan "$TV_HOST" >/dev/null; then
        warn "La TV (${TV_HOST}) no esta en la misma red que este PC."
        info 'Con la TV y el PC en redes distintas no hay forma de conectarlos.'
        info 'Conecta los dos al mismo router/WiFi y repite (ojo con el WiFi de invitados).'
        go=$(read_default 'Continuar de todas formas? (s/n)' 'n')
        if [[ ! "$go" =~ ^[sS] ]]; then
            pause_end
            exit 1
        fi
    fi
fi

# ------------------------------------------------------------------ 4. conexion
step '4/6' 'Comprobando la conexion'

if [ "$PORT" -le 0 ] 2>/dev/null; then
    raw_candidates=()
    if [ "$ROOT_MODE" -eq 1 ]; then
        raw_candidates+=(22)
        [ "$DETECTED_PORT" -gt 0 ] 2>/dev/null && raw_candidates+=("$DETECTED_PORT")
        [ -n "$CFG_PORT" ] && raw_candidates+=("$CFG_PORT")
        raw_candidates+=(9922)
    else
        raw_candidates+=(9922)
        [ "$DETECTED_PORT" -gt 0 ] 2>/dev/null && raw_candidates+=("$DETECTED_PORT")
        [ -n "$CFG_PORT" ] && raw_candidates+=("$CFG_PORT")
        raw_candidates+=(22)
    fi

    CANDIDATES=()
    for p in "${raw_candidates[@]}"; do
        [ "$p" -gt 0 ] 2>/dev/null || continue
        dup=0
        for seen in "${CANDIDATES[@]}"; do
            [ "$seen" = "$p" ] && dup=1
        done
        [ "$dup" -eq 0 ] && CANDIDATES+=("$p")
    done

    if [ "$DRY_RUN" -eq 1 ]; then
        PORT="${CANDIDATES[0]}"
        info "Puerto: ${PORT} (o el 22; se detecta al conectar)"
    else
        PORT=$(find_ssh_port "$TV_HOST" 2.5 "${CANDIDATES[@]}")
        if [ "$PORT" -eq 0 ]; then
            PORT="${CANDIDATES[0]}"
            warn "El SSH de la TV no responde en el puerto ${PORT}."
        else
            ok "El SSH de la TV escucha en el puerto ${PORT}"
        fi
    fi
fi

if [ "$DRY_RUN" -eq 1 ]; then
    info 'Modo de prueba: no se comprueba la red.'
else
    while true; do
        if test_port "$TV_HOST" "$PORT" 3; then
            ok 'El televisor responde'
            break
        fi

        warn "El televisor no responde en ${TV_HOST}:${PORT}."
        info 'Suele ser una de tres cosas: la TV esta apagada, la IP ha cambiado,'
        info 'o la TV y el PC estan en redes distintas.'
        if [ ${#LOCAL_IPS[@]} -gt 0 ]; then
            local_list=''
            for cidr in "${LOCAL_IPS[@]}"; do
                local_list+="${cidr%/*}, "
            done
            info "Este PC esta en: ${local_list%, }"
        fi

        cambiado=0
        for otro in 9922 22; do
            if [ "$otro" != "$PORT" ] && test_port "$TV_HOST" "$otro" 1.5; then
                ok "Pero responde en el puerto ${otro}: uso ese."
                PORT="$otro"
                cambiado=1
                break
            fi
        done
        [ "$cambiado" -eq 1 ] && continue

        title 'Que quieres hacer?'
        info '1) Escribir otra IP'
        info '2) Buscar la TV en la red (recomendado)'
        info '3) Salir'
        pick=$(read_default 'Elige 1, 2 o 3' '2')
        case "$pick" in
            3)
                pause_end
                exit 1
                ;;
            1)
                nueva=$(read_default 'IP del televisor' '')
                if valid_host "$nueva"; then
                    TV_HOST="$nueva"
                    PORT=$(find_ssh_port "$TV_HOST" 2 9922 22)
                    [ "$PORT" -eq 0 ] && PORT=9922
                else
                    fail 'Eso no parece una IP.'
                fi
                ;;
            *)
                hit=$(select_tv_from_scan) || hit=''
                if [ -n "$hit" ]; then
                    TV_HOST="${hit%% *}"
                    PORT="${hit##* }"
                fi
                ;;
        esac
    done
fi

user_label="$TV_USER"
[ -z "$user_label" ] && user_label='se detecta al conectar'
ok "TV: ${TV_HOST}:${PORT}  usuario: ${user_label}"

build_ssh_opts
test_scp_legacy && SCP_LEGACY=1

REMOTE_DIR='/media/developer/temp'
REMOTE_IPK="${REMOTE_DIR}/${ipk_name}"

EXPECTED=$(get_ipk_version "$ipk_path")
if [ -z "$EXPECTED" ]; then
    EXPECTED=$(basename "$ipk_path" | sed -n 's/.*_\([0-9][0-9.]*\)_all\.ipk/\1/p')
fi
[ -z "$EXPECTED" ] && EXPECTED='desconocida'

if [ "$DRY_RUN" -eq 1 ]; then
    title 'DRY RUN (no se toca la TV)'
    info "IPK     : ${ipk_path}"
    info "Version : ${EXPECTED}"
    info "TV      : ${user_label}@${TV_HOST}:${PORT}"
    info "Destino : ${REMOTE_IPK}"
    pause_end
    exit 0
fi

# ------------------------------------------------------------------ 5. copiar
step '5/6' 'Copiando la aplicacion al televisor'

if [ "$ROOT_MODE" -eq 1 ]; then
    info 'Escribe la contrasena SSH de Homebrew Channel.'
    info 'Si nunca la cambiaste, normalmente es: alpine'
else
    info 'Escribe la clave que muestra la app "Developer Mode" en la TV.'
fi
info 'No se ve nada mientras escribes: es normal.'
printf '\n'

TV_PASS=''
intentos_pass=0
auth_ok=0
build_users

while [ -z "$TV_PASS" ]; do
    intentos_pass=$((intentos_pass + 1))
    if [ "$intentos_pass" -gt 3 ]; then
        fail 'La TV no acepta ninguna de las claves escritas.'
        if [ "$ROOT_MODE" -eq 1 ]; then
            info 'Comprueba que SSH Server este activado en Homebrew Channel.'
            info 'Usa la contrasena SSH configurada alli (por defecto: alpine).'
        else
            info 'Abre la app "Developer Mode" en la TV y mira la clave de ahora.'
            info 'Si pone KEY SERVER en ON, esa misma clave desbloquea la llave de la TV.'
            info 'Si la sesion esta caducada, renovadla (dura 50 horas) y repite.'
        fi
        pause_end
        exit 1
    fi

    read -r -s -p '   Clave de la TV (no se ve al escribir): ' TV_PASS || true
    printf '\n'
    TV_PASS=$(trim "$TV_PASS")
    if [ -z "$TV_PASS" ]; then
        fail 'La clave no puede estar vacia.'
        TV_PASS=''
        continue
    fi

    info 'Comprobando la clave con la TV...'
    build_users
    AUTH_PROMPTS=3
    auth_ok=0

    for u in "${USERS[@]}"; do
        if test_tv_password "$TV_PASS" "$u"; then
            TV_USER="$u"
            USE_KEY=0
            KEY_PATH=''
            auth_ok=1
            ok "La TV acepta la clave (usuario ${u})"
            break
        fi
    done

    if [ "$auth_ok" -eq 0 ] && [ "$ROOT_MODE" -ne 1 ]; then
        info 'No la acepta como contrasena. Probando la llave de seguridad...'
        key_path=''
        for key_round in 1 2 3; do
            [ "$key_round" -gt 1 ] && {
                info "La TV aun sincroniza su llave. Solicito una nueva (${key_round}/3)..."
                sleep 4
            }
            if get_tv_key "$TV_HOST" "$TV_PASS"; then
                key_path="$KEY_PATH_RESULT"
            else
                key_path=''
            fi
            if [ -n "$key_path" ]; then
                for u in "${USERS[@]}"; do
                    if test_key_auth "$key_path" "$u"; then
                        auth_ok=1
                        TV_USER="$u"
                        KEY_PATH="$key_path"
                        break
                    fi
                done
                if [ "$auth_ok" -eq 1 ]; then
                    ok "La TV acepta la llave de seguridad (KEY SERVER, usuario ${TV_USER})"
                    break
                fi
            fi
        done

        if [ "$auth_ok" -eq 0 ] && [ -n "$key_path" ]; then
            fail 'La clave es correcta, pero la TV rechazo tres llaves nuevas.'
            info "Cuentas probadas: ${USERS[*]}"
            if [ -n "$LAST_AUTH_ERROR" ]; then
                primera=$(printf '%s\n' "$LAST_AUTH_ERROR" | grep -E 'denied|refused|reset|closed|Too many' | head -n 1 || true)
                [ -n "$primera" ] && info "La TV respondio: $(trim "$primera")"
            fi
            USE_KEY=1
            KEY_PATH="$key_path"
            dbg=$(run_tool ssh -p "$PORT" -vvv "${USERS[${#USERS[@]}-1]}@${TV_HOST}" true 2>&1 | grep -E 'Offering public key|Server accepts key|Authentications that can continue|Next authentication|sign_and_send_pubkey|send_pubkey_test|Permission denied|Too many authentication|no mutual signature|Load key|Will attempt|Connection closed|Connection reset' || true)
            if [ -n "$dbg" ]; then
                info 'Detalle tecnico:'
                printf '%s\n' "$dbg" | sed 's/^/           /'
            fi
            diag_log="${TMPDIR:-/tmp}/diagnostico-xupertv.txt"
            {
                printf 'XuperTV - diagnostico de la llave de seguridad\n'
                printf 'TV      : %s@%s:%s\n' "${USERS[${#USERS[@]}-1]}" "$TV_HOST" "$PORT"
                printf 'Fecha   : %s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
                printf 'Huella  : %s\n' "$(ssh-keygen -lf "$key_path" 2>&1)"
                printf 'Version : %s\n\n' "$(ssh -V 2>&1)"
                printf '%s\n' "$LAST_AUTH_ERROR"
            } > "$diag_log" 2>/dev/null || true
            info "Diagnostico guardado en: ${diag_log}"
            info 'Envia ese archivo si necesitas ayuda.'
            pause_end
            exit 1
        elif [ "$auth_ok" -eq 0 ] && [ -n "$KEY_ERROR" ]; then
            warn "No se pudo usar la llave de la TV: ${KEY_ERROR}"
        fi
    fi

    if [ "$auth_ok" -eq 0 ]; then
        fail 'La TV ha rechazado esa clave.'
        if [ "$ROOT_MODE" -eq 1 ]; then
            info 'Comprueba SSH Server en Homebrew Channel y la contrasena root.'
        else
            info 'Escribela otra vez con cuidado: no se ve al escribir.'
        fi
        if [ "$ROOT_MODE" -ne 1 ] && [ "$intentos_pass" -ge 2 ]; then
            info 'Tiene que ser la que muestra la app Developer Mode, tal cual.'
        fi
        TV_PASS=''
    fi
done
printf '\n'

build_users
USE_KEY=0
[ -n "$KEY_PATH" ] && [ "$auth_ok" -eq 1 ] && USE_KEY=1

if ! send_file "$ipk_path" "$REMOTE_IPK"; then
    diag=$(get_ssh_diagnosis)
    if [[ "$diag" =~ timed[[:space:]]out|No[[:space:]]route[[:space:]]to[[:space:]]host|Connection[[:space:]]refused|Network[[:space:]]is[[:space:]]unreachable|Could[[:space:]]not[[:space:]]resolve ]]; then
        explain_ssh_error "$diag"
        pause_end
        exit 1
    fi
    warn 'No pude escribir en /media/developer/temp. Pruebo en /tmp...'
    REMOTE_DIR='/tmp'
    REMOTE_IPK="${REMOTE_DIR}/${ipk_name}"
    if ! send_file "$ipk_path" "$REMOTE_IPK"; then
        fail 'No pude copiar la aplicacion al televisor.'
        if [ -n "$LAST_TRANSFER_ERROR" ]; then
            linea=$(printf '%s\n' "$LAST_TRANSFER_ERROR" | grep -v '^[[:space:]]*$' | tail -n 2 | tr '\n' ' ' || true)
            [ -n "$linea" ] && info "La TV respondio: $(trim "$linea")"
        fi
        explain_ssh_error "$(get_ssh_diagnosis)"
        pause_end
        exit 1
    fi
fi
ok 'Paquete copiado'

# ------------------------------------------------------------------ 6. instalar
step '6/6' 'Instalando en el televisor'
info 'No cierres esta terminal. Puede tardar entre 30 segundos y 2 minutos.'
printf '\n'
info "Version que se va a instalar: ${EXPECTED}"

INSTALL_JSON="{\"id\":\"${APP_ID}\",\"ipkUrl\":\"${REMOTE_IPK}\",\"subscribe\":true}"
LAUNCH_JSON="{\"id\":\"${APP_ID}\"}"
INSTALL_JSON_PATH="${REMOTE_DIR}/xuper-install.json"
LAUNCH_JSON_PATH="${REMOTE_DIR}/xuper-launch.json"
REMOTE_SH_PATH="${REMOTE_DIR}/xuper-instalar.sh"

REMOTE_SCRIPT=$(cat <<'REMOTE_EOF'
#!/bin/sh
APP="@@APPDIR@@"
SVC="@@SVCDIR@@"
EXPECT="@@VERSION@@"
JSON="@@JSON@@"
LOG="${JSON}.log"

echo ""
echo "   >> La TV esta instalando el paquete..."
luna-send-pub -i -f luna://com.webos.appInstallService/dev/install "$(cat $JSON)" > "$LOG" 2>&1 &
PID=$!

i=0
V=""
while [ $i -lt 75 ]; do
  V=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$APP/appinfo.json" 2>/dev/null | head -n 1)
  if [ "$EXPECT" != "desconocida" ]; then
    if [ "$V" = "$EXPECT" ]; then break; fi
  else
    if grep -q '"returnValue"[[:space:]]*:[[:space:]]*true' "$LOG" 2>/dev/null; then break; fi
  fi
  if [ $((i % 5)) -eq 0 ]; then printf "."; fi
  sleep 2
  i=$((i + 1))
done
printf "\n"
kill $PID 2>/dev/null

if [ "$EXPECT" != "desconocida" ] && [ "$V" != "$EXPECT" ]; then
  if grep -q '"downgrade"[[:space:]]*:[[:space:]]*true' "$LOG" 2>/dev/null; then
    echo "   >> La TV rechazo el paquete como una version anterior."
    echo "   >> Esto ocurre cuando webOS compara 1.5.12 como menor que 1.5.9."
    echo "   >> Usa un paquete con version mayor (por ejemplo 1.6.0) o desinstala la version previa."
  fi
  echo "   >> La TV no confirmo la instalacion (encontrada: ${V:-ninguna})"
  echo "   ---- respuesta del televisor ----"
  tail -n 12 "$LOG" 2>/dev/null | sed 's/^/      /'
  echo "   --------------------------------"
  exit 3
fi

if [ "$EXPECT" = "desconocida" ] && ! grep -q '"returnValue"[[:space:]]*:[[:space:]]*true' "$LOG" 2>/dev/null; then
  echo "   >> La TV no confirmo la instalacion"
  echo "   ---- respuesta del televisor ----"
  tail -n 12 "$LOG" 2>/dev/null | sed 's/^/      /'
  echo "   --------------------------------"
  exit 3
fi

echo "   >> Instalada la version ${V:-correctamente}"

PERMS=$(ls -l "$SVC/ffmpeg" 2>/dev/null | cut -c1-10)
echo "   >> ffmpeg en la TV: ${PERMS:-no encontrado}"
case "$PERMS" in
  *x*) : ;;
  *)
    chmod 755 "$SVC/ffmpeg" 2>/dev/null
    PERMS=$(ls -l "$SVC/ffmpeg" 2>/dev/null | cut -c1-10)
    echo "   >> ffmpeg corregido: ${PERMS:-no encontrado}"
    ;;
esac

echo "   >> Abriendo XuperTV en el televisor..."
luna-send-pub -n 1 -f luna://com.webos.applicationManager/launch "$(cat @@LAUNCH@@)" > /dev/null 2>&1
exit 0
REMOTE_EOF
)

REMOTE_SCRIPT=${REMOTE_SCRIPT//@@APPDIR@@/$APP_DIR}
REMOTE_SCRIPT=${REMOTE_SCRIPT//@@SVCDIR@@/$SVC_DIR}
REMOTE_SCRIPT=${REMOTE_SCRIPT//@@VERSION@@/$EXPECTED}
REMOTE_SCRIPT=${REMOTE_SCRIPT//@@JSON@@/$INSTALL_JSON_PATH}
REMOTE_SCRIPT=${REMOTE_SCRIPT//@@LAUNCH@@/$LAUNCH_JSON_PATH}

LOCAL_SH="${TMP_ROOT}/xuper-instalar.sh"
LOCAL_INSTALL_JSON="${TMP_ROOT}/xuper-install.json"
LOCAL_LAUNCH_JSON="${TMP_ROOT}/xuper-launch.json"

printf '%s\n' "$REMOTE_SCRIPT" > "$LOCAL_SH"
printf '%s' "$INSTALL_JSON" > "$LOCAL_INSTALL_JSON"
printf '%s' "$LAUNCH_JSON" > "$LOCAL_LAUNCH_JSON"

files_ok=1
for leaf in xuper-instalar.sh xuper-install.json xuper-launch.json; do
    if ! send_file "${TMP_ROOT}/${leaf}" "${REMOTE_DIR}/${leaf}"; then
        files_ok=0
        break
    fi
done

if [ "$files_ok" -ne 1 ]; then
    explain_ssh_error "$(get_ssh_diagnosis)"
    pause_end
    exit 1
fi

run_tool ssh -p "$PORT" "${TV_USER}@${TV_HOST}" "sh ${REMOTE_SH_PATH}"
install_exit=$?

cleanup_key

line
if [ "$install_exit" -eq 0 ]; then
    printf '\n'
    printf '   %sLISTO. XuperTV esta instalada en tu televisor.%s\n' "$C_GREEN" "$C_RESET"
    printf '\n'
    info 'En la TV aparece en la barra de inicio como "XuperTV".'
    info 'Si no la ves, apaga y enciende la TV y mira en "Mis aplicaciones".'
    info ''
    info 'Para ACTUALIZAR: vuelve a ejecutar este mismo instalador.'
    info 'Para DESINSTALAR: manten pulsado el boton sobre el icono de la app en la TV.'
    save_config
    pause_end
    exit 0
else
    printf '\n'
    fail 'La instalacion no termino bien.'
    info 'Copia el mensaje de arriba y pasalo a quien te dio el archivo.'
    info 'Prueba tambien a reiniciar la TV y repetir.'
    pause_end
    exit 1
fi
