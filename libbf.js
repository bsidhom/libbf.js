import init from "./libbf_internal.js";

// Entrypoint into libbf.js. This holds a native context and should be closed when no longer needed. Any floats
// handed out by this context are invalidated after the context is closed.
class Big {
    constructor(context, funcs) {
        // Native pointer to our bf_context_t.
        this.context = context;
        // Pointers to wrapped functions.
        this.funcs = funcs;
    }

    // Creates a new BigFloatMutable.
    createMutable() {
        this._ensureOpen();
        let bf = this.funcs.createBf(this.context);
        return new BigFloatMutable(this, bf);
    }

    // Creates a new BigFloat from the given JavaScript number.
    fromFloat(n) {
        this._ensureOpen();
        let mutable = this.createMutable();
        mutable.setFloat(n);
        return new BigFloat(this, mutable);
    }

    // Creates a BigFloat from the given decimal string representation and precision.
    fromString(s, precision) {
        this._ensureOpen();
        let mutable = this.createMutable();
        mutable.setString(s, precision);
        return new BigFloat(this, mutable);
    }

    // Clears the cache of this context.
    clearCache() {
        this._ensureOpen();
    }

    // Closes this Big context.
    close() {
        if (this.context != null) {
            // TODO: Consider cleaning up all BigFloats minted from this environment. This is probably
            //  best done via WeakRefs. It might also be worth adding a FinalizationRegistry to clean
            //  up BigFloats that the user forgot to close.
            this.funcs.destroyContext(this.context);
            this.context = null;
            this.funcs = null;
        }
    }

    _ensureOpen() {
        if (this.context == null) {
            throw new Error("Big already closed");
        }
    }
}

class BigFloatMutable {
    constructor(parent, context) {
        // Parent is the outer Big which wraps wasm functionality.
        this.parent = parent;
        this.context = context;
    }

    // Sets the value of this BigFloat to the given JS number.
    setFloat(n) {
        this._ensureOpen();
        this.parent.funcs.setF64(this.context, n);
    }

    // Sets the value of this BigFloat to the value of the given decimal string.
    setString(s, precision) {
        this._ensureOpen();
        if (!precision || precision < 0) {
            precision = 64;
        }
        this.parent.funcs.setString(this.context, s, precision);
    }

    // Sets this float to the same value as the given one.
    set(other) {
        this._ensureOpen();
        other._ensureOpen();
        this.parent.funcs.set(this.context, other.context);
    }

    // Sets this BigFloat to ln(2) with the given precision.
    setLn2(precision) {
        this._ensureOpen();
        this.parent.funcs.setLog2(this.context, precision);
    }

    // Sets this BigFloat to pi with the given precision.
    setPi(precision) {
        this._ensureOpen();
        this.parent.funcs.setPi(this.context, precision);
    }

    // Negates this BigFloat.
    negate() {
        this._ensureOpen();
        this.parent.funcs.negate(this.context);
    }

    isFinite() {
        this._ensureOpen();
        return this.parent.funcs.isFinite(this.context);
    }

    isNan() {
        this._ensureOpen();
        return this.parent.funcs.isNan(this.context);
    }

    isZero() {
        this._ensureOpen();
        return this.parent.funcs.isZero(this.context);
    }

    // Compares the absolute value of this to the absolute value of other.
    // Returns negative if this.abs() is less than other.abs(), zero if equal,
    // else a positive integer.
    compareAbs(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compareAbs(this.context, other.context);
    }

    // Compares this to the given float. Does a full comparison over all values.
    // -0 < +0, NaN == NaN, and NaN is greater than all other values.
    compareFull(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compareFull(this.context, other.context);
    }

    // Standard comparison. Throws if this or other is NaN.
    compare(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context);
    }

    equal(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context) === 0;
    }

    lessThan(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context) < 0;
    }

    lte(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context) <= 0;
    }

    greaterThan(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context) > 0;
    }

    gte(other) {
        this._ensureOpen();
        other._ensureOpen();
        return this.parent.funcs.compare(this.context, other.context) >= 0;
    }


    add(other, result, precision) {
        this._ensureOpen();
        other._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.add(this.context, other.context, precision, result.context);
    }

    sub(other, result, precision) {
        this._ensureOpen();
        other._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.sub(this.context, other.context, precision, result.context);
    }

    mul(other, result, precision) {
        this._ensureOpen();
        other._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.mul(this.context, other.context, precision, result.context);
    }

    div(other, result, precision) {
        this._ensureOpen();
        other._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.div(this.context, other.context, precision, result.context);
    }

    rem(other, result, precision) {
        this._ensureOpen();
        other._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.rem(this.context, other.context, precision, result.context);
    }

    divrem(other, quotient, remainder, precision) {
        this._ensureOpen();
        other._ensureOpen();
        quotient._ensureOpen();
        remainder._ensureOpen();
        this.parent.funcs.divrem(this.context, other.context, precision, quotient.context, remainder.context);
    }

    // Round to the given precision.
    round(precision) {
        this._ensureOpen();
        this.parent.funcs.round(this.context, precision);
    }

    sqrt(result, precision) {
        this._ensureOpen();
        this.parent.funcs.sqrt(this.context, precision, result);
    }

    exp(result, precision) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.exp(this.context, precision, result.context);
    }

    ln(result, precision) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.log(this.context, precision, result.context);
    }

    pow(exponent, precision, result) {
        this._ensureOpen();
        exponent._ensureOpen();
        this.parent.funcs.pow(this.context, exponent.context, precision, result.context);
    }

    cos(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.cos(this.context, precision, result.context);
    }

    sin(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.sin(this.context, precision, result.context);
    }

    tan(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.tan(this.context, precision, result.context);
    }

    acos(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.acos(this.context, precision, result.context);
    }

    asin(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.asin(this.context, precision, result.context);
    }

    atan(precision, result) {
        this._ensureOpen();
        result._ensureOpen();
        this.parent.funcs.atan(this.context, precision, result.context);
    }

    toFloat() {
        this._ensureOpen();
        return this.parent.funcs.toFloat(this.context);
    }

    // Returns the decimal string representation of this BigFloat, rounded to the
    // given number of significant digits.
    toFixed(n) {
        this._ensureOpen();
        return this.parent.funcs.toFixed(this.context, n);
    }

    // Returns the decimal string representation of this BigFloat with the given
    // number of digits after the decimal  point.
    toFraction(n) {
        this._ensureOpen();
        return this.parent.funcs.toFraction(this.context, n);
    }

    // Returns the decimal string representation of this BigFloat using as few
    // digits as possible, when rounded to the given precision. The given
    // precision (in bits) should usually match the inherent precision of the
    // current value to make the result meaningful.
    toFree(n) {
        this._ensureOpen();
        return this.parent.funcs.toFree(this.context, n);
    }

    // Close this BigFloat and clean up its resources.
    close() {
        if (this.context != null) {
            this.parent.funcs.destroyBf(this.context);
            this.context = null;
            this.parent = null;
        }
    }

    _ensureOpen() {
        if (this.context == null) {
            throw new Error("BigFloat already closed");
        }
    }
}

// A higher-level API that only exposes immutable views of floats.
class BigFloat {
    constructor(parent, wrapped) {
        // Parent is the outer Big which wraps wasm functionality.
        this.parent = parent;
        // Wrapped BigFloat that provides the core functionality.
        this.wrapped = wrapped;
    }

    times(other, precision) {
        let result = this.parent.createMutable();
    }
}

// This initialization function returns a factory that creates new Big objects. Those objects
// should be cleaned up via close() when no longer needed.
export default async function() {
    let libbf = await init();
    console.debug("loaded libbf");
    let createContext = libbf.cwrap("create_context", "number", []);
    let destroyContext = libbf.cwrap("destroy_context", null, ["number"]);
    let createBf = libbf.cwrap("create_bf", "number", ["number"]);
    let destroyBf = libbf.cwrap("destroy_bf", null, ["number"]);

    let setF64 = libbf.cwrap("set_f64", null, ["number", "number"]);
    let setString = libbf.cwrap("set_string", null, ["number", "string", "number"]);
    let set = libbf.cwrap("set_value", null, ["number", "number", "number"]);
    let setLog2 = libbf.cwrap("wrapper_set_log2", null, ["number", "number"]);
    let setPi = libbf.cwrap("wrapper_set_pi", null, ["number", "number"]);

    let negate = libbf.cwrap("negate", null, ["number"]);
    let isFinite = libbf.cwrap("is_finite", "boolean", ["number"]);
    let isNan = libbf.cwrap("is_nan", "boolean", ["number"]);
    let isZero = libbf.cwrap("is_zero", "boolean", ["number"]);

    let compareAbs = libbf.cwrap("compare_abs", "number", ["number", "number"]);
    let compareFull = libbf.cwrap("compare_full", "number", ["number", "number"]);
    let compare = libbf.cwrap("compare", "number", ["number", "number"]);

    let add = libbf.cwrap("wrapper_add", null, ["number", "number", "number", "number"]);
    let sub = libbf.cwrap("wrapper_sub", null, ["number", "number", "number", "number"]);
    let mul = libbf.cwrap("wrapper_mul", null, ["number", "number", "number", "number"]);
    let div = libbf.cwrap("wrapper_div", null, ["number", "number", "number", "number"]);
    let rem = libbf.cwrap("wrapper_rem", null, ["number", "number", "number", "number"]);
    let divrem = libbf.cwrap("wrapper_divrem", null, ["number", "number", "number", "number", "number"]);
    let round = libbf.cwrap("wrapper_round", null, ["number", "number"]);
    let sqrt = libbf.cwrap("wrapper_sqrt", null, ["number", "number", "number"]);

    let exp = libbf.cwrap("wrapper_exp", null, ["number", "number", "number"]);
    let log = libbf.cwrap("wrapper_log", null, ["number", "number", "number"]);
    let pow = libbf.cwrap("wrapper_pow", null, ["number", "number", "number"]);

    let cos = libbf.cwrap("wrapper_cos", null, ["number", "number", "number"]);
    let sin = libbf.cwrap("wrapper_sin", null, ["number", "number", "number"]);
    let tan = libbf.cwrap("wrapper_tan", null, ["number", "number", "number"]);
    let acos = libbf.cwrap("wrapper_acos", null, ["number", "number", "number"]);
    let asin = libbf.cwrap("wrapper_asin", null, ["number", "number", "number"]);
    let atan = libbf.cwrap("wrapper_atan", null, ["number", "number", "number"]);

    let toFloat = libbf.cwrap("to_float", "number", ["number"]);
    let toFixed = libbf.cwrap("to_fixed", "string", ["number", "number"]);
    let toFraction = libbf.cwrap("to_fraction", "string", ["number", "number"]);
    let toFree = libbf.cwrap("to_free", "string", ["number", "number"]);

    return () => new Big(createContext(), {
        destroyContext,
        createBf,
        destroyBf,
        setF64,
        setString,
        set,
        setLog2,
        setPi,
        negate,
        isFinite,
        isNan,
        isZero,
        compareAbs,
        compareFull,
        compare,
        add,
        sub,
        mul,
        div,
        rem,
        divrem,
        round,
        sqrt,
        exp,
        log,
        pow,
        cos,
        sin,
        tan,
        acos,
        asin,
        atan,
        toFloat,
        toFixed,
        toFraction,
        toFree,
    });
}