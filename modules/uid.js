

export default function * uid() {
    var uid = 0;
    while(true) {
        yield uid++;
    }
}