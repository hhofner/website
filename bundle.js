'use strict';

const SMALLEST_UNSAFE_INTEGER = 0x20000000000000;
const LARGEST_SAFE_INTEGER = SMALLEST_UNSAFE_INTEGER - 1;
const UINT32_MAX = -1 >>> 0;
const UINT32_SIZE = UINT32_MAX + 1;
const INT32_SIZE = UINT32_SIZE / 2;
const INT32_MAX = INT32_SIZE - 1;
const UINT21_SIZE = 1 << 21;
const UINT21_MAX = UINT21_SIZE - 1;

/**
 * Returns a value within [-0x80000000, 0x7fffffff]
 */
function int32(engine) {
    return engine.next() | 0;
}

function add(distribution, addend) {
    if (addend === 0) {
        return distribution;
    }
    else {
        return engine => distribution(engine) + addend;
    }
}

/**
 * Returns a value within [-0x20000000000000, 0x1fffffffffffff]
 */
function int53(engine) {
    const high = engine.next() | 0;
    const low = engine.next() >>> 0;
    return ((high & UINT21_MAX) * UINT32_SIZE +
        low +
        (high & UINT21_SIZE ? -SMALLEST_UNSAFE_INTEGER : 0));
}

/**
 * Returns a value within [-0x20000000000000, 0x20000000000000]
 */
function int53Full(engine) {
    while (true) {
        const high = engine.next() | 0;
        if (high & 0x400000) {
            if ((high & 0x7fffff) === 0x400000 && (engine.next() | 0) === 0) {
                return SMALLEST_UNSAFE_INTEGER;
            }
        }
        else {
            const low = engine.next() >>> 0;
            return ((high & UINT21_MAX) * UINT32_SIZE +
                low +
                (high & UINT21_SIZE ? -SMALLEST_UNSAFE_INTEGER : 0));
        }
    }
}

/**
 * Returns a value within [0, 0xffffffff]
 */
function uint32(engine) {
    return engine.next() >>> 0;
}

/**
 * Returns a value within [0, 0x1fffffffffffff]
 */
function uint53(engine) {
    const high = engine.next() & UINT21_MAX;
    const low = engine.next() >>> 0;
    return high * UINT32_SIZE + low;
}

/**
 * Returns a value within [0, 0x20000000000000]
 */
function uint53Full(engine) {
    while (true) {
        const high = engine.next() | 0;
        if (high & UINT21_SIZE) {
            if ((high & UINT21_MAX) === 0 && (engine.next() | 0) === 0) {
                return SMALLEST_UNSAFE_INTEGER;
            }
        }
        else {
            const low = engine.next() >>> 0;
            return (high & UINT21_MAX) * UINT32_SIZE + low;
        }
    }
}

function isPowerOfTwoMinusOne(value) {
    return ((value + 1) & value) === 0;
}
function bitmask(masking) {
    return (engine) => engine.next() & masking;
}
function downscaleToLoopCheckedRange(range) {
    const extendedRange = range + 1;
    const maximum = extendedRange * Math.floor(UINT32_SIZE / extendedRange);
    return engine => {
        let value = 0;
        do {
            value = engine.next() >>> 0;
        } while (value >= maximum);
        return value % extendedRange;
    };
}
function downscaleToRange(range) {
    if (isPowerOfTwoMinusOne(range)) {
        return bitmask(range);
    }
    else {
        return downscaleToLoopCheckedRange(range);
    }
}
function isEvenlyDivisibleByMaxInt32(value) {
    return (value | 0) === 0;
}
function upscaleWithHighMasking(masking) {
    return engine => {
        const high = engine.next() & masking;
        const low = engine.next() >>> 0;
        return high * UINT32_SIZE + low;
    };
}
function upscaleToLoopCheckedRange(extendedRange) {
    const maximum = extendedRange * Math.floor(SMALLEST_UNSAFE_INTEGER / extendedRange);
    return engine => {
        let ret = 0;
        do {
            const high = engine.next() & UINT21_MAX;
            const low = engine.next() >>> 0;
            ret = high * UINT32_SIZE + low;
        } while (ret >= maximum);
        return ret % extendedRange;
    };
}
function upscaleWithinU53(range) {
    const extendedRange = range + 1;
    if (isEvenlyDivisibleByMaxInt32(extendedRange)) {
        const highRange = ((extendedRange / UINT32_SIZE) | 0) - 1;
        if (isPowerOfTwoMinusOne(highRange)) {
            return upscaleWithHighMasking(highRange);
        }
    }
    return upscaleToLoopCheckedRange(extendedRange);
}
function upscaleWithinI53AndLoopCheck(min, max) {
    return engine => {
        let ret = 0;
        do {
            const high = engine.next() | 0;
            const low = engine.next() >>> 0;
            ret =
                (high & UINT21_MAX) * UINT32_SIZE +
                    low +
                    (high & UINT21_SIZE ? -SMALLEST_UNSAFE_INTEGER : 0);
        } while (ret < min || ret > max);
        return ret;
    };
}
/**
 * Returns a Distribution to return a value within [min, max]
 * @param min The minimum integer value, inclusive. No less than -0x20000000000000.
 * @param max The maximum integer value, inclusive. No greater than 0x20000000000000.
 */
function integer(min, max) {
    min = Math.floor(min);
    max = Math.floor(max);
    if (min < -SMALLEST_UNSAFE_INTEGER || !isFinite(min)) {
        throw new RangeError(`Expected min to be at least ${-SMALLEST_UNSAFE_INTEGER}`);
    }
    else if (max > SMALLEST_UNSAFE_INTEGER || !isFinite(max)) {
        throw new RangeError(`Expected max to be at most ${SMALLEST_UNSAFE_INTEGER}`);
    }
    const range = max - min;
    if (range <= 0 || !isFinite(range)) {
        return () => min;
    }
    else if (range === UINT32_MAX) {
        if (min === 0) {
            return uint32;
        }
        else {
            return add(int32, min + INT32_SIZE);
        }
    }
    else if (range < UINT32_MAX) {
        return add(downscaleToRange(range), min);
    }
    else if (range === LARGEST_SAFE_INTEGER) {
        return add(uint53, min);
    }
    else if (range < LARGEST_SAFE_INTEGER) {
        return add(upscaleWithinU53(range), min);
    }
    else if (max - 1 - min === LARGEST_SAFE_INTEGER) {
        return add(uint53Full, min);
    }
    else if (min === -SMALLEST_UNSAFE_INTEGER &&
        max === SMALLEST_UNSAFE_INTEGER) {
        return int53Full;
    }
    else if (min === -SMALLEST_UNSAFE_INTEGER && max === LARGEST_SAFE_INTEGER) {
        return int53;
    }
    else if (min === -LARGEST_SAFE_INTEGER && max === SMALLEST_UNSAFE_INTEGER) {
        return add(int53, 1);
    }
    else if (max === SMALLEST_UNSAFE_INTEGER) {
        return add(upscaleWithinI53AndLoopCheck(min - 1, max - 1), 1);
    }
    else {
        return upscaleWithinI53AndLoopCheck(min, max);
    }
}

function isLeastBitTrue(engine) {
    return (engine.next() & 1) === 1;
}
function lessThan(distribution, value) {
    return engine => distribution(engine) < value;
}
function probability(percentage) {
    if (percentage <= 0) {
        return () => false;
    }
    else if (percentage >= 1) {
        return () => true;
    }
    else {
        const scaled = percentage * UINT32_SIZE;
        if (scaled % 1 === 0) {
            return lessThan(int32, (scaled - INT32_SIZE) | 0);
        }
        else {
            return lessThan(uint53, Math.round(percentage * SMALLEST_UNSAFE_INTEGER));
        }
    }
}
function bool(numerator, denominator) {
    if (denominator == null) {
        if (numerator == null) {
            return isLeastBitTrue;
        }
        return probability(numerator);
    }
    else {
        if (numerator <= 0) {
            return () => false;
        }
        else if (numerator >= denominator) {
            return () => true;
        }
        return lessThan(integer(0, denominator - 1), numerator);
    }
}

/**
 * Returns a Distribution that returns a random `Date` within the inclusive
 * range of [`start`, `end`].
 * @param start The minimum `Date`
 * @param end The maximum `Date`
 */
function date(start, end) {
    const distribution = integer(+start, +end);
    return engine => new Date(distribution(engine));
}

/**
 * Returns a Distribution to return a value within [1, sideCount]
 * @param sideCount The number of sides of the die
 */
function die(sideCount) {
    return integer(1, sideCount);
}

/**
 * Returns a distribution that returns an array of length `dieCount` of values
 * within [1, `sideCount`]
 * @param sideCount The number of sides of each die
 * @param dieCount The number of dice
 */
function dice(sideCount, dieCount) {
    const distribution = die(sideCount);
    return engine => {
        const result = [];
        for (let i = 0; i < dieCount; ++i) {
            result.push(distribution(engine));
        }
        return result;
    };
}

// tslint:disable:unified-signatures
// has 2**x chars, for faster uniform distribution
const DEFAULT_STRING_POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
function string(pool = DEFAULT_STRING_POOL) {
    const poolLength = pool.length;
    if (!poolLength) {
        throw new Error("Expected pool not to be an empty string");
    }
    const distribution = integer(0, poolLength - 1);
    return (engine, length) => {
        let result = "";
        for (let i = 0; i < length; ++i) {
            const j = distribution(engine);
            result += pool.charAt(j);
        }
        return result;
    };
}

const LOWER_HEX_POOL = "0123456789abcdef";
const lowerHex = string(LOWER_HEX_POOL);
const upperHex = string(LOWER_HEX_POOL.toUpperCase());
/**
 * Returns a Distribution that returns a random string comprised of numbers
 * or the characters `abcdef` (or `ABCDEF`) of length `length`.
 * @param length Length of the result string
 * @param uppercase Whether the string should use `ABCDEF` instead of `abcdef`
 */
function hex(uppercase) {
    if (uppercase) {
        return upperHex;
    }
    else {
        return lowerHex;
    }
}

function convertSliceArgument(value, length) {
    if (value < 0) {
        return Math.max(value + length, 0);
    }
    else {
        return Math.min(value, length);
    }
}

function toInteger(value) {
    const num = +value;
    if (num < 0) {
        return Math.ceil(num);
    }
    else {
        return Math.floor(num);
    }
}

/**
 * Returns a random value within the provided `source` within the sliced
 * bounds of `begin` and `end`.
 * @param source an array of items to pick from
 * @param begin the beginning slice index (defaults to `0`)
 * @param end the ending slice index (defaults to `source.length`)
 */
function pick(engine, source, begin, end) {
    const length = source.length;
    if (length === 0) {
        throw new RangeError("Cannot pick from an empty array");
    }
    const start = begin == null ? 0 : convertSliceArgument(toInteger(begin), length);
    const finish = end === void 0 ? length : convertSliceArgument(toInteger(end), length);
    if (start >= finish) {
        throw new RangeError(`Cannot pick between bounds ${start} and ${finish}`);
    }
    const distribution = integer(start, finish - 1);
    return source[distribution(engine)];
}

function multiply(distribution, multiplier) {
    if (multiplier === 1) {
        return distribution;
    }
    else if (multiplier === 0) {
        return () => 0;
    }
    else {
        return engine => distribution(engine) * multiplier;
    }
}

/**
 * Returns a floating-point value within [0.0, 1.0)
 */
function realZeroToOneExclusive(engine) {
    return uint53(engine) / SMALLEST_UNSAFE_INTEGER;
}

/**
 * Returns a floating-point value within [0.0, 1.0]
 */
function realZeroToOneInclusive(engine) {
    return uint53Full(engine) / SMALLEST_UNSAFE_INTEGER;
}

/**
 * Returns a floating-point value within [min, max) or [min, max]
 * @param min The minimum floating-point value, inclusive.
 * @param max The maximum floating-point value.
 * @param inclusive If true, `max` will be inclusive.
 */
function real(min, max, inclusive = false) {
    if (!isFinite(min)) {
        throw new RangeError("Expected min to be a finite number");
    }
    else if (!isFinite(max)) {
        throw new RangeError("Expected max to be a finite number");
    }
    return add(multiply(inclusive ? realZeroToOneInclusive : realZeroToOneExclusive, max - min), min);
}

const sliceArray = Array.prototype.slice;

/**
 * Shuffles an array in-place
 * @param engine The Engine to use when choosing random values
 * @param array The array to shuffle
 * @param downTo minimum index to shuffle. Only used internally.
 */
function shuffle(engine, array, downTo = 0) {
    const length = array.length;
    if (length) {
        for (let i = (length - 1) >>> 0; i > downTo; --i) {
            const distribution = integer(0, i);
            const j = distribution(engine);
            if (i !== j) {
                const tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }
        }
    }
    return array;
}

/**
 * From the population array, produce an array with sampleSize elements that
 * are randomly chosen without repeats.
 * @param engine The Engine to use when choosing random values
 * @param population An array that has items to choose a sample from
 * @param sampleSize The size of the result array
 */
function sample(engine, population, sampleSize) {
    if (sampleSize < 0 ||
        sampleSize > population.length ||
        !isFinite(sampleSize)) {
        throw new RangeError("Expected sampleSize to be within 0 and the length of the population");
    }
    if (sampleSize === 0) {
        return [];
    }
    const clone = sliceArray.call(population);
    const length = clone.length;
    if (length === sampleSize) {
        return shuffle(engine, clone, 0);
    }
    const tailLength = length - sampleSize;
    return shuffle(engine, clone, tailLength - 1).slice(tailLength);
}

const stringRepeat = (() => {
    try {
        if ("x".repeat(3) === "xxx") {
            return (pattern, count) => pattern.repeat(count);
        }
    }
    catch (_) {
        // nothing to do here
    }
    return (pattern, count) => {
        let result = "";
        while (count > 0) {
            if (count & 1) {
                result += pattern;
            }
            count >>= 1;
            pattern += pattern;
        }
        return result;
    };
})();

function zeroPad(text, zeroCount) {
    return stringRepeat("0", zeroCount - text.length) + text;
}
/**
 * Returns a Universally Unique Identifier Version 4.
 *
 * See http://en.wikipedia.org/wiki/Universally_unique_identifier
 */
function uuid4(engine) {
    const a = engine.next() >>> 0;
    const b = engine.next() | 0;
    const c = engine.next() | 0;
    const d = engine.next() >>> 0;
    return (zeroPad(a.toString(16), 8) +
        "-" +
        zeroPad((b & 0xffff).toString(16), 4) +
        "-" +
        zeroPad((((b >> 4) & 0x0fff) | 0x4000).toString(16), 4) +
        "-" +
        zeroPad(((c & 0x3fff) | 0x8000).toString(16), 4) +
        "-" +
        zeroPad(((c >> 4) & 0xffff).toString(16), 4) +
        zeroPad(d.toString(16), 8));
}

/**
 * An int32-producing Engine that uses `Math.random()`
 */
const nativeMath = {
    next() {
        return (Math.random() * UINT32_SIZE) | 0;
    }
};

// tslint:disable:unified-signatures
/**
 * A wrapper around an Engine that provides easy-to-use methods for
 * producing values based on known distributions
 */
class Random {
    /**
     * Creates a new Random wrapper
     * @param engine The engine to use (defaults to a `Math.random`-based implementation)
     */
    constructor(engine = nativeMath) {
        this.engine = engine;
    }
    /**
     * Returns a value within [-0x80000000, 0x7fffffff]
     */
    int32() {
        return int32(this.engine);
    }
    /**
     * Returns a value within [0, 0xffffffff]
     */
    uint32() {
        return uint32(this.engine);
    }
    /**
     * Returns a value within [0, 0x1fffffffffffff]
     */
    uint53() {
        return uint53(this.engine);
    }
    /**
     * Returns a value within [0, 0x20000000000000]
     */
    uint53Full() {
        return uint53Full(this.engine);
    }
    /**
     * Returns a value within [-0x20000000000000, 0x1fffffffffffff]
     */
    int53() {
        return int53(this.engine);
    }
    /**
     * Returns a value within [-0x20000000000000, 0x20000000000000]
     */
    int53Full() {
        return int53Full(this.engine);
    }
    /**
     * Returns a value within [min, max]
     * @param min The minimum integer value, inclusive. No less than -0x20000000000000.
     * @param max The maximum integer value, inclusive. No greater than 0x20000000000000.
     */
    integer(min, max) {
        return integer(min, max)(this.engine);
    }
    /**
     * Returns a floating-point value within [0.0, 1.0]
     */
    realZeroToOneInclusive() {
        return realZeroToOneInclusive(this.engine);
    }
    /**
     * Returns a floating-point value within [0.0, 1.0)
     */
    realZeroToOneExclusive() {
        return realZeroToOneExclusive(this.engine);
    }
    /**
     * Returns a floating-point value within [min, max) or [min, max]
     * @param min The minimum floating-point value, inclusive.
     * @param max The maximum floating-point value.
     * @param inclusive If true, `max` will be inclusive.
     */
    real(min, max, inclusive = false) {
        return real(min, max, inclusive)(this.engine);
    }
    bool(numerator, denominator) {
        return bool(numerator, denominator)(this.engine);
    }
    /**
     * Return a random value within the provided `source` within the sliced
     * bounds of `begin` and `end`.
     * @param source an array of items to pick from
     * @param begin the beginning slice index (defaults to `0`)
     * @param end the ending slice index (defaults to `source.length`)
     */
    pick(source, begin, end) {
        return pick(this.engine, source, begin, end);
    }
    /**
     * Shuffles an array in-place
     * @param array The array to shuffle
     */
    shuffle(array) {
        return shuffle(this.engine, array);
    }
    /**
     * From the population array, returns an array with sampleSize elements that
     * are randomly chosen without repeats.
     * @param population An array that has items to choose a sample from
     * @param sampleSize The size of the result array
     */
    sample(population, sampleSize) {
        return sample(this.engine, population, sampleSize);
    }
    /**
     * Returns a value within [1, sideCount]
     * @param sideCount The number of sides of the die
     */
    die(sideCount) {
        return die(sideCount)(this.engine);
    }
    /**
     * Returns an array of length `dieCount` of values within [1, sideCount]
     * @param sideCount The number of sides of each die
     * @param dieCount The number of dice
     */
    dice(sideCount, dieCount) {
        return dice(sideCount, dieCount)(this.engine);
    }
    /**
     * Returns a Universally Unique Identifier Version 4.
     *
     * See http://en.wikipedia.org/wiki/Universally_unique_identifier
     */
    uuid4() {
        return uuid4(this.engine);
    }
    string(length, pool) {
        return string(pool)(this.engine, length);
    }
    /**
     * Returns a random string comprised of numbers or the characters `abcdef`
     * (or `ABCDEF`) of length `length`.
     * @param length Length of the result string
     * @param uppercase Whether the string should use `ABCDEF` instead of `abcdef`
     */
    hex(length, uppercase) {
        return hex(uppercase)(this.engine, length);
    }
    /**
     * Returns a random `Date` within the inclusive range of [`start`, `end`].
     * @param start The minimum `Date`
     * @param end The maximum `Date`
     */
    date(start, end) {
        return date(start, end)(this.engine);
    }
}

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array
 */
const I32Array = (() => {
    try {
        const buffer = new ArrayBuffer(4);
        const view = new Int32Array(buffer);
        view[0] = INT32_SIZE;
        if (view[0] === -INT32_SIZE) {
            return Int32Array;
        }
    }
    catch (_) {
        // nothing to do here
    }
    return Array;
})();

/**
 * Returns an array of random int32 values, based on current time
 * and a random number engine
 *
 * @param engine an Engine to pull random values from, default `nativeMath`
 * @param length the length of the Array, minimum 1, default 16
 */
function createEntropy(engine = nativeMath, length = 16) {
    const array = [];
    array.push(new Date().getTime() | 0);
    for (let i = 1; i < length; ++i) {
        array[i] = engine.next() | 0;
    }
    return array;
}

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
 */
const imul = (() => {
    try {
        if (Math.imul(UINT32_MAX, 5) === -5) {
            return Math.imul;
        }
    }
    catch (_) {
        // nothing to do here
    }
    const UINT16_MAX = 0xffff;
    return (a, b) => {
        const ah = (a >>> 16) & UINT16_MAX;
        const al = a & UINT16_MAX;
        const bh = (b >>> 16) & UINT16_MAX;
        const bl = b & UINT16_MAX;
        // the shift by 0 fixes the sign on the high part
        // the final |0 converts the unsigned value into a signed value
        return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
    };
})();

const ARRAY_SIZE = 624;
const ARRAY_MAX = ARRAY_SIZE - 1;
const M = 397;
const ARRAY_SIZE_MINUS_M = ARRAY_SIZE - M;
const A = 0x9908b0df;
/**
 * An Engine that is a pseudorandom number generator using the Mersenne
 * Twister algorithm based on the prime 2**19937 − 1
 *
 * See http://en.wikipedia.org/wiki/Mersenne_twister
 */
class MersenneTwister19937 {
    /**
     * MersenneTwister19937 should not be instantiated directly.
     * Instead, use the static methods `seed`, `seedWithArray`, or `autoSeed`.
     */
    constructor() {
        this.data = new I32Array(ARRAY_SIZE);
        this.index = 0; // integer within [0, 624]
        this.uses = 0;
    }
    /**
     * Returns a MersenneTwister19937 seeded with an initial int32 value
     * @param initial the initial seed value
     */
    static seed(initial) {
        return new MersenneTwister19937().seed(initial);
    }
    /**
     * Returns a MersenneTwister19937 seeded with zero or more int32 values
     * @param source A series of int32 values
     */
    static seedWithArray(source) {
        return new MersenneTwister19937().seedWithArray(source);
    }
    /**
     * Returns a MersenneTwister19937 seeded with the current time and
     * a series of natively-generated random values
     */
    static autoSeed() {
        return MersenneTwister19937.seedWithArray(createEntropy());
    }
    /**
     * Returns the next int32 value of the sequence
     */
    next() {
        if ((this.index | 0) >= ARRAY_SIZE) {
            refreshData(this.data);
            this.index = 0;
        }
        const value = this.data[this.index];
        this.index = (this.index + 1) | 0;
        this.uses += 1;
        return temper(value) | 0;
    }
    /**
     * Returns the number of times that the Engine has been used.
     *
     * This can be provided to an unused MersenneTwister19937 with the same
     * seed, bringing it to the exact point that was left off.
     */
    getUseCount() {
        return this.uses;
    }
    /**
     * Discards one or more items from the engine
     * @param count The count of items to discard
     */
    discard(count) {
        if (count <= 0) {
            return this;
        }
        this.uses += count;
        if ((this.index | 0) >= ARRAY_SIZE) {
            refreshData(this.data);
            this.index = 0;
        }
        while (count + this.index > ARRAY_SIZE) {
            count -= ARRAY_SIZE - this.index;
            refreshData(this.data);
            this.index = 0;
        }
        this.index = (this.index + count) | 0;
        return this;
    }
    seed(initial) {
        let previous = 0;
        this.data[0] = previous = initial | 0;
        for (let i = 1; i < ARRAY_SIZE; i = (i + 1) | 0) {
            this.data[i] = previous =
                (imul(previous ^ (previous >>> 30), 0x6c078965) + i) | 0;
        }
        this.index = ARRAY_SIZE;
        this.uses = 0;
        return this;
    }
    seedWithArray(source) {
        this.seed(0x012bd6aa);
        seedWithArray(this.data, source);
        return this;
    }
}
function refreshData(data) {
    let k = 0;
    let tmp = 0;
    for (; (k | 0) < ARRAY_SIZE_MINUS_M; k = (k + 1) | 0) {
        tmp = (data[k] & INT32_SIZE) | (data[(k + 1) | 0] & INT32_MAX);
        data[k] = data[(k + M) | 0] ^ (tmp >>> 1) ^ (tmp & 0x1 ? A : 0);
    }
    for (; (k | 0) < ARRAY_MAX; k = (k + 1) | 0) {
        tmp = (data[k] & INT32_SIZE) | (data[(k + 1) | 0] & INT32_MAX);
        data[k] =
            data[(k - ARRAY_SIZE_MINUS_M) | 0] ^ (tmp >>> 1) ^ (tmp & 0x1 ? A : 0);
    }
    tmp = (data[ARRAY_MAX] & INT32_SIZE) | (data[0] & INT32_MAX);
    data[ARRAY_MAX] = data[M - 1] ^ (tmp >>> 1) ^ (tmp & 0x1 ? A : 0);
}
function temper(value) {
    value ^= value >>> 11;
    value ^= (value << 7) & 0x9d2c5680;
    value ^= (value << 15) & 0xefc60000;
    return value ^ (value >>> 18);
}
function seedWithArray(data, source) {
    let i = 1;
    let j = 0;
    const sourceLength = source.length;
    let k = Math.max(sourceLength, ARRAY_SIZE) | 0;
    let previous = data[0] | 0;
    for (; (k | 0) > 0; --k) {
        data[i] = previous =
            ((data[i] ^ imul(previous ^ (previous >>> 30), 0x0019660d)) +
                (source[j] | 0) +
                (j | 0)) |
                0;
        i = (i + 1) | 0;
        ++j;
        if ((i | 0) > ARRAY_MAX) {
            data[0] = data[ARRAY_MAX];
            i = 1;
        }
        if (j >= sourceLength) {
            j = 0;
        }
    }
    for (k = ARRAY_MAX; (k | 0) > 0; --k) {
        data[i] = previous =
            ((data[i] ^ imul(previous ^ (previous >>> 30), 0x5d588b65)) - i) | 0;
        i = (i + 1) | 0;
        if ((i | 0) > ARRAY_MAX) {
            data[0] = data[ARRAY_MAX];
            i = 1;
        }
    }
    data[0] = INT32_SIZE;
}

/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.

 Copyright (c) 2021 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;
const F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;
const grad3 = new Float32Array([1, 1, 0,
    -1, 1, 0,
    1, -1, 0,
    -1, -1, 0,
    1, 0, 1,
    -1, 0, 1,
    1, 0, -1,
    -1, 0, -1,
    0, 1, 1,
    0, -1, 1,
    0, 1, -1,
    0, -1, -1]);
const grad4 = new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
    0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
    1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
    -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
    1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
    -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
    1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
    -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]);
/** Deterministic simplex noise generator suitable for 2D, 3D and 4D spaces. */
class SimplexNoise {
    /**
     * Creates a new `SimplexNoise` instance.
     * This involves some setup. You can save a few cpu cycles by reusing the same instance.
     * @param randomOrSeed A random number generator or a seed (string|number).
     * Defaults to Math.random (random irreproducible initialization).
     */
    constructor(randomOrSeed = Math.random) {
        const random = typeof randomOrSeed == 'function' ? randomOrSeed : alea(randomOrSeed);
        this.p = buildPermutationTable(random);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    /**
     * Samples the noise field in 2 dimensions
     * @param x
     * @param y
     * @returns a number in the interval [-1, 1]
     */
    noise2D(x, y) {
        const permMod12 = this.permMod12;
        const perm = this.perm;
        let n0 = 0; // Noise contributions from the three corners
        let n1 = 0;
        let n2 = 0;
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * F2; // Hairy factor for 2D
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = x - X0; // The x,y distances from the cell origin
        const y0 = y - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
    /**
     * Samples the noise field in 3 dimensions
     * @param x
     * @param y
     * @param z
     * @returns a number in the interval [-1, 1]
     */
    noise3D(x, y, z) {
        const permMod12 = this.permMod12;
        const perm = this.perm;
        let n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y + z) * F3; // Very nice and simple skew factor for 3D
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const t = (i + j + k) * G3;
        const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = x - X0; // The x,y,z distances from the cell origin
        const y0 = y - Y0;
        const z0 = z - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        const x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        // Calculate the contribution from the four corners
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0)
            n0 = 0.0;
        else {
            const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0)
            n1 = 0.0;
        else {
            const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0)
            n2 = 0.0;
        else {
            const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0)
            n3 = 0.0;
        else {
            const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }
    /**
     * Samples the noise field in 4 dimensions
     * @param x
     * @param y
     * @param z
     * @returns a number in the interval [-1, 1]
     */
    noise4D(x, y, z, w) {
        const perm = this.perm;
        let n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        const s = (x + y + z + w) * F4; // Factor for 4D skewing
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const l = Math.floor(w + s);
        const t = (i + j + k + l) * G4; // Factor for 4D unskewing
        const X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        const Y0 = j - t;
        const Z0 = k - t;
        const W0 = l - t;
        const x0 = x - X0; // The x,y,z,w distances from the cell origin
        const y0 = y - Y0;
        const z0 = z - Z0;
        const w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        let rankx = 0;
        let ranky = 0;
        let rankz = 0;
        let rankw = 0;
        if (x0 > y0)
            rankx++;
        else
            ranky++;
        if (x0 > z0)
            rankx++;
        else
            rankz++;
        if (x0 > w0)
            rankx++;
        else
            rankw++;
        if (y0 > z0)
            ranky++;
        else
            rankz++;
        if (y0 > w0)
            ranky++;
        else
            rankw++;
        if (z0 > w0)
            rankz++;
        else
            rankw++;
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        // Rank 2 denotes the second largest coordinate.
        // Rank 1 denotes the second smallest coordinate.
        // The integer offsets for the second simplex corner
        const i1 = rankx >= 3 ? 1 : 0;
        const j1 = ranky >= 3 ? 1 : 0;
        const k1 = rankz >= 3 ? 1 : 0;
        const l1 = rankw >= 3 ? 1 : 0;
        // The integer offsets for the third simplex corner
        const i2 = rankx >= 2 ? 1 : 0;
        const j2 = ranky >= 2 ? 1 : 0;
        const k2 = rankz >= 2 ? 1 : 0;
        const l2 = rankw >= 2 ? 1 : 0;
        // The integer offsets for the fourth simplex corner
        const i3 = rankx >= 1 ? 1 : 0;
        const j3 = ranky >= 1 ? 1 : 0;
        const k3 = rankz >= 1 ? 1 : 0;
        const l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        const x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        const y1 = y0 - j1 + G4;
        const z1 = z0 - k1 + G4;
        const w1 = w0 - l1 + G4;
        const x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        const y2 = y0 - j2 + 2.0 * G4;
        const z2 = z0 - k2 + 2.0 * G4;
        const w2 = w0 - l2 + 2.0 * G4;
        const x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        const y3 = y0 - j3 + 3.0 * G4;
        const z3 = z0 - k3 + 3.0 * G4;
        const w3 = w0 - l3 + 3.0 * G4;
        const x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        const y4 = y0 - 1.0 + 4.0 * G4;
        const z4 = z0 - 1.0 + 4.0 * G4;
        const w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const ll = l & 255;
        // Calculate the contribution from the five corners
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0)
            n0 = 0.0;
        else {
            const gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0)
            n1 = 0.0;
        else {
            const gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0)
            n2 = 0.0;
        else {
            const gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0)
            n3 = 0.0;
        else {
            const gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0)
            n4 = 0.0;
        else {
            const gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
}
var e = SimplexNoise;
/**
 * Builds a random permutation table.
 * This is exported only for (internal) testing purposes.
 * Do not rely on this export.
 * @private
 */
function buildPermutationTable(random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(random() * (256 - i));
        const aux = p[i];
        p[i] = p[r];
        p[r] = aux;
    }
    return p;
}
/*
The ALEA PRNG and masher code used by simplex-noise.js
is based on code by Johannes Baagøe, modified by Jonas Wagner.
See alea.md for the full license.
*/
function alea(seed) {
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    let c = 1;
    const mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');
    s0 -= mash(seed);
    if (s0 < 0) {
        s0 += 1;
    }
    s1 -= mash(seed);
    if (s1 < 0) {
        s1 += 1;
    }
    s2 -= mash(seed);
    if (s2 < 0) {
        s2 += 1;
    }
    return function () {
        const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
    };
}
function masher() {
    let n = 0xefc8249d;
    return function (data) {
        data = data.toString();
        for (let i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            let h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
}

var t=new e,r=function(i,n,e){var t=i*e,r=n*e;return {minWidth:t,maxWidth:i-t,minHeight:r,maxHeight:n-r}},a=function(e){for(var t=e.count,a=e.height,o=e.margin,h=void 0===o?.1:o,d=e.width,m=(x=e.seed||MersenneTwister19937.autoSeed(),new Random(x)),u=r(d,a,h),l=u.minWidth,v=u.maxWidth,c=u.minHeight,f=u.maxHeight,g=[],p=0;p<t;p++)g.push({x:m.real(l,v),y:m.real(c,f),vx:0,vy:0,line:[]});var x;return g},o=function(i){var n,e,r=i.damping,a=i.lengthOfStep,o=i.particle,h=(e=i.amplitude,t.noise2D(o.x*(n=i.frequency),o.y*n)*e);o.vx+=Math.cos(h)*a,o.vy+=Math.sin(h)*a,o.x+=o.vx,o.y+=o.vy,o.vx*=r,o.vy*=r,o.line.push([o.x,o.y]);},h=function(i){var n=void 0===i?{}:i,e=n.amplitude,t=void 0===e?5:e,h=n.count,d=n.damping,m=void 0===d?.1:d,u=n.height,l=n.margin,v=void 0===l?.1:l,c=n.scale,f=void 0===c?1:c,g=n.width,p=30*f,x=5*f,s=.001/f,y=n.particles||a({count:void 0===h?1e3:h,height:u,margin:v,seed:n.seed,width:g})||[];return null==y||y.forEach(function(i){for(;i.line.length<p;)o({amplitude:t,damping:m,frequency:s,lengthOfStep:x,particle:i});}),null==y||y.forEach(function(i){i.line=i.line.filter(function(i){return function(i,n,e,t,a){var o=r(e,t,a);return i>o.minWidth&&i<o.maxWidth&&n>o.minHeight&&n<o.maxHeight}(i[0],i[1],g,u,v)});}),y};

const fields = h({
    count: 1000,
    margin: 0.0,
    amplitude: 3,
    damping: 0.6,
    height: window.innerWidth,
    width: window.innerWidth,
    step: 100,
    scale: 1.5
});

let fieldCount = 100;
let lineCount = 1;

function init() {
    window.requestAnimationFrame(draw);
}

function drawInit() {
    let context = canvas.getContext("2d");

    // Draw the first 100 lines for a start
    fields.forEach((field, index) => {
        if (index > fieldCount) return;
        const [start, ...pts] = field.line || [];
        if (!start) return;

        context.beginPath();
        context.moveTo(...start);

        pts.forEach((pt) => {
            context.lineTo(...pt);
        });

        context.lineWidth = 2;
        context.strokeStyle = '#EDCDBB';
        context.stroke();
    });

}

function draw() {
    let context = canvas.getContext("2d");
    context.lineWidth = 2;
    context.strokeStyle = '#EDCDBB';

    if (fieldCount < fields.length) {
        let line = fields[fieldCount].line;
        if (lineCount < line.length - 1) {
            context.beginPath();
            context.moveTo(...line[lineCount]);
            context.lineTo(...line[lineCount + 1]);
            context.stroke();
            lineCount++;
            window.requestAnimationFrame(draw);
        } else {
            fieldCount++;
            lineCount = 1;
            window.requestAnimationFrame(draw);
        }
    }
}

let canvas = document.getElementById("vinegar");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (canvas && canvas.getContext) {
    drawInit();
    init();
}
