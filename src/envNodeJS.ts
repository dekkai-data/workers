const kIsNodeJS: boolean = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
export function isNodeJS(): boolean {
    return kIsNodeJS;
}

function checkDynamicImport(): boolean {
    try {
        import(`${null}`).catch(() => false);
        return true;
    } catch {
        return false;
    }
}

const kSupportsDynamicImport: boolean = checkDynamicImport();
export function supportsDynamicImport(): boolean {
    return kSupportsDynamicImport;
}

// declare `__non_webpack_require__` for WebPack environments
// eslint-disable-next-line camelcase
declare const __non_webpack_require__: any;

export async function getModule(mod: string): Promise<any> {
    if (kSupportsDynamicImport) {
        return await import(mod);
    }
    return typeof module !== 'undefined' && typeof module.require === 'function' && module.require(mod) ||
            // eslint-disable-next-line camelcase
            typeof __non_webpack_require__ === 'function' && __non_webpack_require__(mod) ||
            typeof require === 'function' && require(mod); // eslint-disable-line
}
