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
            var HTMLCollection2 = [];
            traverseDescendants(this.childTags, function(descendant) {
              if (descendant.name === tagName || tagName === "*") {
                HTMLCollection2.push(descendant);
              }
            });
            return HTMLCollection2;
          };
        }
        if (!ElementPrototype.getElementsByClassName) {
          ElementPrototype.getElementsByClassName = function(className) {
            var names = className.trim().replace(/\s+/g, " ").split(" ");
            var HTMLCollection2 = [];
            traverseDescendants([this], function(descendant) {
              var descendantClassName = descendant.attribs.class;
              if (descendantClassName && names.every(function(name) {
                return descendantClassName.indexOf(name) > -1;
              })) {
                HTMLCollection2.push(descendant);
              }
            });
            return HTMLCollection2;
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
                      var NodeList2 = [];
                      traverseDescendants([node], function(descendant) {
                        if (validate(descendant)) {
                          NodeList2.push(descendant);
                        }
                      });
                      return {
                        v: NodeList2
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
                      var NodeList2 = [];
                      traverseDescendants([node], function(descendant, done) {
                        if (validate(descendant)) {
                          NodeList2.push(descendant);
                          done();
                        }
                      });
                      return {
                        v: NodeList2
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
                      var NodeList2 = [];
                      traverseDescendants([node], function(descendant) {
                        return NodeList2.push(descendant);
                      });
                      return {
                        v: NodeList2
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
                      var NodeList2 = [];
                      traverseDescendants([node], function(descendant) {
                        if (validate(descendant)) {
                          NodeList2.push(descendant);
                        }
                      });
                      return {
                        v: NodeList2
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
              return match.reduce(function(NodeList2, matchedNode) {
                if (validatePseudo(matchedNode)) {
                  NodeList2.push(matchedNode);
                }
                return NodeList2;
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
      exports.default = optimize;
      var _adapt = require_adapt();
      var _adapt2 = _interopRequireDefault(_adapt);
      var _utilities = require_utilities();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function optimize(selector, elements) {
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

  // node_modules/unique-selector/lib/getID.js
  var require_getID = __commonJS({
    "node_modules/unique-selector/lib/getID.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getID = getID;
      function getID(el) {
        var id = el.getAttribute("id");
        if (id !== null && id !== "") {
          return id.match(/(?:^\d|:)/) ? '[id="' + id + '"]' : "#" + id;
        }
        return null;
      }
    }
  });

  // node_modules/unique-selector/lib/getClasses.js
  var require_getClasses = __commonJS({
    "node_modules/unique-selector/lib/getClasses.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getClasses = getClasses;
      exports.getClassSelectors = getClassSelectors2;
      function getClasses(el) {
        if (!el.hasAttribute("class")) {
          return [];
        }
        try {
          var classList = Array.prototype.slice.call(el.classList);
          return classList.filter(function(item) {
            return !/^[a-z_-][a-z\d_-]*$/i.test(item) ? null : item;
          });
        } catch (e) {
          var className = el.getAttribute("class");
          className = className.trim().replace(/\s+/g, " ");
          return className.split(" ");
        }
      }
      function getClassSelectors2(el) {
        var classList = getClasses(el).filter(Boolean);
        return classList.map(function(cl) {
          return "." + cl;
        });
      }
    }
  });

  // node_modules/unique-selector/lib/getCombinations.js
  var require_getCombinations = __commonJS({
    "node_modules/unique-selector/lib/getCombinations.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getCombinations = getCombinations;
      function kCombinations(result, items, data, start, end, index, k) {
        if (index === k) {
          result.push(data.slice(0, index).join(""));
          return;
        }
        for (var i = start; i <= end && end - i + 1 >= k - index; ++i) {
          data[index] = items[i];
          kCombinations(result, items, data, i + 1, end, index + 1, k);
        }
      }
      function getCombinations(items, k) {
        var result = [], n = items.length, data = [];
        for (var l = 1; l <= k; ++l) {
          kCombinations(result, items, data, 0, n - 1, 0, l);
        }
        return result;
      }
    }
  });

  // node_modules/unique-selector/lib/getAttributes.js
  var require_getAttributes = __commonJS({
    "node_modules/unique-selector/lib/getAttributes.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getAttributes = getAttributes;
      function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
          for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
          }
          return arr2;
        } else {
          return Array.from(arr);
        }
      }
      function getAttributes(el) {
        var attributesToIgnore = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : ["id", "class", "length"];
        var attributes = el.attributes;
        var attrs = [].concat(_toConsumableArray(attributes));
        return attrs.reduce(function(sum, next) {
          if (!(attributesToIgnore.indexOf(next.nodeName) > -1)) {
            sum.push("[" + next.nodeName + '="' + next.value + '"]');
          }
          return sum;
        }, []);
      }
    }
  });

  // node_modules/unique-selector/lib/isElement.js
  var require_isElement = __commonJS({
    "node_modules/unique-selector/lib/isElement.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      exports.isElement = isElement2;
      function isElement2(el) {
        var isElem = void 0;
        if ((typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === "object") {
          isElem = el instanceof HTMLElement;
        } else {
          isElem = !!el && (typeof el === "undefined" ? "undefined" : _typeof(el)) === "object" && el.nodeType === 1 && typeof el.nodeName === "string";
        }
        return isElem;
      }
    }
  });

  // node_modules/unique-selector/lib/getNthChild.js
  var require_getNthChild = __commonJS({
    "node_modules/unique-selector/lib/getNthChild.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getNthChild = getNthChild;
      var _isElement = require_isElement();
      function getNthChild(element) {
        var counter = 0;
        var k = void 0;
        var sibling = void 0;
        var parentNode = element.parentNode;
        if (Boolean(parentNode)) {
          var childNodes = parentNode.childNodes;
          var len = childNodes.length;
          for (k = 0; k < len; k++) {
            sibling = childNodes[k];
            if ((0, _isElement.isElement)(sibling)) {
              counter++;
              if (sibling === element) {
                return ":nth-child(" + counter + ")";
              }
            }
          }
        }
        return null;
      }
    }
  });

  // node_modules/unique-selector/lib/getTag.js
  var require_getTag = __commonJS({
    "node_modules/unique-selector/lib/getTag.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getTag = getTag;
      function getTag(el) {
        return el.tagName.toLowerCase().replace(/:/g, "\\:");
      }
    }
  });

  // node_modules/unique-selector/lib/isUnique.js
  var require_isUnique = __commonJS({
    "node_modules/unique-selector/lib/isUnique.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.isUnique = isUnique;
      function isUnique(el, selector) {
        if (!Boolean(selector)) return false;
        var elems = el.ownerDocument.querySelectorAll(selector);
        return elems.length === 1 && elems[0] === el;
      }
    }
  });

  // node_modules/unique-selector/lib/getParents.js
  var require_getParents = __commonJS({
    "node_modules/unique-selector/lib/getParents.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getParents = getParents2;
      var _isElement = require_isElement();
      function getParents2(el) {
        var parents = [];
        var currentElement = el;
        while ((0, _isElement.isElement)(currentElement)) {
          parents.push(currentElement);
          currentElement = currentElement.parentNode;
        }
        return parents;
      }
    }
  });

  // node_modules/unique-selector/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/unique-selector/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = unique2;
      var _getID = require_getID();
      var _getClasses = require_getClasses();
      var _getCombinations = require_getCombinations();
      var _getAttributes = require_getAttributes();
      var _getNthChild = require_getNthChild();
      var _getTag = require_getTag();
      var _isUnique = require_isUnique();
      var _getParents = require_getParents();
      function getAllSelectors2(el, selectors, attributesToIgnore) {
        var funcs = {
          "Tag": _getTag.getTag,
          "NthChild": _getNthChild.getNthChild,
          "Attributes": function Attributes(elem) {
            return (0, _getAttributes.getAttributes)(elem, attributesToIgnore);
          },
          "Class": _getClasses.getClassSelectors,
          "ID": _getID.getID
        };
        return selectors.reduce(function(res, next) {
          res[next] = funcs[next](el);
          return res;
        }, {});
      }
      function testUniqueness(element, selector) {
        var parentNode = element.parentNode;
        var elements = parentNode.querySelectorAll(selector);
        return elements.length === 1 && elements[0] === element;
      }
      function getFirstUnique(element, selectors) {
        return selectors.find(testUniqueness.bind(null, element));
      }
      function getUniqueCombination(element, items, tag) {
        var combinations = (0, _getCombinations.getCombinations)(items, 3), firstUnique = getFirstUnique(element, combinations);
        if (Boolean(firstUnique)) {
          return firstUnique;
        }
        if (Boolean(tag)) {
          combinations = combinations.map(function(combination) {
            return tag + combination;
          });
          firstUnique = getFirstUnique(element, combinations);
          if (Boolean(firstUnique)) {
            return firstUnique;
          }
        }
        return null;
      }
      function getUniqueSelector(element, selectorTypes, attributesToIgnore, excludeRegex) {
        var foundSelector = void 0;
        var elementSelectors = getAllSelectors2(element, selectorTypes, attributesToIgnore);
        if (excludeRegex && excludeRegex instanceof RegExp) {
          elementSelectors.ID = excludeRegex.test(elementSelectors.ID) ? null : elementSelectors.ID;
          elementSelectors.Class = elementSelectors.Class.filter(function(className) {
            return !excludeRegex.test(className);
          });
        }
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = void 0;
        try {
          for (var _iterator = selectorTypes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var selectorType = _step.value;
            var ID = elementSelectors.ID, Tag = elementSelectors.Tag, Classes = elementSelectors.Class, Attributes = elementSelectors.Attributes, NthChild = elementSelectors.NthChild;
            switch (selectorType) {
              case "ID":
                if (Boolean(ID) && testUniqueness(element, ID)) {
                  return ID;
                }
                break;
              case "Tag":
                if (Boolean(Tag) && testUniqueness(element, Tag)) {
                  return Tag;
                }
                break;
              case "Class":
                if (Boolean(Classes) && Classes.length) {
                  foundSelector = getUniqueCombination(element, Classes, Tag);
                  if (foundSelector) {
                    return foundSelector;
                  }
                }
                break;
              case "Attributes":
                if (Boolean(Attributes) && Attributes.length) {
                  foundSelector = getUniqueCombination(element, Attributes, Tag);
                  if (foundSelector) {
                    return foundSelector;
                  }
                }
                break;
              case "NthChild":
                if (Boolean(NthChild)) {
                  return NthChild;
                }
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
        return "*";
      }
      function unique2(el) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var _options$selectorType = options.selectorTypes, selectorTypes = _options$selectorType === void 0 ? ["ID", "Class", "Tag", "NthChild"] : _options$selectorType, _options$attributesTo = options.attributesToIgnore, attributesToIgnore = _options$attributesTo === void 0 ? ["id", "class", "length"] : _options$attributesTo, _options$excludeRegex = options.excludeRegex, excludeRegex = _options$excludeRegex === void 0 ? null : _options$excludeRegex;
        var allSelectors = [];
        var parents = (0, _getParents.getParents)(el);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = void 0;
        try {
          for (var _iterator2 = parents[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var elem = _step2.value;
            var selector = getUniqueSelector(elem, selectorTypes, attributesToIgnore, excludeRegex);
            if (Boolean(selector)) {
              allSelectors.push(selector);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
        var selectors = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = void 0;
        try {
          for (var _iterator3 = allSelectors[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var it = _step3.value;
            selectors.unshift(it);
            var _selector = selectors.join(" > ");
            if ((0, _isUnique.isUnique)(el, _selector)) {
              return _selector;
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
        return null;
      }
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

  // node_modules/css-selector-generator/esm/utilities-iselement.js
  function isElement(input) {
    return typeof input === "object" && input !== null && input.nodeType === Node.ELEMENT_NODE;
  }

  // node_modules/css-selector-generator/esm/types.js
  var OPERATOR = {
    NONE: "",
    DESCENDANT: " ",
    CHILD: " > "
  };
  var CSS_SELECTOR_TYPE = {
    id: "id",
    class: "class",
    tag: "tag",
    attribute: "attribute",
    nthchild: "nthchild",
    nthoftype: "nthoftype"
  };

  // node_modules/css-selector-generator/esm/utilities-typescript.js
  function isEnumValue(haystack, needle) {
    return Object.values(haystack).includes(needle);
  }

  // node_modules/css-selector-generator/esm/utilities-messages.js
  var libraryName = "CssSelectorGenerator";
  function showWarning(id = "unknown problem", ...args) {
    console.warn(`${libraryName}: ${id}`, ...args);
  }

  // node_modules/css-selector-generator/esm/utilities-options.js
  var DEFAULT_OPTIONS = {
    selectors: [
      CSS_SELECTOR_TYPE.id,
      CSS_SELECTOR_TYPE.class,
      CSS_SELECTOR_TYPE.tag,
      CSS_SELECTOR_TYPE.attribute
    ],
    // if set to true, always include tag name
    includeTag: false,
    whitelist: [],
    blacklist: [],
    combineWithinSelector: true,
    combineBetweenSelectors: true,
    root: null,
    maxCombinations: Number.POSITIVE_INFINITY,
    maxCandidates: Number.POSITIVE_INFINITY,
    useScope: false
  };
  function sanitizeSelectorTypes(input) {
    if (!Array.isArray(input)) {
      return [];
    }
    return input.filter((item) => isEnumValue(CSS_SELECTOR_TYPE, item));
  }
  function isRegExp(input) {
    return input instanceof RegExp;
  }
  function isCssSelectorMatch(input) {
    return ["string", "function"].includes(typeof input) || isRegExp(input);
  }
  function sanitizeCssSelectorMatchList(input) {
    if (!Array.isArray(input)) {
      return [];
    }
    return input.filter(isCssSelectorMatch);
  }
  function isNode(input) {
    return input instanceof Node;
  }
  function isParentNode(input) {
    const validParentNodeTypes = [
      Node.DOCUMENT_NODE,
      Node.DOCUMENT_FRAGMENT_NODE,
      // this includes Shadow DOM root
      Node.ELEMENT_NODE
    ];
    return isNode(input) && validParentNodeTypes.includes(input.nodeType);
  }
  function sanitizeRoot(input, element) {
    if (isParentNode(input)) {
      if (!input.contains(element)) {
        showWarning("element root mismatch", "Provided root does not contain the element. This will most likely result in producing a fallback selector using element's real root node. If you plan to use the selector using provided root (e.g. `root.querySelector`), it will not work as intended.");
      }
      return input;
    }
    const rootNode = element.getRootNode({ composed: false });
    if (isParentNode(rootNode)) {
      if (rootNode !== document) {
        showWarning("shadow root inferred", "You did not provide a root and the element is a child of Shadow DOM. This will produce a selector using ShadowRoot as a root. If you plan to use the selector using document as a root (e.g. `document.querySelector`), it will not work as intended.");
      }
      return rootNode;
    }
    return getRootNode(element);
  }
  function sanitizeMaxNumber(input) {
    return typeof input === "number" ? input : Number.POSITIVE_INFINITY;
  }
  function sanitizeOptions(element, custom_options = {}) {
    const options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), custom_options);
    return {
      selectors: sanitizeSelectorTypes(options.selectors),
      whitelist: sanitizeCssSelectorMatchList(options.whitelist),
      blacklist: sanitizeCssSelectorMatchList(options.blacklist),
      root: sanitizeRoot(options.root, element),
      combineWithinSelector: !!options.combineWithinSelector,
      combineBetweenSelectors: !!options.combineBetweenSelectors,
      includeTag: !!options.includeTag,
      maxCombinations: sanitizeMaxNumber(options.maxCombinations),
      maxCandidates: sanitizeMaxNumber(options.maxCandidates),
      useScope: !!options.useScope
    };
  }

  // node_modules/css-selector-generator/esm/utilities-data.js
  function getIntersection(items = []) {
    const [firstItem = [], ...otherItems] = items;
    if (otherItems.length === 0) {
      return firstItem;
    }
    return otherItems.reduce((accumulator, currentValue) => {
      return accumulator.filter((item) => currentValue.includes(item));
    }, firstItem);
  }
  function flattenArray(input) {
    return [].concat(...input);
  }
  function wildcardToRegExp(input) {
    return input.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".+");
  }
  function createPatternMatcher(list) {
    const matchFunctions = list.map((item) => {
      if (isRegExp(item)) {
        return (input) => item.test(input);
      }
      if (typeof item === "function") {
        return (input) => {
          const result = item(input);
          if (typeof result !== "boolean") {
            showWarning("pattern matcher function invalid", "Provided pattern matching function does not return boolean. It's result will be ignored.", item);
            return false;
          }
          return result;
        };
      }
      if (typeof item === "string") {
        const re = new RegExp("^" + wildcardToRegExp(item) + "$");
        return (input) => re.test(input);
      }
      showWarning("pattern matcher invalid", "Pattern matching only accepts strings, regular expressions and/or functions. This item is invalid and will be ignored.", item);
      return () => false;
    });
    return (input) => matchFunctions.some((matchFunction) => matchFunction(input));
  }

  // node_modules/css-selector-generator/esm/utilities-dom.js
  function testSelector(elements, selector, root) {
    const result = Array.from(sanitizeRoot(root, elements[0]).querySelectorAll(selector));
    return result.length === elements.length && elements.every((element) => result.includes(element));
  }
  function getElementParents(element, root) {
    root = root !== null && root !== void 0 ? root : getRootNode(element);
    const result = [];
    let parent = element;
    while (isElement(parent) && parent !== root) {
      result.push(parent);
      parent = parent.parentElement;
    }
    return result;
  }
  function getParents(elements, root) {
    return getIntersection(elements.map((element) => getElementParents(element, root)));
  }
  function getRootNode(element) {
    return element.ownerDocument.querySelector(":root");
  }

  // node_modules/css-selector-generator/esm/constants.js
  var SELECTOR_SEPARATOR = ", ";
  var INVALID_ID_RE = new RegExp([
    "^$",
    // empty or not set
    "\\s"
    // contains whitespace
  ].join("|"));
  var INVALID_CLASS_RE = new RegExp([
    "^$"
    // empty or not set
  ].join("|"));
  var SELECTOR_PATTERN = [
    CSS_SELECTOR_TYPE.nthoftype,
    CSS_SELECTOR_TYPE.tag,
    CSS_SELECTOR_TYPE.id,
    CSS_SELECTOR_TYPE.class,
    CSS_SELECTOR_TYPE.attribute,
    CSS_SELECTOR_TYPE.nthchild
  ];

  // node_modules/css-selector-generator/esm/selector-attribute.js
  var attributeBlacklistMatch = createPatternMatcher([
    "class",
    "id",
    // Angular attributes
    "ng-*"
  ]);
  function attributeNodeToSimplifiedSelector({ name }) {
    return `[${name}]`;
  }
  function attributeNodeToSelector({ name, value }) {
    return `[${name}='${value}']`;
  }
  function isValidAttributeNode({ nodeName, nodeValue }, element) {
    const tagName = element.tagName.toLowerCase();
    if (["input", "option"].includes(tagName) && nodeName === "value") {
      return false;
    }
    if (nodeName === "src" && (nodeValue === null || nodeValue === void 0 ? void 0 : nodeValue.startsWith("data:"))) {
      return false;
    }
    return !attributeBlacklistMatch(nodeName);
  }
  function sanitizeAttributeData({ nodeName, nodeValue }) {
    return {
      name: sanitizeSelectorItem(nodeName),
      value: sanitizeSelectorItem(nodeValue !== null && nodeValue !== void 0 ? nodeValue : void 0)
    };
  }
  function getElementAttributeSelectors(element) {
    const validAttributes = Array.from(element.attributes).filter((attributeNode) => isValidAttributeNode(attributeNode, element)).map(sanitizeAttributeData);
    return [
      ...validAttributes.map(attributeNodeToSimplifiedSelector),
      ...validAttributes.map(attributeNodeToSelector)
    ];
  }
  function getAttributeSelectors(elements) {
    const elementSelectors = elements.map(getElementAttributeSelectors);
    return getIntersection(elementSelectors);
  }

  // node_modules/css-selector-generator/esm/selector-class.js
  function getElementClassSelectors(element) {
    var _a;
    return ((_a = element.getAttribute("class")) !== null && _a !== void 0 ? _a : "").trim().split(/\s+/).filter((item) => !INVALID_CLASS_RE.test(item)).map((item) => `.${sanitizeSelectorItem(item)}`);
  }
  function getClassSelectors(elements) {
    const elementSelectors = elements.map(getElementClassSelectors);
    return getIntersection(elementSelectors);
  }

  // node_modules/css-selector-generator/esm/selector-id.js
  function getElementIdSelectors(element) {
    var _a;
    const id = (_a = element.getAttribute("id")) !== null && _a !== void 0 ? _a : "";
    const selector = `#${sanitizeSelectorItem(id)}`;
    const rootNode = element.getRootNode({ composed: false });
    return !INVALID_ID_RE.test(id) && testSelector([element], selector, rootNode) ? [selector] : [];
  }
  function getIdSelector(elements) {
    return elements.length === 0 || elements.length > 1 ? [] : getElementIdSelectors(elements[0]);
  }

  // node_modules/css-selector-generator/esm/selector-nth-child.js
  function getElementNthChildSelector(element) {
    const parent = element.parentNode;
    if (parent) {
      const siblings = Array.from(parent.childNodes).filter(isElement);
      const elementIndex = siblings.indexOf(element);
      if (elementIndex > -1) {
        return [
          `:nth-child(${String(elementIndex + 1)})`
        ];
      }
    }
    return [];
  }
  function getNthChildSelector(elements) {
    return getIntersection(elements.map(getElementNthChildSelector));
  }

  // node_modules/css-selector-generator/esm/selector-tag.js
  function getElementTagSelectors(element) {
    return [
      sanitizeSelectorItem(element.tagName.toLowerCase())
    ];
  }
  function getTagSelector(elements) {
    const selectors = [
      ...new Set(flattenArray(elements.map(getElementTagSelectors)))
    ];
    return selectors.length === 0 || selectors.length > 1 ? [] : [selectors[0]];
  }

  // node_modules/css-selector-generator/esm/selector-nth-of-type.js
  function getElementNthOfTypeSelector(element) {
    const tag = getTagSelector([element])[0];
    const parentElement = element.parentElement;
    if (parentElement) {
      const siblings = Array.from(parentElement.children).filter((element2) => element2.tagName.toLowerCase() === tag);
      const elementIndex = siblings.indexOf(element);
      if (elementIndex > -1) {
        return [
          `${tag}:nth-of-type(${String(elementIndex + 1)})`
        ];
      }
    }
    return [];
  }
  function getNthOfTypeSelector(elements) {
    return getIntersection(elements.map(getElementNthOfTypeSelector));
  }

  // node_modules/css-selector-generator/esm/utilities-powerset.js
  function* powerSetGenerator(input = [], { maxResults = Number.POSITIVE_INFINITY } = {}) {
    let resultCounter = 0;
    let offsets = generateOffsets(1);
    while (offsets.length <= input.length && resultCounter < maxResults) {
      resultCounter += 1;
      const result = offsets.map((offset) => input[offset]);
      yield result;
      offsets = bumpOffsets(offsets, input.length - 1);
    }
  }
  function getPowerSet(input = [], { maxResults = Number.POSITIVE_INFINITY } = {}) {
    return Array.from(powerSetGenerator(input, { maxResults }));
  }
  function bumpOffsets(offsets = [], maxValue = 0) {
    const size = offsets.length;
    if (size === 0) {
      return [];
    }
    const result = [...offsets];
    result[size - 1] += 1;
    for (let index = size - 1; index >= 0; index--) {
      if (result[index] > maxValue) {
        if (index === 0) {
          return generateOffsets(size + 1);
        } else {
          result[index - 1]++;
          result[index] = result[index - 1] + 1;
        }
      }
    }
    if (result[size - 1] > maxValue) {
      return generateOffsets(size + 1);
    }
    return result;
  }
  function generateOffsets(size = 1) {
    return Array.from(Array(size).keys());
  }

  // node_modules/css-selector-generator/esm/utilities-cartesian.js
  function getCartesianProduct(input = {}) {
    let result = [];
    Object.entries(input).forEach(([key, values]) => {
      result = values.flatMap((value) => {
        if (result.length === 0) {
          return [{ [key]: value }];
        } else {
          return result.map((memo) => Object.assign(Object.assign({}, memo), { [key]: value }));
        }
      });
    });
    return result;
  }

  // node_modules/css-selector-generator/esm/utilities-selectors.js
  var ESCAPED_COLON = ":".charCodeAt(0).toString(16).toUpperCase();
  var SPECIAL_CHARACTERS_RE = /[ !"#$%&'()\[\]{|}<>*+,./;=?@^`~\\]/;
  function sanitizeSelectorItem(input = "") {
    return CSS ? CSS.escape(input) : legacySanitizeSelectorItem(input);
  }
  function legacySanitizeSelectorItem(input = "") {
    return input.split("").map((character) => {
      if (character === ":") {
        return `\\${ESCAPED_COLON} `;
      }
      if (SPECIAL_CHARACTERS_RE.test(character)) {
        return `\\${character}`;
      }
      return escape(character).replace(/%/g, "\\");
    }).join("");
  }
  var SELECTOR_TYPE_GETTERS = {
    tag: getTagSelector,
    id: getIdSelector,
    class: getClassSelectors,
    attribute: getAttributeSelectors,
    nthchild: getNthChildSelector,
    nthoftype: getNthOfTypeSelector
  };
  var ELEMENT_SELECTOR_TYPE_GETTERS = {
    tag: getElementTagSelectors,
    id: getElementIdSelectors,
    class: getElementClassSelectors,
    attribute: getElementAttributeSelectors,
    nthchild: getElementNthChildSelector,
    nthoftype: getElementNthOfTypeSelector
  };
  function getElementSelectorsByType(element, selectorType) {
    return ELEMENT_SELECTOR_TYPE_GETTERS[selectorType](element);
  }
  function getSelectorsByType(elements, selector_type) {
    const getter = SELECTOR_TYPE_GETTERS[selector_type];
    return getter(elements);
  }
  function filterSelectors(list = [], matchBlacklist, matchWhitelist) {
    return list.filter((item) => matchWhitelist(item) || !matchBlacklist(item));
  }
  function orderSelectors(list = [], matchWhitelist) {
    return list.sort((a, b) => {
      const a_is_whitelisted = matchWhitelist(a);
      const b_is_whitelisted = matchWhitelist(b);
      if (a_is_whitelisted && !b_is_whitelisted) {
        return -1;
      }
      if (!a_is_whitelisted && b_is_whitelisted) {
        return 1;
      }
      return 0;
    });
  }
  function getAllSelectors(elements, root, options) {
    const selectors_list = getSelectorsList(elements, options);
    const type_combinations = getTypeCombinations(selectors_list, options);
    const all_selectors = flattenArray(type_combinations);
    return [...new Set(all_selectors)];
  }
  function getSelectorsList(elements, options) {
    const { blacklist, whitelist, combineWithinSelector, maxCombinations } = options;
    const matchBlacklist = createPatternMatcher(blacklist);
    const matchWhitelist = createPatternMatcher(whitelist);
    const reducer = (data, selector_type) => {
      const selectors_by_type = getSelectorsByType(elements, selector_type);
      const filtered_selectors = filterSelectors(selectors_by_type, matchBlacklist, matchWhitelist);
      const found_selectors = orderSelectors(filtered_selectors, matchWhitelist);
      data[selector_type] = combineWithinSelector ? getPowerSet(found_selectors, { maxResults: maxCombinations }) : found_selectors.map((item) => [item]);
      return data;
    };
    return getSelectorsToGet(options).reduce(reducer, {});
  }
  function getSelectorsToGet(options) {
    const { selectors, includeTag } = options;
    const selectors_to_get = [...selectors];
    if (includeTag && !selectors_to_get.includes("tag")) {
      selectors_to_get.push("tag");
    }
    return selectors_to_get;
  }
  function addTagTypeIfNeeded(list) {
    return list.includes(CSS_SELECTOR_TYPE.tag) || list.includes(CSS_SELECTOR_TYPE.nthoftype) ? [...list] : [...list, CSS_SELECTOR_TYPE.tag];
  }
  function combineSelectorTypes(options) {
    const { selectors, combineBetweenSelectors, includeTag, maxCandidates } = options;
    const combinations = combineBetweenSelectors ? getPowerSet(selectors, { maxResults: maxCandidates }) : selectors.map((item) => [item]);
    return includeTag ? combinations.map(addTagTypeIfNeeded) : combinations;
  }
  function getTypeCombinations(selectors_list, options) {
    return combineSelectorTypes(options).map((item) => {
      return constructSelectors(item, selectors_list);
    }).filter((item) => item.length > 0);
  }
  function constructSelectors(selector_types, selectors_by_type) {
    const data = {};
    selector_types.forEach((selector_type) => {
      const selector_variants = selectors_by_type[selector_type];
      if (selector_variants && selector_variants.length > 0) {
        data[selector_type] = selector_variants;
      }
    });
    const combinations = getCartesianProduct(data);
    return combinations.map(constructSelector);
  }
  function constructSelectorType(selector_type, selectors_data) {
    return selectors_data[selector_type] ? selectors_data[selector_type].join("") : "";
  }
  function constructSelector(selectorData = {}) {
    const pattern = [...SELECTOR_PATTERN];
    if (selectorData[CSS_SELECTOR_TYPE.tag] && selectorData[CSS_SELECTOR_TYPE.nthoftype]) {
      pattern.splice(pattern.indexOf(CSS_SELECTOR_TYPE.tag), 1);
    }
    return pattern.map((type) => constructSelectorType(type, selectorData)).join("");
  }
  function generateCandidateCombinations(selectors, rootSelector) {
    return [
      ...selectors.map((selector) => rootSelector + OPERATOR.DESCENDANT + selector),
      ...selectors.map((selector) => rootSelector + OPERATOR.CHILD + selector)
    ];
  }
  function generateCandidates(selectors, rootSelector) {
    return rootSelector === "" ? selectors : generateCandidateCombinations(selectors, rootSelector);
  }
  function getSelectorWithinRoot(elements, root, rootSelector = "", options) {
    const elementSelectors = getAllSelectors(elements, root, options);
    const selectorCandidates = generateCandidates(elementSelectors, rootSelector);
    for (const candidateSelector of selectorCandidates) {
      if (testSelector(elements, candidateSelector, root)) {
        return candidateSelector;
      }
    }
    return null;
  }
  function getClosestIdentifiableParent(elements, root, rootSelector = "", options) {
    if (elements.length === 0) {
      return null;
    }
    const candidatesList = [
      elements.length > 1 ? elements : [],
      ...getParents(elements, root).map((element) => [element])
    ];
    for (const currentElements of candidatesList) {
      const result = getSelectorWithinRoot(currentElements, root, rootSelector, options);
      if (result) {
        return {
          foundElements: currentElements,
          selector: result
        };
      }
    }
    return null;
  }
  function sanitizeSelectorNeedle(needle) {
    if (needle instanceof NodeList || needle instanceof HTMLCollection) {
      needle = Array.from(needle);
    }
    const elements = (Array.isArray(needle) ? needle : [needle]).filter(isElement);
    return [...new Set(elements)];
  }

  // node_modules/css-selector-generator/esm/utilities-element-data.js
  function createElementSelectorData(selector) {
    return {
      value: selector,
      include: false
    };
  }
  function createElementData(element, selectorTypes, operator = OPERATOR.NONE) {
    const selectors = {};
    selectorTypes.forEach((selectorType) => {
      Reflect.set(selectors, selectorType, getElementSelectorsByType(element, selectorType).map(createElementSelectorData));
    });
    return {
      element,
      operator,
      selectors
    };
  }
  function constructElementSelector({ selectors, operator }) {
    let pattern = [...SELECTOR_PATTERN];
    if (selectors[CSS_SELECTOR_TYPE.tag] && selectors[CSS_SELECTOR_TYPE.nthoftype]) {
      pattern = pattern.filter((item) => item !== CSS_SELECTOR_TYPE.tag);
    }
    let selector = "";
    pattern.forEach((selectorType) => {
      var _a;
      const selectorsOfType = (_a = selectors[selectorType]) !== null && _a !== void 0 ? _a : [];
      selectorsOfType.forEach(({ value, include }) => {
        if (include) {
          selector += value;
        }
      });
    });
    return operator + selector;
  }

  // node_modules/css-selector-generator/esm/selector-fallback.js
  function getElementFallbackSelector(element, root) {
    const parentElements = getElementParents(element, root).reverse();
    const elementsData = parentElements.map((element2) => {
      var _a;
      const elementData = createElementData(element2, [CSS_SELECTOR_TYPE.nthchild], OPERATOR.CHILD);
      ((_a = elementData.selectors.nthchild) !== null && _a !== void 0 ? _a : []).forEach((selectorData) => {
        selectorData.include = true;
      });
      return elementData;
    });
    return [
      root ? ":scope" : ":root",
      ...elementsData.map(constructElementSelector)
    ].join("");
  }
  function getFallbackSelector(elements, root) {
    return elements.map((element) => getElementFallbackSelector(element, root)).join(SELECTOR_SEPARATOR);
  }

  // node_modules/css-selector-generator/esm/index.js
  function getCssSelector(needle, custom_options = {}) {
    var _a;
    const elements = sanitizeSelectorNeedle(needle);
    const options = sanitizeOptions(elements[0], custom_options);
    const root = (_a = options.root) !== null && _a !== void 0 ? _a : getRootNode(elements[0]);
    let partialSelector = "";
    let currentRoot = root;
    function updateIdentifiableParent() {
      return getClosestIdentifiableParent(elements, currentRoot, partialSelector, options);
    }
    let closestIdentifiableParent = updateIdentifiableParent();
    while (closestIdentifiableParent) {
      const { foundElements, selector } = closestIdentifiableParent;
      if (testSelector(elements, selector, root)) {
        return selector;
      }
      currentRoot = foundElements[0];
      partialSelector = selector;
      closestIdentifiableParent = updateIdentifiableParent();
    }
    if (elements.length > 1) {
      return elements.map((element) => getCssSelector(element, options)).join(SELECTOR_SEPARATOR);
    }
    return getFallbackSelector(elements, options.useScope ? root : void 0);
  }

  // usecases/DOMParserService.js
  var import_optimal_select = __toESM(require_lib());
  var import_unique_selector = __toESM(require_lib2());
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
      this.weight = {
        WL: 0.4,
        Wc: 0.6,
        Wa: 1,
        Wcl: 1,
        Wt: 1,
        Wn: 3
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
      let isUniqueSelector = {
        cssSelector: false,
        OptSelector: false,
        uniSelector: false
      };
      let doc, cssatt, optPri, uniPri;
      if (sourceWin === "iframe") {
        doc = this.iframeDoc;
        cssatt = ["tag", "class", "attribute", "nthchild"];
        optPri = ["tag", "class", "attribute"];
        uniPri = ["Tag", "Class", "Attributes", "NthChild"];
      } else {
        doc = document;
        cssatt = ["class", "attribute", "tag", "nthchild"];
        optPri = ["class", "attribute", "tag"];
        uniPri = ["Class", "Attributes", "Tag", "NthChild"];
      }
      let csskey = 0, optkey = 0, unikey = 0;
      const selector = getCssSelector(e, {
        selectors: cssatt,
        blacklist: ["id"],
        root: doc
      });
      console.log("selector", selector);
      if (this.findUnique(selector, doc)) {
        isUniqueSelector.cssSelector = true;
        isUniqueObj.ByDomPath = true;
        csskey = 1;
      }
      let opt_selector = (0, import_optimal_select.select)(e, {
        root: doc,
        priority: optPri,
        ignore: {
          id: true
        }
      });
      if (this.findUnique(opt_selector, doc)) {
        isUniqueSelector.OptSelector = true;
        isUniqueObj.ByDomPath = true;
        optkey = 1;
      }
      let options = {
        // Array of selector types based on which the unique selector will generate
        selectorTypes: uniPri
      };
      let dom_selector = (0, import_unique_selector.default)(e, options);
      if (this.findUnique(dom_selector, doc)) {
        isUniqueSelector.uniSelector = true;
        isUniqueObj.ByDomPath = true;
        unikey = 1;
      }
      let csspath = this.analyzeCssPath(selector, csskey);
      let optpath = this.analyzeCssPath(opt_selector, optkey);
      let unipath = this.analyzeCssPath(dom_selector, unikey);
      let paths = [csspath, optpath, unipath];
      this.playwrightObj.ByDomPath.csspath = this.bestDomPath(paths);
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
    bestDomPath(paths) {
      const WL = this.weight.WL;
      const Wc = this.weight.Wc;
      const Wa = this.weight.Wa;
      const Wcl = this.weight.Wcl;
      const Wt = this.weight.Wt;
      const Wn = this.weight.Wn;
      let bestScore = -Infinity;
      let bestPath = null;
      for (const p of paths) {
        const { length, a, cl, t, n, U } = p;
        const Lscore = 1 / (1 + length);
        const Cscore = 1 / (1 + Wa * a + Wcl * cl + Wt * t + Wn * n);
        const Score = U * (WL * Lscore + Wc * Cscore);
        console.log("Score - path1: ", p.path);
        console.log("Score - score: ", Score);
        console.log("Score - Others: LS", Lscore, " CS: ", Cscore, "wa, a, wcl, cl, wt, t, wn, n: ", Wa, a, Wcl, cl, Wt, t, Wn, n);
        if (Score > bestScore) {
          bestScore = Score;
          bestPath = p.path;
        }
      }
      return bestPath;
    }
    analyzeCssPath(cssPath, unique2) {
      const obj = {
        path: cssPath,
        length: 0,
        a: 0,
        cl: 0,
        t: 0,
        n: 0,
        U: unique2
      };
      obj.length = cssPath.split(/>|\s+/).filter(Boolean).length;
      const attrMatches = cssPath.match(/\[[^\]]+\]/g);
      obj.a = attrMatches ? attrMatches.length : 0;
      const classMatches = cssPath.match(/\.[^\s\#\.\[:>]+/g);
      obj.cl = classMatches ? classMatches.length : 0;
      const cleanedForTag = cssPath.replace(/:[a-zA-Z-]+\([^)]+\)/g, "").replace(/\.[a-zA-Z0-9_-]+/g, "").replace(/\[[^\]]+\]/g, "");
      const tagMatches = cleanedForTag.match(/\b[a-zA-Z][a-zA-Z0-9]*\b/g);
      console.log("Score: tag", tagMatches);
      obj.t = tagMatches ? tagMatches.length : 0;
      const nthMatches = cssPath.match(/:nth-(child|of-type)\([^)]+\)/g);
      obj.n = nthMatches ? nthMatches.length : 0;
      return obj;
    }
    findUnique(path, doc) {
      const element = doc.querySelectorAll(path);
      console.log("element: ", element);
      if (element.length === 1) {
        console.log("This csspath is unique");
        return true;
      } else {
        console.log("This is not unique");
        return false;
      }
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
            const testSelector2 = `${selector}.${esc}`;
            if (document.querySelectorAll(testSelector2).length === 1) {
              selector = testSelector2;
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
    checkUniqueByDom(path) {
      const element = document.querySelectorAll(path);
      console.log("element: ", element);
      if (element.length === 1) {
        console.log("This csspath is unique");
        return true;
      } else {
        console.log("This is not unique");
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
        this.userActionDB[this.rightNowAction].setInputText(inputText);
        console.log("InputTEXT: ", inputText);
      }
      if (action.type === "keyboard") {
        inputKey = action.getKeyboard();
      }
      if (action.type === "change") {
        selectLabel = action.getSourceElement().options[action.getSourceElement().selectedIndex].text;
        this.userActionDB[this.rightNowAction].setSelectedText(selectLabel);
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
      this.updateUserActionDB(funName, obj, act);
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
      console.log("souFunName: ", souFunName, " tarFunName: ", tarFunName);
      this.updateUserActionDB(souFunName, souObj, actDrag);
      this.updateUserActionDB(tarFunName, tarObj, actDrop);
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
      let act2 = { type: "click", addConfig: "", sourceWindow, targetWindow: "" };
      const command = this.playwrightCodeSetter(funName, obj, act2);
      playwrightCommand.codeSetter(command);
      this.updateUserActionDB(funName, obj, act2);
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
      let act2 = { type: "dbclick", addConfig: "", sourceWindow, targetWindow: "" };
      const command = this.playwrightCodeSetter(funName, obj, act2);
      playwrightCommand.codeSetter(command);
      this.updateUserActionDB(funName, obj, act2);
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
      let act2 = { type: "input", addConfig: "", sourceWindow, targetWindow: "", inputText };
      const command = this.playwrightCodeSetter(funName, obj, act2);
      playwrightCommand.codeSetter(command);
      this.updateUserActionDB(funName, obj, act2);
    }
    keydownSetter() {
    }
    //避免playwright code裡面外面都用"
    replacePath(cssPath) {
      return cssPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    playwrightCodeSetter(funName, obj, act2) {
      console.log("variable in codeSetter: funName= ", funName, "obg= ", obj, "act = ", act2);
      let sourceWinVar = act2.sourceWindow;
      let targetWinVar = act2.targetWindow;
      if (funName === "ByDomPath") {
        obj.csspath = this.replacePath(obj.csspath);
      }
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
            return `${windowVar}.locator("${obj.csspath}")`;
          default:
            return new Error(funName, " Not found!!");
        }
      };
      switch (act2.type) {
        case "click":
          if (sourceWinVar === "page") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.click("${obj.csspath}");`;
            }
            return `await ${getLocator(sourceWinVar)}.click();`;
          } else if (sourceWinVar === "iframe") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.locator("${obj.csspath}").click();`;
            }
            return `await ${getLocator(sourceWinVar)}.click();`;
          }
          break;
        case "dbclick":
          if (sourceWinVar === "page") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.dblclick("${obj.csspath}");`;
            }
            return `await ${getLocator(sourceWinVar)}.dblclick();`;
          } else if (sourceWinVar === "iframe") {
            if (funName === "ByDomPath") {
              return `await ${sourceWinVar}.locator("${obj.csspath}".dblclick());`;
            }
            return `await ${getLocator(sourceWinVar)}.dblclick();`;
          }
          break;
        case "input":
          let text = act2.inputText;
          console.log("Inner Text: ", text);
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.locator("${obj.csspath}").fill('${text}');`;
          } else if (funName === "ByRole") {
            return `await ${sourceWinVar}.getByRole("${obj.role}", { name: "${obj.name}" }).fill('${text}')`;
          } else if (funName === "ByTitle") {
            return `await ${sourceWinVar}.getByTitle("${obj.title}", {exact: true}).fill('${text}')`;
          }
          break;
        case "dragANDdrop":
          if (act2.ddConfig === "drag") {
            return `await ${getLocator(sourceWinVar)}`;
          }
          if (act2.ddConfig === "drop") {
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
    updateUserActionDB(funName, obj, act2) {
      if (act2.type === "dragANDdrop" && act2.ddConfig === "drop") {
        this.userActionDB[this.rightNowAction].setTargetMethod(funName);
        if (funName === "ByTitle") {
          this.userActionDB[this.rightNowAction].setTargetData(obj.title);
        } else if (funName === "ByText") {
          this.userActionDB[this.rightNowAction].setTargetData(obj.text);
        } else if (funName === "ByDomPath") {
          this.userActionDB[this.rightNowAction].setTargetData(obj.csspath);
        }
      } else {
        this.userActionDB[this.rightNowAction].setSourceMethod(funName);
        if (funName === "ByTitle") {
          this.userActionDB[this.rightNowAction].setSourceData(obj.title);
        } else if (funName === "ByText") {
          this.userActionDB[this.rightNowAction].setSourceData(obj.text);
        } else if (funName === "ByDomPath") {
          this.userActionDB[this.rightNowAction].setSourceData(obj.csspath);
        }
      }
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
      this.path = null;
      this.inputText = "";
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
      this.sourceWindow = sourceWindow;
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
    setInputText(text) {
      this.inputText = text;
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
    getInputText() {
      return this.inputText;
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
      this.dragStepFlag = 0;
    }
    init() {
      this.iframeDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this));
      this.iframeDocument.addEventListener("mousedown", this.mousedownHandler.bind(this));
      this.iframeDocument.addEventListener("mouseup", this.mouseupHandler.bind(this));
      this.iframeDocument.addEventListener("input", this.inputHandler.bind(this));
      this.iframeWindow.addEventListener("drop", this.dropHandler.bind(this));
      this.iframeWindow.addEventListener("message", this.messageHandler.bind(this));
    }
    messageHandler(e) {
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
    }
    dropHandler(e) {
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
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        chrome.storage.local.set({ actionPos: this.rightNowAction });
        this.windowDragFlag = false;
      }
    }
    inputHandler(e) {
      if (!e.isTrusted) return;
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
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      }, this.INPUT_DELAY);
    }
    mouseupHandler(e) {
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
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
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
            chrome.runtime.sendMessage({
              type: "display_useraction",
              action: this.useractionDB
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
          chrome.runtime.sendMessage({
            type: "display_useraction",
            action: this.useractionDB
          });
          window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        }
      }
      this.dragStepFlag = 0;
      console.log("drag flag - up \u51FA", this.dragStepFlag);
    }
    mousedownHandler(e) {
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
      this.dragSource = e.target;
      this.mouseDownFlag = true;
      this.dragStepFlag = 1;
    }
    mousemoveHandler(e) {
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
    }
  };

  // interfaces/OuterEventListener.js
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
      this.isRecording = false;
    }
    init() {
      document.addEventListener("click", this.clickHandler.bind(this), true);
      window.addEventListener("dragstart", this.dragStartHandler.bind(this));
      document.addEventListener("dblclick", this.dblClickHandler.bind(this), true);
      document.addEventListener("keydown", this.keydownHandler.bind(this));
      document.addEventListener("change", this.changeHandler.bind(this), true);
      document.addEventListener("input", this.inputHandler.bind(this), true);
      window.addEventListener("message", this.messageHandler.bind(this));
    }
    messageHandler(e) {
      const msg = e.data;
      console.log("window get msg: ", msg);
      switch (msg.type) {
        case "actionPosChanged":
          this.rightNowAction = msg.actionPos;
          break;
        case "START_RECORDING":
          console.log("receive start button");
          this.isRecording = true;
          break;
        // 可以加入更多 case
        case "STOP_RECORDING":
          console.log("receive stop button");
          this.isRecording = false;
          break;
      }
    }
    inputHandler(e) {
      if (!this.isRecording) return;
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
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        this.iframeWindow.postMessage(
          { type: "actionPosChanged", actionPos: this.rightNowAction },
          "*"
        );
      }, 500);
    }
    changeHandler(e) {
      if (!this.isRecording) return;
      if (!e.isTrusted) return;
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
    }
    keydownHandler(e) {
      if (!this.isRecording) return;
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
    }
    dblClickHandler(e) {
      if (!this.isRecording) return;
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
      chrome.runtime.sendMessage({
        type: "display_useraction",
        action: this.useractionDB
      });
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
    }
    dragStartHandler(e) {
      if (!this.isRecording) return;
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
    }
    clickHandler(e) {
      if (!this.isRecording) return;
      if (e.target.tagName === "LABEL") return;
      if (e.target.tagName === "SELECT") return;
      const target = e.target;
      let clickable;
      if (target.tagName === "INPUT") {
        const parent = target.parentElement;
        const label = parent?.querySelector(`label[for="${target.id}"]`);
        if (label) {
          clickable = label;
        } else {
          clickable = e.target.closest(`
  button,
  a,
  [role="button"],
  [onclick],
  i,           /* \u5305\u542B <i> */
  svg           /* \u6216\u76F4\u63A5 svg */
`) || e.target;
        }
      } else {
        console.log("Here is a click event! e: ", e.target);
        clickable = e.target.closest(`
  button,
  a,
  [role="button"],
  [onclick],
  i,           
  svg           
`) || e.target;
      }
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
      console.log("CLICK!!!");
      chrome.runtime.sendMessage({
        type: "display_useraction",
        action: this.useractionDB
      });
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
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
        const iframeListener = new IframeEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
        iframeListener.init();
      }
      const outerListener = new OuterEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
      outerListener.init();
      chrome.storage.local.clear(() => {
        console.log("storage \u5DF2\u6E05\u7A7A");
      });
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
