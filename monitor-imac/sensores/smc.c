// Reads temperature and fan keys straight from the Apple SMC (System
// Management Controller) on Intel Macs, for machines where powermetrics shows
// no sensors (such as older iMacs running a newer macOS through OCLP).
// Prints one "KEY value" line per key that answers. No root needed.
//
//   clang -O2 -framework IOKit -o smc-lector smc.c
#include <IOKit/IOKitLib.h>
#include <stdio.h>
#include <string.h>

#define KERNEL_INDEX_SMC 2
#define SMC_CMD_READ_BYTES 5
#define SMC_CMD_READ_KEYINFO 9

// Layout the AppleSMC kernel driver expects (same as smcFanControl's smc.h).
typedef struct { char major, minor, build, reserved[1]; UInt16 release; } SMCKeyData_vers_t;
typedef struct { UInt16 version, length; UInt32 cpuPLimit, gpuPLimit, memPLimit; } SMCKeyData_pLimitData_t;
typedef struct { UInt32 dataSize, dataType; char dataAttributes; } SMCKeyData_keyInfo_t;
typedef unsigned char SMCBytes_t[32];
typedef struct {
  UInt32 key;
  SMCKeyData_vers_t vers;
  SMCKeyData_pLimitData_t pLimitData;
  SMCKeyData_keyInfo_t keyInfo;
  char result, status, data8;
  UInt32 data32;
  SMCBytes_t bytes;
} SMCKeyData_t;

static io_connect_t conexion;

static UInt32 fourcc(const char *s) {
  return ((UInt32)s[0] << 24) | ((UInt32)s[1] << 16) | ((UInt32)s[2] << 8) | (UInt32)s[3];
}

static int llamar(SMCKeyData_t *entrada, SMCKeyData_t *salida) {
  size_t tam = sizeof(SMCKeyData_t);
  kern_return_t r = IOConnectCallStructMethod(conexion, KERNEL_INDEX_SMC, entrada, sizeof(SMCKeyData_t), salida, &tam);
  return r == kIOReturnSuccess && salida->result == 0;
}

// Reads one key and converts it to a number. Returns 0 if the key is missing.
static int leer(const char *clave, double *valor) {
  SMCKeyData_t entrada, salida;
  memset(&entrada, 0, sizeof entrada);
  memset(&salida, 0, sizeof salida);
  entrada.key = fourcc(clave);
  entrada.data8 = SMC_CMD_READ_KEYINFO;
  if (!llamar(&entrada, &salida)) return 0;

  UInt32 tipo = salida.keyInfo.dataType;
  entrada.keyInfo.dataSize = salida.keyInfo.dataSize;
  entrada.data8 = SMC_CMD_READ_BYTES;
  memset(&salida, 0, sizeof salida);
  if (!llamar(&entrada, &salida)) return 0;

  unsigned char *b = salida.bytes;
  if (tipo == fourcc("sp78")) *valor = (signed char)b[0] + b[1] / 256.0;
  else if (tipo == fourcc("fpe2")) *valor = ((b[0] << 8) | b[1]) / 4.0;
  else if (tipo == fourcc("ui8 ")) *valor = b[0];
  else if (tipo == fourcc("ui16")) *valor = (b[0] << 8) | b[1];
  else if (tipo == fourcc("flt ")) { float f; memcpy(&f, b, 4); *valor = f; }
  else return 0;
  return 1;
}

int main(void) {
  io_service_t servicio = IOServiceGetMatchingService(MACH_PORT_NULL, IOServiceMatching("AppleSMC"));
  if (!servicio || IOServiceOpen(servicio, mach_task_self(), 0, &conexion) != kIOReturnSuccess) {
    fprintf(stderr, "No se pudo abrir el SMC\n");
    return 1;
  }
  IOObjectRelease(servicio);

  // CPU die/proximity/heatsink, GPU die/proximity/heatsink, disk, memory, ambient.
  const char *temperaturas[] = {"TC0D", "TC0E", "TC0F", "TC0P", "TC0H", "TG0D", "TG0P", "TG0H",
                                "TH0P", "TH1P", "Tm0P", "TA0P", "TL0P", "TW0P", "TO0P"};
  double v;
  for (size_t i = 0; i < sizeof temperaturas / sizeof *temperaturas; i++)
    if (leer(temperaturas[i], &v) && v > 1 && v < 130) printf("%s %.2f\n", temperaturas[i], v);

  int ventiladores = leer("FNum", &v) ? (int)v : 0;
  printf("FNum %d\n", ventiladores);
  for (int i = 0; i < ventiladores && i < 10; i++) {
    char clave[5];
    snprintf(clave, sizeof clave, "F%dAc", i);
    if (leer(clave, &v)) printf("%s %.0f\n", clave, v);
  }
  IOServiceClose(conexion);
  return 0;
}
