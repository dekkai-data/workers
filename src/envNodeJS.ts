/**
 * Caches the result of a  NodeJS environment check.
 * @internal
 */
const kIsNodeJS: boolean = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

/**
 * Checks if the current environment is NodeJS.
 */
export function isNodeJS(): boolean {
    return kIsNodeJS;
}

/**
 * Checks if the current environment supports dynamic imports.
 * @internal
 */
function checkDynamicImport(): boolean {
    try {
        import(`${null}`).catch(() => false);
        return true;
    } catch {
        return false;
    }
}

/**
 * Caches the result of a dynamic imports check.
 * @internal
 */
const kSupportsDynamicImport: boolean = checkDynamicImport();

/**
 * Checks if the current environment supports dynamic imports.
 */
export function supportsDynamicImport(): boolean {
    return kSupportsDynamicImport;
}

// declare `__non_webpack_require__` for WebPack environments
// eslint-disable-next-line camelcase
declare const __non_webpack_require__: any;

/**
 * Detects the environment and loads a module using either `require` or `import`.
 * @param mod - The name or path to the module to load.
 */
export async function getModule(mod: string): Promise<any> {
    if (kSupportsDynamicImport) {
        return await import(mod);
    }
    return typeof module !== 'undefined' && typeof module.require === 'function' && module.require(mod) ||
            // eslint-disable-next-line camelcase
            typeof __non_webpack_require__ === 'function' && __non_webpack_require__(mod) ||
            typeof require === 'function' && require(mod); // eslint-disable-line
}
