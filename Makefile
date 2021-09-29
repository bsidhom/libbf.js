CONFIG=env.config
include ${CONFIG}

CFLAGS+=-Wall -g $(PROFILE) -MMD
CFLAGS+=-O2
CFLAGS+=-flto
LIBS=-lm
EMFLAGS=-s ALLOW_MEMORY_GROWTH=1
EMFLAGS+=-s EXPORTED_FUNCTIONS=[]
EMFLAGS+=-s EXPORTED_RUNTIME_METHODS=ccall,cwrap
EMFLAGS+=-s MODULARIZE
EMFLAGS+=-s EXPORT_ES6
LIBBF_WRAPPER=libbf_internal.js

all: $(LIBBF_WRAPPER)

clean:
	rm -f *.o $(LIBBF_WRAPPER)

# TODO: Figure out how to delegate to nested Makefile to create libbf object
# files. Right now, those need to be built out-of-band by the other Makefile.
$(LIBBF_WRAPPER): wrapper.o libbf/libbf.o libbf/cutils.o
	$(CC) $(CFLAGS) wrapper.o libbf/libbf.o libbf/cutils.o -o $@ $(EMFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<
