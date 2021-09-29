#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>

#include "libbf/libbf.h"

// NOTE: We use malloc to create allocations on the heap, even though
// libbf does not use it directly. Since precision has a minimum size
// of 32 bits, we make all precision arguments of type uint32_t. This
// removes ambiguity around float64s that do not fit into the bit size.

// TODO: Consider using a custom allocator that uses resizable JavaScript
//  byte buffers. Allocations then originate in JavaScript and can be GC'd
//  when no longer referenced (e.g., if those byte buffers are stored in
//  a WeakSet).
static void* my_bf_realloc(void* opaque, void* ptr, size_t size)
{
    return realloc(ptr, size);
}

// Callback type that can be used to send a string back to JavaScript.
typedef void (*send_string)(const char* s, size_t len);

// Utility function to throw in JavaScript.
EM_JS(void, throw_error, (const char* message), {
    throw Error(UTF8ToString(message));
});

EMSCRIPTEN_KEEPALIVE
bf_context_t* create_context() {
    bf_context_t* ctx = malloc(sizeof(bf_context_t));
    bf_context_init(ctx, &my_bf_realloc, NULL);
    return ctx;
}

EMSCRIPTEN_KEEPALIVE
void clear_context_cache(bf_context_t* ctx) {
    // As elsewhere, we forward directly to the "real" function and keep this
    // to ensure the function gets included in our artifact.
    bf_clear_cache(ctx);
}

EMSCRIPTEN_KEEPALIVE
void destroy_context(bf_context_t* ctx) {
    bf_context_end(ctx);
    free(ctx);
}

EMSCRIPTEN_KEEPALIVE
bf_t* create_bf(bf_context_t* ctx) {
    bf_t* bf = malloc(sizeof(bf_t));
    bf_init(ctx, bf);
    return bf;
}

EMSCRIPTEN_KEEPALIVE
void destroy_bf(bf_t* bf) {
    bf_delete(bf);
}

EMSCRIPTEN_KEEPALIVE
void set_f64(bf_t* bf, double value) {
    int ret = bf_set_float64(bf, value);
    if (ret != 0) {
        throw_error("could not set to float");
    }
}

EMSCRIPTEN_KEEPALIVE
void set_string(bf_t* bf, const char* s, uint32_t precision) {
    // We only accept decimal input.
    int ret = bf_atof(bf, s, NULL, 10, precision, BF_ATOF_NO_HEX);
    if (ret != 0) {
        throw_error("could not set to string");
    }
}

EMSCRIPTEN_KEEPALIVE
void set_value(bf_t* self, const bf_t* new_value) {
    int ret = bf_set(self, new_value);
    if (ret != 0) {
        throw_error("could not set BigFloat from BigFloat");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_set_log2(bf_t* bf, uint32_t precision) {
    int ret = bf_const_log2(bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error setting log(2)");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_set_pi(bf_t* bf, uint32_t precision) {
    int ret = bf_const_pi(bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error setting pi");
    }
}

EMSCRIPTEN_KEEPALIVE
void negate(bf_t* bf) {
    bf_neg(bf);
}

EMSCRIPTEN_KEEPALIVE
int is_finite(bf_t* bf) {
    return bf_is_finite(bf);
}

EMSCRIPTEN_KEEPALIVE
int is_nan(bf_t* bf) {
    return bf_is_nan(bf);
}

EMSCRIPTEN_KEEPALIVE
int is_zero(bf_t* bf) {
    return bf_is_zero(bf);
}

// We should really export bf_cmpu directly, but I wasn't able to get this working
// via -s EXPORTED_FUNCTIONS=["bf_cmpu"]. Emscripten complained:
//   emcc: error: undefined exported symbol: "bf_cmpfull"
EMSCRIPTEN_KEEPALIVE
int compare_abs(bf_t* a, bf_t* b) {
    return bf_cmpu(a, b);
}

// -0 < 0, NaN == NaN, and NaN greater than all other "number"s.
EMSCRIPTEN_KEEPALIVE
int compare_full(bf_t* a, bf_t* b) {
    return bf_cmp_full(a, b);
}

// Standard comparison. -0 == 0. Throws if either number is NaN.
EMSCRIPTEN_KEEPALIVE
int compare(bf_t* a, bf_t* b) {
    int ret = bf_cmp(a, b);
    if (ret == 2) {
        throw_error("NaN cannot be compared");
    }
    return ret;
}

EMSCRIPTEN_KEEPALIVE
void wrapper_add(const bf_t* a, const bf_t* b, int32_t precision, bf_t* result) {
    int ret = bf_add(result, a, b, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while adding");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_sub(const bf_t* a, const bf_t* b, int32_t precision, bf_t* result) {
    int ret = bf_sub(result, a, b, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while subtracting");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_mul(const bf_t* a, const bf_t* b, int32_t precision, bf_t* result) {
    int ret = bf_mul(result, a, b, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while multiplying");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_div(const bf_t* a, const bf_t* b, int32_t precision, bf_t* result) {
    int ret = bf_div(result, a, b, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT && ret != BF_ST_DIVIDE_ZERO) {
        throw_error("error while dividing");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_rem(const bf_t* a, const bf_t* b, int32_t precision, bf_t* result) {
    int ret = bf_rem(result, a, b, precision, BF_RNDN, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT && ret != BF_ST_DIVIDE_ZERO) {
        throw_error("error while dividing");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_divrem(const bf_t* a, const bf_t* b, int32_t precision, bf_t* quotient, bf_t* remainder) {
    int ret = bf_divrem(quotient, remainder, a, b, precision, BF_RNDN, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT && ret != BF_ST_DIVIDE_ZERO) {
        throw_error("error while dividing");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_round(bf_t* bf, int32_t precision) {
    int ret = bf_round(bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while rounding");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_sqrt(const bf_t* bf, int32_t precision, bf_t* result) {
    int ret = bf_sqrt(result, bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while taking square root");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_exp(const bf_t* bf, int32_t precision, bf_t* result) {
    int ret = bf_exp(result, bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while exponentiating");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_log(const bf_t* bf, int32_t precision, bf_t* result) {
    int ret = bf_log(result, bf, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error while taking logarithm");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_pow(const bf_t* base, const bf_t* exponent, int32_t precision, bf_t* result) {
    int ret = bf_pow(result, base, exponent, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        // TODO: Consider throwing more specific errors based on specific conditions.
        // Unfortunately, we cannot use sprintf here because we will never return from
        // throw_error, and therefore cannot clean up.
        throw_error("error while raising to power");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_cos(const bf_t* angle, int32_t precision, bf_t* result) {
    int ret = bf_cos(result, angle, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking cosine");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_sin(const bf_t* angle, int32_t precision, bf_t* result) {
    int ret = bf_sin(result, angle, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking sine");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_tan(const bf_t* angle, int32_t precision, bf_t* result) {
    int ret = bf_tan(result, angle, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking tangent");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_acos(const bf_t* ratio, int32_t precision, bf_t* result) {
    int ret = bf_acos(result, ratio, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking arccosine");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_asin(const bf_t* ratio, int32_t precision, bf_t* result) {
    int ret = bf_asin(result, ratio, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking arcsine");
    }
}

EMSCRIPTEN_KEEPALIVE
void wrapper_atan(const bf_t* ratio, int32_t precision, bf_t* result) {
    int ret = bf_atan(result, ratio, precision, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("error wile taking arctangent");
    }
}

EMSCRIPTEN_KEEPALIVE
double to_float(const bf_t* bf) {
    double result;
    int ret = bf_get_float64(bf, &result, BF_RNDN);
    if (ret != 0 && ret != BF_ST_INEXACT) {
        throw_error("could not get f64 from BigFloat");
    }
    return result;
}

EMSCRIPTEN_KEEPALIVE
char* to_fixed(const bf_t* bf, uint32_t significant_digits) {
    size_t len;
    char* s = bf_ftoa(&len, bf, /* radix= */ 10, significant_digits, BF_FTOA_FORMAT_FIXED | BF_RNDN);
    if (s == NULL) {
        throw_error("could not write BigFloat to fixed string");
    }
    return s;
}

EMSCRIPTEN_KEEPALIVE
char* to_fraction(const bf_t* bf, uint32_t fraction_digits) {
    size_t len;
    char* s = bf_ftoa(&len, bf, /* radix= */ 10, fraction_digits, BF_FTOA_FORMAT_FRAC | BF_RNDN);
    if (s == NULL) {
        throw_error("could not write BigFloat to fractional string");
    }
    return s;
}

EMSCRIPTEN_KEEPALIVE
char* to_free(const bf_t* bf, uint32_t precision) {
    size_t len;
    char* s = bf_ftoa(&len, bf, /* radix= */ 10, precision, BF_FTOA_FORMAT_FREE_MIN | BF_RNDN);
    if (s == NULL) {
        throw_error("could not write BigFloat to string");
    }
    return s;
}

EMSCRIPTEN_KEEPALIVE
int my_main(bf_context_t* ctx, limb_t precision) {
  int ret;
  //bf_context_t ctx;
  bf_t in;
  bf_t out;
  char* digits;
  size_t len;

  //bf_context_init(&ctx, my_bf_realloc, NULL);
  bf_init(ctx, &in);
  bf_init(ctx, &out);

  ret = bf_set_float64(&in, 3);
  if (ret != 0) {
    printf("bf_atof error: %d\n", ret);
    return EXIT_FAILURE;
  }
  ret = bf_log(&out, &in, precision, 0);
  if (ret != 0) {
    if (ret == BF_ST_INEXACT) {
      printf("WARN: inexact bf_log\n");
    } else {
      printf("bf_log error: %d\n", ret);
      return EXIT_FAILURE;
    }
  }
  digits = bf_ftoa(&len, &out, 10, precision, BF_FTOA_FORMAT_FIXED | BF_RNDN);
  printf("%ld: %s\n", len, digits);
  free(digits);

  bf_delete(&out);
  bf_delete(&in);
  //bf_context_end(&ctx);
  return EXIT_SUCCESS;
}
