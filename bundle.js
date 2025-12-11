(() => {
  window.global ||= window;
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/optimal-select/lib/adapt.js
  var require_adapt = __commonJS({
    "node_modules/optimal-select/lib/adapt.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      var _slicedToArray = /* @__PURE__ */ (function() {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = void 0;
          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);
              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"]) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }
          return _arr;
        }
        return function(arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      })();
      exports.default = adapt;
      function adapt(element, options) {
        if (global.document) {
          return false;
        } else {
          global.document = options.context || (function() {
            var root = element;
            while (root.parent) {
              root = root.parent;
            }
            return root;
          })();
        }
        var ElementPrototype = Object.getPrototypeOf(global.document);
        if (!Object.getOwnPropertyDescriptor(ElementPrototype, "childTags")) {
          Object.defineProperty(ElementPrototype, "childTags", {
            enumerable: true,
            get: function get() {
              return this.children.filter(function(node) {
                return node.type === "tag" || node.type === "script" || node.type === "style";
              });
            }
          });
        }
        if (!Object.getOwnPropertyDescriptor(ElementPrototype, "attributes")) {
          Object.defineProperty(ElementPrototype, "attributes", {
            enumerable: true,
            get: function get() {
              var attribs = this.attribs;
              var attributesNames = Object.keys(attribs);
              var NamedNodeMap = attributesNames.reduce(function(attributes, attributeName, index) {
                attributes[index] = {
                  name: attributeName,
                  value: attribs[attributeName]
                };
                return attributes;
              }, {});
              Object.defineProperty(NamedNodeMap, "length", {
                enumerable: false,
                configurable: false,
                value: attributesNames.length
              });
              return NamedNodeMap;
            }
          });
        }
        if (!ElementPrototype.getAttribute) {
          ElementPrototype.getAttribute = function(name) {
            return this.attribs[name] || null;
          };
        }
        if (!ElementPrototype.getElementsByTagName) {
          ElementPrototype.getElementsByTagName = function(tagName) {
            var HTMLCollection = [];
            traverseDescendants(this.childTags, function(descendant) {
              if (descendant.name === tagName || tagName === "*") {
                HTMLCollection.push(descendant);
              }
            });
            return HTMLCollection;
          };
        }
        if (!ElementPrototype.getElementsByClassName) {
          ElementPrototype.getElementsByClassName = function(className) {
            var names = className.trim().replace(/\s+/g, " ").split(" ");
            var HTMLCollection = [];
            traverseDescendants([this], function(descendant) {
              var descendantClassName = descendant.attribs.class;
              if (descendantClassName && names.every(function(name) {
                return descendantClassName.indexOf(name) > -1;
              })) {
                HTMLCollection.push(descendant);
              }
            });
            return HTMLCollection;
          };
        }
        if (!ElementPrototype.querySelectorAll) {
          ElementPrototype.querySelectorAll = function(selectors) {
            var _this = this;
            selectors = selectors.replace(/(>)(\S)/g, "$1 $2").trim();
            var instructions = getInstructions(selectors);
            var discover = instructions.shift();
            var total = instructions.length;
            return discover(this).filter(function(node) {
              var step = 0;
              while (step < total) {
                node = instructions[step](node, _this);
                if (!node) {
                  return false;
                }
                step += 1;
              }
              return true;
            });
          };
        }
        if (!ElementPrototype.contains) {
          ElementPrototype.contains = function(element2) {
            var inclusive = false;
            traverseDescendants([this], function(descendant, done) {
              if (descendant === element2) {
                inclusive = true;
                done();
              }
            });
            return inclusive;
          };
        }
        return true;
      }
      function getInstructions(selectors) {
        return selectors.split(" ").reverse().map(function(selector, step) {
          var discover = step === 0;
          var _selector$split = selector.split(":"), _selector$split2 = _slicedToArray(_selector$split, 2), type = _selector$split2[0], pseudo = _selector$split2[1];
          var validate = null;
          var instruction = null;
          (function() {
            switch (true) {
              // child: '>'
              case />/.test(type):
                instruction = function checkParent(node) {
                  return function(validate2) {
                    return validate2(node.parent) && node.parent;
                  };
                };
                break;
              // class: '.'
              case /^\./.test(type):
                var names = type.substr(1).split(".");
                validate = function validate2(node) {
                  var nodeClassName = node.attribs.class;
                  return nodeClassName && names.every(function(name) {
                    return nodeClassName.indexOf(name) > -1;
                  });
                };
                instruction = function checkClass(node, root) {
                  if (discover) {
                    return node.getElementsByClassName(names.join(" "));
                  }
                  return typeof node === "function" ? node(validate) : getAncestor(node, root, validate);
                };
                break;
              // attribute: '[key="value"]'
              case /^\[/.test(type):
                var _type$replace$split = type.replace(/\[|\]|"/g, "").split("="), _type$replace$split2 = _slicedToArray(_type$replace$split, 2), attributeKey = _type$replace$split2[0], attributeValue = _type$replace$split2[1];
                validate = function validate2(node) {
                  var hasAttribute = Object.keys(node.attribs).indexOf(attributeKey) > -1;
                  if (hasAttribute) {
                    if (!attributeValue || node.attribs[attributeKey] === attributeValue) {
                      return true;
                    }
                  }
                  return false;
                };
                instruction = function checkAttribute(node, root) {
                  if (discover) {
                    var _ret2 = (function() {
                      var NodeList = [];
                      traverseDescendants([node], function(descendant) {
                        if (validate(descendant)) {
                          NodeList.push(descendant);
                        }
                      });
                      return {
                        v: NodeList
                      };
                    })();
                    if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
                  }
                  return typeof node === "function" ? node(validate) : getAncestor(node, root, validate);
                };
                break;
              // id: '#'
              case /^#/.test(type):
                var id = type.substr(1);
                validate = function validate2(node) {
                  return node.attribs.id === id;
                };
                instruction = function checkId(node, root) {
                  if (discover) {
                    var _ret3 = (function() {
                      var NodeList = [];
                      traverseDescendants([node], function(descendant, done) {
                        if (validate(descendant)) {
                          NodeList.push(descendant);
                          done();
                        }
                      });
                      return {
                        v: NodeList
                      };
                    })();
                    if ((typeof _ret3 === "undefined" ? "undefined" : _typeof(_ret3)) === "object") return _ret3.v;
                  }
                  return typeof node === "function" ? node(validate) : getAncestor(node, root, validate);
                };
                break;
              // universal: '*'
              case /\*/.test(type):
                validate = function validate2(node) {
                  return true;
                };
                instruction = function checkUniversal(node, root) {
                  if (discover) {
                    var _ret4 = (function() {
                      var NodeList = [];
                      traverseDescendants([node], function(descendant) {
                        return NodeList.push(descendant);
                      });
                      return {
                        v: NodeList
                      };
                    })();
                    if ((typeof _ret4 === "undefined" ? "undefined" : _typeof(_ret4)) === "object") return _ret4.v;
                  }
                  return typeof node === "function" ? node(validate) : getAncestor(node, root, validate);
                };
                break;
              // tag: '...'
              default:
                validate = function validate2(node) {
                  return node.name === type;
                };
                instruction = function checkTag(node, root) {
                  if (discover) {
                    var _ret5 = (function() {
                      var NodeList = [];
                      traverseDescendants([node], function(descendant) {
                        if (validate(descendant)) {
                          NodeList.push(descendant);
                        }
                      });
                      return {
                        v: NodeList
                      };
                    })();
                    if ((typeof _ret5 === "undefined" ? "undefined" : _typeof(_ret5)) === "object") return _ret5.v;
                  }
                  return typeof node === "function" ? node(validate) : getAncestor(node, root, validate);
                };
            }
          })();
          if (!pseudo) {
            return instruction;
          }
          var rule = pseudo.match(/-(child|type)\((\d+)\)$/);
          var kind = rule[1];
          var index = parseInt(rule[2], 10) - 1;
          var validatePseudo = function validatePseudo2(node) {
            if (node) {
              var compareSet = node.parent.childTags;
              if (kind === "type") {
                compareSet = compareSet.filter(validate);
              }
              var nodeIndex = compareSet.findIndex(function(child) {
                return child === node;
              });
              if (nodeIndex === index) {
                return true;
              }
            }
            return false;
          };
          return function enhanceInstruction(node) {
            var match = instruction(node);
            if (discover) {
              return match.reduce(function(NodeList, matchedNode) {
                if (validatePseudo(matchedNode)) {
                  NodeList.push(matchedNode);
                }
                return NodeList;
              }, []);
            }
            return validatePseudo(match) && match;
          };
        });
      }
      function traverseDescendants(nodes, handler) {
        nodes.forEach(function(node) {
          var progress = true;
          handler(node, function() {
            return progress = false;
          });
          if (node.childTags && progress) {
            traverseDescendants(node.childTags, handler);
          }
        });
      }
      function getAncestor(node, root, validate) {
        while (node.parent) {
          node = node.parent;
          if (validate(node)) {
            return node;
          }
          if (node === root) {
            break;
          }
        }
        return null;
      }
      module.exports = exports["default"];
    }
  });

  // node_modules/optimal-select/lib/utilities.js
  var require_utilities = __commonJS({
    "node_modules/optimal-select/lib/utilities.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.convertNodeList = convertNodeList;
      exports.escapeValue = escapeValue;
      function convertNodeList(nodes) {
        var length = nodes.length;
        var arr = new Array(length);
        for (var i = 0; i < length; i++) {
          arr[i] = nodes[i];
        }
        return arr;
      }
      function escapeValue(value) {
        return value && value.replace(/['"`\\/:\?&!#$%^()[\]{|}*+;,.<=>@~]/g, "\\$&").replace(/\n/g, "A");
      }
    }
  });

  // node_modules/optimal-select/lib/match.js
  var require_match = __commonJS({
    "node_modules/optimal-select/lib/match.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = match;
      var _utilities = require_utilities();
      var defaultIgnore = {
        attribute: function attribute(attributeName) {
          return ["style", "data-reactid", "data-react-checksum"].indexOf(attributeName) > -1;
        }
      };
      function match(node, options) {
        var _options$root = options.root, root = _options$root === void 0 ? document : _options$root, _options$skip = options.skip, skip = _options$skip === void 0 ? null : _options$skip, _options$priority = options.priority, priority = _options$priority === void 0 ? ["id", "class", "href", "src"] : _options$priority, _options$ignore = options.ignore, ignore = _options$ignore === void 0 ? {} : _options$ignore;
        var path = [];
        var element = node;
        var length = path.length;
        var ignoreClass = false;
        var skipCompare = skip && (Array.isArray(skip) ? skip : [skip]).map(function(entry) {
          if (typeof entry !== "function") {
            return function(element2) {
              return element2 === entry;
            };
          }
          return entry;
        });
        var skipChecks = function skipChecks2(element2) {
          return skip && skipCompare.some(function(compare) {
            return compare(element2);
          });
        };
        Object.keys(ignore).forEach(function(type) {
          if (type === "class") {
            ignoreClass = true;
          }
          var predicate = ignore[type];
          if (typeof predicate === "function") return;
          if (typeof predicate === "number") {
            predicate = predicate.toString();
          }
          if (typeof predicate === "string") {
            predicate = new RegExp((0, _utilities.escapeValue)(predicate).replace(/\\/g, "\\\\"));
          }
          if (typeof predicate === "boolean") {
            predicate = predicate ? /(?:)/ : /.^/;
          }
          ignore[type] = function(name, value) {
            return predicate.test(value);
          };
        });
        if (ignoreClass) {
          (function() {
            var ignoreAttribute = ignore.attribute;
            ignore.attribute = function(name, value, defaultPredicate) {
              return ignore.class(value) || ignoreAttribute && ignoreAttribute(name, value, defaultPredicate);
            };
          })();
        }
        while (element !== root) {
          if (skipChecks(element) !== true) {
            if (checkAttributes(priority, element, ignore, path, root)) break;
            if (checkTag(element, ignore, path, root)) break;
            checkAttributes(priority, element, ignore, path);
            if (path.length === length) {
              checkTag(element, ignore, path);
            }
            if (path.length === length) {
              checkChilds(priority, element, ignore, path);
            }
          }
          element = element.parentNode;
          length = path.length;
        }
        if (element === root) {
          var pattern = findPattern(priority, element, ignore);
          path.unshift(pattern);
        }
        return path.join(" ");
      }
      function checkAttributes(priority, element, ignore, path) {
        var parent = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : element.parentNode;
        var pattern = findAttributesPattern(priority, element, ignore);
        if (pattern) {
          var matches = parent.querySelectorAll(pattern);
          if (matches.length === 1) {
            path.unshift(pattern);
            return true;
          }
        }
        return false;
      }
      function findAttributesPattern(priority, element, ignore) {
        var attributes = element.attributes;
        var sortedKeys = Object.keys(attributes).sort(function(curr, next) {
          var currPos = priority.indexOf(attributes[curr].name);
          var nextPos = priority.indexOf(attributes[next].name);
          if (nextPos === -1) {
            if (currPos === -1) {
              return 0;
            }
            return -1;
          }
          return currPos - nextPos;
        });
        for (var i = 0, l = sortedKeys.length; i < l; i++) {
          var key = sortedKeys[i];
          var attribute = attributes[key];
          var attributeName = attribute.name;
          var attributeValue = (0, _utilities.escapeValue)(attribute.value);
          var currentIgnore = ignore[attributeName] || ignore.attribute;
          var currentDefaultIgnore = defaultIgnore[attributeName] || defaultIgnore.attribute;
          if (checkIgnore(currentIgnore, attributeName, attributeValue, currentDefaultIgnore)) {
            continue;
          }
          var pattern = "[" + attributeName + '="' + attributeValue + '"]';
          if (/\b\d/.test(attributeValue) === false) {
            if (attributeName === "id") {
              pattern = "#" + attributeValue;
            }
            if (attributeName === "class") {
              var className = attributeValue.trim().replace(/\s+/g, ".");
              pattern = "." + className;
            }
          }
          return pattern;
        }
        return null;
      }
      function checkTag(element, ignore, path) {
        var parent = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : element.parentNode;
        var pattern = findTagPattern(element, ignore);
        if (pattern) {
          var matches = parent.getElementsByTagName(pattern);
          if (matches.length === 1) {
            path.unshift(pattern);
            return true;
          }
        }
        return false;
      }
      function findTagPattern(element, ignore) {
        var tagName = element.tagName.toLowerCase();
        if (checkIgnore(ignore.tag, null, tagName)) {
          return null;
        }
        return tagName;
      }
      function checkChilds(priority, element, ignore, path) {
        var parent = element.parentNode;
        var children = parent.childTags || parent.children;
        for (var i = 0, l = children.length; i < l; i++) {
          var child = children[i];
          if (child === element) {
            var childPattern = findPattern(priority, child, ignore);
            if (!childPattern) {
              return console.warn("\n          Element couldn't be matched through strict ignore pattern!\n        ", child, ignore, childPattern);
            }
            var pattern = "> " + childPattern + ":nth-child(" + (i + 1) + ")";
            path.unshift(pattern);
            return true;
          }
        }
        return false;
      }
      function findPattern(priority, element, ignore) {
        var pattern = findAttributesPattern(priority, element, ignore);
        if (!pattern) {
          pattern = findTagPattern(element, ignore);
        }
        return pattern;
      }
      function checkIgnore(predicate, name, value, defaultPredicate) {
        if (!value) {
          return true;
        }
        var check = predicate || defaultPredicate;
        if (!check) {
          return false;
        }
        return check(name, value, defaultPredicate);
      }
      module.exports = exports["default"];
    }
  });

  // node_modules/optimal-select/lib/optimize.js
  var require_optimize = __commonJS({
    "node_modules/optimal-select/lib/optimize.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = optimize2;
      var _adapt = require_adapt();
      var _adapt2 = _interopRequireDefault(_adapt);
      var _utilities = require_utilities();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function optimize2(selector, elements) {
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        if (!Array.isArray(elements)) {
          elements = !elements.length ? [elements] : (0, _utilities.convertNodeList)(elements);
        }
        if (!elements.length || elements.some(function(element) {
          return element.nodeType !== 1;
        })) {
          throw new Error('Invalid input - to compare HTMLElements its necessary to provide a reference of the selected node(s)! (missing "elements")');
        }
        var globalModified = (0, _adapt2.default)(elements[0], options);
        var path = selector.replace(/> /g, ">").split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (path.length < 2) {
          return optimizePart("", selector, "", elements);
        }
        var shortened = [path.pop()];
        while (path.length > 1) {
          var current = path.pop();
          var prePart = path.join(" ");
          var postPart = shortened.join(" ");
          var pattern = prePart + " " + postPart;
          var matches = document.querySelectorAll(pattern);
          if (matches.length !== elements.length) {
            shortened.unshift(optimizePart(prePart, current, postPart, elements));
          }
        }
        shortened.unshift(path[0]);
        path = shortened;
        path[0] = optimizePart("", path[0], path.slice(1).join(" "), elements);
        path[path.length - 1] = optimizePart(path.slice(0, -1).join(" "), path[path.length - 1], "", elements);
        if (globalModified) {
          delete global.document;
        }
        return path.join(" ").replace(/>/g, "> ").trim();
      }
      function optimizePart(prePart, current, postPart, elements) {
        if (prePart.length) prePart = prePart + " ";
        if (postPart.length) postPart = " " + postPart;
        if (/\[*\]/.test(current)) {
          var key = current.replace(/=.*$/, "]");
          var pattern = "" + prePart + key + postPart;
          var matches = document.querySelectorAll(pattern);
          if (compareResults(matches, elements)) {
            current = key;
          } else {
            var references = document.querySelectorAll("" + prePart + key);
            var _loop = function _loop3() {
              var reference = references[i];
              if (elements.some(function(element) {
                return reference.contains(element);
              })) {
                var description = reference.tagName.toLowerCase();
                pattern = "" + prePart + description + postPart;
                matches = document.querySelectorAll(pattern);
                if (compareResults(matches, elements)) {
                  current = description;
                }
                return "break";
              }
            };
            for (var i = 0, l = references.length; i < l; i++) {
              var pattern;
              var matches;
              var _ret = _loop();
              if (_ret === "break") break;
            }
          }
        }
        if (/>/.test(current)) {
          var descendant = current.replace(/>/, "");
          var pattern = "" + prePart + descendant + postPart;
          var matches = document.querySelectorAll(pattern);
          if (compareResults(matches, elements)) {
            current = descendant;
          }
        }
        if (/:nth-child/.test(current)) {
          var type = current.replace(/nth-child/g, "nth-of-type");
          var pattern = "" + prePart + type + postPart;
          var matches = document.querySelectorAll(pattern);
          if (compareResults(matches, elements)) {
            current = type;
          }
        }
        if (/\.\S+\.\S+/.test(current)) {
          var names = current.trim().split(".").slice(1).map(function(name) {
            return "." + name;
          }).sort(function(curr, next) {
            return curr.length - next.length;
          });
          while (names.length) {
            var partial = current.replace(names.shift(), "").trim();
            var pattern = ("" + prePart + partial + postPart).trim();
            if (!pattern.length || pattern.charAt(0) === ">" || pattern.charAt(pattern.length - 1) === ">") {
              break;
            }
            var matches = document.querySelectorAll(pattern);
            if (compareResults(matches, elements)) {
              current = partial;
            }
          }
          names = current && current.match(/\./g);
          if (names && names.length > 2) {
            var _references = document.querySelectorAll("" + prePart + current);
            var _loop2 = function _loop22() {
              var reference = _references[i];
              if (elements.some(function(element) {
                return reference.contains(element);
              })) {
                var description = reference.tagName.toLowerCase();
                pattern = "" + prePart + description + postPart;
                matches = document.querySelectorAll(pattern);
                if (compareResults(matches, elements)) {
                  current = description;
                }
                return "break";
              }
            };
            for (var i = 0, l = _references.length; i < l; i++) {
              var pattern;
              var matches;
              var _ret2 = _loop2();
              if (_ret2 === "break") break;
            }
          }
        }
        return current;
      }
      function compareResults(matches, elements) {
        var length = matches.length;
        return length === elements.length && elements.every(function(element) {
          for (var i = 0; i < length; i++) {
            if (matches[i] === element) {
              return true;
            }
          }
          return false;
        });
      }
      module.exports = exports["default"];
    }
  });

  // node_modules/optimal-select/lib/common.js
  var require_common = __commonJS({
    "node_modules/optimal-select/lib/common.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getCommonAncestor = getCommonAncestor;
      exports.getCommonProperties = getCommonProperties;
      function getCommonAncestor(elements) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var _options$root = options.root, root = _options$root === void 0 ? document : _options$root;
        var ancestors = [];
        elements.forEach(function(element, index) {
          var parents = [];
          while (element !== root) {
            element = element.parentNode;
            parents.unshift(element);
          }
          ancestors[index] = parents;
        });
        ancestors.sort(function(curr, next) {
          return curr.length - next.length;
        });
        var shallowAncestor = ancestors.shift();
        var ancestor = null;
        var _loop = function _loop2() {
          var parent = shallowAncestor[i];
          var missing = ancestors.some(function(otherParents) {
            return !otherParents.some(function(otherParent) {
              return otherParent === parent;
            });
          });
          if (missing) {
            return "break";
          }
          ancestor = parent;
        };
        for (var i = 0, l = shallowAncestor.length; i < l; i++) {
          var _ret = _loop();
          if (_ret === "break") break;
        }
        return ancestor;
      }
      function getCommonProperties(elements) {
        var commonProperties = {
          classes: [],
          attributes: {},
          tag: null
        };
        elements.forEach(function(element) {
          var commonClasses = commonProperties.classes, commonAttributes = commonProperties.attributes, commonTag = commonProperties.tag;
          if (commonClasses !== void 0) {
            var classes = element.getAttribute("class");
            if (classes) {
              classes = classes.trim().split(" ");
              if (!commonClasses.length) {
                commonProperties.classes = classes;
              } else {
                commonClasses = commonClasses.filter(function(entry) {
                  return classes.some(function(name) {
                    return name === entry;
                  });
                });
                if (commonClasses.length) {
                  commonProperties.classes = commonClasses;
                } else {
                  delete commonProperties.classes;
                }
              }
            } else {
              delete commonProperties.classes;
            }
          }
          if (commonAttributes !== void 0) {
            (function() {
              var elementAttributes = element.attributes;
              var attributes = Object.keys(elementAttributes).reduce(function(attributes2, key) {
                var attribute = elementAttributes[key];
                var attributeName = attribute.name;
                if (attribute && attributeName !== "class") {
                  attributes2[attributeName] = attribute.value;
                }
                return attributes2;
              }, {});
              var attributesNames = Object.keys(attributes);
              var commonAttributesNames = Object.keys(commonAttributes);
              if (attributesNames.length) {
                if (!commonAttributesNames.length) {
                  commonProperties.attributes = attributes;
                } else {
                  commonAttributes = commonAttributesNames.reduce(function(nextCommonAttributes, name) {
                    var value = commonAttributes[name];
                    if (value === attributes[name]) {
                      nextCommonAttributes[name] = value;
                    }
                    return nextCommonAttributes;
                  }, {});
                  if (Object.keys(commonAttributes).length) {
                    commonProperties.attributes = commonAttributes;
                  } else {
                    delete commonProperties.attributes;
                  }
                }
              } else {
                delete commonProperties.attributes;
              }
            })();
          }
          if (commonTag !== void 0) {
            var tag = element.tagName.toLowerCase();
            if (!commonTag) {
              commonProperties.tag = tag;
            } else if (tag !== commonTag) {
              delete commonProperties.tag;
            }
          }
        });
        return commonProperties;
      }
    }
  });

  // node_modules/optimal-select/lib/select.js
  var require_select = __commonJS({
    "node_modules/optimal-select/lib/select.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      exports.getSingleSelector = getSingleSelector;
      exports.getMultiSelector = getMultiSelector;
      exports.default = getQuerySelector;
      var _adapt = require_adapt();
      var _adapt2 = _interopRequireDefault(_adapt);
      var _match = require_match();
      var _match2 = _interopRequireDefault(_match);
      var _optimize = require_optimize();
      var _optimize2 = _interopRequireDefault(_optimize);
      var _utilities = require_utilities();
      var _common = require_common();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function getSingleSelector(element) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (element.nodeType === 3) {
          element = element.parentNode;
        }
        if (element.nodeType !== 1) {
          throw new Error('Invalid input - only HTMLElements or representations of them are supported! (not "' + (typeof element === "undefined" ? "undefined" : _typeof(element)) + '")');
        }
        var globalModified = (0, _adapt2.default)(element, options);
        var selector = (0, _match2.default)(element, options);
        var optimized = (0, _optimize2.default)(selector, element, options);
        if (globalModified) {
          delete global.document;
        }
        return optimized;
      }
      function getMultiSelector(elements) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (!Array.isArray(elements)) {
          elements = (0, _utilities.convertNodeList)(elements);
        }
        if (elements.some(function(element) {
          return element.nodeType !== 1;
        })) {
          throw new Error("Invalid input - only an Array of HTMLElements or representations of them is supported!");
        }
        var globalModified = (0, _adapt2.default)(elements[0], options);
        var ancestor = (0, _common.getCommonAncestor)(elements, options);
        var ancestorSelector = getSingleSelector(ancestor, options);
        var commonSelectors = getCommonSelectors(elements);
        var descendantSelector = commonSelectors[0];
        var selector = (0, _optimize2.default)(ancestorSelector + " " + descendantSelector, elements, options);
        var selectorMatches = (0, _utilities.convertNodeList)(document.querySelectorAll(selector));
        if (!elements.every(function(element) {
          return selectorMatches.some(function(entry) {
            return entry === element;
          });
        })) {
          return console.warn("\n      The selected elements can't be efficiently mapped.\n      Its probably best to use multiple single selectors instead!\n    ", elements);
        }
        if (globalModified) {
          delete global.document;
        }
        return selector;
      }
      function getCommonSelectors(elements) {
        var _getCommonProperties = (0, _common.getCommonProperties)(elements), classes = _getCommonProperties.classes, attributes = _getCommonProperties.attributes, tag = _getCommonProperties.tag;
        var selectorPath = [];
        if (tag) {
          selectorPath.push(tag);
        }
        if (classes) {
          var classSelector = classes.map(function(name) {
            return "." + name;
          }).join("");
          selectorPath.push(classSelector);
        }
        if (attributes) {
          var attributeSelector = Object.keys(attributes).reduce(function(parts, name) {
            parts.push("[" + name + '="' + attributes[name] + '"]');
            return parts;
          }, []).join("");
          selectorPath.push(attributeSelector);
        }
        if (selectorPath.length) {
        }
        return [selectorPath.join("")];
      }
      function getQuerySelector(input) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (input.length && !input.name) {
          return getMultiSelector(input, options);
        }
        return getSingleSelector(input, options);
      }
    }
  });

  // node_modules/optimal-select/lib/index.js
  var require_lib = __commonJS({
    "node_modules/optimal-select/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = exports.common = exports.optimize = exports.getMultiSelector = exports.getSingleSelector = exports.select = void 0;
      var _select2 = require_select();
      Object.defineProperty(exports, "getSingleSelector", {
        enumerable: true,
        get: function get() {
          return _select2.getSingleSelector;
        }
      });
      Object.defineProperty(exports, "getMultiSelector", {
        enumerable: true,
        get: function get() {
          return _select2.getMultiSelector;
        }
      });
      var _select3 = _interopRequireDefault(_select2);
      var _optimize2 = require_optimize();
      var _optimize3 = _interopRequireDefault(_optimize2);
      var _common2 = require_common();
      var _common = _interopRequireWildcard(_common2);
      function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
          return obj;
        } else {
          var newObj = {};
          if (obj != null) {
            for (var key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
          }
          newObj.default = obj;
          return newObj;
        }
      }
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.select = _select3.default;
      exports.optimize = _optimize3.default;
      exports.common = _common;
      exports.default = _select3.default;
    }
  });

  // node_modules/trim/index.js
  var require_trim = __commonJS({
    "node_modules/trim/index.js"(exports, module) {
      exports = module.exports = trim;
      function trim(str) {
        return str.replace(/^\s*|\s*$/g, "");
      }
      exports.left = function(str) {
        return str.replace(/^\s*/, "");
      };
      exports.right = function(str) {
        return str.replace(/\s*$/, "");
      };
    }
  });

  // node_modules/css-path/css-path.js
  var require_css_path = __commonJS({
    "node_modules/css-path/css-path.js"(exports, module) {
      var trim = require_trim();
      var classSelector = function(className) {
        var selectors = className.split(/\s/g), array = [];
        for (var i = 0; i < selectors.length; ++i) {
          if (selectors[i].length > 0) {
            array.push("." + selectors[i]);
          }
        }
        return array.join("");
      };
      var nthChild = function(elm) {
        var childNumber = 0, childNodes = elm.parentNode.childNodes, index = 0;
        for (; index < childNodes.length; ++index) {
          if (childNodes[index].nodeType === 1)
            ++childNumber;
          if (childNodes[index] === elm)
            return childNumber;
        }
      };
      var path = function(elm, rootNode, list) {
        var tag = elm.tagName.toLowerCase(), selector = [tag], className = elm.getAttribute("class"), id = elm.getAttribute("id");
        if (id) {
          list.unshift(tag + "#" + trim(id));
          return list;
        }
        if (className)
          selector.push(classSelector(className));
        if (tag !== "html" && tag !== "body" && elm.parentNode) {
          selector.push(":nth-child(" + nthChild(elm) + ")");
        }
        list.unshift(selector.join(""));
        if (elm.parentNode && elm.parentNode !== rootNode && elm.parentNode.tagName) {
          path(elm.parentNode, rootNode, list);
        }
        return list;
      };
      module.exports = function(elm, rootNode) {
        return path(elm, rootNode, []).join(" > ");
      };
    }
  });

  // (disabled):node_modules/css.escape/css.escape.js
  var require_css_escape = __commonJS({
    "(disabled):node_modules/css.escape/css.escape.js"() {
    }
  });

  // node_modules/chrome-dompath/lib/DOMNode.js
  var require_DOMNode = __commonJS({
    "node_modules/chrome-dompath/lib/DOMNode.js"(exports, module) {
      module.exports.nodeNameInCorrectCase = function nodeNameInCorrectCase(node) {
        const shadowRootType = node.shadowRoot && node.shadowRoot.mode;
        if (shadowRootType)
          return "#shadow-root (" + shadowRootType + ")";
        if (!node.localName)
          return node.nodeName;
        if (node.localName.length !== node.nodeName.length)
          return node.nodeName;
        return node.localName;
      };
      module.exports.shadowRootType = function(node) {
        const ancestorShadowRoot = node.ancestorShadowRoot();
        return ancestorShadowRoot ? ancestorShadowRoot.mode : null;
      };
      module.exports.NodeType = {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
      };
      module.exports.ShadowRootTypes = {
        UserAgent: "user-agent",
        Open: "open",
        Closed: "closed"
      };
    }
  });

  // node_modules/chrome-dompath/lib/DOMPath.js
  var require_DOMPath = __commonJS({
    "node_modules/chrome-dompath/lib/DOMPath.js"(exports, module) {
      require_css_escape();
      var { ShadowRootTypes, nodeNameInCorrectCase, NodeType } = require_DOMNode();
      var Elements = {};
      Elements.DOMPath = {};
      Elements.DOMPath.fullQualifiedSelector = function(node, justSelector) {
        try {
          if (node.nodeType !== NodeType.ELEMENT_NODE)
            return node.localName || node.nodeName.toLowerCase();
          return Elements.DOMPath.cssPath(node, justSelector);
        } catch (e) {
          return null;
        }
      };
      Elements.DOMPath.cssPath = function(node, optimized) {
        if (node.nodeType !== NodeType.ELEMENT_NODE)
          return "";
        const steps = [];
        let contextNode = node;
        while (contextNode) {
          const step = Elements.DOMPath._cssPathStep(contextNode, !!optimized, contextNode === node);
          if (!step)
            break;
          steps.push(step);
          if (step.optimized)
            break;
          contextNode = contextNode.parentNode;
        }
        steps.reverse();
        return steps.join(" > ");
      };
      Elements.DOMPath.canGetJSPath = function(node) {
        let wp = node;
        while (wp) {
          if (wp.shadowRoot && wp.shadowRoot.mode !== ShadowRootTypes.Open)
            return false;
          wp = wp.shadowRoot && wp.shadowRoot.host;
        }
        return true;
      };
      Elements.DOMPath.jsPath = function(node, optimized) {
        if (node.nodeType !== NodeType.ELEMENT_NODE)
          return "";
        const path = [];
        let wp = node;
        while (wp) {
          path.push(Elements.DOMPath.cssPath(wp, optimized));
          wp = wp.shadowRoot && wp.shadowRoot.host;
        }
        path.reverse();
        let result = "";
        for (let i = 0; i < path.length; ++i) {
          const string = JSON.stringify(path[i]);
          if (i)
            result += `.shadowRoot.querySelector(${string})`;
          else
            result += `document.querySelector(${string})`;
        }
        return result;
      };
      Elements.DOMPath._cssPathStep = function(node, optimized, isTargetNode) {
        if (node.nodeType !== NodeType.ELEMENT_NODE)
          return null;
        const id = node.getAttribute("id");
        if (optimized) {
          if (id)
            return new Elements.DOMPath.Step(idSelector(id), true);
          const nodeNameLower = node.nodeName.toLowerCase();
          if (nodeNameLower === "body" || nodeNameLower === "head" || nodeNameLower === "html")
            return new Elements.DOMPath.Step(nodeNameInCorrectCase(node), true);
        }
        const nodeName = nodeNameInCorrectCase(node);
        if (id)
          return new Elements.DOMPath.Step(nodeName + idSelector(id), true);
        const parent = node.parentNode;
        if (!parent || parent.nodeType === NodeType.DOCUMENT_NODE)
          return new Elements.DOMPath.Step(nodeName, true);
        function prefixedElementClassNames(node2) {
          const classAttribute = node2.getAttribute("class");
          if (!classAttribute)
            return [];
          return classAttribute.split(/\s+/g).filter(Boolean).map(function(name) {
            return "$" + name;
          });
        }
        function idSelector(id2) {
          return "#" + CSS.escape(id2);
        }
        const prefixedOwnClassNamesArray = prefixedElementClassNames(node);
        let needsClassNames = false;
        let needsNthChild = false;
        let ownIndex = -1;
        let elementIndex = -1;
        const siblings = parent.children;
        for (let i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
          const sibling = siblings[i];
          if (sibling.nodeType !== NodeType.ELEMENT_NODE)
            continue;
          elementIndex += 1;
          if (sibling === node) {
            ownIndex = elementIndex;
            continue;
          }
          if (needsNthChild)
            continue;
          if (nodeNameInCorrectCase(sibling) !== nodeName)
            continue;
          needsClassNames = true;
          const ownClassNames = new Set(prefixedOwnClassNamesArray);
          if (!ownClassNames.size) {
            needsNthChild = true;
            continue;
          }
          const siblingClassNamesArray = prefixedElementClassNames(sibling);
          for (let j = 0; j < siblingClassNamesArray.length; ++j) {
            const siblingClass = siblingClassNamesArray[j];
            if (!ownClassNames.has(siblingClass))
              continue;
            ownClassNames.delete(siblingClass);
            if (!ownClassNames.size) {
              needsNthChild = true;
              break;
            }
          }
        }
        let result = nodeName;
        if (isTargetNode && nodeName.toLowerCase() === "input" && node.getAttribute("type") && !node.getAttribute("id") && !node.getAttribute("class"))
          result += "[type=" + CSS.escape(node.getAttribute("type")) + "]";
        if (needsNthChild) {
          result += ":nth-child(" + (ownIndex + 1) + ")";
        } else if (needsClassNames) {
          for (const prefixedName of prefixedOwnClassNamesArray)
            result += "." + CSS.escape(prefixedName.slice(1));
        }
        return new Elements.DOMPath.Step(result, false);
      };
      Elements.DOMPath.xPath = function(node, optimized) {
        if (node.nodeType === NodeType.DOCUMENT_NODE)
          return "/";
        const steps = [];
        let contextNode = node;
        while (contextNode) {
          const step = Elements.DOMPath._xPathValue(contextNode, optimized);
          if (!step)
            break;
          steps.push(step);
          if (step.optimized)
            break;
          contextNode = contextNode.parentNode;
        }
        steps.reverse();
        return (steps.length && steps[0].optimized ? "" : "/") + steps.join("/");
      };
      Elements.DOMPath._xPathValue = function(node, optimized) {
        let ownValue;
        const ownIndex = Elements.DOMPath._xPathIndex(node);
        if (ownIndex === -1)
          return null;
        switch (node.nodeType) {
          case NodeType.ELEMENT_NODE:
            if (optimized && node.getAttribute("id"))
              return new Elements.DOMPath.Step('//*[@id="' + node.getAttribute("id") + '"]', true);
            ownValue = node.localName;
            break;
          case NodeType.ATTRIBUTE_NODE:
            ownValue = "@" + node.nodeName;
            break;
          case NodeType.TEXT_NODE:
          case NodeType.CDATA_SECTION_NODE:
            ownValue = "text()";
            break;
          case NodeType.PROCESSING_INSTRUCTION_NODE:
            ownValue = "processing-instruction()";
            break;
          case NodeType.COMMENT_NODE:
            ownValue = "comment()";
            break;
          case NodeType.DOCUMENT_NODE:
            ownValue = "";
            break;
          default:
            ownValue = "";
            break;
        }
        if (ownIndex > 0)
          ownValue += "[" + ownIndex + "]";
        return new Elements.DOMPath.Step(ownValue, node.nodeType === NodeType.DOCUMENT_NODE);
      };
      Elements.DOMPath._xPathIndex = function(node) {
        function areNodesSimilar(left, right) {
          if (left === right)
            return true;
          if (left.nodeType === NodeType.ELEMENT_NODE && right.nodeType === NodeType.ELEMENT_NODE)
            return left.localName === right.localName;
          if (left.nodeType === right.nodeType)
            return true;
          const leftType = left.nodeType === NodeType.CDATA_SECTION_NODE ? NodeType.TEXT_NODE : left.nodeType;
          const rightType = right.nodeType === NodeType.CDATA_SECTION_NODE ? NodeType.TEXT_NODE : right.nodeType;
          return leftType === rightType;
        }
        const siblings = node.parentNode ? node.parentNode.children : null;
        if (!siblings)
          return 0;
        let hasSameNamedElements;
        for (let i = 0; i < siblings.length; ++i) {
          if (areNodesSimilar(node, siblings[i]) && siblings[i] !== node) {
            hasSameNamedElements = true;
            break;
          }
        }
        if (!hasSameNamedElements)
          return 0;
        let ownIndex = 1;
        for (let i = 0; i < siblings.length; ++i) {
          if (areNodesSimilar(node, siblings[i])) {
            if (siblings[i] === node)
              return ownIndex;
            ++ownIndex;
          }
        }
        return -1;
      };
      Elements.DOMPath.Step = class {
        /**
         * @param {string} value
         * @param {boolean} optimized
         */
        constructor(value, optimized) {
          this.value = value;
          this.optimized = optimized || false;
        }
        /**
         * @override
         * @return {string}
         */
        toString() {
          return this.value;
        }
      };
      module.exports = Elements.DOMPath;
    }
  });

  // entities/DOMElement.js
  var DOMElement = class {
    constructor() {
      this.tag = "";
      this.id = "";
      this.title = "";
      this.event = null;
      this.type = "";
    }
    setElementData(element, type) {
      this.type = type;
      this.tag = element.tagName.toLowerCase() || "";
      this.id = element.id || "";
      this.title = element.getAttribute("title") || "";
      this.event = element;
      this.key = "";
    }
    getAllElements() {
      return {
        type: this.type,
        elementData: {
          id: this.id,
          title: this.title,
          tagname: this.tag,
          key: this.key
        },
        event: this.event
      };
    }
    resetElement() {
      this.tag = "";
      this.id = "";
      this.title = "";
      this.event = null;
    }
    setKeyElement(key) {
      this.key = key;
    }
  };

  // entities/PlaywrightCommand.js
  var PlaywrightCommand = class {
    constructor() {
      this.code = [];
      this.code_import = [];
      this.codeOutsider_up = [];
      this.codeOutsider_down = [];
      this.codeWindows = [];
      this.code_import.push("import { test, expect } from '@playwright/test'");
      this.codeOutsider_up.push("test('Set up', async ({page}) => {");
      this.codeOutsider_down.push("});");
      this.href = window.location.href;
      this.codeSetter(`await page.goto('${this.href}');`);
    }
    codeSetter(codeline) {
      this.code.push(codeline);
    }
    codeImportSetter(codeline) {
      this.code_import.push(codeline);
    }
    codeWindowsSetter(codeline) {
      this.codeWindows.push(codeline);
    }
    codeGetter() {
      let all_code = [...this.code_import, ...this.codeOutsider_up, ...this.codeWindows, ...this.code, ...this.codeOutsider_down];
      return all_code;
    }
  };

  // config.js
  var DIALOG_SELECTORS = [
    '[role="dialog"]',
    // 標準 WAI-ARIA 對話框
    ".modal",
    // 常見 class 名稱
    "dialog",
    // 原生 <dialog> 元素
    ".gjs-mdl-container",
    // GrapesJS
    ".gjs-mdl-dialog",
    // GrapesJS
    ".ant-modal",
    // Ant Design
    ".MuiDialog-root",
    // Material UI
    ".chakra-modal__content",
    // Chakra UI
    ".ion-modal",
    // Ionic Framework
    ".swal2-popup",
    // SweetAlert2
    "div.gjs-mdl-content"
  ];

  // usecases/DOMParserService.js
  var import_optimal_select = __toESM(require_lib());
  var import_css_path = __toESM(require_css_path());
  var DOMParserService = class {
    constructor(iframeWindow) {
      this.iframeWindow = iframeWindow;
      this.iframeDoc = iframeWindow.document;
      this.DIALOG_SELECTORS = DIALOG_SELECTORS;
      this.priSize = 4;
      this.priority = {
        //要新增方法改這裡就可以
        0: "ByRole",
        1: "ByTitle",
        2: "ByText",
        3: "ByDomPath",
        4: "ByPlaceholder",
        5: "ByAltText",
        6: "ByLabel"
      };
      this.allAttributeInfo = {
        //根據節點取到所有可以找到唯一path的屬性
        tagName: null,
        id: null,
        className: null,
        title: null,
        text: null,
        placeholder: null,
        alt: null,
        ariaLabel: null,
        role: null
      };
      this.playwrightObj = {
        //playwright所有方法與要存的內容
        ByRole: { name: null, role: null, index: null },
        ByLabel: {},
        ByPlaceholder: {},
        ByText: { text: null },
        ByTitle: { title: null },
        ByAltText: {},
        ByDomPath: { csspath: null }
      };
      this.playwrightMethodsStatus = {
        ByRole: false,
        ByLabel: false,
        ByPlaceholder: false,
        ByText: true,
        ByTitle: true,
        ByAltText: false,
        ByDomPath: true
      };
    }
    getOpenSourcePath(e, sourceWin, type) {
      this.cleanInfo();
      this.setInfo(e);
      this.clearPlaywrightObj();
      console.log("All Attribute Info: ", this.allAttributeInfo);
      let isUniqueObj = {
        ByTitle: false,
        ByDomPath: false,
        ByText: false
      };
      if (type === "change") {
        const DOMPath = require_DOMPath();
        let selector = DOMPath.fullQualifiedSelector(e, true);
        isUniqueObj.ByDomPath = true;
        this.playwrightObj.ByDomPath.csspath = selector;
        console.log("Generated unique selector_change:", selector);
      } else {
        let doc = document;
        let myBlacklist = ["style", "data-reactid"];
        let myPri = ["id", "div"];
        let myIgnore = {
          id: true,
          attribute(name, value, defaultPredicate) {
            return /data-*/.test(name) || defaultPredicate(name, value);
          }
        };
        if (sourceWin === "iframe") {
          console.log("inside iframe!!!");
          doc = this.iframeDoc;
          myBlacklist = ["style", "data-reactid", "id"];
          myPri = ["div"];
          myIgnore = {
            id: true,
            attribute(name, value, defaultPredicate) {
              return /data-*/.test(name) || defaultPredicate(name, value);
            }
          };
        }
        let selector = (0, import_optimal_select.select)(e, {
          root: doc,
          ignore: myIgnore,
          priority: myPri
        });
        isUniqueObj.ByDomPath = true;
        this.playwrightObj.ByDomPath.csspath = selector;
        console.log("Generated unique selector:", selector);
      }
      if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
        this.playwrightObj.ByTitle.title = this.allAttributeInfo.title;
        isUniqueObj.ByTitle = true;
      } else {
        isUniqueObj.ByTitle = false;
      }
      if (this.checkUniqueByText(this.allAttributeInfo.text)) {
        this.playwrightObj.ByText.text = this.allAttributeInfo.text;
        isUniqueObj.ByText = true;
      } else {
        isUniqueObj.ByText = false;
      }
      let newObj = {};
      for (let i = 0; i < this.priSize; i++) {
        let key = this.priority[i];
        if (isUniqueObj[key]) {
          newObj[i] = { funName: key, obj: this.playwrightObj[key] };
        }
      }
      if (Object.keys(newObj).length === 0) {
        throw new Error("Can't find the unique path here!");
      }
      console.log("newObj: ", newObj);
      return newObj;
    }
    getAllPath(el, sourceWin) {
      console.log("el:", el);
      this.cleanInfo();
      this.setInfo(el);
      this.clearPlaywrightObj();
      console.log("All Attribute Info: ", this.allAttributeInfo);
      let isUniqueObj = {
        ByRole: false,
        ByTitle: false,
        ByDomPath: false,
        ByText: false
      };
      const dompath = this.getUniquePath(el);
      if (this.checkUniqueByDompath(dompath)) {
        console.log("DOMPATH is UNIQUE!!!!");
        this.playwrightObj.ByDomPath.csspath = dompath;
        console.log("dompah inside playwrightObj: ", this.playwrightObj);
        isUniqueObj.ByDomPath = true;
      } else {
        console.log("dompath is not unique~");
        isUniqueObj.ByDomPath = false;
      }
      if (this.getPlaywrightRole(el, sourceWin)) {
        console.log("Role - attributeInfo: ", this.allAttributeInfo, " obj: ", this.playwrightObj);
        isUniqueObj.ByRole = true;
      } else {
        isUniqueObj.ByRole = false;
      }
      if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
        this.playwrightObj.ByTitle.title = this.allAttributeInfo.title;
        isUniqueObj.ByTitle = true;
      } else {
        isUniqueObj.ByTitle = false;
      }
      if (this.checkUniqueByText(this.allAttributeInfo.text)) {
        this.playwrightObj.ByText.text = this.allAttributeInfo.text;
        isUniqueObj.ByText = true;
      } else {
        isUniqueObj.ByText = false;
      }
      let newObj = {};
      for (let i = 0; i < this.priSize; i++) {
        let key = this.priority[i];
        if (isUniqueObj[key]) {
          newObj[i] = { funName: key, obj: this.playwrightObj[key] };
        }
      }
      if (Object.keys(newObj).length === 0) {
        throw new Error("Can't find the unique path here!");
      }
      console.log("newObj: ", newObj);
      return newObj;
    }
    inferRole(el) {
      if (el.hasAttribute("role")) return el.getAttribute("role");
      switch (el.tagName.toLowerCase()) {
        case "button":
          return "button";
        case "a":
          return el.hasAttribute("href") ? "link" : null;
        case "input": {
          const type = el.getAttribute("type") || "text";
          if (type === "checkbox") return "checkbox";
          if (type === "radio") return "radio";
          return "textbox";
        }
        case "img":
          return "img";
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          return "heading";
        default:
          return null;
      }
    }
    getPlaywrightRole(el, sourceWin) {
      if (!(el instanceof Element)) return null;
      const role = el.getAttribute("role") || this.inferRole(el);
      if (!role) return null;
      const name = el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("placeholder") || el.textContent.trim();
      let targetDoc;
      if (sourceWin === "page") {
        targetDoc = document;
      } else if (sourceWin === "iframe") {
        targetDoc = this.iframeDoc;
      } else {
        throw new Error("\u274C sourceWin must be 'page' or 'iframe'");
      }
      let containerEl = null;
      for (const sel of this.DIALOG_SELECTORS) {
        containerEl = el.closest(sel);
        if (containerEl) break;
      }
      console.log("Role - container: ", containerEl);
      const searchRoot = containerEl || targetDoc;
      const allSame = Array.from(searchRoot.querySelectorAll("*")).filter((e) => {
        const style = window.getComputedStyle(e);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const r = e.getAttribute("role") || this.inferRole(e);
        if (r !== role) return false;
        const n = e.getAttribute("aria-label") || e.getAttribute("alt") || e.getAttribute("placeholder") || e.textContent.trim();
        return n === name;
      });
      const index = allSame.indexOf(el);
      const isUnique = allSame.length === 1;
      this.playwrightObj.ByRole.index = index;
      this.playwrightObj.ByRole.name = name;
      this.playwrightObj.ByRole.role = role;
      console.log("Role - Dialoog Selectors: ", this.DIALOG_SELECTORS);
      console.log("Role - AllSame: ", allSame);
      if (isUnique) {
        console.log(`Role - \u2705 \u552F\u4E00 getByRole(${role}, { name: '${name}' })`);
        return true;
      } else {
        console.log(
          `Role - \u26A0\uFE0F \u627E\u5230 ${allSame.length} \u500B\u76F8\u540C role/name \u7684\u5143\u7D20\uFF08\u641C\u5C0B\u7BC4\u570D\uFF1A${containerEl ? "dialog" : "document"}\uFF09`
        );
        return false;
      }
    }
    /*
     getPlaywrightRole(el, sourceWin) {
      if (!(el instanceof Element)) return null;
    
      // 1️⃣ 取得角色
      const role = el.getAttribute('role') || this.inferRole(el);
      if (!role) return null;
    
      // 2️⃣ 取得名稱
      const name =
        el.getAttribute('aria-label') ||
        el.getAttribute('alt') ||
        el.getAttribute('placeholder') ||
        el.textContent.trim();
    
    
        
      // 3️⃣ 找出全頁面相同 role 的元素
      //在window找
      let allSameRole;
      let index = 0;
      
      console.log("Role - sourceWIn: ",sourceWin);
      //console.log("Role - view: ", el.ownerDocument.defaultView);
      if(sourceWin === "page"){
          console.log("Role- :element inside window");
      allSameRole = Array.from(document.querySelectorAll('*'))
        .filter(e => (e.getAttribute('role') || this.inferRole(e)) === role);
    
      // 4️⃣ 找出 el 在這些元素中的第幾個
      index = allSameRole.indexOf(el);
      console.log("Role - allSame: ",allSameRole);
      }
      //*******目前只支援一個iframe因此這樣寫
      else if (sourceWin === "iframe") {
        console.log("Role- :element inside iframe");
          allSameRole = Array.from(this.iframeDoc.querySelectorAll('*'))
        .filter(e => (e.getAttribute('role') || this.inferRole(e)) === role);
    
      // 4️⃣ 找出 el 在這些元素中的第幾個
      index = allSameRole.indexOf(el);
      console.log("Role - allSame: ",allSameRole);
      }
      else{
        throw new Error("source Window Not Exit!");
      }
    
      if(index < 0) index = 0;
    
      this.playwrightObj.ByRole.index = index;
      this.playwrightObj.ByRole.name = name;
      this.playwrightObj.ByRole.role = role;
    
      if(role){
        return true;
      }
      return false;
    
    }
    
    */
    getDomPath(el) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
      const path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.className) {
          const className = el.className.split(" ")[0];
          if (className) {
            selector += `.${className}`;
          }
        }
        let siblingIndex = 1;
        let sibling = el;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.nodeName === el.nodeName) {
            siblingIndex++;
          }
        }
        if (siblingIndex > 1) {
          selector += `:nth-of-type(${siblingIndex})`;
        }
        path.unshift(selector);
        el = el.parentElement;
      }
      let newpath = path.join(">");
      console.log("dom path: ", newpath);
      return newpath;
    }
    ///////自己寫
    getUniquePath(el) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
      const path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let tag = el.tagName.toLowerCase();
        const parent = el.parentElement;
        if (parent) {
          console.log("parent children: ", Array.from(parent.children));
          const siblings = Array.from(parent.children).filter(
            (sib) => sib.tagName === el.tagName
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(el) + 1;
            tag += `:nth-of-type(${index})`;
          }
          const fullPath = path.length ? `${tag} > ${path.join(" > ")}` : tag;
          if (document.querySelectorAll(fullPath).length === 1) {
            path.unshift(tag);
            console.log("short: full path\u53EA\u6709\u4E00\u500B");
            console.log("short path:", path);
            console.log("short -----------------");
            break;
          }
        }
        path.unshift(tag);
        el = el.parentElement;
      }
      console.log("parent children path: ", path);
      return path.join(" > ");
    }
    getShortUniqueDomPath(el, opts = {}) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
      const maxDepth = typeof opts.maxDepth === "number" ? opts.maxDepth : 8;
      const path = [];
      let current = el;
      let depth = 0;
      const labelledById = el.getAttribute("aria-labelledby");
      if (labelledById) {
        const labelElement = document.getElementById(labelledById);
        if (labelElement) {
          console.log("\u{1F539} \u6709 aria-labelledby\uFF0C\u5C0D\u61C9 label \u6587\u5B57\uFF1A", labelElement.textContent.trim());
          return "#" + labelledById;
        } else {
          console.warn("\u26A0\uFE0F \u627E\u4E0D\u5230\u5C0D\u61C9\u7684 label \u5143\u7D20\uFF1A", labelledById);
        }
      }
      while (current && current.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
        depth++;
        let selector = current.tagName.toLowerCase();
        if (current.className && typeof current.className === "string") {
          const classList = current.className.trim().split(/\s+/).filter(Boolean);
          for (const cls of classList) {
            const esc = CSS.escape(cls);
            const testSelector = `${selector}.${esc}`;
            if (document.querySelectorAll(testSelector).length === 1) {
              selector = testSelector;
              break;
            }
          }
        }
        const fullPath = path.length ? `${selector} > ${path.join(" > ")}` : selector;
        if (document.querySelectorAll(fullPath).length === 1) {
          path.unshift(selector);
          console.log("short: full path\u53EA\u6709\u4E00\u500B");
          console.log("short path:", path);
          console.log("short -----------------");
          break;
        }
        let siblingIndex = 1;
        let sibling = current;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.nodeName === current.nodeName) siblingIndex++;
        }
        if (siblingIndex > 1) selector += `:nth-of-type(${siblingIndex})`;
        path.unshift(selector);
        console.log("short: sibling finded siblingIndex: ", siblingIndex);
        console.log("short path:", path);
        console.log("short -----------------");
        current = current.parentElement;
      }
      console.log("short unique path: ", path.join(" > "));
      return path.join(" > ");
    }
    checkUniqueByDompath(path) {
      let main_findLength = 0;
      let iframe_findLength = 0;
      main_findLength = document.querySelectorAll(path).length;
      iframe_findLength = this.iframeDoc.querySelectorAll(path).length;
      if (main_findLength === 1 || iframe_findLength === 1)
        return true;
      else
        return false;
    }
    /*
      checkUniqueByRole(role, name, roleIndex) {
        // 找出所有 role 對應的元素
        const elements = Array.from(document.querySelectorAll(`[role="${role}"]`));
        const iframe_elements = Array.from(this.iframeDoc.querySelectorAll(`[role="${role}"]`));
        // 過濾出 innerText 與 name 相符的元素
        const matched = elements.filter(el => el.innerText.trim() === name);
        const iframe_matched = iframe_elements.filter(el => el.innerText.trim() === name);
    
        if (matched.length === 0) {
          console.log("ByRole: X unique, X exists");
          return false;
        } else if (matched.length === 1 || iframe_matched === 1) {
          console.log("ByRole: IS unique, Is exists");
          return true;
        } else {
          console.log("ByRole: X unique, Is exists");
          return false;
        }
      }
        */
    checkUniqueByRole(role, name, roleIndex) {
      if (!role || !name) return { isUnique: false, total: 0 };
      const mainElements = Array.from(document.querySelectorAll(`[role="${role}"]`));
      const iframeElements = window.myIframeDoc ? Array.from(window.myIframeDoc.querySelectorAll(`[role="${role}"]`)) : [];
      const matchText = (el) => el.innerText.trim() === name;
      const matchedMain = mainElements.filter(matchText);
      const matchedIframe = iframeElements.filter(matchText);
      const total = matchedMain.length + matchedIframe.length;
      const isUnique = total === 1;
      if (total === 0) {
        console.log(`\u274C No element found for role="${role}" and name="${name}"`);
        return false;
      } else if (isUnique) {
        console.log(`\u2705 Unique element found (${role}, "${name}")`);
        return true;
      } else {
        console.log(`\u26A0\uFE0F ${total} elements found (${role}, "${name}"), current index: ${roleIndex}`);
        return false;
      }
    }
    checkUniqueByTitle(title) {
      const elements = document.querySelectorAll(`[title="${title}"]`);
      const iframe_elements = this.iframeDoc.querySelectorAll(`[title="${title}"]`);
      console.log("check title: ", elements, "check iframe title: ", iframe_elements);
      if (elements.length === 1 || iframe_elements === 1) {
        return true;
      } else {
        return false;
      }
    }
    checkUniqueByText(text) {
      const elements = Array.from(document.querySelectorAll("*"));
      const matched = elements.filter((el) => el.textContent.trim() === text);
      if (matched.length === 1) {
        console.log("\u9019\u500B\u6587\u5B57\u5728\u9801\u9762\u4E2D\u662F\u552F\u4E00\u7684", matched[0]);
        return true;
      } else if (matched.length > 1) {
        console.log(`\u627E\u5230 ${matched.length} \u500B\u76F8\u540C\u6587\u5B57\u7684\u5143\u7D20`);
        return false;
      } else {
        console.log("\u6C92\u6709\u627E\u5230\u8A72\u6587\u5B57");
        return false;
      }
    }
    setInfo(el) {
      this.allAttributeInfo.tagName = el.tagName || null;
      this.allAttributeInfo.id = el.id || null;
      this.allAttributeInfo.className = el.className || null;
      this.allAttributeInfo.title = el.title || null;
      const text = el.innerText;
      this.allAttributeInfo.text = typeof text === "string" ? text.trim() : null;
      this.allAttributeInfo.placeholder = el.placeholder || null;
      this.allAttributeInfo.alt = el.alt || null;
      this.allAttributeInfo.ariaLabel = el.getAttribute?.("aria-label") || null;
      this.allAttributeInfo.role = el.getAttribute?.("role") || null;
    }
    cleanInfo() {
      this.allAttributeInfo.tagName = null;
      this.allAttributeInfo.id = null;
      this.allAttributeInfo.className = null;
      this.allAttributeInfo.title = null;
      this.allAttributeInfo.text = null;
      this.allAttributeInfo.placeholder = null;
      this.allAttributeInfo.alt = null;
      this.allAttributeInfo.ariaLabel = null;
      this.allAttributeInfo.role = null;
    }
    clearPlaywrightObj() {
      this.playwrightObj = {
        ByRole: { name: null, role: null },
        ByLabel: {},
        ByPlaceholder: {},
        ByText: { text: null },
        ByTitle: { title: null },
        ByAltText: {},
        ByDomPath: { csspath: null }
      };
    }
    getPriority() {
      return this.priority;
    }
    getPriSize() {
      return this.priSize;
    }
  };

  // usecases/PlaywrightCodeGenerator.js
  var PlaywrightCodeGenerator = class {
    constructor(iframeWindow, userActionDB) {
      this.typedText = "";
      this.domService = new DOMParserService(iframeWindow);
      this.userActionDB = userActionDB;
      this.rightNowAction;
    }
    generate(action, playwrightCommand, rightNowAction) {
      this.rightNowAction = rightNowAction;
      console.log("action: ", action);
      let sourcepath = null;
      let targetpath = null;
      let inputText = "default";
      let inputKey = "default";
      let selectLabel = "default";
      sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type);
      if (action.type === "dragANDdrop") {
        targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
        console.log("inside generate: targetpath  ", targetpath);
      }
      if (action.type === "input") {
        inputText = action.getSourceElement().innerText || action.getSourceElement().value;
        console.log("InputTEXT: ", inputText);
      }
      if (action.type === "keyboard") {
        inputKey = action.getKeyboard();
      }
      if (action.type === "change") {
        selectLabel = action.getSourceElement().options[action.getSourceElement().selectedIndex].text;
      }
      console.log("inside generate: ", this.userActionDB, rightNowAction);
      let sourceWindow = this.userActionDB[rightNowAction].getSourceWindow();
      let targetWindow = this.userActionDB[rightNowAction].getTargetWindow();
      console.log("userDB inside generator: ", this.userActionDB);
      console.log("sourceWin, targetWin, rightnowACT: ", sourceWindow, targetWindow, rightNowAction);
      console.log("\u6ED1\u9F20\u505C\u7559\u5728 iframe \u4E2D\u7684\u5143\u7D20:", targetpath);
      console.log("source path: ", sourcepath);
      if (action.getActionType() === "dragANDdrop") {
        this.dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow);
      } else if (action.getActionType() === "click" || action.getActionType() === "checkBox") {
        this.clickSetter(playwrightCommand, sourcepath, sourceWindow);
      } else if (action.getActionType() === "dbclick") {
        this.doubleClickSetter(playwrightCommand, sourcepath, sourceWindow);
      } else if (action.getActionType() === "input") {
        this.inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText);
      } else if (action.getActionType() === "keydown") {
        playwrightCommand.codeSetter(`await page.locator('${sourcepath}').fill(${this.typedText});`);
      } else if (action.getActionType() === "keyboard") {
        this.keyboardSetter(playwrightCommand, inputKey);
      } else if (action.getActionType() === "change") {
        this.changeSetter(playwrightCommand, sourcepath, selectLabel);
      }
    }
    changeSetter(playwrightCommand, sourcepath, selectedValue) {
      let priMin = -1;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (sourcepath[i]) {
          priMin = i;
          break;
        }
      }
      console.log("priMin: ", priMin);
      let funName = sourcepath[priMin].funName;
      let obj = sourcepath[priMin].obj;
      console.log("funName: ", funName, "obj", obj);
      if (funName === "ByDomPath") {
        let code = `await page.selectOption('${obj.csspath}', { label:'${selectedValue}'});`;
        playwrightCommand.codeSetter(code);
      }
    }
    keyboardSetter(playwrightCommand, inputKey) {
      if (inputKey === "Backspace") {
        let code = `await page.keyboard.press('Backspace');`;
        playwrightCommand.codeSetter(code);
      }
    }
    dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow) {
      let souPriMin = -1;
      let tarPriMin = -1;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (sourcepath[i]) {
          souPriMin = i;
          break;
        }
      }
      for (let i = 0; i < this.domService.priSize; i++) {
        if (targetpath[i]) {
          tarPriMin = i;
          break;
        }
      }
      console.log("Source priMin: ", souPriMin, "Target Primin: ", tarPriMin);
      let souFunName = sourcepath[souPriMin].funName;
      let souObj = sourcepath[souPriMin].obj;
      console.log("source funName: ", souFunName, "source obj", souObj);
      let tarFunName = targetpath[tarPriMin].funName;
      let tarObj = targetpath[tarPriMin].obj;
      console.log("target funName: ", tarFunName, "target obj: ", tarObj);
      let actDrag = { type: "dragANDdrop", ddConfig: "drag", sourceWindow, targetWindow };
      let actDrop = { type: "dragANDdrop", ddConfig: "drop", sourceWindow, targetWindow };
      const souCommand = this.playwrightCodeSetter(souFunName, souObj, actDrag);
      const tarCommand = this.playwrightCodeSetter(tarFunName, tarObj, actDrop);
      console.log("tarComnd: ", tarCommand);
      playwrightCommand.codeSetter(`${souCommand}.dragTo(${tarCommand});`);
    }
    clickSetter(playwrightCommand, sourcepath, sourceWindow) {
      console.log("inside CLICK SETTER: ", sourceWindow);
      let priMin = -1;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (sourcepath[i]) {
          priMin = i;
          break;
        }
      }
      console.log("priMin: ", priMin);
      let funName = sourcepath[priMin].funName;
      let obj = sourcepath[priMin].obj;
      console.log("funName: ", funName, "obj", obj);
      let act = { type: "click", addConfig: "", sourceWindow, targetWindow: "" };
      const command = this.playwrightCodeSetter(funName, obj, act);
      playwrightCommand.codeSetter(command);
      this.userActionDB[this.rightNowAction].setSourceMethod(funName);
      if (funName === "ByTitle") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.title);
      } else if (funName === "ByText") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.text);
      } else if (funName === "ByDomPath") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.csspath);
      }
    }
    doubleClickSetter(playwrightCommand, sourcepath, sourceWindow) {
      console.log("inside DOUBLE CLICK SETTER: ", sourceWindow);
      let priMin = -1;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (sourcepath[i]) {
          priMin = i;
          break;
        }
      }
      console.log("priMin: ", priMin);
      let funName = sourcepath[priMin].funName;
      let obj = sourcepath[priMin].obj;
      console.log("funName: ", funName, "obj", obj);
      let act = { type: "dbclick", addConfig: "", sourceWindow, targetWindow: "" };
      const command = this.playwrightCodeSetter(funName, obj, act);
      playwrightCommand.codeSetter(command);
    }
    inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText) {
      console.log("inside input Setter!");
      let priMin = -1;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (sourcepath[i]) {
          priMin = i;
          break;
        }
      }
      console.log("priMin: ", priMin);
      let funName = sourcepath[priMin].funName;
      let obj = sourcepath[priMin].obj;
      console.log("funName: ", funName, "obj", obj);
      let act = { type: "input", addConfig: "", sourceWindow, targetWindow: "", inputText };
      const command = this.playwrightCodeSetter(funName, obj, act);
      playwrightCommand.codeSetter(command);
    }
    keydownSetter() {
    }
    playwrightCodeSetter(funName, obj, act) {
      console.log("variable in codeSetter: funName= ", funName, "obg= ", obj, "act = ", act);
      let sourceWinVar = act.sourceWindow;
      let targetWinVar = act.targetWindow;
      const getLocator = (windowVar, winName) => {
        switch (funName) {
          case "ByRole":
            if (obj.index <= 0)
              return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" })`;
            else
              return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" }).nth(${obj.index})`;
          case "ByTitle":
            return `${windowVar}.getByTitle("${obj.title}", {exact: true})`;
          case "ByText":
            return `${windowVar}.getByText("${obj.text}", { exact: true })`;
          case "ByDomPath":
            return `${windowVar}.locator('${obj.csspath}')`;
          default:
            return new Error(funName, " Not found!!");
        }
      };
      switch (act.type) {
        case "click":
          if (sourceWinVar === "page") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.click('${obj.csspath}');`;
            }
            return `await ${getLocator(sourceWinVar)}.click();`;
          } else if (sourceWinVar === "iframe") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.locator('${obj.csspath}').click();`;
            }
            return `await ${getLocator(sourceWinVar)}.click();`;
          }
          break;
        case "dbclick":
          if (sourceWinVar === "page") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.dblclick('${obj.csspath}');`;
            }
            return `await ${getLocator(sourceWinVar)}.dblclick();`;
          } else if (sourceWinVar === "iframe") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.locator('${obj.csspath}'.dblclick());`;
            }
            return `await ${getLocator(sourceWinVar)}.dblclick();`;
          }
          break;
        case "input":
          let text = act.inputText;
          console.log("Inner Text: ", text);
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.locator('${obj.csspath}').fill('${text}');`;
          } else if (funName === "ByRole") {
            return `await ${sourceWinVar}.getByRole("${obj.role}", { name: "${obj.name}" }).fill('${text}')`;
          } else if (funName === "ByTitle") {
            return `await ${sourceWinVar}.getByTitle("${obj.title}", {exact: true}).fill('${text}')`;
          }
          break;
        case "dragANDdrop":
          if (act.ddConfig === "drag") {
            return `await ${getLocator(sourceWinVar)}`;
          }
          if (act.ddConfig === "drop") {
            return `${getLocator(targetWinVar)}`;
          }
          break;
        default:
          console.log("Unknown action~");
          break;
      }
    }
    static initListener() {
      window.addEventListener("message", (event) => {
        const data = event.data;
        console.log("\u{1F4E9} PlaywrightCodeGenerator \u6536\u5230\u8A0A\u606F:", data);
        if (data.type === "keydown") {
          this.typedText = data.typedText;
        }
      });
    }
  };

  // entities/UserAction.js
  var UserAction = class {
    constructor(type, source, target, sourceWindow, targetWindow) {
      this.type = type;
      this.source = source;
      this.target = target;
      this.sourceWindow = sourceWindow;
      this.targetWindow = targetWindow;
      this.sourceMethod = null;
      this.sourceData = null;
      this.targetMethod = null;
      this.targetData = null;
      this.keyboard = null;
      this.selectedText = null;
      this.selectedValue = null;
    }
    setKeyboard(key) {
      this.keyboard = key;
    }
    setActionType(type) {
      this.type = type;
    }
    setSourceElement(source) {
      this.source = source;
    }
    setTargetElement(target) {
      this.target = target;
    }
    setSourceWindow(sourceWindow) {
      this.soureWindow = sourceWindow;
    }
    setTargetWindow(targetWindow) {
      this.targetWindow = targetWindow;
    }
    setSourceMethod(sourceMethod) {
      this.sourceMethod = sourceMethod;
    }
    setSourceData(sourceData) {
      this.sourceData = sourceData;
    }
    setTargetMethod(targetMethod) {
      this.targetMethod = targetMethod;
    }
    setTargetData(targetData) {
      this.targetData = targetData;
    }
    setSelectedText(text) {
      this.selectedText = text;
    }
    setSelectedValue(value) {
      this.selectedValue = value;
    }
    getActionType() {
      return this.type;
    }
    getSourceElement() {
      return this.source;
    }
    getTargetElement() {
      return this.target;
    }
    getSourceWindow() {
      return this.sourceWindow;
    }
    getTargetWindow() {
      return this.targetWindow;
    }
    getSourceMethod() {
      return this.sourceMethod;
    }
    getSourceData() {
      return this.sourceData;
    }
    getTargetMethod() {
      return this.targetMethod;
    }
    getTargetData() {
      return this.targetData;
    }
    getKeyboard() {
      return this.keyboard;
    }
    getSelectedText() {
      return this.selectedText;
    }
    getSelectedValue() {
      return this.selectedValue;
    }
  };

  // usecases/ActionInterpreter.js
  var ActionInterpreter = class {
    static interpretDrag(action_type, sourceEl, targetEl, sourceWindow, targetWindow) {
      return new UserAction(action_type, sourceEl, targetEl, sourceWindow, targetWindow);
    }
  };

  // interfaces/IframeEventListener.js
  var IframeEventListener = class {
    constructor(iframeWindow, domParserService, command, userActionDB) {
      this.iframeWindow = iframeWindow;
      this.domParserService = domParserService;
      this.iframeDocument = iframeWindow.document;
      this.useractionDB = userActionDB;
      this.playwrightCommand = command;
      this.generator = new PlaywrightCodeGenerator(iframeWindow, this.useractionDB);
      this.DOMElement = new DOMElement();
      this.target = null;
      this.source = null;
      this.currentHoveredElement = null;
      this.rightNowAction = -1;
      this.clickFlag = 0;
      this.clickTimeOut = null;
      this.DOUBLE_CLICK_DELAY = 250;
      this.inputTimer = 0;
      this.INPUT_DELAY = 500;
      this.dragStart = { x: 0, y: 0 };
      this.isDragging = false;
      this.DRAG_THRESHOLD = 5;
      this.dragSource;
      this.mouseDownFlag = false;
      this.windowDragFlag = false;
      this.iframeDragFlag = false;
      this.dragStepFlag = 0;
    }
    init() {
      this.iframeDocument.addEventListener("mousemove", (e) => {
        this.currentHoveredElement = e.target;
        if (!this.dragStart) return;
        if (this.dragStepFlag != 1) return;
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
          this.isDragging = true;
          this.dragStepFlag = 2;
          const action_type = "dragANDdrop";
          console.log("iframe - Drgging Start!");
          this.rightNowAction = this.rightNowAction + 1;
          this.DOMElement.setElementData(this.dragSource, "drag");
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
          this.mouseDownFlag = false;
        }
      });
      this.iframeDocument.addEventListener("mousedown", (e) => {
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.isDragging = false;
        this.dragSource = e.target;
        this.mouseDownFlag = true;
        this.dragStepFlag = 1;
      });
      this.iframeDocument.addEventListener("mouseup", (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };
          const action_type = "dragANDdrop";
          const tempAction = this.useractionDB[this.rightNowAction];
          tempAction.setTargetWindow("iframe");
          tempAction.setTargetElement(this.currentHoveredElement);
          this.generator.generate(tempAction, this.playwrightCommand, this.rightNowAction);
          this.currentHoveredElement = null;
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        } else {
          this.clickFlag += 1;
          if (this.clickFlag == 1) {
            const el = e.target;
            const tag = el.tagName;
            const sameTagSiblings = Array.from(el.parentElement.children).filter((child) => child.tagName === tag);
            console.log(`\u{1F539} \u540C\u6A23\u6A19\u7C64 <${tag.toLowerCase()}> \u7684\u5144\u5F1F\u7BC0\u9EDE\uFF1A`, sameTagSiblings);
            const siblings = Array.from(el.parentElement.children);
            console.log("\u{1F9E9} \u5305\u542B\u81EA\u5DF1\u7684\u6240\u6709\u5144\u5F1F\u7BC0\u9EDE\uFF1A");
            siblings.forEach((node, i) => {
              console.log(`${i}: <${node.tagName.toLowerCase()}>`, node);
            });
            this.clickTimeOut = setTimeout(() => {
              this.clickFlag = 0;
              this.isDragging = false;
              this.dragStart = { x: 0, y: 0 };
              const action_type = "click";
              this.rightNowAction = this.rightNowAction + 1;
              this.DOMElement.setElementData(e.target, "click");
              this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
              this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
              console.log("useractionDB: ", this.useractionDB);
              const generatedCode = this.playwrightCommand.codeGetter();
              console.log("Playwright Command:", generatedCode);
              chrome.runtime.sendMessage({
                type: "display_code",
                code: generatedCode
              });
              window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
            }, this.DOUBLE_CLICK_DELAY);
          } else if (this.clickFlag == 2) {
            clearTimeout(this.clickTimeOut);
            console.log("Double Click Detected!");
            this.clickFlag = 0;
            this.isDragging = false;
            this.dragStart = { x: 0, y: 0 };
            const action_type = "dbclick";
            this.rightNowAction = this.rightNowAction + 1;
            this.DOMElement.setElementData(e.target, "dbclick");
            this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
            this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
            console.log("Playwright Command:", this.playwrightCommand.codeGetter());
            console.log("useractionDB: ", this.useractionDB);
            const generatedCode = this.playwrightCommand.codeGetter();
            console.log("Playwright Command:", generatedCode);
            chrome.runtime.sendMessage({
              type: "display_code",
              code: generatedCode
            });
            window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
          }
        }
        this.dragStepFlag = 0;
        console.log("drag flag - up \u51FA", this.dragStepFlag);
      });
      this.iframeDocument.addEventListener("input", (e) => {
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(() => {
          console.log("\u4F7F\u7528\u8005\u8F38\u5165\u5B8C\u6210\uFF1A", e.target.value || e.target.innerText);
          this.rightNowAction = this.rightNowAction + 1;
          console.log("iframe - rightNowAction(input): ", this.rightNowAction);
          const action_type = "input";
          this.currentHoveredElement = e.target;
          this.DOMElement.setElementData(this.currentHoveredElement, action_type);
          console.log(this.DOMElement.getAllElements());
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", ""));
          this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
          console.log("Playwright Command:", this.playwrightCommand.codeGetter());
          console.log("useractionDB: ", this.useractionDB);
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        }, this.INPUT_DELAY);
      });
      this.iframeWindow.addEventListener("dragover", (e) => {
        console.log("\u62D6\u66F3\u6ED1\u904E\u76EE\u6A19\u5340");
      });
      this.iframeDocument.addEventListener("dragstart", async (e) => {
        console.log("\u5075\u6E2C\u5230iframe-drag");
        this.iframeDragFlag = true;
      });
      this.iframeWindow.addEventListener("drop", async (e) => {
        this.currentHoveredElement = e.target;
        if (this.currentHoveredElement && this.windowDragFlag) {
          console.log("in iframe drop: ", this.currentHoveredElement);
          console.log("drag inside iframe (drop)");
          console.log("iframe - rightNowAction: ", this.rightNowAction);
          const tempAction = this.useractionDB[this.rightNowAction];
          console.log("tempAction inside iframeWindow", tempAction);
          tempAction.setTargetWindow("iframe");
          console.log("inside drop action db: ", this.useractionDB);
          tempAction.setTargetElement(this.currentHoveredElement);
          console.log("tempAction: ", tempAction);
          this.generator.generate(tempAction, this.playwrightCommand, this.rightNowAction);
          console.log("Playwright Command:", this.playwrightCommand.codeGetter());
          this.currentHoveredElement = null;
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          chrome.storage.local.set({ actionPos: this.rightNowAction });
          this.windowDragFlag = false;
        }
      });
      this.iframeWindow.addEventListener("message", (e) => {
        const msg = e.data;
        console.log("msg:", msg);
        switch (msg.type) {
          case "window_drag_start":
            console.log("iframe \u6536\u5230 window \u50B3\u4F86\u7684 dragstart");
            this.windowDragFlag = true;
            break;
          case "actionPosChanged":
            console.log("iframe receive rightNowAction change request~");
            this.rightNowAction = msg.actionPos;
            break;
        }
      });
      function waitForLocalSotrageChanged() {
        return new Promise((resolve) => {
          function listener(changes, areaName) {
            if (areaName === "local" && changes.actionPos) {
              resolve(changes.actionPos.newValue);
            }
          }
          chrome.storage.onChanged.addListener(listener);
        });
      }
    }
  };

  // interfaces/OuterEventListener.js
  (function() {
    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === "input") {
        if (!options || typeof options === "boolean") {
          options = { capture: true };
        } else if (typeof options === "object") {
          options.capture = true;
        }
        console.log("[MonkeyPatch] Patched input listener for:", this);
      }
      return originalAdd.call(this, type, listener, options);
    };
  })();
  var OuterEventListener = class {
    constructor(iframeWindow, domParserService, command, userActionDB) {
      this.iframeWindow = iframeWindow;
      this.domParserService = domParserService;
      this.dragSources = document.querySelectorAll('[draggable="true"]');
      this.DOMElement = new DOMElement();
      this.useractionDB = userActionDB;
      this.playwrightCommand = command;
      this.generator = new PlaywrightCodeGenerator(iframeWindow, this.useractionDB);
      this.target = null;
      this.source = null;
      this.currentHoveredElement = null;
      this.rightNowAction = -1;
      this.typedText = "";
      this.timer;
    }
    init() {
      document.addEventListener("click", (e) => {
        if (e.target.matches("input[type='checkbox'], select") || e.target.closest("input[type='checkbox'], select")) {
          return;
        }
        if (e.target.tagName === "SELECT") return;
        console.log("Here is a click event! e: ", e.target);
        const clickable = e.target.closest(`
  button,
  a,
  [role="button"],
  [onclick],
  i,           /* \u5305\u542B <i> */
  svg           /* \u6216\u76F4\u63A5 svg */
`) || e.target;
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction(click): ", this.rightNowAction);
        const action_type = "click";
        this.currentHoveredElement = clickable;
        this.DOMElement.setElementData(this.currentHoveredElement, "click");
        console.log(this.DOMElement.getAllElements());
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
        this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
        console.log("Playwright Command:", this.playwrightCommand.codeGetter());
        console.log("useractionDB: ", this.useractionDB);
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      }, true);
      window.addEventListener("drop", (e) => {
        console.log("window drop!");
      });
      window.addEventListener("dragstart", (e) => {
        try {
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction (drag stat): ", this.rightNowAction);
          const target = e.target;
          const action_type = "dragANDdrop";
          if (target.getAttribute("draggable") === "true") {
            console.log("\u62D6\u62C9\u958B\u59CB:", target);
            this.DOMElement.setElementData(target, "drag");
            this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
            this.iframeWindow.postMessage({ type: "window_drag_start", nowAction: this.rightNowAction }, "*");
            chrome.storage.local.set({ sourceOfDD: "window" });
            this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
          }
        } catch (error) {
        }
      });
      document.addEventListener("dblclick", (e) => {
        console.log("double click detected!");
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction(dbclick): ", this.rightNowAction);
        const action_type = "dbclick";
        this.currentHoveredElement = e.target;
        this.DOMElement.setElementData(this.currentHoveredElement, action_type);
        console.log(this.DOMElement.getAllElements());
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
        this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
        console.log("Playwright Command:", this.playwrightCommand.codeGetter());
        console.log("useractionDB: ", this.useractionDB);
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      }, true);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          console.log("Backspace key pressed!");
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction(keyboard: ", this.rightNowAction);
          const action_type = "keyboard";
          this.currentHoveredElement = e.target;
          this.DOMElement.setElementData(this.currentHoveredElement, action_type);
          this.DOMElement.setKeyElement(e.key);
          console.log(this.DOMElement.getAllElements());
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
          this.useractionDB[this.rightNowAction].setKeyboard(e.key);
          this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
          console.log("Playwright Command:", this.playwrightCommand.codeGetter());
          console.log("useractionDB: ", this.useractionDB);
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          chrome.runtime.sendMessage({
            type: "display_useraction",
            action: this.useractionDB
          });
          this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        }
      });
      document.addEventListener("change", (e) => {
        const tag = e.target.tagName;
        const type = e.target.type;
        const isSelect = tag === "SELECT";
        const isCheckbox = tag === "INPUT" && type === "checkbox";
        if (!isSelect || isCheckbox) return;
        let action_type;
        if (isSelect) {
          action_type = "change";
          let select2 = e.target.closest("select");
          console.log("inside change!");
          console.log("inside change 1!");
          let domTest = this.domParserService.getOpenSourcePath(e.target, "page");
          console.log("checked test: ", domTest);
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction(change): ", this.rightNowAction);
          this.DOMElement.setElementData(e.target, "change");
          console.log(this.DOMElement.getAllElements());
        } else if (isCheckbox) {
          action_type = "checkBox";
          console.log("inside check box!");
          console.log("inside check box 1!");
          let domTest = this.domParserService.getOpenSourcePath(e.target, "page");
          console.log("checked test: ", domTest);
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction(check box): ", this.rightNowAction);
          this.DOMElement.setElementData(e.target, "checkBox");
          console.log(this.DOMElement.getAllElements());
        }
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
        this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
        console.log("Playwright Command:", this.playwrightCommand.codeGetter());
        console.log("useractionDB: ", this.useractionDB);
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      }, true);
      document.addEventListener("input", (e) => {
        const tag = e.target.tagName.toLowerCase();
        const type = e.target.getAttribute("type");
        const isTextInput = tag === "input" && (!type || type === "text" || type === "search" || type === "email" || type === "password" || type === "number") || tag === "textarea" || e.target.isContentEditable;
        if (!isTextInput) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          console.log("\u{1F4DD} \u4F7F\u7528\u8005\u8F38\u5165\u5B8C\u6210\uFF1A", e.target.value || e.target.innerText);
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction(input): ", this.rightNowAction);
          const action_type = "input";
          this.currentHoveredElement = e.target;
          this.DOMElement.setElementData(this.currentHoveredElement, action_type);
          console.log(this.DOMElement.getAllElements());
          this.useractionDB.push(
            ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", "")
          );
          this.generator.generate(
            this.useractionDB[this.rightNowAction],
            this.playwrightCommand,
            this.rightNowAction
          );
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          console.log("useractionDB:", this.useractionDB);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          this.iframeWindow.postMessage(
            { type: "actionPosChanged", actionPos: this.rightNowAction },
            "*"
          );
        }, 500);
      }, true);
      window.addEventListener("message", (e) => {
        const msg = e.data;
        console.log("window get msg: ", msg);
        switch (msg.type) {
          case "actionPosChanged":
            this.rightNowAction = msg.actionPos;
            break;
        }
      });
    }
    AfterAllSteps() {
      const generatedCode = this.playwrightCommand.codeGetter();
      console.log("Playwright Command:", generatedCode);
      chrome.runtime.sendMessage({
        type: "display_code",
        code: generatedCode
      });
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      this.iframeWindow.postMessage({ type: "typedTextChanged", typedText: this.typedText }, "*");
    }
  };

  // WindowsCatcher.js
  var WindowsCatcher = class {
    constructor(doucumentRef = document) {
      this.documentRef = doucumentRef;
      this.iframeWindowsId = [];
    }
    getWindows() {
      const iframe = this.documentRef.querySelector("iframe");
      this.iframeWindowsId.push(iframe.id);
      const anotherIframe = this.documentRef.querySelectorAll("iframe");
      const iframeWindows = iframe?.contentWindow || null;
      const mainWindow = window;
      return { mainWindow, iframeWindows };
    }
    getIframesId() {
      return this.iframeWindowsId;
    }
  };

  // usecases/StorageManager.js
  var StorageManager = class {
  };

  // MainApp.js
  var MainApp = class {
    constructor() {
      this.allwindows = new WindowsCatcher();
      this.userActionDB = [];
      this.command = new PlaywrightCommand();
    }
    start() {
      console.log("\u7A0B\u5F0F\u6D3B\u8457!");
      const { mainWindow, iframeWindows } = this.allwindows.getWindows();
      this.init_codeSetter();
      const domParserService = new DOMParserService(iframeWindows);
      if (iframeWindows) {
        const iframeListener2 = new IframeEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
        iframeListener2.init();
      }
      const outerListener = new OuterEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
      outerListener.init();
      chrome.storage.local.clear(() => {
        console.log("storage \u5DF2\u6E05\u7A7A");
      });
      const storageManager = new StorageManager(iframeListener, outerListener, domParserService);
    }
    init_codeSetter() {
      const iframesId = this.allwindows.getIframesId();
      const codeline = `const iframe = page.frameLocator('iframe#${iframesId}');`;
      this.command.codeWindowsSetter(codeline);
    }
  };
  const app = new MainApp();
app.start();
})();
