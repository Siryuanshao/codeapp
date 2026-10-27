#include <cstdio>
#include <cstring>

static int digit(int c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

int main(int argc, char **argv) {
    const char *output = nullptr;
    for (int i = 1; i + 1 < argc; ++i) {
        if (std::strcmp(argv[i], "-o") == 0) output = argv[i + 1];
    }
    if (!output) return 1;
    std::FILE *out = std::fopen(output, "wb");
    if (!out) return 1;
    if (std::strcmp(output, "/main.wasm") == 0) {
        std::FILE *in = std::fopen("/codeapp-debug-program.b64", "rb");
        if (!in) return 1;
        unsigned accumulator = 0;
        int bits = 0;
        for (int c; (c = std::fgetc(in)) != EOF;) {
            if (c == '=') break;
            int value = digit(c);
            if (value < 0) continue;
            accumulator = (accumulator << 6) | value;
            bits += 6;
            if (bits >= 8) {
                bits -= 8;
                std::fputc((accumulator >> bits) & 255, out);
            }
        }
        std::fclose(in);
    }
    std::fclose(out);
    return 0;
}
