const kIsNodeJS: boolean = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

export function isNodeJS(): boolean {
    return kIsNodeJS;
}
