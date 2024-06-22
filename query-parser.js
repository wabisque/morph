export default class QueryParser {
  /** @type {string} */
  get source() {
    return this.#source;
  }
  /** @type {*[]?} */
  #expanded = null;
  /** @type {[string, string][]?} */
  #records = null;
  /** @type {Record<string, *>?} */
  #resolved = null;
  /** @type {string} */
  #source;

  /**
   * @param {string} source
   */
  constructor(source) {
    this.#source = source;
  }

  /**
   * @returns {Record<string, *>}
   */
  execute() {
    this.#records ??= this.#parse();
    this.#expanded ??= this.#expand();
    this.#resolved ??= this.#resolve();

    return this.#resolved;
  }

  #expand() {
    if(this.#source.length == 0) {
      return [];
    }

    const result = [];

    for(const [ key, value = '' ] of this.#records) {
      let scope = result;

      if(/^[A-Za-z_$][A-Za-z_$\d]*(\[(([A-Za-z_$][A-Za-z_$\d]*)|\d+)?\])*$/g.test(key)) {
        const path = key
          .replace(/\]$/g, '')
          .split(/\]?\[/);

        for(let index = 0; index < path.length; index++) {
          const part = path[index];
          const found = scope.find(item => item?.key == part);

          if(index < path.length - 1) {
            if(found != null) {
              if(Array.isArray(found.value)) {
                scope = found.value;
              } else {
                found.value = [
                  found.value,
                  {
                    key: part,
                    value: scope = []
                  },
                ];
              }
            } else {
              scope.push({
                key: part,
                value: scope = [],
              });
            }
          } else {
            if(found != null) {
              if(Array.isArray(found.value)) {
                found.value.push(value);
              } else {
                found.value = [
                  found.value,
                  value,
                ];
              }
            } else {
              scope.push({
                key: part,
                value,
              });
            }
          }
        }
      } else {
        const found = scope.find(item => item?.key == key);

        if(found != null) {
          if(Array.isArray(found.value)) {
            found.value.push(value);
          } else {
            found.value = [
              found.value,
              value
            ];
          }
        } else {
          scope.push({
            key,
            value,
          });
        }
      }
    }

    return result;
  }

  #finalize(value) {
    if(Array.isArray(value)) {
      const result = [];
      const annex = [];

      for(const item of value) {
        if(typeof item == 'string') {
          annex.push(item);
        } else {
          if(item.key == '') {
            annex.push(this.#finalize(item.value));
          } else {
            result[item.key] = this.#finalize(item.value);
          }
        }
      }

      result.push(...annex);

      if(Object.keys(result).some(key => isNaN(key))) {
        return Object.fromEntries(Object.entries(result));
      }

      return result;
    }

    return value;
  }

  #parse() {
    return this.#source
      .split('&')
      .map(segment => decodeURIComponent(segment).split('='));
  }

  #resolve() {
    const result = {};

    for(const item of this.#expanded) {
      result[item.key] = this.#finalize(item.value);
    }

    return result;
  }
}
