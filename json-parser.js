export default class JsonParser {
  /** @type {string} */
  get source() {
    return this.#source;
  }
  /** @type {Record<string, *>} */
  #resolved;
  /** @type {string} */
  #source;

  constructor(source) {
    this.#source = source;
  }

  execute() {
    this.#resolved ??= this.#resolve();

    return this.#resolved;
  }

  #resolve() {
    const result = JSON.parse(this.#source);

    if(typeof result != 'object' || Array.isArray(result)) {
      return {
        value: result,
      };
    }

    return result;
  }
}
