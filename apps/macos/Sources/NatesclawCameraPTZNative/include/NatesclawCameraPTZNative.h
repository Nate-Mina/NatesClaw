#ifndef NATESCLAW_CAMERA_PTZ_NATIVE_H
#define NATESCLAW_CAMERA_PTZ_NATIVE_H

#include <stddef.h>
#include <stdint.h>

typedef struct NatesclawUVCController NatesclawUVCController;

int natesclaw_uvc_parse_camera_terminal(
    const uint8_t *descriptors,
    size_t descriptors_length,
    uint8_t *terminal_id_out,
    uint32_t *controls_out
);

int natesclaw_uvc_open(
    uint32_t location_id,
    uint16_t vendor_id,
    uint16_t product_id,
    NatesclawUVCController **controller_out,
    uint32_t *controls_out,
    char **error_out
);

int natesclaw_uvc_control(
    NatesclawUVCController *controller,
    uint8_t selector,
    uint8_t request,
    void *data,
    uint16_t length,
    char **error_out
);

void natesclaw_uvc_close(NatesclawUVCController *controller);

#endif
