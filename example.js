import init from "./libbf.js";

let main = async () => {
    let makeBig = await init();
    let big = makeBig();
    let a = big.createMutable();
    let b = big.createMutable();
    let result = big.createMutable();
    a.setFloat(3);
    b.setString("54", 100)
    a.mul(b, result, 100);
    console.log(result.toFixed(4));
    a.ln(result, 4000);
    console.log(result.toFixed(1000));
    b.setFloat(0.5);
    a.pow(b, 4000, result);
    console.log(result.toFixed(1000));
    result.setPi(4000);
    console.log(result.toFixed(1000));

    console.log(a.toFixed(10));
    console.log(b.toFixed(10));
    console.log(`compare: ${a.compareAbs(b)}`);
    console.log(`compare: ${b.compareAbs(a)}`);
    console.log(`compare: ${a.compareAbs(a)}`);

    a.setFloat(2);
    b.setFloat(NaN);
    console.log(`compare NaN: ${a.compareFull(b)}`);
    console.log(`compare NaN: ${b.compareFull(a)}`);
    console.log(`compare NaN: ${b.compareFull(b)}`);

    a.setFloat(3576456.4356354);
    b.set(a);
    console.log(`a: ${a.toFixed(10)}`);
    console.log(`b: ${b.toFixed(10)}`);
    console.log(`a.toFraction(10): ${a.toFraction(10)}`)
    console.log(`a.toFree(50): ${a.toFree(500)}`)

    a.setLn2(100);
    console.log(`log2: ${a.toFixed(30)}`);

    a.setFloat(-1);
    a.acos(10000, result);
    console.log(result.toFixed(3000));

    result.close();
    b.close();
    a.close();
    big.close();
};

main().catch((error) => {
    console.error(error);
});