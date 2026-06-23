(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
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

  // ../../../node_modules/optimal-select/lib/adapt.js
  var require_adapt = __commonJS({
    "../../../node_modules/optimal-select/lib/adapt.js"(exports, module2) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
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
          ElementPrototype.getElementsByTagName = function(tagName2) {
            var HTMLCollection2 = [];
            traverseDescendants(this.childTags, function(descendant) {
              if (descendant.name === tagName2 || tagName2 === "*") {
                HTMLCollection2.push(descendant);
              }
            });
            return HTMLCollection2;
          };
        }
        if (!ElementPrototype.getElementsByClassName) {
          ElementPrototype.getElementsByClassName = function(className2) {
            var names = className2.trim().replace(/\s+/g, " ").split(" ");
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
        return selectors.split(" ").reverse().map(function(selector2, step) {
          var discover = step === 0;
          var _selector$split = selector2.split(":"), _selector$split2 = _slicedToArray(_selector$split, 2), type = _selector$split2[0], pseudo = _selector$split2[1];
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
                    if ((typeof _ret2 === "undefined" ? "undefined" : _typeof4(_ret2)) === "object") return _ret2.v;
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
                    if ((typeof _ret3 === "undefined" ? "undefined" : _typeof4(_ret3)) === "object") return _ret3.v;
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
                    if ((typeof _ret4 === "undefined" ? "undefined" : _typeof4(_ret4)) === "object") return _ret4.v;
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
                    if ((typeof _ret5 === "undefined" ? "undefined" : _typeof4(_ret5)) === "object") return _ret5.v;
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
      module2.exports = exports["default"];
    }
  });

  // ../../../node_modules/optimal-select/lib/utilities.js
  var require_utilities = __commonJS({
    "../../../node_modules/optimal-select/lib/utilities.js"(exports) {
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

  // ../../../node_modules/optimal-select/lib/match.js
  var require_match = __commonJS({
    "../../../node_modules/optimal-select/lib/match.js"(exports, module2) {
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
          var matches2 = parent.querySelectorAll(pattern);
          if (matches2.length === 1) {
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
              var className2 = attributeValue.trim().replace(/\s+/g, ".");
              pattern = "." + className2;
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
          var matches2 = parent.getElementsByTagName(pattern);
          if (matches2.length === 1) {
            path.unshift(pattern);
            return true;
          }
        }
        return false;
      }
      function findTagPattern(element, ignore) {
        var tagName2 = element.tagName.toLowerCase();
        if (checkIgnore(ignore.tag, null, tagName2)) {
          return null;
        }
        return tagName2;
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
      module2.exports = exports["default"];
    }
  });

  // ../../../node_modules/optimal-select/lib/optimize.js
  var require_optimize = __commonJS({
    "../../../node_modules/optimal-select/lib/optimize.js"(exports, module2) {
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
      function optimize2(selector2, elements) {
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
        var path = selector2.replace(/> /g, ">").split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (path.length < 2) {
          return optimizePart("", selector2, "", elements);
        }
        var shortened = [path.pop()];
        while (path.length > 1) {
          var current = path.pop();
          var prePart = path.join(" ");
          var postPart = shortened.join(" ");
          var pattern = prePart + " " + postPart;
          var matches2 = document.querySelectorAll(pattern);
          if (matches2.length !== elements.length) {
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
          var matches2 = document.querySelectorAll(pattern);
          if (compareResults(matches2, elements)) {
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
                matches2 = document.querySelectorAll(pattern);
                if (compareResults(matches2, elements)) {
                  current = description;
                }
                return "break";
              }
            };
            for (var i = 0, l = references.length; i < l; i++) {
              var pattern;
              var matches2;
              var _ret = _loop();
              if (_ret === "break") break;
            }
          }
        }
        if (/>/.test(current)) {
          var descendant = current.replace(/>/, "");
          var pattern = "" + prePart + descendant + postPart;
          var matches2 = document.querySelectorAll(pattern);
          if (compareResults(matches2, elements)) {
            current = descendant;
          }
        }
        if (/:nth-child/.test(current)) {
          var type = current.replace(/nth-child/g, "nth-of-type");
          var pattern = "" + prePart + type + postPart;
          var matches2 = document.querySelectorAll(pattern);
          if (compareResults(matches2, elements)) {
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
            var matches2 = document.querySelectorAll(pattern);
            if (compareResults(matches2, elements)) {
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
                matches2 = document.querySelectorAll(pattern);
                if (compareResults(matches2, elements)) {
                  current = description;
                }
                return "break";
              }
            };
            for (var i = 0, l = _references.length; i < l; i++) {
              var pattern;
              var matches2;
              var _ret2 = _loop2();
              if (_ret2 === "break") break;
            }
          }
        }
        return current;
      }
      function compareResults(matches2, elements) {
        var length = matches2.length;
        return length === elements.length && elements.every(function(element) {
          for (var i = 0; i < length; i++) {
            if (matches2[i] === element) {
              return true;
            }
          }
          return false;
        });
      }
      module2.exports = exports["default"];
    }
  });

  // ../../../node_modules/optimal-select/lib/common.js
  var require_common = __commonJS({
    "../../../node_modules/optimal-select/lib/common.js"(exports) {
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

  // ../../../node_modules/optimal-select/lib/select.js
  var require_select = __commonJS({
    "../../../node_modules/optimal-select/lib/select.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
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
          throw new Error('Invalid input - only HTMLElements or representations of them are supported! (not "' + (typeof element === "undefined" ? "undefined" : _typeof4(element)) + '")');
        }
        var globalModified = (0, _adapt2.default)(element, options);
        var selector2 = (0, _match2.default)(element, options);
        var optimized = (0, _optimize2.default)(selector2, element, options);
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
        var selector2 = (0, _optimize2.default)(ancestorSelector + " " + descendantSelector, elements, options);
        var selectorMatches = (0, _utilities.convertNodeList)(document.querySelectorAll(selector2));
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
        return selector2;
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

  // ../../../node_modules/optimal-select/lib/index.js
  var require_lib = __commonJS({
    "../../../node_modules/optimal-select/lib/index.js"(exports) {
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

  // ../../../node_modules/pretty-format/node_modules/ansi-styles/index.js
  var require_ansi_styles = __commonJS({
    "../../../node_modules/pretty-format/node_modules/ansi-styles/index.js"(exports, module2) {
      "use strict";
      var ANSI_BACKGROUND_OFFSET = 10;
      var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
      var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
      function assembleStyles() {
        const codes = /* @__PURE__ */ new Map();
        const styles = {
          modifier: {
            reset: [0, 0],
            // 21 isn't widely supported and 22 does the same thing
            bold: [1, 22],
            dim: [2, 22],
            italic: [3, 23],
            underline: [4, 24],
            overline: [53, 55],
            inverse: [7, 27],
            hidden: [8, 28],
            strikethrough: [9, 29]
          },
          color: {
            black: [30, 39],
            red: [31, 39],
            green: [32, 39],
            yellow: [33, 39],
            blue: [34, 39],
            magenta: [35, 39],
            cyan: [36, 39],
            white: [37, 39],
            // Bright color
            blackBright: [90, 39],
            redBright: [91, 39],
            greenBright: [92, 39],
            yellowBright: [93, 39],
            blueBright: [94, 39],
            magentaBright: [95, 39],
            cyanBright: [96, 39],
            whiteBright: [97, 39]
          },
          bgColor: {
            bgBlack: [40, 49],
            bgRed: [41, 49],
            bgGreen: [42, 49],
            bgYellow: [43, 49],
            bgBlue: [44, 49],
            bgMagenta: [45, 49],
            bgCyan: [46, 49],
            bgWhite: [47, 49],
            // Bright color
            bgBlackBright: [100, 49],
            bgRedBright: [101, 49],
            bgGreenBright: [102, 49],
            bgYellowBright: [103, 49],
            bgBlueBright: [104, 49],
            bgMagentaBright: [105, 49],
            bgCyanBright: [106, 49],
            bgWhiteBright: [107, 49]
          }
        };
        styles.color.gray = styles.color.blackBright;
        styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
        styles.color.grey = styles.color.blackBright;
        styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
        for (const [groupName, group] of Object.entries(styles)) {
          for (const [styleName, style] of Object.entries(group)) {
            styles[styleName] = {
              open: `\x1B[${style[0]}m`,
              close: `\x1B[${style[1]}m`
            };
            group[styleName] = styles[styleName];
            codes.set(style[0], style[1]);
          }
          Object.defineProperty(styles, groupName, {
            value: group,
            enumerable: false
          });
        }
        Object.defineProperty(styles, "codes", {
          value: codes,
          enumerable: false
        });
        styles.color.close = "\x1B[39m";
        styles.bgColor.close = "\x1B[49m";
        styles.color.ansi256 = wrapAnsi256();
        styles.color.ansi16m = wrapAnsi16m();
        styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
        styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
        Object.defineProperties(styles, {
          rgbToAnsi256: {
            value: (red, green, blue) => {
              if (red === green && green === blue) {
                if (red < 8) {
                  return 16;
                }
                if (red > 248) {
                  return 231;
                }
                return Math.round((red - 8) / 247 * 24) + 232;
              }
              return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
            },
            enumerable: false
          },
          hexToRgb: {
            value: (hex) => {
              const matches2 = /(?<colorString>[a-f\d]{6}|[a-f\d]{3})/i.exec(hex.toString(16));
              if (!matches2) {
                return [0, 0, 0];
              }
              let { colorString } = matches2.groups;
              if (colorString.length === 3) {
                colorString = colorString.split("").map((character) => character + character).join("");
              }
              const integer = Number.parseInt(colorString, 16);
              return [
                integer >> 16 & 255,
                integer >> 8 & 255,
                integer & 255
              ];
            },
            enumerable: false
          },
          hexToAnsi256: {
            value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
            enumerable: false
          }
        });
        return styles;
      }
      Object.defineProperty(module2, "exports", {
        enumerable: true,
        get: assembleStyles
      });
    }
  });

  // ../../../node_modules/pretty-format/build/collections.js
  var require_collections = __commonJS({
    "../../../node_modules/pretty-format/build/collections.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.printIteratorEntries = printIteratorEntries;
      exports.printIteratorValues = printIteratorValues;
      exports.printListItems = printListItems;
      exports.printObjectProperties = printObjectProperties;
      var getKeysOfEnumerableProperties = (object, compareKeys) => {
        const keys = Object.keys(object).sort(compareKeys);
        if (Object.getOwnPropertySymbols) {
          Object.getOwnPropertySymbols(object).forEach((symbol) => {
            if (Object.getOwnPropertyDescriptor(object, symbol).enumerable) {
              keys.push(symbol);
            }
          });
        }
        return keys;
      };
      function printIteratorEntries(iterator, config2, indentation, depth, refs, printer, separator = ": ") {
        let result = "";
        let current = iterator.next();
        if (!current.done) {
          result += config2.spacingOuter;
          const indentationNext = indentation + config2.indent;
          while (!current.done) {
            const name = printer(
              current.value[0],
              config2,
              indentationNext,
              depth,
              refs
            );
            const value = printer(
              current.value[1],
              config2,
              indentationNext,
              depth,
              refs
            );
            result += indentationNext + name + separator + value;
            current = iterator.next();
            if (!current.done) {
              result += "," + config2.spacingInner;
            } else if (!config2.min) {
              result += ",";
            }
          }
          result += config2.spacingOuter + indentation;
        }
        return result;
      }
      function printIteratorValues(iterator, config2, indentation, depth, refs, printer) {
        let result = "";
        let current = iterator.next();
        if (!current.done) {
          result += config2.spacingOuter;
          const indentationNext = indentation + config2.indent;
          while (!current.done) {
            result += indentationNext + printer(current.value, config2, indentationNext, depth, refs);
            current = iterator.next();
            if (!current.done) {
              result += "," + config2.spacingInner;
            } else if (!config2.min) {
              result += ",";
            }
          }
          result += config2.spacingOuter + indentation;
        }
        return result;
      }
      function printListItems(list, config2, indentation, depth, refs, printer) {
        let result = "";
        if (list.length) {
          result += config2.spacingOuter;
          const indentationNext = indentation + config2.indent;
          for (let i = 0; i < list.length; i++) {
            result += indentationNext;
            if (i in list) {
              result += printer(list[i], config2, indentationNext, depth, refs);
            }
            if (i < list.length - 1) {
              result += "," + config2.spacingInner;
            } else if (!config2.min) {
              result += ",";
            }
          }
          result += config2.spacingOuter + indentation;
        }
        return result;
      }
      function printObjectProperties(val, config2, indentation, depth, refs, printer) {
        let result = "";
        const keys = getKeysOfEnumerableProperties(val, config2.compareKeys);
        if (keys.length) {
          result += config2.spacingOuter;
          const indentationNext = indentation + config2.indent;
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const name = printer(key, config2, indentationNext, depth, refs);
            const value = printer(val[key], config2, indentationNext, depth, refs);
            result += indentationNext + name + ": " + value;
            if (i < keys.length - 1) {
              result += "," + config2.spacingInner;
            } else if (!config2.min) {
              result += ",";
            }
          }
          result += config2.spacingOuter + indentation;
        }
        return result;
      }
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/AsymmetricMatcher.js
  var require_AsymmetricMatcher = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/AsymmetricMatcher.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _collections = require_collections();
      var global2 = (function() {
        if (typeof globalThis !== "undefined") {
          return globalThis;
        } else if (typeof global2 !== "undefined") {
          return global2;
        } else if (typeof self !== "undefined") {
          return self;
        } else if (typeof window !== "undefined") {
          return window;
        } else {
          return Function("return this")();
        }
      })();
      var Symbol2 = global2["jest-symbol-do-not-touch"] || global2.Symbol;
      var asymmetricMatcher = typeof Symbol2 === "function" && Symbol2.for ? Symbol2.for("jest.asymmetricMatcher") : 1267621;
      var SPACE = " ";
      var serialize = (val, config2, indentation, depth, refs, printer) => {
        const stringedValue = val.toString();
        if (stringedValue === "ArrayContaining" || stringedValue === "ArrayNotContaining") {
          if (++depth > config2.maxDepth) {
            return "[" + stringedValue + "]";
          }
          return stringedValue + SPACE + "[" + (0, _collections.printListItems)(
            val.sample,
            config2,
            indentation,
            depth,
            refs,
            printer
          ) + "]";
        }
        if (stringedValue === "ObjectContaining" || stringedValue === "ObjectNotContaining") {
          if (++depth > config2.maxDepth) {
            return "[" + stringedValue + "]";
          }
          return stringedValue + SPACE + "{" + (0, _collections.printObjectProperties)(
            val.sample,
            config2,
            indentation,
            depth,
            refs,
            printer
          ) + "}";
        }
        if (stringedValue === "StringMatching" || stringedValue === "StringNotMatching") {
          return stringedValue + SPACE + printer(val.sample, config2, indentation, depth, refs);
        }
        if (stringedValue === "StringContaining" || stringedValue === "StringNotContaining") {
          return stringedValue + SPACE + printer(val.sample, config2, indentation, depth, refs);
        }
        return val.toAsymmetricMatcher();
      };
      exports.serialize = serialize;
      var test = (val) => val && val.$$typeof === asymmetricMatcher;
      exports.test = test;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/ansi-regex/index.js
  var require_ansi_regex = __commonJS({
    "../../../node_modules/ansi-regex/index.js"(exports, module2) {
      "use strict";
      module2.exports = ({ onlyFirst = false } = {}) => {
        const pattern = [
          "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
          "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
        ].join("|");
        return new RegExp(pattern, onlyFirst ? void 0 : "g");
      };
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/ConvertAnsi.js
  var require_ConvertAnsi = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/ConvertAnsi.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _ansiRegex = _interopRequireDefault(require_ansi_regex());
      var _ansiStyles = _interopRequireDefault(require_ansi_styles());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var toHumanReadableAnsi = (text) => text.replace((0, _ansiRegex.default)(), (match) => {
        switch (match) {
          case _ansiStyles.default.red.close:
          case _ansiStyles.default.green.close:
          case _ansiStyles.default.cyan.close:
          case _ansiStyles.default.gray.close:
          case _ansiStyles.default.white.close:
          case _ansiStyles.default.yellow.close:
          case _ansiStyles.default.bgRed.close:
          case _ansiStyles.default.bgGreen.close:
          case _ansiStyles.default.bgYellow.close:
          case _ansiStyles.default.inverse.close:
          case _ansiStyles.default.dim.close:
          case _ansiStyles.default.bold.close:
          case _ansiStyles.default.reset.open:
          case _ansiStyles.default.reset.close:
            return "</>";
          case _ansiStyles.default.red.open:
            return "<red>";
          case _ansiStyles.default.green.open:
            return "<green>";
          case _ansiStyles.default.cyan.open:
            return "<cyan>";
          case _ansiStyles.default.gray.open:
            return "<gray>";
          case _ansiStyles.default.white.open:
            return "<white>";
          case _ansiStyles.default.yellow.open:
            return "<yellow>";
          case _ansiStyles.default.bgRed.open:
            return "<bgRed>";
          case _ansiStyles.default.bgGreen.open:
            return "<bgGreen>";
          case _ansiStyles.default.bgYellow.open:
            return "<bgYellow>";
          case _ansiStyles.default.inverse.open:
            return "<inverse>";
          case _ansiStyles.default.dim.open:
            return "<dim>";
          case _ansiStyles.default.bold.open:
            return "<bold>";
          default:
            return "";
        }
      });
      var test = (val) => typeof val === "string" && !!val.match((0, _ansiRegex.default)());
      exports.test = test;
      var serialize = (val, config2, indentation, depth, refs, printer) => printer(toHumanReadableAnsi(val), config2, indentation, depth, refs);
      exports.serialize = serialize;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/DOMCollection.js
  var require_DOMCollection = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/DOMCollection.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _collections = require_collections();
      var SPACE = " ";
      var OBJECT_NAMES = ["DOMStringMap", "NamedNodeMap"];
      var ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/;
      var testName = (name) => OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name);
      var test = (val) => val && val.constructor && !!val.constructor.name && testName(val.constructor.name);
      exports.test = test;
      var isNamedNodeMap = (collection) => collection.constructor.name === "NamedNodeMap";
      var serialize = (collection, config2, indentation, depth, refs, printer) => {
        const name = collection.constructor.name;
        if (++depth > config2.maxDepth) {
          return "[" + name + "]";
        }
        return (config2.min ? "" : name + SPACE) + (OBJECT_NAMES.indexOf(name) !== -1 ? "{" + (0, _collections.printObjectProperties)(
          isNamedNodeMap(collection) ? Array.from(collection).reduce((props, attribute) => {
            props[attribute.name] = attribute.value;
            return props;
          }, {}) : { ...collection },
          config2,
          indentation,
          depth,
          refs,
          printer
        ) + "}" : "[" + (0, _collections.printListItems)(
          Array.from(collection),
          config2,
          indentation,
          depth,
          refs,
          printer
        ) + "]");
      };
      exports.serialize = serialize;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/lib/escapeHTML.js
  var require_escapeHTML = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/lib/escapeHTML.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = escapeHTML2;
      function escapeHTML2(str) {
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/lib/markup.js
  var require_markup = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/lib/markup.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.printText = exports.printProps = exports.printElementAsLeaf = exports.printElement = exports.printComment = exports.printChildren = void 0;
      var _escapeHTML = _interopRequireDefault(require_escapeHTML());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var printProps2 = (keys, props, config2, indentation, depth, refs, printer) => {
        const indentationNext = indentation + config2.indent;
        const colors = config2.colors;
        return keys.map((key) => {
          const value = props[key];
          let printed = printer(value, config2, indentationNext, depth, refs);
          if (typeof value !== "string") {
            if (printed.indexOf("\n") !== -1) {
              printed = config2.spacingOuter + indentationNext + printed + config2.spacingOuter + indentation;
            }
            printed = "{" + printed + "}";
          }
          return config2.spacingInner + indentation + colors.prop.open + key + colors.prop.close + "=" + colors.value.open + printed + colors.value.close;
        }).join("");
      };
      exports.printProps = printProps2;
      var printChildren2 = (children, config2, indentation, depth, refs, printer) => children.map(
        (child) => config2.spacingOuter + indentation + (typeof child === "string" ? printText2(child, config2) : printer(child, config2, indentation, depth, refs))
      ).join("");
      exports.printChildren = printChildren2;
      var printText2 = (text, config2) => {
        const contentColor = config2.colors.content;
        return contentColor.open + (0, _escapeHTML.default)(text) + contentColor.close;
      };
      exports.printText = printText2;
      var printComment2 = (comment, config2) => {
        const commentColor = config2.colors.comment;
        return commentColor.open + "<!--" + (0, _escapeHTML.default)(comment) + "-->" + commentColor.close;
      };
      exports.printComment = printComment2;
      var printElement2 = (type, printedProps, printedChildren, config2, indentation) => {
        const tagColor = config2.colors.tag;
        return tagColor.open + "<" + type + (printedProps && tagColor.close + printedProps + config2.spacingOuter + indentation + tagColor.open) + (printedChildren ? ">" + tagColor.close + printedChildren + config2.spacingOuter + indentation + tagColor.open + "</" + type : (printedProps && !config2.min ? "" : " ") + "/") + ">" + tagColor.close;
      };
      exports.printElement = printElement2;
      var printElementAsLeaf2 = (type, config2) => {
        const tagColor = config2.colors.tag;
        return tagColor.open + "<" + type + tagColor.close + " \u2026" + tagColor.open + " />" + tagColor.close;
      };
      exports.printElementAsLeaf = printElementAsLeaf2;
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/DOMElement.js
  var require_DOMElement = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/DOMElement.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _markup = require_markup();
      var ELEMENT_NODE2 = 1;
      var TEXT_NODE2 = 3;
      var COMMENT_NODE2 = 8;
      var FRAGMENT_NODE2 = 11;
      var ELEMENT_REGEXP2 = /^((HTML|SVG)\w*)?Element$/;
      var testHasAttribute = (val) => {
        try {
          return typeof val.hasAttribute === "function" && val.hasAttribute("is");
        } catch {
          return false;
        }
      };
      var testNode2 = (val) => {
        const constructorName = val.constructor.name;
        const { nodeType, tagName: tagName2 } = val;
        const isCustomElement2 = typeof tagName2 === "string" && tagName2.includes("-") || testHasAttribute(val);
        return nodeType === ELEMENT_NODE2 && (ELEMENT_REGEXP2.test(constructorName) || isCustomElement2) || nodeType === TEXT_NODE2 && constructorName === "Text" || nodeType === COMMENT_NODE2 && constructorName === "Comment" || nodeType === FRAGMENT_NODE2 && constructorName === "DocumentFragment";
      };
      var test = (val) => {
        var _val$constructor;
        return (val === null || val === void 0 ? void 0 : (_val$constructor = val.constructor) === null || _val$constructor === void 0 ? void 0 : _val$constructor.name) && testNode2(val);
      };
      exports.test = test;
      function nodeIsText2(node) {
        return node.nodeType === TEXT_NODE2;
      }
      function nodeIsComment2(node) {
        return node.nodeType === COMMENT_NODE2;
      }
      function nodeIsFragment2(node) {
        return node.nodeType === FRAGMENT_NODE2;
      }
      var serialize = (node, config2, indentation, depth, refs, printer) => {
        if (nodeIsText2(node)) {
          return (0, _markup.printText)(node.data, config2);
        }
        if (nodeIsComment2(node)) {
          return (0, _markup.printComment)(node.data, config2);
        }
        const type = nodeIsFragment2(node) ? "DocumentFragment" : node.tagName.toLowerCase();
        if (++depth > config2.maxDepth) {
          return (0, _markup.printElementAsLeaf)(type, config2);
        }
        return (0, _markup.printElement)(
          type,
          (0, _markup.printProps)(
            nodeIsFragment2(node) ? [] : Array.from(node.attributes).map((attr2) => attr2.name).sort(),
            nodeIsFragment2(node) ? {} : Array.from(node.attributes).reduce((props, attribute) => {
              props[attribute.name] = attribute.value;
              return props;
            }, {}),
            config2,
            indentation + config2.indent,
            depth,
            refs,
            printer
          ),
          (0, _markup.printChildren)(
            Array.prototype.slice.call(node.childNodes || node.children),
            config2,
            indentation + config2.indent,
            depth,
            refs,
            printer
          ),
          config2,
          indentation
        );
      };
      exports.serialize = serialize;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/Immutable.js
  var require_Immutable = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/Immutable.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _collections = require_collections();
      var IS_ITERABLE_SENTINEL = "@@__IMMUTABLE_ITERABLE__@@";
      var IS_LIST_SENTINEL = "@@__IMMUTABLE_LIST__@@";
      var IS_KEYED_SENTINEL = "@@__IMMUTABLE_KEYED__@@";
      var IS_MAP_SENTINEL = "@@__IMMUTABLE_MAP__@@";
      var IS_ORDERED_SENTINEL = "@@__IMMUTABLE_ORDERED__@@";
      var IS_RECORD_SENTINEL = "@@__IMMUTABLE_RECORD__@@";
      var IS_SEQ_SENTINEL = "@@__IMMUTABLE_SEQ__@@";
      var IS_SET_SENTINEL = "@@__IMMUTABLE_SET__@@";
      var IS_STACK_SENTINEL = "@@__IMMUTABLE_STACK__@@";
      var getImmutableName = (name) => "Immutable." + name;
      var printAsLeaf = (name) => "[" + name + "]";
      var SPACE = " ";
      var LAZY = "\u2026";
      var printImmutableEntries = (val, config2, indentation, depth, refs, printer, type) => ++depth > config2.maxDepth ? printAsLeaf(getImmutableName(type)) : getImmutableName(type) + SPACE + "{" + (0, _collections.printIteratorEntries)(
        val.entries(),
        config2,
        indentation,
        depth,
        refs,
        printer
      ) + "}";
      function getRecordEntries(val) {
        let i = 0;
        return {
          next() {
            if (i < val._keys.length) {
              const key = val._keys[i++];
              return {
                done: false,
                value: [key, val.get(key)]
              };
            }
            return {
              done: true,
              value: void 0
            };
          }
        };
      }
      var printImmutableRecord = (val, config2, indentation, depth, refs, printer) => {
        const name = getImmutableName(val._name || "Record");
        return ++depth > config2.maxDepth ? printAsLeaf(name) : name + SPACE + "{" + (0, _collections.printIteratorEntries)(
          getRecordEntries(val),
          config2,
          indentation,
          depth,
          refs,
          printer
        ) + "}";
      };
      var printImmutableSeq = (val, config2, indentation, depth, refs, printer) => {
        const name = getImmutableName("Seq");
        if (++depth > config2.maxDepth) {
          return printAsLeaf(name);
        }
        if (val[IS_KEYED_SENTINEL]) {
          return name + SPACE + "{" + // from Immutable collection of entries or from ECMAScript object
          (val._iter || val._object ? (0, _collections.printIteratorEntries)(
            val.entries(),
            config2,
            indentation,
            depth,
            refs,
            printer
          ) : LAZY) + "}";
        }
        return name + SPACE + "[" + (val._iter || // from Immutable collection of values
        val._array || // from ECMAScript array
        val._collection || // from ECMAScript collection in immutable v4
        val._iterable ? (0, _collections.printIteratorValues)(
          val.values(),
          config2,
          indentation,
          depth,
          refs,
          printer
        ) : LAZY) + "]";
      };
      var printImmutableValues = (val, config2, indentation, depth, refs, printer, type) => ++depth > config2.maxDepth ? printAsLeaf(getImmutableName(type)) : getImmutableName(type) + SPACE + "[" + (0, _collections.printIteratorValues)(
        val.values(),
        config2,
        indentation,
        depth,
        refs,
        printer
      ) + "]";
      var serialize = (val, config2, indentation, depth, refs, printer) => {
        if (val[IS_MAP_SENTINEL]) {
          return printImmutableEntries(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer,
            val[IS_ORDERED_SENTINEL] ? "OrderedMap" : "Map"
          );
        }
        if (val[IS_LIST_SENTINEL]) {
          return printImmutableValues(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer,
            "List"
          );
        }
        if (val[IS_SET_SENTINEL]) {
          return printImmutableValues(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer,
            val[IS_ORDERED_SENTINEL] ? "OrderedSet" : "Set"
          );
        }
        if (val[IS_STACK_SENTINEL]) {
          return printImmutableValues(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer,
            "Stack"
          );
        }
        if (val[IS_SEQ_SENTINEL]) {
          return printImmutableSeq(val, config2, indentation, depth, refs, printer);
        }
        return printImmutableRecord(val, config2, indentation, depth, refs, printer);
      };
      exports.serialize = serialize;
      var test = (val) => val && (val[IS_ITERABLE_SENTINEL] === true || val[IS_RECORD_SENTINEL] === true);
      exports.test = test;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/react-is/cjs/react-is.development.js
  var require_react_is_development = __commonJS({
    "../../../node_modules/react-is/cjs/react-is.development.js"(exports) {
      "use strict";
      if (true) {
        (function() {
          "use strict";
          var REACT_ELEMENT_TYPE = 60103;
          var REACT_PORTAL_TYPE = 60106;
          var REACT_FRAGMENT_TYPE = 60107;
          var REACT_STRICT_MODE_TYPE = 60108;
          var REACT_PROFILER_TYPE = 60114;
          var REACT_PROVIDER_TYPE = 60109;
          var REACT_CONTEXT_TYPE = 60110;
          var REACT_FORWARD_REF_TYPE = 60112;
          var REACT_SUSPENSE_TYPE = 60113;
          var REACT_SUSPENSE_LIST_TYPE = 60120;
          var REACT_MEMO_TYPE = 60115;
          var REACT_LAZY_TYPE = 60116;
          var REACT_BLOCK_TYPE = 60121;
          var REACT_SERVER_BLOCK_TYPE = 60122;
          var REACT_FUNDAMENTAL_TYPE = 60117;
          var REACT_SCOPE_TYPE = 60119;
          var REACT_OPAQUE_ID_TYPE = 60128;
          var REACT_DEBUG_TRACING_MODE_TYPE = 60129;
          var REACT_OFFSCREEN_TYPE = 60130;
          var REACT_LEGACY_HIDDEN_TYPE = 60131;
          if (typeof Symbol === "function" && Symbol.for) {
            var symbolFor = Symbol.for;
            REACT_ELEMENT_TYPE = symbolFor("react.element");
            REACT_PORTAL_TYPE = symbolFor("react.portal");
            REACT_FRAGMENT_TYPE = symbolFor("react.fragment");
            REACT_STRICT_MODE_TYPE = symbolFor("react.strict_mode");
            REACT_PROFILER_TYPE = symbolFor("react.profiler");
            REACT_PROVIDER_TYPE = symbolFor("react.provider");
            REACT_CONTEXT_TYPE = symbolFor("react.context");
            REACT_FORWARD_REF_TYPE = symbolFor("react.forward_ref");
            REACT_SUSPENSE_TYPE = symbolFor("react.suspense");
            REACT_SUSPENSE_LIST_TYPE = symbolFor("react.suspense_list");
            REACT_MEMO_TYPE = symbolFor("react.memo");
            REACT_LAZY_TYPE = symbolFor("react.lazy");
            REACT_BLOCK_TYPE = symbolFor("react.block");
            REACT_SERVER_BLOCK_TYPE = symbolFor("react.server.block");
            REACT_FUNDAMENTAL_TYPE = symbolFor("react.fundamental");
            REACT_SCOPE_TYPE = symbolFor("react.scope");
            REACT_OPAQUE_ID_TYPE = symbolFor("react.opaque.id");
            REACT_DEBUG_TRACING_MODE_TYPE = symbolFor("react.debug_trace_mode");
            REACT_OFFSCREEN_TYPE = symbolFor("react.offscreen");
            REACT_LEGACY_HIDDEN_TYPE = symbolFor("react.legacy_hidden");
          }
          var enableScopeAPI = false;
          function isValidElementType(type) {
            if (typeof type === "string" || typeof type === "function") {
              return true;
            }
            if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || type === REACT_DEBUG_TRACING_MODE_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || type === REACT_LEGACY_HIDDEN_TYPE || enableScopeAPI) {
              return true;
            }
            if (typeof type === "object" && type !== null) {
              if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_BLOCK_TYPE || type[0] === REACT_SERVER_BLOCK_TYPE) {
                return true;
              }
            }
            return false;
          }
          function typeOf(object) {
            if (typeof object === "object" && object !== null) {
              var $$typeof = object.$$typeof;
              switch ($$typeof) {
                case REACT_ELEMENT_TYPE:
                  var type = object.type;
                  switch (type) {
                    case REACT_FRAGMENT_TYPE:
                    case REACT_PROFILER_TYPE:
                    case REACT_STRICT_MODE_TYPE:
                    case REACT_SUSPENSE_TYPE:
                    case REACT_SUSPENSE_LIST_TYPE:
                      return type;
                    default:
                      var $$typeofType = type && type.$$typeof;
                      switch ($$typeofType) {
                        case REACT_CONTEXT_TYPE:
                        case REACT_FORWARD_REF_TYPE:
                        case REACT_LAZY_TYPE:
                        case REACT_MEMO_TYPE:
                        case REACT_PROVIDER_TYPE:
                          return $$typeofType;
                        default:
                          return $$typeof;
                      }
                  }
                case REACT_PORTAL_TYPE:
                  return $$typeof;
              }
            }
            return void 0;
          }
          var ContextConsumer = REACT_CONTEXT_TYPE;
          var ContextProvider = REACT_PROVIDER_TYPE;
          var Element2 = REACT_ELEMENT_TYPE;
          var ForwardRef = REACT_FORWARD_REF_TYPE;
          var Fragment = REACT_FRAGMENT_TYPE;
          var Lazy = REACT_LAZY_TYPE;
          var Memo = REACT_MEMO_TYPE;
          var Portal = REACT_PORTAL_TYPE;
          var Profiler = REACT_PROFILER_TYPE;
          var StrictMode = REACT_STRICT_MODE_TYPE;
          var Suspense = REACT_SUSPENSE_TYPE;
          var hasWarnedAboutDeprecatedIsAsyncMode = false;
          var hasWarnedAboutDeprecatedIsConcurrentMode = false;
          function isAsyncMode(object) {
            {
              if (!hasWarnedAboutDeprecatedIsAsyncMode) {
                hasWarnedAboutDeprecatedIsAsyncMode = true;
                console["warn"]("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 18+.");
              }
            }
            return false;
          }
          function isConcurrentMode(object) {
            {
              if (!hasWarnedAboutDeprecatedIsConcurrentMode) {
                hasWarnedAboutDeprecatedIsConcurrentMode = true;
                console["warn"]("The ReactIs.isConcurrentMode() alias has been deprecated, and will be removed in React 18+.");
              }
            }
            return false;
          }
          function isContextConsumer(object) {
            return typeOf(object) === REACT_CONTEXT_TYPE;
          }
          function isContextProvider(object) {
            return typeOf(object) === REACT_PROVIDER_TYPE;
          }
          function isElement4(object) {
            return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
          }
          function isForwardRef(object) {
            return typeOf(object) === REACT_FORWARD_REF_TYPE;
          }
          function isFragment(object) {
            return typeOf(object) === REACT_FRAGMENT_TYPE;
          }
          function isLazy(object) {
            return typeOf(object) === REACT_LAZY_TYPE;
          }
          function isMemo(object) {
            return typeOf(object) === REACT_MEMO_TYPE;
          }
          function isPortal(object) {
            return typeOf(object) === REACT_PORTAL_TYPE;
          }
          function isProfiler(object) {
            return typeOf(object) === REACT_PROFILER_TYPE;
          }
          function isStrictMode(object) {
            return typeOf(object) === REACT_STRICT_MODE_TYPE;
          }
          function isSuspense(object) {
            return typeOf(object) === REACT_SUSPENSE_TYPE;
          }
          exports.ContextConsumer = ContextConsumer;
          exports.ContextProvider = ContextProvider;
          exports.Element = Element2;
          exports.ForwardRef = ForwardRef;
          exports.Fragment = Fragment;
          exports.Lazy = Lazy;
          exports.Memo = Memo;
          exports.Portal = Portal;
          exports.Profiler = Profiler;
          exports.StrictMode = StrictMode;
          exports.Suspense = Suspense;
          exports.isAsyncMode = isAsyncMode;
          exports.isConcurrentMode = isConcurrentMode;
          exports.isContextConsumer = isContextConsumer;
          exports.isContextProvider = isContextProvider;
          exports.isElement = isElement4;
          exports.isForwardRef = isForwardRef;
          exports.isFragment = isFragment;
          exports.isLazy = isLazy;
          exports.isMemo = isMemo;
          exports.isPortal = isPortal;
          exports.isProfiler = isProfiler;
          exports.isStrictMode = isStrictMode;
          exports.isSuspense = isSuspense;
          exports.isValidElementType = isValidElementType;
          exports.typeOf = typeOf;
        })();
      }
    }
  });

  // ../../../node_modules/react-is/index.js
  var require_react_is = __commonJS({
    "../../../node_modules/react-is/index.js"(exports, module2) {
      "use strict";
      if (false) {
        module2.exports = null;
      } else {
        module2.exports = require_react_is_development();
      }
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/ReactElement.js
  var require_ReactElement = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/ReactElement.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var ReactIs = _interopRequireWildcard(require_react_is());
      var _markup = require_markup();
      function _getRequireWildcardCache(nodeInterop) {
        if (typeof WeakMap !== "function") return null;
        var cacheBabelInterop = /* @__PURE__ */ new WeakMap();
        var cacheNodeInterop = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function(nodeInterop2) {
          return nodeInterop2 ? cacheNodeInterop : cacheBabelInterop;
        })(nodeInterop);
      }
      function _interopRequireWildcard(obj, nodeInterop) {
        if (!nodeInterop && obj && obj.__esModule) {
          return obj;
        }
        if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
          return { default: obj };
        }
        var cache = _getRequireWildcardCache(nodeInterop);
        if (cache && cache.has(obj)) {
          return cache.get(obj);
        }
        var newObj = {};
        var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var key in obj) {
          if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
              Object.defineProperty(newObj, key, desc);
            } else {
              newObj[key] = obj[key];
            }
          }
        }
        newObj.default = obj;
        if (cache) {
          cache.set(obj, newObj);
        }
        return newObj;
      }
      var getChildren = (arg, children = []) => {
        if (Array.isArray(arg)) {
          arg.forEach((item) => {
            getChildren(item, children);
          });
        } else if (arg != null && arg !== false) {
          children.push(arg);
        }
        return children;
      };
      var getType = (element) => {
        const type = element.type;
        if (typeof type === "string") {
          return type;
        }
        if (typeof type === "function") {
          return type.displayName || type.name || "Unknown";
        }
        if (ReactIs.isFragment(element)) {
          return "React.Fragment";
        }
        if (ReactIs.isSuspense(element)) {
          return "React.Suspense";
        }
        if (typeof type === "object" && type !== null) {
          if (ReactIs.isContextProvider(element)) {
            return "Context.Provider";
          }
          if (ReactIs.isContextConsumer(element)) {
            return "Context.Consumer";
          }
          if (ReactIs.isForwardRef(element)) {
            if (type.displayName) {
              return type.displayName;
            }
            const functionName = type.render.displayName || type.render.name || "";
            return functionName !== "" ? "ForwardRef(" + functionName + ")" : "ForwardRef";
          }
          if (ReactIs.isMemo(element)) {
            const functionName = type.displayName || type.type.displayName || type.type.name || "";
            return functionName !== "" ? "Memo(" + functionName + ")" : "Memo";
          }
        }
        return "UNDEFINED";
      };
      var getPropKeys = (element) => {
        const { props } = element;
        return Object.keys(props).filter((key) => key !== "children" && props[key] !== void 0).sort();
      };
      var serialize = (element, config2, indentation, depth, refs, printer) => ++depth > config2.maxDepth ? (0, _markup.printElementAsLeaf)(getType(element), config2) : (0, _markup.printElement)(
        getType(element),
        (0, _markup.printProps)(
          getPropKeys(element),
          element.props,
          config2,
          indentation + config2.indent,
          depth,
          refs,
          printer
        ),
        (0, _markup.printChildren)(
          getChildren(element.props.children),
          config2,
          indentation + config2.indent,
          depth,
          refs,
          printer
        ),
        config2,
        indentation
      );
      exports.serialize = serialize;
      var test = (val) => val != null && ReactIs.isElement(val);
      exports.test = test;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/pretty-format/build/plugins/ReactTestComponent.js
  var require_ReactTestComponent = __commonJS({
    "../../../node_modules/pretty-format/build/plugins/ReactTestComponent.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.test = exports.serialize = exports.default = void 0;
      var _markup = require_markup();
      var global2 = (function() {
        if (typeof globalThis !== "undefined") {
          return globalThis;
        } else if (typeof global2 !== "undefined") {
          return global2;
        } else if (typeof self !== "undefined") {
          return self;
        } else if (typeof window !== "undefined") {
          return window;
        } else {
          return Function("return this")();
        }
      })();
      var Symbol2 = global2["jest-symbol-do-not-touch"] || global2.Symbol;
      var testSymbol = typeof Symbol2 === "function" && Symbol2.for ? Symbol2.for("react.test.json") : 245830487;
      var getPropKeys = (object) => {
        const { props } = object;
        return props ? Object.keys(props).filter((key) => props[key] !== void 0).sort() : [];
      };
      var serialize = (object, config2, indentation, depth, refs, printer) => ++depth > config2.maxDepth ? (0, _markup.printElementAsLeaf)(object.type, config2) : (0, _markup.printElement)(
        object.type,
        object.props ? (0, _markup.printProps)(
          getPropKeys(object),
          object.props,
          config2,
          indentation + config2.indent,
          depth,
          refs,
          printer
        ) : "",
        object.children ? (0, _markup.printChildren)(
          object.children,
          config2,
          indentation + config2.indent,
          depth,
          refs,
          printer
        ) : "",
        config2,
        indentation
      );
      exports.serialize = serialize;
      var test = (val) => val && val.$$typeof === testSymbol;
      exports.test = test;
      var plugin = {
        serialize,
        test
      };
      var _default = plugin;
      exports.default = _default;
    }
  });

  // ../../../node_modules/pretty-format/build/index.js
  var require_build = __commonJS({
    "../../../node_modules/pretty-format/build/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = exports.DEFAULT_OPTIONS = void 0;
      exports.format = format2;
      exports.plugins = void 0;
      var _ansiStyles = _interopRequireDefault(require_ansi_styles());
      var _collections = require_collections();
      var _AsymmetricMatcher = _interopRequireDefault(
        require_AsymmetricMatcher()
      );
      var _ConvertAnsi = _interopRequireDefault(require_ConvertAnsi());
      var _DOMCollection = _interopRequireDefault(require_DOMCollection());
      var _DOMElement = _interopRequireDefault(require_DOMElement());
      var _Immutable = _interopRequireDefault(require_Immutable());
      var _ReactElement = _interopRequireDefault(require_ReactElement());
      var _ReactTestComponent = _interopRequireDefault(
        require_ReactTestComponent()
      );
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var toString = Object.prototype.toString;
      var toISOString = Date.prototype.toISOString;
      var errorToString = Error.prototype.toString;
      var regExpToString = RegExp.prototype.toString;
      var getConstructorName = (val) => typeof val.constructor === "function" && val.constructor.name || "Object";
      var isWindow = (val) => typeof window !== "undefined" && val === window;
      var SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
      var NEWLINE_REGEXP = /\n/gi;
      var PrettyFormatPluginError = class extends Error {
        constructor(message, stack) {
          super(message);
          this.stack = stack;
          this.name = this.constructor.name;
        }
      };
      function isToStringedArrayType(toStringed) {
        return toStringed === "[object Array]" || toStringed === "[object ArrayBuffer]" || toStringed === "[object DataView]" || toStringed === "[object Float32Array]" || toStringed === "[object Float64Array]" || toStringed === "[object Int8Array]" || toStringed === "[object Int16Array]" || toStringed === "[object Int32Array]" || toStringed === "[object Uint8Array]" || toStringed === "[object Uint8ClampedArray]" || toStringed === "[object Uint16Array]" || toStringed === "[object Uint32Array]";
      }
      function printNumber(val) {
        return Object.is(val, -0) ? "-0" : String(val);
      }
      function printBigInt(val) {
        return String(`${val}n`);
      }
      function printFunction(val, printFunctionName) {
        if (!printFunctionName) {
          return "[Function]";
        }
        return "[Function " + (val.name || "anonymous") + "]";
      }
      function printSymbol(val) {
        return String(val).replace(SYMBOL_REGEXP, "Symbol($1)");
      }
      function printError(val) {
        return "[" + errorToString.call(val) + "]";
      }
      function printBasicValue(val, printFunctionName, escapeRegex, escapeString) {
        if (val === true || val === false) {
          return "" + val;
        }
        if (val === void 0) {
          return "undefined";
        }
        if (val === null) {
          return "null";
        }
        const typeOf = typeof val;
        if (typeOf === "number") {
          return printNumber(val);
        }
        if (typeOf === "bigint") {
          return printBigInt(val);
        }
        if (typeOf === "string") {
          if (escapeString) {
            return '"' + val.replace(/"|\\/g, "\\$&") + '"';
          }
          return '"' + val + '"';
        }
        if (typeOf === "function") {
          return printFunction(val, printFunctionName);
        }
        if (typeOf === "symbol") {
          return printSymbol(val);
        }
        const toStringed = toString.call(val);
        if (toStringed === "[object WeakMap]") {
          return "WeakMap {}";
        }
        if (toStringed === "[object WeakSet]") {
          return "WeakSet {}";
        }
        if (toStringed === "[object Function]" || toStringed === "[object GeneratorFunction]") {
          return printFunction(val, printFunctionName);
        }
        if (toStringed === "[object Symbol]") {
          return printSymbol(val);
        }
        if (toStringed === "[object Date]") {
          return isNaN(+val) ? "Date { NaN }" : toISOString.call(val);
        }
        if (toStringed === "[object Error]") {
          return printError(val);
        }
        if (toStringed === "[object RegExp]") {
          if (escapeRegex) {
            return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
          }
          return regExpToString.call(val);
        }
        if (val instanceof Error) {
          return printError(val);
        }
        return null;
      }
      function printComplexValue(val, config2, indentation, depth, refs, hasCalledToJSON) {
        if (refs.indexOf(val) !== -1) {
          return "[Circular]";
        }
        refs = refs.slice();
        refs.push(val);
        const hitMaxDepth = ++depth > config2.maxDepth;
        const min = config2.min;
        if (config2.callToJSON && !hitMaxDepth && val.toJSON && typeof val.toJSON === "function" && !hasCalledToJSON) {
          return printer(val.toJSON(), config2, indentation, depth, refs, true);
        }
        const toStringed = toString.call(val);
        if (toStringed === "[object Arguments]") {
          return hitMaxDepth ? "[Arguments]" : (min ? "" : "Arguments ") + "[" + (0, _collections.printListItems)(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer
          ) + "]";
        }
        if (isToStringedArrayType(toStringed)) {
          return hitMaxDepth ? "[" + val.constructor.name + "]" : (min ? "" : !config2.printBasicPrototype && val.constructor.name === "Array" ? "" : val.constructor.name + " ") + "[" + (0, _collections.printListItems)(
            val,
            config2,
            indentation,
            depth,
            refs,
            printer
          ) + "]";
        }
        if (toStringed === "[object Map]") {
          return hitMaxDepth ? "[Map]" : "Map {" + (0, _collections.printIteratorEntries)(
            val.entries(),
            config2,
            indentation,
            depth,
            refs,
            printer,
            " => "
          ) + "}";
        }
        if (toStringed === "[object Set]") {
          return hitMaxDepth ? "[Set]" : "Set {" + (0, _collections.printIteratorValues)(
            val.values(),
            config2,
            indentation,
            depth,
            refs,
            printer
          ) + "}";
        }
        return hitMaxDepth || isWindow(val) ? "[" + getConstructorName(val) + "]" : (min ? "" : !config2.printBasicPrototype && getConstructorName(val) === "Object" ? "" : getConstructorName(val) + " ") + "{" + (0, _collections.printObjectProperties)(
          val,
          config2,
          indentation,
          depth,
          refs,
          printer
        ) + "}";
      }
      function isNewPlugin(plugin) {
        return plugin.serialize != null;
      }
      function printPlugin(plugin, val, config2, indentation, depth, refs) {
        let printed;
        try {
          printed = isNewPlugin(plugin) ? plugin.serialize(val, config2, indentation, depth, refs, printer) : plugin.print(
            val,
            (valChild) => printer(valChild, config2, indentation, depth, refs),
            (str) => {
              const indentationNext = indentation + config2.indent;
              return indentationNext + str.replace(NEWLINE_REGEXP, "\n" + indentationNext);
            },
            {
              edgeSpacing: config2.spacingOuter,
              min: config2.min,
              spacing: config2.spacingInner
            },
            config2.colors
          );
        } catch (error) {
          throw new PrettyFormatPluginError(error.message, error.stack);
        }
        if (typeof printed !== "string") {
          throw new Error(
            `pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`
          );
        }
        return printed;
      }
      function findPlugin(plugins3, val) {
        for (let p = 0; p < plugins3.length; p++) {
          try {
            if (plugins3[p].test(val)) {
              return plugins3[p];
            }
          } catch (error) {
            throw new PrettyFormatPluginError(error.message, error.stack);
          }
        }
        return null;
      }
      function printer(val, config2, indentation, depth, refs, hasCalledToJSON) {
        const plugin = findPlugin(config2.plugins, val);
        if (plugin !== null) {
          return printPlugin(plugin, val, config2, indentation, depth, refs);
        }
        const basicResult = printBasicValue(
          val,
          config2.printFunctionName,
          config2.escapeRegex,
          config2.escapeString
        );
        if (basicResult !== null) {
          return basicResult;
        }
        return printComplexValue(
          val,
          config2,
          indentation,
          depth,
          refs,
          hasCalledToJSON
        );
      }
      var DEFAULT_THEME = {
        comment: "gray",
        content: "reset",
        prop: "yellow",
        tag: "cyan",
        value: "green"
      };
      var DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);
      var DEFAULT_OPTIONS2 = {
        callToJSON: true,
        compareKeys: void 0,
        escapeRegex: false,
        escapeString: true,
        highlight: false,
        indent: 2,
        maxDepth: Infinity,
        min: false,
        plugins: [],
        printBasicPrototype: true,
        printFunctionName: true,
        theme: DEFAULT_THEME
      };
      exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS2;
      function validateOptions(options) {
        Object.keys(options).forEach((key) => {
          if (!DEFAULT_OPTIONS2.hasOwnProperty(key)) {
            throw new Error(`pretty-format: Unknown option "${key}".`);
          }
        });
        if (options.min && options.indent !== void 0 && options.indent !== 0) {
          throw new Error(
            'pretty-format: Options "min" and "indent" cannot be used together.'
          );
        }
        if (options.theme !== void 0) {
          if (options.theme === null) {
            throw new Error('pretty-format: Option "theme" must not be null.');
          }
          if (typeof options.theme !== "object") {
            throw new Error(
              `pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`
            );
          }
        }
      }
      var getColorsHighlight = (options) => DEFAULT_THEME_KEYS.reduce((colors, key) => {
        const value = options.theme && options.theme[key] !== void 0 ? options.theme[key] : DEFAULT_THEME[key];
        const color = value && _ansiStyles.default[value];
        if (color && typeof color.close === "string" && typeof color.open === "string") {
          colors[key] = color;
        } else {
          throw new Error(
            `pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`
          );
        }
        return colors;
      }, /* @__PURE__ */ Object.create(null));
      var getColorsEmpty = () => DEFAULT_THEME_KEYS.reduce((colors, key) => {
        colors[key] = {
          close: "",
          open: ""
        };
        return colors;
      }, /* @__PURE__ */ Object.create(null));
      var getPrintFunctionName = (options) => options && options.printFunctionName !== void 0 ? options.printFunctionName : DEFAULT_OPTIONS2.printFunctionName;
      var getEscapeRegex = (options) => options && options.escapeRegex !== void 0 ? options.escapeRegex : DEFAULT_OPTIONS2.escapeRegex;
      var getEscapeString = (options) => options && options.escapeString !== void 0 ? options.escapeString : DEFAULT_OPTIONS2.escapeString;
      var getConfig2 = (options) => {
        var _options$printBasicPr;
        return {
          callToJSON: options && options.callToJSON !== void 0 ? options.callToJSON : DEFAULT_OPTIONS2.callToJSON,
          colors: options && options.highlight ? getColorsHighlight(options) : getColorsEmpty(),
          compareKeys: options && typeof options.compareKeys === "function" ? options.compareKeys : DEFAULT_OPTIONS2.compareKeys,
          escapeRegex: getEscapeRegex(options),
          escapeString: getEscapeString(options),
          indent: options && options.min ? "" : createIndent(
            options && options.indent !== void 0 ? options.indent : DEFAULT_OPTIONS2.indent
          ),
          maxDepth: options && options.maxDepth !== void 0 ? options.maxDepth : DEFAULT_OPTIONS2.maxDepth,
          min: options && options.min !== void 0 ? options.min : DEFAULT_OPTIONS2.min,
          plugins: options && options.plugins !== void 0 ? options.plugins : DEFAULT_OPTIONS2.plugins,
          printBasicPrototype: (_options$printBasicPr = options === null || options === void 0 ? void 0 : options.printBasicPrototype) !== null && _options$printBasicPr !== void 0 ? _options$printBasicPr : true,
          printFunctionName: getPrintFunctionName(options),
          spacingInner: options && options.min ? " " : "\n",
          spacingOuter: options && options.min ? "" : "\n"
        };
      };
      function createIndent(indent) {
        return new Array(indent + 1).join(" ");
      }
      function format2(val, options) {
        if (options) {
          validateOptions(options);
          if (options.plugins) {
            const plugin = findPlugin(options.plugins, val);
            if (plugin !== null) {
              return printPlugin(plugin, val, getConfig2(options), "", 0, []);
            }
          }
        }
        const basicResult = printBasicValue(
          val,
          getPrintFunctionName(options),
          getEscapeRegex(options),
          getEscapeString(options)
        );
        if (basicResult !== null) {
          return basicResult;
        }
        return printComplexValue(val, getConfig2(options), "", 0, []);
      }
      var plugins2 = {
        AsymmetricMatcher: _AsymmetricMatcher.default,
        ConvertAnsi: _ConvertAnsi.default,
        DOMCollection: _DOMCollection.default,
        DOMElement: _DOMElement.default,
        Immutable: _Immutable.default,
        ReactElement: _ReactElement.default,
        ReactTestComponent: _ReactTestComponent.default
      };
      exports.plugins = plugins2;
      var _default = format2;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/util/iteratorProxy.js
  var require_iteratorProxy = __commonJS({
    "../../../node_modules/aria-query/lib/util/iteratorProxy.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      function iteratorProxy() {
        var values = this;
        var index = 0;
        var iter = {
          "@@iterator": function iterator() {
            return iter;
          },
          next: function next() {
            if (index < values.length) {
              var value = values[index];
              index = index + 1;
              return {
                done: false,
                value
              };
            } else {
              return {
                done: true
              };
            }
          }
        };
        return iter;
      }
      var _default = iteratorProxy;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/util/iterationDecorator.js
  var require_iterationDecorator = __commonJS({
    "../../../node_modules/aria-query/lib/util/iterationDecorator.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = iterationDecorator;
      var _iteratorProxy = _interopRequireDefault(require_iteratorProxy());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _typeof4(obj) {
        "@babel/helpers - typeof";
        return _typeof4 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
          return typeof obj2;
        } : function(obj2) {
          return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        }, _typeof4(obj);
      }
      function iterationDecorator(collection, entries) {
        if (typeof Symbol === "function" && _typeof4(Symbol.iterator) === "symbol") {
          Object.defineProperty(collection, Symbol.iterator, {
            value: _iteratorProxy.default.bind(entries)
          });
        }
        return collection;
      }
    }
  });

  // ../../../node_modules/aria-query/lib/ariaPropsMap.js
  var require_ariaPropsMap = __commonJS({
    "../../../node_modules/aria-query/lib/ariaPropsMap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _iterationDecorator = _interopRequireDefault(require_iterationDecorator());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _iterableToArrayLimit(arr, i) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F2() {
            };
            return { s: F, n: function n() {
              if (i >= o.length) return { done: true };
              return { done: false, value: o[i++] };
            }, e: function e(_e2) {
              throw _e2;
            }, f: F };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return { s: function s() {
          it = it.call(o);
        }, n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        }, e: function e(_e3) {
          didErr = true;
          err = _e3;
        }, f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        } };
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) {
          arr2[i] = arr[i];
        }
        return arr2;
      }
      var properties = [["aria-activedescendant", {
        "type": "id"
      }], ["aria-atomic", {
        "type": "boolean"
      }], ["aria-autocomplete", {
        "type": "token",
        "values": ["inline", "list", "both", "none"]
      }], ["aria-braillelabel", {
        "type": "string"
      }], ["aria-brailleroledescription", {
        "type": "string"
      }], ["aria-busy", {
        "type": "boolean"
      }], ["aria-checked", {
        "type": "tristate"
      }], ["aria-colcount", {
        type: "integer"
      }], ["aria-colindex", {
        type: "integer"
      }], ["aria-colspan", {
        type: "integer"
      }], ["aria-controls", {
        "type": "idlist"
      }], ["aria-current", {
        type: "token",
        values: ["page", "step", "location", "date", "time", true, false]
      }], ["aria-describedby", {
        "type": "idlist"
      }], ["aria-description", {
        "type": "string"
      }], ["aria-details", {
        "type": "id"
      }], ["aria-disabled", {
        "type": "boolean"
      }], ["aria-dropeffect", {
        "type": "tokenlist",
        "values": ["copy", "execute", "link", "move", "none", "popup"]
      }], ["aria-errormessage", {
        "type": "id"
      }], ["aria-expanded", {
        "type": "boolean",
        "allowundefined": true
      }], ["aria-flowto", {
        "type": "idlist"
      }], ["aria-grabbed", {
        "type": "boolean",
        "allowundefined": true
      }], ["aria-haspopup", {
        "type": "token",
        "values": [false, true, "menu", "listbox", "tree", "grid", "dialog"]
      }], ["aria-hidden", {
        "type": "boolean",
        "allowundefined": true
      }], ["aria-invalid", {
        "type": "token",
        "values": ["grammar", false, "spelling", true]
      }], ["aria-keyshortcuts", {
        type: "string"
      }], ["aria-label", {
        "type": "string"
      }], ["aria-labelledby", {
        "type": "idlist"
      }], ["aria-level", {
        "type": "integer"
      }], ["aria-live", {
        "type": "token",
        "values": ["assertive", "off", "polite"]
      }], ["aria-modal", {
        type: "boolean"
      }], ["aria-multiline", {
        "type": "boolean"
      }], ["aria-multiselectable", {
        "type": "boolean"
      }], ["aria-orientation", {
        "type": "token",
        "values": ["vertical", "undefined", "horizontal"]
      }], ["aria-owns", {
        "type": "idlist"
      }], ["aria-placeholder", {
        type: "string"
      }], ["aria-posinset", {
        "type": "integer"
      }], ["aria-pressed", {
        "type": "tristate"
      }], ["aria-readonly", {
        "type": "boolean"
      }], ["aria-relevant", {
        "type": "tokenlist",
        "values": ["additions", "all", "removals", "text"]
      }], ["aria-required", {
        "type": "boolean"
      }], ["aria-roledescription", {
        type: "string"
      }], ["aria-rowcount", {
        type: "integer"
      }], ["aria-rowindex", {
        type: "integer"
      }], ["aria-rowspan", {
        type: "integer"
      }], ["aria-selected", {
        "type": "boolean",
        "allowundefined": true
      }], ["aria-setsize", {
        "type": "integer"
      }], ["aria-sort", {
        "type": "token",
        "values": ["ascending", "descending", "none", "other"]
      }], ["aria-valuemax", {
        "type": "number"
      }], ["aria-valuemin", {
        "type": "number"
      }], ["aria-valuenow", {
        "type": "number"
      }], ["aria-valuetext", {
        "type": "string"
      }]];
      var ariaPropsMap = {
        entries: function entries() {
          return properties;
        },
        forEach: function forEach(fn) {
          var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
          var _iterator = _createForOfIteratorHelper(properties), _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var _step$value = _slicedToArray(_step.value, 2), key = _step$value[0], values = _step$value[1];
              fn.call(thisArg, values, key, properties);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        },
        get: function get(key) {
          var item = properties.find(function(tuple) {
            return tuple[0] === key ? true : false;
          });
          return item && item[1];
        },
        has: function has(key) {
          return !!ariaPropsMap.get(key);
        },
        keys: function keys() {
          return properties.map(function(_ref) {
            var _ref2 = _slicedToArray(_ref, 1), key = _ref2[0];
            return key;
          });
        },
        values: function values() {
          return properties.map(function(_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2), values2 = _ref4[1];
            return values2;
          });
        }
      };
      var _default = (0, _iterationDecorator.default)(ariaPropsMap, ariaPropsMap.entries());
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/domMap.js
  var require_domMap = __commonJS({
    "../../../node_modules/aria-query/lib/domMap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _iterationDecorator = _interopRequireDefault(require_iterationDecorator());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _iterableToArrayLimit(arr, i) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F2() {
            };
            return { s: F, n: function n() {
              if (i >= o.length) return { done: true };
              return { done: false, value: o[i++] };
            }, e: function e(_e2) {
              throw _e2;
            }, f: F };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return { s: function s() {
          it = it.call(o);
        }, n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        }, e: function e(_e3) {
          didErr = true;
          err = _e3;
        }, f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        } };
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) {
          arr2[i] = arr[i];
        }
        return arr2;
      }
      var dom = [["a", {
        reserved: false
      }], ["abbr", {
        reserved: false
      }], ["acronym", {
        reserved: false
      }], ["address", {
        reserved: false
      }], ["applet", {
        reserved: false
      }], ["area", {
        reserved: false
      }], ["article", {
        reserved: false
      }], ["aside", {
        reserved: false
      }], ["audio", {
        reserved: false
      }], ["b", {
        reserved: false
      }], ["base", {
        reserved: true
      }], ["bdi", {
        reserved: false
      }], ["bdo", {
        reserved: false
      }], ["big", {
        reserved: false
      }], ["blink", {
        reserved: false
      }], ["blockquote", {
        reserved: false
      }], ["body", {
        reserved: false
      }], ["br", {
        reserved: false
      }], ["button", {
        reserved: false
      }], ["canvas", {
        reserved: false
      }], ["caption", {
        reserved: false
      }], ["center", {
        reserved: false
      }], ["cite", {
        reserved: false
      }], ["code", {
        reserved: false
      }], ["col", {
        reserved: true
      }], ["colgroup", {
        reserved: true
      }], ["content", {
        reserved: false
      }], ["data", {
        reserved: false
      }], ["datalist", {
        reserved: false
      }], ["dd", {
        reserved: false
      }], ["del", {
        reserved: false
      }], ["details", {
        reserved: false
      }], ["dfn", {
        reserved: false
      }], ["dialog", {
        reserved: false
      }], ["dir", {
        reserved: false
      }], ["div", {
        reserved: false
      }], ["dl", {
        reserved: false
      }], ["dt", {
        reserved: false
      }], ["em", {
        reserved: false
      }], ["embed", {
        reserved: false
      }], ["fieldset", {
        reserved: false
      }], ["figcaption", {
        reserved: false
      }], ["figure", {
        reserved: false
      }], ["font", {
        reserved: false
      }], ["footer", {
        reserved: false
      }], ["form", {
        reserved: false
      }], ["frame", {
        reserved: false
      }], ["frameset", {
        reserved: false
      }], ["h1", {
        reserved: false
      }], ["h2", {
        reserved: false
      }], ["h3", {
        reserved: false
      }], ["h4", {
        reserved: false
      }], ["h5", {
        reserved: false
      }], ["h6", {
        reserved: false
      }], ["head", {
        reserved: true
      }], ["header", {
        reserved: false
      }], ["hgroup", {
        reserved: false
      }], ["hr", {
        reserved: false
      }], ["html", {
        reserved: true
      }], ["i", {
        reserved: false
      }], ["iframe", {
        reserved: false
      }], ["img", {
        reserved: false
      }], ["input", {
        reserved: false
      }], ["ins", {
        reserved: false
      }], ["kbd", {
        reserved: false
      }], ["keygen", {
        reserved: false
      }], ["label", {
        reserved: false
      }], ["legend", {
        reserved: false
      }], ["li", {
        reserved: false
      }], ["link", {
        reserved: true
      }], ["main", {
        reserved: false
      }], ["map", {
        reserved: false
      }], ["mark", {
        reserved: false
      }], ["marquee", {
        reserved: false
      }], ["menu", {
        reserved: false
      }], ["menuitem", {
        reserved: false
      }], ["meta", {
        reserved: true
      }], ["meter", {
        reserved: false
      }], ["nav", {
        reserved: false
      }], ["noembed", {
        reserved: true
      }], ["noscript", {
        reserved: true
      }], ["object", {
        reserved: false
      }], ["ol", {
        reserved: false
      }], ["optgroup", {
        reserved: false
      }], ["option", {
        reserved: false
      }], ["output", {
        reserved: false
      }], ["p", {
        reserved: false
      }], ["param", {
        reserved: true
      }], ["picture", {
        reserved: true
      }], ["pre", {
        reserved: false
      }], ["progress", {
        reserved: false
      }], ["q", {
        reserved: false
      }], ["rp", {
        reserved: false
      }], ["rt", {
        reserved: false
      }], ["rtc", {
        reserved: false
      }], ["ruby", {
        reserved: false
      }], ["s", {
        reserved: false
      }], ["samp", {
        reserved: false
      }], ["script", {
        reserved: true
      }], ["section", {
        reserved: false
      }], ["select", {
        reserved: false
      }], ["small", {
        reserved: false
      }], ["source", {
        reserved: true
      }], ["spacer", {
        reserved: false
      }], ["span", {
        reserved: false
      }], ["strike", {
        reserved: false
      }], ["strong", {
        reserved: false
      }], ["style", {
        reserved: true
      }], ["sub", {
        reserved: false
      }], ["summary", {
        reserved: false
      }], ["sup", {
        reserved: false
      }], ["table", {
        reserved: false
      }], ["tbody", {
        reserved: false
      }], ["td", {
        reserved: false
      }], ["textarea", {
        reserved: false
      }], ["tfoot", {
        reserved: false
      }], ["th", {
        reserved: false
      }], ["thead", {
        reserved: false
      }], ["time", {
        reserved: false
      }], ["title", {
        reserved: true
      }], ["tr", {
        reserved: false
      }], ["track", {
        reserved: true
      }], ["tt", {
        reserved: false
      }], ["u", {
        reserved: false
      }], ["ul", {
        reserved: false
      }], ["var", {
        reserved: false
      }], ["video", {
        reserved: false
      }], ["wbr", {
        reserved: false
      }], ["xmp", {
        reserved: false
      }]];
      var domMap = {
        entries: function entries() {
          return dom;
        },
        forEach: function forEach(fn) {
          var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
          var _iterator = _createForOfIteratorHelper(dom), _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var _step$value = _slicedToArray(_step.value, 2), key = _step$value[0], values = _step$value[1];
              fn.call(thisArg, values, key, dom);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        },
        get: function get(key) {
          var item = dom.find(function(tuple) {
            return tuple[0] === key ? true : false;
          });
          return item && item[1];
        },
        has: function has(key) {
          return !!domMap.get(key);
        },
        keys: function keys() {
          return dom.map(function(_ref) {
            var _ref2 = _slicedToArray(_ref, 1), key = _ref2[0];
            return key;
          });
        },
        values: function values() {
          return dom.map(function(_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2), values2 = _ref4[1];
            return values2;
          });
        }
      };
      var _default = (0, _iterationDecorator.default)(domMap, domMap.entries());
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/commandRole.js
  var require_commandRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/commandRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var commandRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget"]]
      };
      var _default = commandRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/compositeRole.js
  var require_compositeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/compositeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var compositeRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-activedescendant": null,
          "aria-disabled": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget"]]
      };
      var _default = compositeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/inputRole.js
  var require_inputRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/inputRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var inputRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null
        },
        relatedConcepts: [{
          concept: {
            name: "input"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget"]]
      };
      var _default = inputRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/landmarkRole.js
  var require_landmarkRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/landmarkRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var landmarkRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = landmarkRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/rangeRole.js
  var require_rangeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/rangeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var rangeRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-valuemax": null,
          "aria-valuemin": null,
          "aria-valuenow": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = rangeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/roletypeRole.js
  var require_roletypeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/roletypeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var roletypeRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: [],
        prohibitedProps: [],
        props: {
          "aria-atomic": null,
          "aria-busy": null,
          "aria-controls": null,
          "aria-current": null,
          "aria-describedby": null,
          "aria-details": null,
          "aria-dropeffect": null,
          "aria-flowto": null,
          "aria-grabbed": null,
          "aria-hidden": null,
          "aria-keyshortcuts": null,
          "aria-label": null,
          "aria-labelledby": null,
          "aria-live": null,
          "aria-owns": null,
          "aria-relevant": null,
          "aria-roledescription": null
        },
        relatedConcepts: [{
          concept: {
            name: "role"
          },
          module: "XHTML"
        }, {
          concept: {
            name: "type"
          },
          module: "Dublin Core"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: []
      };
      var _default = roletypeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/sectionRole.js
  var require_sectionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/sectionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var sectionRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: [],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "frontmatter"
          },
          module: "DTB"
        }, {
          concept: {
            name: "level"
          },
          module: "DTB"
        }, {
          concept: {
            name: "level"
          },
          module: "SMIL"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = sectionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/sectionheadRole.js
  var require_sectionheadRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/sectionheadRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var sectionheadRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = sectionheadRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/selectRole.js
  var require_selectRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/selectRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var selectRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-orientation": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite"], ["roletype", "structure", "section", "group"]]
      };
      var _default = selectRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/structureRole.js
  var require_structureRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/structureRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var structureRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: [],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype"]]
      };
      var _default = structureRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/widgetRole.js
  var require_widgetRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/widgetRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var widgetRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: [],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype"]]
      };
      var _default = widgetRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/abstract/windowRole.js
  var require_windowRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/abstract/windowRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var windowRole = {
        abstract: true,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-modal": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype"]]
      };
      var _default = windowRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/ariaAbstractRoles.js
  var require_ariaAbstractRoles = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/ariaAbstractRoles.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _commandRole = _interopRequireDefault(require_commandRole());
      var _compositeRole = _interopRequireDefault(require_compositeRole());
      var _inputRole = _interopRequireDefault(require_inputRole());
      var _landmarkRole = _interopRequireDefault(require_landmarkRole());
      var _rangeRole = _interopRequireDefault(require_rangeRole());
      var _roletypeRole = _interopRequireDefault(require_roletypeRole());
      var _sectionRole = _interopRequireDefault(require_sectionRole());
      var _sectionheadRole = _interopRequireDefault(require_sectionheadRole());
      var _selectRole = _interopRequireDefault(require_selectRole());
      var _structureRole = _interopRequireDefault(require_structureRole());
      var _widgetRole = _interopRequireDefault(require_widgetRole());
      var _windowRole = _interopRequireDefault(require_windowRole());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var ariaAbstractRoles = [["command", _commandRole.default], ["composite", _compositeRole.default], ["input", _inputRole.default], ["landmark", _landmarkRole.default], ["range", _rangeRole.default], ["roletype", _roletypeRole.default], ["section", _sectionRole.default], ["sectionhead", _sectionheadRole.default], ["select", _selectRole.default], ["structure", _structureRole.default], ["widget", _widgetRole.default], ["window", _windowRole.default]];
      var _default = ariaAbstractRoles;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/alertRole.js
  var require_alertRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/alertRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var alertRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-atomic": "true",
          "aria-live": "assertive"
        },
        relatedConcepts: [{
          concept: {
            name: "alert"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = alertRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/alertdialogRole.js
  var require_alertdialogRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/alertdialogRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var alertdialogRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "alert"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "alert"], ["roletype", "window", "dialog"]]
      };
      var _default = alertdialogRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/applicationRole.js
  var require_applicationRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/applicationRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var applicationRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-activedescendant": null,
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "Device Independence Delivery Unit"
          }
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = applicationRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/articleRole.js
  var require_articleRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/articleRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var articleRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-posinset": null,
          "aria-setsize": null
        },
        relatedConcepts: [{
          concept: {
            name: "article"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "document"]]
      };
      var _default = articleRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/bannerRole.js
  var require_bannerRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/bannerRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var bannerRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            constraints: ["scoped to the body element"],
            name: "header"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = bannerRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/blockquoteRole.js
  var require_blockquoteRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/blockquoteRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var blockquoteRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "blockquote"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = blockquoteRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/buttonRole.js
  var require_buttonRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/buttonRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var buttonRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-pressed": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "type",
              value: "button"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "type",
              value: "image"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "type",
              value: "reset"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "type",
              value: "submit"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            name: "button"
          },
          module: "HTML"
        }, {
          concept: {
            name: "trigger"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command"]]
      };
      var _default = buttonRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/captionRole.js
  var require_captionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/captionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var captionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "caption"
          },
          module: "HTML"
        }],
        requireContextRole: ["figure", "grid", "table"],
        requiredContextRole: ["figure", "grid", "table"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = captionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/cellRole.js
  var require_cellRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/cellRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var cellRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-colindex": null,
          "aria-colspan": null,
          "aria-rowindex": null,
          "aria-rowspan": null
        },
        relatedConcepts: [{
          concept: {
            constraints: ["ancestor table element has table role"],
            name: "td"
          },
          module: "HTML"
        }],
        requireContextRole: ["row"],
        requiredContextRole: ["row"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = cellRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/checkboxRole.js
  var require_checkboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/checkboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var checkboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-checked": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-required": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "type",
              value: "checkbox"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            name: "option"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-checked": null
        },
        superClass: [["roletype", "widget", "input"]]
      };
      var _default = checkboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/codeRole.js
  var require_codeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/codeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var codeRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "code"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = codeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/columnheaderRole.js
  var require_columnheaderRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/columnheaderRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var columnheaderRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-sort": null
        },
        relatedConcepts: [{
          concept: {
            name: "th"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "scope",
              value: "col"
            }],
            name: "th"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "scope",
              value: "colgroup"
            }],
            name: "th"
          },
          module: "HTML"
        }],
        requireContextRole: ["row"],
        requiredContextRole: ["row"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "cell"], ["roletype", "structure", "section", "cell", "gridcell"], ["roletype", "widget", "gridcell"], ["roletype", "structure", "sectionhead"]]
      };
      var _default = columnheaderRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/comboboxRole.js
  var require_comboboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/comboboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var comboboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-activedescendant": null,
          "aria-autocomplete": null,
          "aria-errormessage": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-required": null,
          "aria-expanded": "false",
          "aria-haspopup": "listbox"
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "email"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "search"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "tel"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "text"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "url"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "list"
            }, {
              name: "type",
              value: "url"
            }],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "multiple"
            }, {
              constraints: ["undefined"],
              name: "size"
            }],
            constraints: ["the multiple attribute is not set and the size attribute does not have a value greater than 1"],
            name: "select"
          },
          module: "HTML"
        }, {
          concept: {
            name: "select"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-controls": null,
          "aria-expanded": "false"
        },
        superClass: [["roletype", "widget", "input"]]
      };
      var _default = comboboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/complementaryRole.js
  var require_complementaryRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/complementaryRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var complementaryRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "aside"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-label"
            }],
            constraints: ["scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
            name: "aside"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-labelledby"
            }],
            constraints: ["scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
            name: "aside"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = complementaryRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/contentinfoRole.js
  var require_contentinfoRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/contentinfoRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var contentinfoRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            constraints: ["scoped to the body element"],
            name: "footer"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = contentinfoRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/definitionRole.js
  var require_definitionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/definitionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var definitionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "dd"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = definitionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/deletionRole.js
  var require_deletionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/deletionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var deletionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "del"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = deletionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/dialogRole.js
  var require_dialogRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/dialogRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var dialogRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "dialog"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "window"]]
      };
      var _default = dialogRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/directoryRole.js
  var require_directoryRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/directoryRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var directoryRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          module: "DAISY Guide"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "list"]]
      };
      var _default = directoryRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/documentRole.js
  var require_documentRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/documentRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var documentRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "Device Independence Delivery Unit"
          }
        }, {
          concept: {
            name: "html"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = documentRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/emphasisRole.js
  var require_emphasisRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/emphasisRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var emphasisRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "em"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = emphasisRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/feedRole.js
  var require_feedRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/feedRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var feedRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["article"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "list"]]
      };
      var _default = feedRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/figureRole.js
  var require_figureRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/figureRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var figureRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "figure"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = figureRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/formRole.js
  var require_formRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/formRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var formRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-label"
            }],
            name: "form"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-labelledby"
            }],
            name: "form"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "name"
            }],
            name: "form"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = formRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/genericRole.js
  var require_genericRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/genericRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var genericRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "a"
          },
          module: "HTML"
        }, {
          concept: {
            name: "area"
          },
          module: "HTML"
        }, {
          concept: {
            name: "aside"
          },
          module: "HTML"
        }, {
          concept: {
            name: "b"
          },
          module: "HTML"
        }, {
          concept: {
            name: "bdo"
          },
          module: "HTML"
        }, {
          concept: {
            name: "body"
          },
          module: "HTML"
        }, {
          concept: {
            name: "data"
          },
          module: "HTML"
        }, {
          concept: {
            name: "div"
          },
          module: "HTML"
        }, {
          concept: {
            constraints: ["scoped to the main element", "scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
            name: "footer"
          },
          module: "HTML"
        }, {
          concept: {
            constraints: ["scoped to the main element", "scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
            name: "header"
          },
          module: "HTML"
        }, {
          concept: {
            name: "hgroup"
          },
          module: "HTML"
        }, {
          concept: {
            name: "i"
          },
          module: "HTML"
        }, {
          concept: {
            name: "pre"
          },
          module: "HTML"
        }, {
          concept: {
            name: "q"
          },
          module: "HTML"
        }, {
          concept: {
            name: "samp"
          },
          module: "HTML"
        }, {
          concept: {
            name: "section"
          },
          module: "HTML"
        }, {
          concept: {
            name: "small"
          },
          module: "HTML"
        }, {
          concept: {
            name: "span"
          },
          module: "HTML"
        }, {
          concept: {
            name: "u"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = genericRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/gridRole.js
  var require_gridRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/gridRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var gridRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-multiselectable": null,
          "aria-readonly": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["row"], ["row", "rowgroup"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite"], ["roletype", "structure", "section", "table"]]
      };
      var _default = gridRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/gridcellRole.js
  var require_gridcellRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/gridcellRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var gridcellRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-required": null,
          "aria-selected": null
        },
        relatedConcepts: [{
          concept: {
            constraints: ["ancestor table element has grid role", "ancestor table element has treegrid role"],
            name: "td"
          },
          module: "HTML"
        }],
        requireContextRole: ["row"],
        requiredContextRole: ["row"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "cell"], ["roletype", "widget"]]
      };
      var _default = gridcellRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/groupRole.js
  var require_groupRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/groupRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var groupRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-activedescendant": null,
          "aria-disabled": null
        },
        relatedConcepts: [{
          concept: {
            name: "details"
          },
          module: "HTML"
        }, {
          concept: {
            name: "fieldset"
          },
          module: "HTML"
        }, {
          concept: {
            name: "optgroup"
          },
          module: "HTML"
        }, {
          concept: {
            name: "address"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = groupRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/headingRole.js
  var require_headingRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/headingRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var headingRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-level": "2"
        },
        relatedConcepts: [{
          concept: {
            name: "h1"
          },
          module: "HTML"
        }, {
          concept: {
            name: "h2"
          },
          module: "HTML"
        }, {
          concept: {
            name: "h3"
          },
          module: "HTML"
        }, {
          concept: {
            name: "h4"
          },
          module: "HTML"
        }, {
          concept: {
            name: "h5"
          },
          module: "HTML"
        }, {
          concept: {
            name: "h6"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-level": "2"
        },
        superClass: [["roletype", "structure", "sectionhead"]]
      };
      var _default = headingRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/imgRole.js
  var require_imgRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/imgRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var imgRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "alt"
            }],
            name: "img"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "alt"
            }],
            name: "img"
          },
          module: "HTML"
        }, {
          concept: {
            name: "imggroup"
          },
          module: "DTB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = imgRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/insertionRole.js
  var require_insertionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/insertionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var insertionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "ins"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = insertionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/linkRole.js
  var require_linkRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/linkRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var linkRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-expanded": null,
          "aria-haspopup": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "href"
            }],
            name: "a"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "href"
            }],
            name: "area"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command"]]
      };
      var _default = linkRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/listRole.js
  var require_listRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/listRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var listRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "menu"
          },
          module: "HTML"
        }, {
          concept: {
            name: "ol"
          },
          module: "HTML"
        }, {
          concept: {
            name: "ul"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["listitem"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = listRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/listboxRole.js
  var require_listboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/listboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var listboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-invalid": null,
          "aria-multiselectable": null,
          "aria-readonly": null,
          "aria-required": null,
          "aria-orientation": "vertical"
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: [">1"],
              name: "size"
            }],
            constraints: ["the size attribute value is greater than 1"],
            name: "select"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "multiple"
            }],
            name: "select"
          },
          module: "HTML"
        }, {
          concept: {
            name: "datalist"
          },
          module: "HTML"
        }, {
          concept: {
            name: "list"
          },
          module: "ARIA"
        }, {
          concept: {
            name: "select"
          },
          module: "XForms"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["option", "group"], ["option"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
      };
      var _default = listboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/listitemRole.js
  var require_listitemRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/listitemRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var listitemRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-level": null,
          "aria-posinset": null,
          "aria-setsize": null
        },
        relatedConcepts: [{
          concept: {
            constraints: ["direct descendant of ol", "direct descendant of ul", "direct descendant of menu"],
            name: "li"
          },
          module: "HTML"
        }, {
          concept: {
            name: "item"
          },
          module: "XForms"
        }],
        requireContextRole: ["directory", "list"],
        requiredContextRole: ["directory", "list"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = listitemRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/logRole.js
  var require_logRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/logRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var logRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-live": "polite"
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = logRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/mainRole.js
  var require_mainRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/mainRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var mainRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "main"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = mainRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/markRole.js
  var require_markRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/markRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var markRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: [],
        props: {
          "aria-braillelabel": null,
          "aria-brailleroledescription": null,
          "aria-description": null
        },
        relatedConcepts: [{
          concept: {
            name: "mark"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = markRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/marqueeRole.js
  var require_marqueeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/marqueeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var marqueeRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = marqueeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/mathRole.js
  var require_mathRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/mathRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var mathRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "math"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = mathRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/menuRole.js
  var require_menuRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/menuRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var menuRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-orientation": "vertical"
        },
        relatedConcepts: [{
          concept: {
            name: "MENU"
          },
          module: "JAPI"
        }, {
          concept: {
            name: "list"
          },
          module: "ARIA"
        }, {
          concept: {
            name: "select"
          },
          module: "XForms"
        }, {
          concept: {
            name: "sidebar"
          },
          module: "DTB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["menuitem", "group"], ["menuitemradio", "group"], ["menuitemcheckbox", "group"], ["menuitem"], ["menuitemcheckbox"], ["menuitemradio"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
      };
      var _default = menuRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/menubarRole.js
  var require_menubarRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/menubarRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var menubarRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-orientation": "horizontal"
        },
        relatedConcepts: [{
          concept: {
            name: "toolbar"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["menuitem", "group"], ["menuitemradio", "group"], ["menuitemcheckbox", "group"], ["menuitem"], ["menuitemcheckbox"], ["menuitemradio"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "select", "menu"], ["roletype", "structure", "section", "group", "select", "menu"]]
      };
      var _default = menubarRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/menuitemRole.js
  var require_menuitemRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/menuitemRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var menuitemRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-posinset": null,
          "aria-setsize": null
        },
        relatedConcepts: [{
          concept: {
            name: "MENU_ITEM"
          },
          module: "JAPI"
        }, {
          concept: {
            name: "listitem"
          },
          module: "ARIA"
        }, {
          concept: {
            name: "option"
          },
          module: "ARIA"
        }],
        requireContextRole: ["group", "menu", "menubar"],
        requiredContextRole: ["group", "menu", "menubar"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command"]]
      };
      var _default = menuitemRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/menuitemcheckboxRole.js
  var require_menuitemcheckboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/menuitemcheckboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var menuitemcheckboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "menuitem"
          },
          module: "ARIA"
        }],
        requireContextRole: ["group", "menu", "menubar"],
        requiredContextRole: ["group", "menu", "menubar"],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-checked": null
        },
        superClass: [["roletype", "widget", "input", "checkbox"], ["roletype", "widget", "command", "menuitem"]]
      };
      var _default = menuitemcheckboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/menuitemradioRole.js
  var require_menuitemradioRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/menuitemradioRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var menuitemradioRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "menuitem"
          },
          module: "ARIA"
        }],
        requireContextRole: ["group", "menu", "menubar"],
        requiredContextRole: ["group", "menu", "menubar"],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-checked": null
        },
        superClass: [["roletype", "widget", "input", "checkbox", "menuitemcheckbox"], ["roletype", "widget", "command", "menuitem", "menuitemcheckbox"], ["roletype", "widget", "input", "radio"]]
      };
      var _default = menuitemradioRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/meterRole.js
  var require_meterRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/meterRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var meterRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-valuetext": null,
          "aria-valuemax": "100",
          "aria-valuemin": "0"
        },
        relatedConcepts: [{
          concept: {
            name: "meter"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-valuenow": null
        },
        superClass: [["roletype", "structure", "range"]]
      };
      var _default = meterRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/navigationRole.js
  var require_navigationRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/navigationRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var navigationRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "nav"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = navigationRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/noneRole.js
  var require_noneRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/noneRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var noneRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: [],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: []
      };
      var _default = noneRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/noteRole.js
  var require_noteRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/noteRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var noteRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = noteRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/optionRole.js
  var require_optionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/optionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var optionRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-checked": null,
          "aria-posinset": null,
          "aria-setsize": null,
          "aria-selected": "false"
        },
        relatedConcepts: [{
          concept: {
            name: "item"
          },
          module: "XForms"
        }, {
          concept: {
            name: "listitem"
          },
          module: "ARIA"
        }, {
          concept: {
            name: "option"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-selected": "false"
        },
        superClass: [["roletype", "widget", "input"]]
      };
      var _default = optionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/paragraphRole.js
  var require_paragraphRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/paragraphRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var paragraphRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "p"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = paragraphRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/presentationRole.js
  var require_presentationRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/presentationRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var presentationRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "alt",
              value: ""
            }],
            name: "img"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = presentationRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/progressbarRole.js
  var require_progressbarRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/progressbarRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var progressbarRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-valuetext": null
        },
        relatedConcepts: [{
          concept: {
            name: "progress"
          },
          module: "HTML"
        }, {
          concept: {
            name: "status"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "range"], ["roletype", "widget"]]
      };
      var _default = progressbarRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/radioRole.js
  var require_radioRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/radioRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var radioRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-checked": null,
          "aria-posinset": null,
          "aria-setsize": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "type",
              value: "radio"
            }],
            name: "input"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-checked": null
        },
        superClass: [["roletype", "widget", "input"]]
      };
      var _default = radioRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/radiogroupRole.js
  var require_radiogroupRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/radiogroupRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var radiogroupRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-required": null
        },
        relatedConcepts: [{
          concept: {
            name: "list"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["radio"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
      };
      var _default = radiogroupRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/regionRole.js
  var require_regionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/regionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var regionRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-label"
            }],
            name: "section"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["set"],
              name: "aria-labelledby"
            }],
            name: "section"
          },
          module: "HTML"
        }, {
          concept: {
            name: "Device Independence Glossart perceivable unit"
          }
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = regionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/rowRole.js
  var require_rowRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/rowRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var rowRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-colindex": null,
          "aria-expanded": null,
          "aria-level": null,
          "aria-posinset": null,
          "aria-rowindex": null,
          "aria-selected": null,
          "aria-setsize": null
        },
        relatedConcepts: [{
          concept: {
            name: "tr"
          },
          module: "HTML"
        }],
        requireContextRole: ["grid", "rowgroup", "table", "treegrid"],
        requiredContextRole: ["grid", "rowgroup", "table", "treegrid"],
        requiredOwnedElements: [["cell"], ["columnheader"], ["gridcell"], ["rowheader"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "group"], ["roletype", "widget"]]
      };
      var _default = rowRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/rowgroupRole.js
  var require_rowgroupRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/rowgroupRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var rowgroupRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "tbody"
          },
          module: "HTML"
        }, {
          concept: {
            name: "tfoot"
          },
          module: "HTML"
        }, {
          concept: {
            name: "thead"
          },
          module: "HTML"
        }],
        requireContextRole: ["grid", "table", "treegrid"],
        requiredContextRole: ["grid", "table", "treegrid"],
        requiredOwnedElements: [["row"]],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = rowgroupRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/rowheaderRole.js
  var require_rowheaderRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/rowheaderRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var rowheaderRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-sort": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "scope",
              value: "row"
            }],
            name: "th"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              name: "scope",
              value: "rowgroup"
            }],
            name: "th"
          },
          module: "HTML"
        }],
        requireContextRole: ["row", "rowgroup"],
        requiredContextRole: ["row", "rowgroup"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "cell"], ["roletype", "structure", "section", "cell", "gridcell"], ["roletype", "widget", "gridcell"], ["roletype", "structure", "sectionhead"]]
      };
      var _default = rowheaderRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/scrollbarRole.js
  var require_scrollbarRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/scrollbarRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var scrollbarRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-valuetext": null,
          "aria-orientation": "vertical",
          "aria-valuemax": "100",
          "aria-valuemin": "0"
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-controls": null,
          "aria-valuenow": null
        },
        superClass: [["roletype", "structure", "range"], ["roletype", "widget"]]
      };
      var _default = scrollbarRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/searchRole.js
  var require_searchRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/searchRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var searchRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = searchRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/searchboxRole.js
  var require_searchboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/searchboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var searchboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "list"
            }, {
              name: "type",
              value: "search"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "input", "textbox"]]
      };
      var _default = searchboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/separatorRole.js
  var require_separatorRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/separatorRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var separatorRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-orientation": "horizontal",
          "aria-valuemax": "100",
          "aria-valuemin": "0",
          "aria-valuenow": null,
          "aria-valuetext": null
        },
        relatedConcepts: [{
          concept: {
            name: "hr"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure"]]
      };
      var _default = separatorRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/sliderRole.js
  var require_sliderRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/sliderRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var sliderRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-haspopup": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-valuetext": null,
          "aria-orientation": "horizontal",
          "aria-valuemax": "100",
          "aria-valuemin": "0"
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "type",
              value: "range"
            }],
            name: "input"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-valuenow": null
        },
        superClass: [["roletype", "widget", "input"], ["roletype", "structure", "range"]]
      };
      var _default = sliderRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/spinbuttonRole.js
  var require_spinbuttonRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/spinbuttonRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var spinbuttonRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null,
          "aria-readonly": null,
          "aria-required": null,
          "aria-valuetext": null,
          "aria-valuenow": "0"
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              name: "type",
              value: "number"
            }],
            name: "input"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite"], ["roletype", "widget", "input"], ["roletype", "structure", "range"]]
      };
      var _default = spinbuttonRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/statusRole.js
  var require_statusRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/statusRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var statusRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-atomic": "true",
          "aria-live": "polite"
        },
        relatedConcepts: [{
          concept: {
            name: "output"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = statusRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/strongRole.js
  var require_strongRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/strongRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var strongRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "strong"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = strongRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/subscriptRole.js
  var require_subscriptRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/subscriptRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var subscriptRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "sub"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = subscriptRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/superscriptRole.js
  var require_superscriptRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/superscriptRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var superscriptRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["prohibited"],
        prohibitedProps: ["aria-label", "aria-labelledby"],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "sup"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = superscriptRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/switchRole.js
  var require_switchRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/switchRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var switchRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "button"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-checked": null
        },
        superClass: [["roletype", "widget", "input", "checkbox"]]
      };
      var _default = switchRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/tabRole.js
  var require_tabRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/tabRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var tabRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-posinset": null,
          "aria-setsize": null,
          "aria-selected": "false"
        },
        relatedConcepts: [],
        requireContextRole: ["tablist"],
        requiredContextRole: ["tablist"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "sectionhead"], ["roletype", "widget"]]
      };
      var _default = tabRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/tableRole.js
  var require_tableRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/tableRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var tableRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-colcount": null,
          "aria-rowcount": null
        },
        relatedConcepts: [{
          concept: {
            name: "table"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["row"], ["row", "rowgroup"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = tableRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/tablistRole.js
  var require_tablistRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/tablistRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var tablistRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-level": null,
          "aria-multiselectable": null,
          "aria-orientation": "horizontal"
        },
        relatedConcepts: [{
          module: "DAISY",
          concept: {
            name: "guide"
          }
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["tab"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite"]]
      };
      var _default = tablistRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/tabpanelRole.js
  var require_tabpanelRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/tabpanelRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var tabpanelRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = tabpanelRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/termRole.js
  var require_termRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/termRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var termRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "dfn"
          },
          module: "HTML"
        }, {
          concept: {
            name: "dt"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = termRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/textboxRole.js
  var require_textboxRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/textboxRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var textboxRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-activedescendant": null,
          "aria-autocomplete": null,
          "aria-errormessage": null,
          "aria-haspopup": null,
          "aria-invalid": null,
          "aria-multiline": null,
          "aria-placeholder": null,
          "aria-readonly": null,
          "aria-required": null
        },
        relatedConcepts: [{
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "type"
            }, {
              constraints: ["undefined"],
              name: "list"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "list"
            }, {
              name: "type",
              value: "email"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "list"
            }, {
              name: "type",
              value: "tel"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "list"
            }, {
              name: "type",
              value: "text"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            attributes: [{
              constraints: ["undefined"],
              name: "list"
            }, {
              name: "type",
              value: "url"
            }],
            constraints: ["the list attribute is not set"],
            name: "input"
          },
          module: "HTML"
        }, {
          concept: {
            name: "input"
          },
          module: "XForms"
        }, {
          concept: {
            name: "textarea"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "input"]]
      };
      var _default = textboxRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/timeRole.js
  var require_timeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/timeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var timeRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "time"
          },
          module: "HTML"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = timeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/timerRole.js
  var require_timerRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/timerRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var timerRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "status"]]
      };
      var _default = timerRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/toolbarRole.js
  var require_toolbarRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/toolbarRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var toolbarRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-orientation": "horizontal"
        },
        relatedConcepts: [{
          concept: {
            name: "menubar"
          },
          module: "ARIA"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "group"]]
      };
      var _default = toolbarRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/tooltipRole.js
  var require_tooltipRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/tooltipRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var tooltipRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = tooltipRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/treeRole.js
  var require_treeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/treeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var treeRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null,
          "aria-multiselectable": null,
          "aria-required": null,
          "aria-orientation": "vertical"
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["treeitem", "group"], ["treeitem"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
      };
      var _default = treeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/treegridRole.js
  var require_treegridRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/treegridRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var treegridRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["row"], ["row", "rowgroup"]],
        requiredProps: {},
        superClass: [["roletype", "widget", "composite", "grid"], ["roletype", "structure", "section", "table", "grid"], ["roletype", "widget", "composite", "select", "tree"], ["roletype", "structure", "section", "group", "select", "tree"]]
      };
      var _default = treegridRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/literal/treeitemRole.js
  var require_treeitemRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/literal/treeitemRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var treeitemRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-expanded": null,
          "aria-haspopup": null
        },
        relatedConcepts: [],
        requireContextRole: ["group", "tree"],
        requiredContextRole: ["group", "tree"],
        requiredOwnedElements: [],
        requiredProps: {
          "aria-selected": null
        },
        superClass: [["roletype", "structure", "section", "listitem"], ["roletype", "widget", "input", "option"]]
      };
      var _default = treeitemRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/ariaLiteralRoles.js
  var require_ariaLiteralRoles = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/ariaLiteralRoles.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _alertRole = _interopRequireDefault(require_alertRole());
      var _alertdialogRole = _interopRequireDefault(require_alertdialogRole());
      var _applicationRole = _interopRequireDefault(require_applicationRole());
      var _articleRole = _interopRequireDefault(require_articleRole());
      var _bannerRole = _interopRequireDefault(require_bannerRole());
      var _blockquoteRole = _interopRequireDefault(require_blockquoteRole());
      var _buttonRole = _interopRequireDefault(require_buttonRole());
      var _captionRole = _interopRequireDefault(require_captionRole());
      var _cellRole = _interopRequireDefault(require_cellRole());
      var _checkboxRole = _interopRequireDefault(require_checkboxRole());
      var _codeRole = _interopRequireDefault(require_codeRole());
      var _columnheaderRole = _interopRequireDefault(require_columnheaderRole());
      var _comboboxRole = _interopRequireDefault(require_comboboxRole());
      var _complementaryRole = _interopRequireDefault(require_complementaryRole());
      var _contentinfoRole = _interopRequireDefault(require_contentinfoRole());
      var _definitionRole = _interopRequireDefault(require_definitionRole());
      var _deletionRole = _interopRequireDefault(require_deletionRole());
      var _dialogRole = _interopRequireDefault(require_dialogRole());
      var _directoryRole = _interopRequireDefault(require_directoryRole());
      var _documentRole = _interopRequireDefault(require_documentRole());
      var _emphasisRole = _interopRequireDefault(require_emphasisRole());
      var _feedRole = _interopRequireDefault(require_feedRole());
      var _figureRole = _interopRequireDefault(require_figureRole());
      var _formRole = _interopRequireDefault(require_formRole());
      var _genericRole = _interopRequireDefault(require_genericRole());
      var _gridRole = _interopRequireDefault(require_gridRole());
      var _gridcellRole = _interopRequireDefault(require_gridcellRole());
      var _groupRole = _interopRequireDefault(require_groupRole());
      var _headingRole = _interopRequireDefault(require_headingRole());
      var _imgRole = _interopRequireDefault(require_imgRole());
      var _insertionRole = _interopRequireDefault(require_insertionRole());
      var _linkRole = _interopRequireDefault(require_linkRole());
      var _listRole = _interopRequireDefault(require_listRole());
      var _listboxRole = _interopRequireDefault(require_listboxRole());
      var _listitemRole = _interopRequireDefault(require_listitemRole());
      var _logRole = _interopRequireDefault(require_logRole());
      var _mainRole = _interopRequireDefault(require_mainRole());
      var _markRole = _interopRequireDefault(require_markRole());
      var _marqueeRole = _interopRequireDefault(require_marqueeRole());
      var _mathRole = _interopRequireDefault(require_mathRole());
      var _menuRole = _interopRequireDefault(require_menuRole());
      var _menubarRole = _interopRequireDefault(require_menubarRole());
      var _menuitemRole = _interopRequireDefault(require_menuitemRole());
      var _menuitemcheckboxRole = _interopRequireDefault(require_menuitemcheckboxRole());
      var _menuitemradioRole = _interopRequireDefault(require_menuitemradioRole());
      var _meterRole = _interopRequireDefault(require_meterRole());
      var _navigationRole = _interopRequireDefault(require_navigationRole());
      var _noneRole = _interopRequireDefault(require_noneRole());
      var _noteRole = _interopRequireDefault(require_noteRole());
      var _optionRole = _interopRequireDefault(require_optionRole());
      var _paragraphRole = _interopRequireDefault(require_paragraphRole());
      var _presentationRole = _interopRequireDefault(require_presentationRole());
      var _progressbarRole = _interopRequireDefault(require_progressbarRole());
      var _radioRole = _interopRequireDefault(require_radioRole());
      var _radiogroupRole = _interopRequireDefault(require_radiogroupRole());
      var _regionRole = _interopRequireDefault(require_regionRole());
      var _rowRole = _interopRequireDefault(require_rowRole());
      var _rowgroupRole = _interopRequireDefault(require_rowgroupRole());
      var _rowheaderRole = _interopRequireDefault(require_rowheaderRole());
      var _scrollbarRole = _interopRequireDefault(require_scrollbarRole());
      var _searchRole = _interopRequireDefault(require_searchRole());
      var _searchboxRole = _interopRequireDefault(require_searchboxRole());
      var _separatorRole = _interopRequireDefault(require_separatorRole());
      var _sliderRole = _interopRequireDefault(require_sliderRole());
      var _spinbuttonRole = _interopRequireDefault(require_spinbuttonRole());
      var _statusRole = _interopRequireDefault(require_statusRole());
      var _strongRole = _interopRequireDefault(require_strongRole());
      var _subscriptRole = _interopRequireDefault(require_subscriptRole());
      var _superscriptRole = _interopRequireDefault(require_superscriptRole());
      var _switchRole = _interopRequireDefault(require_switchRole());
      var _tabRole = _interopRequireDefault(require_tabRole());
      var _tableRole = _interopRequireDefault(require_tableRole());
      var _tablistRole = _interopRequireDefault(require_tablistRole());
      var _tabpanelRole = _interopRequireDefault(require_tabpanelRole());
      var _termRole = _interopRequireDefault(require_termRole());
      var _textboxRole = _interopRequireDefault(require_textboxRole());
      var _timeRole = _interopRequireDefault(require_timeRole());
      var _timerRole = _interopRequireDefault(require_timerRole());
      var _toolbarRole = _interopRequireDefault(require_toolbarRole());
      var _tooltipRole = _interopRequireDefault(require_tooltipRole());
      var _treeRole = _interopRequireDefault(require_treeRole());
      var _treegridRole = _interopRequireDefault(require_treegridRole());
      var _treeitemRole = _interopRequireDefault(require_treeitemRole());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var ariaLiteralRoles = [["alert", _alertRole.default], ["alertdialog", _alertdialogRole.default], ["application", _applicationRole.default], ["article", _articleRole.default], ["banner", _bannerRole.default], ["blockquote", _blockquoteRole.default], ["button", _buttonRole.default], ["caption", _captionRole.default], ["cell", _cellRole.default], ["checkbox", _checkboxRole.default], ["code", _codeRole.default], ["columnheader", _columnheaderRole.default], ["combobox", _comboboxRole.default], ["complementary", _complementaryRole.default], ["contentinfo", _contentinfoRole.default], ["definition", _definitionRole.default], ["deletion", _deletionRole.default], ["dialog", _dialogRole.default], ["directory", _directoryRole.default], ["document", _documentRole.default], ["emphasis", _emphasisRole.default], ["feed", _feedRole.default], ["figure", _figureRole.default], ["form", _formRole.default], ["generic", _genericRole.default], ["grid", _gridRole.default], ["gridcell", _gridcellRole.default], ["group", _groupRole.default], ["heading", _headingRole.default], ["img", _imgRole.default], ["insertion", _insertionRole.default], ["link", _linkRole.default], ["list", _listRole.default], ["listbox", _listboxRole.default], ["listitem", _listitemRole.default], ["log", _logRole.default], ["main", _mainRole.default], ["mark", _markRole.default], ["marquee", _marqueeRole.default], ["math", _mathRole.default], ["menu", _menuRole.default], ["menubar", _menubarRole.default], ["menuitem", _menuitemRole.default], ["menuitemcheckbox", _menuitemcheckboxRole.default], ["menuitemradio", _menuitemradioRole.default], ["meter", _meterRole.default], ["navigation", _navigationRole.default], ["none", _noneRole.default], ["note", _noteRole.default], ["option", _optionRole.default], ["paragraph", _paragraphRole.default], ["presentation", _presentationRole.default], ["progressbar", _progressbarRole.default], ["radio", _radioRole.default], ["radiogroup", _radiogroupRole.default], ["region", _regionRole.default], ["row", _rowRole.default], ["rowgroup", _rowgroupRole.default], ["rowheader", _rowheaderRole.default], ["scrollbar", _scrollbarRole.default], ["search", _searchRole.default], ["searchbox", _searchboxRole.default], ["separator", _separatorRole.default], ["slider", _sliderRole.default], ["spinbutton", _spinbuttonRole.default], ["status", _statusRole.default], ["strong", _strongRole.default], ["subscript", _subscriptRole.default], ["superscript", _superscriptRole.default], ["switch", _switchRole.default], ["tab", _tabRole.default], ["table", _tableRole.default], ["tablist", _tablistRole.default], ["tabpanel", _tabpanelRole.default], ["term", _termRole.default], ["textbox", _textboxRole.default], ["time", _timeRole.default], ["timer", _timerRole.default], ["toolbar", _toolbarRole.default], ["tooltip", _tooltipRole.default], ["tree", _treeRole.default], ["treegrid", _treegridRole.default], ["treeitem", _treeitemRole.default]];
      var _default = ariaLiteralRoles;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docAbstractRole.js
  var require_docAbstractRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docAbstractRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docAbstractRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "abstract [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docAbstractRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docAcknowledgmentsRole.js
  var require_docAcknowledgmentsRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docAcknowledgmentsRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docAcknowledgmentsRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "acknowledgments [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docAcknowledgmentsRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docAfterwordRole.js
  var require_docAfterwordRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docAfterwordRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docAfterwordRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "afterword [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docAfterwordRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docAppendixRole.js
  var require_docAppendixRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docAppendixRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docAppendixRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "appendix [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docAppendixRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docBacklinkRole.js
  var require_docBacklinkRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docBacklinkRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docBacklinkRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "referrer [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command", "link"]]
      };
      var _default = docBacklinkRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docBiblioentryRole.js
  var require_docBiblioentryRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docBiblioentryRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docBiblioentryRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "EPUB biblioentry [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: ["doc-bibliography"],
        requiredContextRole: ["doc-bibliography"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "listitem"]]
      };
      var _default = docBiblioentryRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docBibliographyRole.js
  var require_docBibliographyRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docBibliographyRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docBibliographyRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "bibliography [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["doc-biblioentry"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docBibliographyRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docBibliorefRole.js
  var require_docBibliorefRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docBibliorefRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docBibliorefRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "biblioref [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command", "link"]]
      };
      var _default = docBibliorefRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docChapterRole.js
  var require_docChapterRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docChapterRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docChapterRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "chapter [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docChapterRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docColophonRole.js
  var require_docColophonRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docColophonRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docColophonRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "colophon [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docColophonRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docConclusionRole.js
  var require_docConclusionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docConclusionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docConclusionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "conclusion [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docConclusionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docCoverRole.js
  var require_docCoverRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docCoverRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docCoverRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "cover [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "img"]]
      };
      var _default = docCoverRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docCreditRole.js
  var require_docCreditRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docCreditRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docCreditRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "credit [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docCreditRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docCreditsRole.js
  var require_docCreditsRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docCreditsRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docCreditsRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "credits [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docCreditsRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docDedicationRole.js
  var require_docDedicationRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docDedicationRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docDedicationRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "dedication [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docDedicationRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docEndnoteRole.js
  var require_docEndnoteRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docEndnoteRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docEndnoteRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "rearnote [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: ["doc-endnotes"],
        requiredContextRole: ["doc-endnotes"],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "listitem"]]
      };
      var _default = docEndnoteRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docEndnotesRole.js
  var require_docEndnotesRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docEndnotesRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docEndnotesRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "rearnotes [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["doc-endnote"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docEndnotesRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docEpigraphRole.js
  var require_docEpigraphRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docEpigraphRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docEpigraphRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "epigraph [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docEpigraphRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docEpilogueRole.js
  var require_docEpilogueRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docEpilogueRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docEpilogueRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "epilogue [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docEpilogueRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docErrataRole.js
  var require_docErrataRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docErrataRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docErrataRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "errata [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docErrataRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docExampleRole.js
  var require_docExampleRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docExampleRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docExampleRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docExampleRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docFootnoteRole.js
  var require_docFootnoteRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docFootnoteRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docFootnoteRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "footnote [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docFootnoteRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docForewordRole.js
  var require_docForewordRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docForewordRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docForewordRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "foreword [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docForewordRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docGlossaryRole.js
  var require_docGlossaryRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docGlossaryRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docGlossaryRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "glossary [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [["definition"], ["term"]],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docGlossaryRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docGlossrefRole.js
  var require_docGlossrefRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docGlossrefRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docGlossrefRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "glossref [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command", "link"]]
      };
      var _default = docGlossrefRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docIndexRole.js
  var require_docIndexRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docIndexRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docIndexRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "index [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
      };
      var _default = docIndexRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docIntroductionRole.js
  var require_docIntroductionRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docIntroductionRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docIntroductionRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "introduction [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docIntroductionRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docNoterefRole.js
  var require_docNoterefRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docNoterefRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docNoterefRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "noteref [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "widget", "command", "link"]]
      };
      var _default = docNoterefRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docNoticeRole.js
  var require_docNoticeRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docNoticeRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docNoticeRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "notice [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "note"]]
      };
      var _default = docNoticeRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPagebreakRole.js
  var require_docPagebreakRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPagebreakRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPagebreakRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "pagebreak [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "separator"]]
      };
      var _default = docPagebreakRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPagelistRole.js
  var require_docPagelistRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPagelistRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPagelistRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "page-list [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
      };
      var _default = docPagelistRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPartRole.js
  var require_docPartRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPartRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPartRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "part [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docPartRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPrefaceRole.js
  var require_docPrefaceRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPrefaceRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPrefaceRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "preface [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docPrefaceRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPrologueRole.js
  var require_docPrologueRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPrologueRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPrologueRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "prologue [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark"]]
      };
      var _default = docPrologueRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docPullquoteRole.js
  var require_docPullquoteRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docPullquoteRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docPullquoteRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {},
        relatedConcepts: [{
          concept: {
            name: "pullquote [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["none"]]
      };
      var _default = docPullquoteRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docQnaRole.js
  var require_docQnaRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docQnaRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docQnaRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "qna [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section"]]
      };
      var _default = docQnaRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docSubtitleRole.js
  var require_docSubtitleRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docSubtitleRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docSubtitleRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "subtitle [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "sectionhead"]]
      };
      var _default = docSubtitleRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docTipRole.js
  var require_docTipRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docTipRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docTipRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "help [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "note"]]
      };
      var _default = docTipRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/dpub/docTocRole.js
  var require_docTocRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/dpub/docTocRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var docTocRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          concept: {
            name: "toc [EPUB-SSV]"
          },
          module: "EPUB"
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
      };
      var _default = docTocRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/ariaDpubRoles.js
  var require_ariaDpubRoles = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/ariaDpubRoles.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _docAbstractRole = _interopRequireDefault(require_docAbstractRole());
      var _docAcknowledgmentsRole = _interopRequireDefault(require_docAcknowledgmentsRole());
      var _docAfterwordRole = _interopRequireDefault(require_docAfterwordRole());
      var _docAppendixRole = _interopRequireDefault(require_docAppendixRole());
      var _docBacklinkRole = _interopRequireDefault(require_docBacklinkRole());
      var _docBiblioentryRole = _interopRequireDefault(require_docBiblioentryRole());
      var _docBibliographyRole = _interopRequireDefault(require_docBibliographyRole());
      var _docBibliorefRole = _interopRequireDefault(require_docBibliorefRole());
      var _docChapterRole = _interopRequireDefault(require_docChapterRole());
      var _docColophonRole = _interopRequireDefault(require_docColophonRole());
      var _docConclusionRole = _interopRequireDefault(require_docConclusionRole());
      var _docCoverRole = _interopRequireDefault(require_docCoverRole());
      var _docCreditRole = _interopRequireDefault(require_docCreditRole());
      var _docCreditsRole = _interopRequireDefault(require_docCreditsRole());
      var _docDedicationRole = _interopRequireDefault(require_docDedicationRole());
      var _docEndnoteRole = _interopRequireDefault(require_docEndnoteRole());
      var _docEndnotesRole = _interopRequireDefault(require_docEndnotesRole());
      var _docEpigraphRole = _interopRequireDefault(require_docEpigraphRole());
      var _docEpilogueRole = _interopRequireDefault(require_docEpilogueRole());
      var _docErrataRole = _interopRequireDefault(require_docErrataRole());
      var _docExampleRole = _interopRequireDefault(require_docExampleRole());
      var _docFootnoteRole = _interopRequireDefault(require_docFootnoteRole());
      var _docForewordRole = _interopRequireDefault(require_docForewordRole());
      var _docGlossaryRole = _interopRequireDefault(require_docGlossaryRole());
      var _docGlossrefRole = _interopRequireDefault(require_docGlossrefRole());
      var _docIndexRole = _interopRequireDefault(require_docIndexRole());
      var _docIntroductionRole = _interopRequireDefault(require_docIntroductionRole());
      var _docNoterefRole = _interopRequireDefault(require_docNoterefRole());
      var _docNoticeRole = _interopRequireDefault(require_docNoticeRole());
      var _docPagebreakRole = _interopRequireDefault(require_docPagebreakRole());
      var _docPagelistRole = _interopRequireDefault(require_docPagelistRole());
      var _docPartRole = _interopRequireDefault(require_docPartRole());
      var _docPrefaceRole = _interopRequireDefault(require_docPrefaceRole());
      var _docPrologueRole = _interopRequireDefault(require_docPrologueRole());
      var _docPullquoteRole = _interopRequireDefault(require_docPullquoteRole());
      var _docQnaRole = _interopRequireDefault(require_docQnaRole());
      var _docSubtitleRole = _interopRequireDefault(require_docSubtitleRole());
      var _docTipRole = _interopRequireDefault(require_docTipRole());
      var _docTocRole = _interopRequireDefault(require_docTocRole());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var ariaDpubRoles = [["doc-abstract", _docAbstractRole.default], ["doc-acknowledgments", _docAcknowledgmentsRole.default], ["doc-afterword", _docAfterwordRole.default], ["doc-appendix", _docAppendixRole.default], ["doc-backlink", _docBacklinkRole.default], ["doc-biblioentry", _docBiblioentryRole.default], ["doc-bibliography", _docBibliographyRole.default], ["doc-biblioref", _docBibliorefRole.default], ["doc-chapter", _docChapterRole.default], ["doc-colophon", _docColophonRole.default], ["doc-conclusion", _docConclusionRole.default], ["doc-cover", _docCoverRole.default], ["doc-credit", _docCreditRole.default], ["doc-credits", _docCreditsRole.default], ["doc-dedication", _docDedicationRole.default], ["doc-endnote", _docEndnoteRole.default], ["doc-endnotes", _docEndnotesRole.default], ["doc-epigraph", _docEpigraphRole.default], ["doc-epilogue", _docEpilogueRole.default], ["doc-errata", _docErrataRole.default], ["doc-example", _docExampleRole.default], ["doc-footnote", _docFootnoteRole.default], ["doc-foreword", _docForewordRole.default], ["doc-glossary", _docGlossaryRole.default], ["doc-glossref", _docGlossrefRole.default], ["doc-index", _docIndexRole.default], ["doc-introduction", _docIntroductionRole.default], ["doc-noteref", _docNoterefRole.default], ["doc-notice", _docNoticeRole.default], ["doc-pagebreak", _docPagebreakRole.default], ["doc-pagelist", _docPagelistRole.default], ["doc-part", _docPartRole.default], ["doc-preface", _docPrefaceRole.default], ["doc-prologue", _docPrologueRole.default], ["doc-pullquote", _docPullquoteRole.default], ["doc-qna", _docQnaRole.default], ["doc-subtitle", _docSubtitleRole.default], ["doc-tip", _docTipRole.default], ["doc-toc", _docTocRole.default]];
      var _default = ariaDpubRoles;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsDocumentRole.js
  var require_graphicsDocumentRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsDocumentRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var graphicsDocumentRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          module: "GRAPHICS",
          concept: {
            name: "graphics-object"
          }
        }, {
          module: "ARIA",
          concept: {
            name: "img"
          }
        }, {
          module: "ARIA",
          concept: {
            name: "article"
          }
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "document"]]
      };
      var _default = graphicsDocumentRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsObjectRole.js
  var require_graphicsObjectRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsObjectRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var graphicsObjectRole = {
        abstract: false,
        accessibleNameRequired: false,
        baseConcepts: [],
        childrenPresentational: false,
        nameFrom: ["author", "contents"],
        prohibitedProps: [],
        props: {
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [{
          module: "GRAPHICS",
          concept: {
            name: "graphics-document"
          }
        }, {
          module: "ARIA",
          concept: {
            name: "group"
          }
        }, {
          module: "ARIA",
          concept: {
            name: "img"
          }
        }, {
          module: "GRAPHICS",
          concept: {
            name: "graphics-symbol"
          }
        }],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "group"]]
      };
      var _default = graphicsObjectRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsSymbolRole.js
  var require_graphicsSymbolRole = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/graphics/graphicsSymbolRole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var graphicsSymbolRole = {
        abstract: false,
        accessibleNameRequired: true,
        baseConcepts: [],
        childrenPresentational: true,
        nameFrom: ["author"],
        prohibitedProps: [],
        props: {
          "aria-disabled": null,
          "aria-errormessage": null,
          "aria-expanded": null,
          "aria-haspopup": null,
          "aria-invalid": null
        },
        relatedConcepts: [],
        requireContextRole: [],
        requiredContextRole: [],
        requiredOwnedElements: [],
        requiredProps: {},
        superClass: [["roletype", "structure", "section", "img"]]
      };
      var _default = graphicsSymbolRole;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/etc/roles/ariaGraphicsRoles.js
  var require_ariaGraphicsRoles = __commonJS({
    "../../../node_modules/aria-query/lib/etc/roles/ariaGraphicsRoles.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _graphicsDocumentRole = _interopRequireDefault(require_graphicsDocumentRole());
      var _graphicsObjectRole = _interopRequireDefault(require_graphicsObjectRole());
      var _graphicsSymbolRole = _interopRequireDefault(require_graphicsSymbolRole());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var ariaGraphicsRoles = [["graphics-document", _graphicsDocumentRole.default], ["graphics-object", _graphicsObjectRole.default], ["graphics-symbol", _graphicsSymbolRole.default]];
      var _default = ariaGraphicsRoles;
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/rolesMap.js
  var require_rolesMap = __commonJS({
    "../../../node_modules/aria-query/lib/rolesMap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _ariaAbstractRoles = _interopRequireDefault(require_ariaAbstractRoles());
      var _ariaLiteralRoles = _interopRequireDefault(require_ariaLiteralRoles());
      var _ariaDpubRoles = _interopRequireDefault(require_ariaDpubRoles());
      var _ariaGraphicsRoles = _interopRequireDefault(require_ariaGraphicsRoles());
      var _iterationDecorator = _interopRequireDefault(require_iterationDecorator());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _defineProperty4(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F2() {
            };
            return { s: F, n: function n() {
              if (i >= o.length) return { done: true };
              return { done: false, value: o[i++] };
            }, e: function e(_e2) {
              throw _e2;
            }, f: F };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return { s: function s() {
          it = it.call(o);
        }, n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        }, e: function e(_e3) {
          didErr = true;
          err = _e3;
        }, f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        } };
      }
      function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) {
          arr2[i] = arr[i];
        }
        return arr2;
      }
      function _iterableToArrayLimit(arr, i) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      var roles2 = [].concat(_ariaAbstractRoles.default, _ariaLiteralRoles.default, _ariaDpubRoles.default, _ariaGraphicsRoles.default);
      roles2.forEach(function(_ref) {
        var _ref2 = _slicedToArray(_ref, 2), roleDefinition = _ref2[1];
        var _iterator = _createForOfIteratorHelper(roleDefinition.superClass), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var superClassIter = _step.value;
            var _iterator2 = _createForOfIteratorHelper(superClassIter), _step2;
            try {
              var _loop = function _loop2() {
                var superClassName = _step2.value;
                var superClassRoleTuple = roles2.find(function(_ref3) {
                  var _ref4 = _slicedToArray(_ref3, 1), name = _ref4[0];
                  return name === superClassName;
                });
                if (superClassRoleTuple) {
                  var superClassDefinition = superClassRoleTuple[1];
                  for (var _i2 = 0, _Object$keys = Object.keys(superClassDefinition.props); _i2 < _Object$keys.length; _i2++) {
                    var prop = _Object$keys[_i2];
                    if (
                      // $FlowIssue Accessing the hasOwnProperty on the Object prototype is fine.
                      !Object.prototype.hasOwnProperty.call(roleDefinition.props, prop)
                    ) {
                      Object.assign(roleDefinition.props, _defineProperty4({}, prop, superClassDefinition.props[prop]));
                    }
                  }
                }
              };
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                _loop();
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
      var rolesMap = {
        entries: function entries() {
          return roles2;
        },
        forEach: function forEach(fn) {
          var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
          var _iterator3 = _createForOfIteratorHelper(roles2), _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
              var _step3$value = _slicedToArray(_step3.value, 2), key = _step3$value[0], values = _step3$value[1];
              fn.call(thisArg, values, key, roles2);
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        },
        get: function get(key) {
          var item = roles2.find(function(tuple) {
            return tuple[0] === key ? true : false;
          });
          return item && item[1];
        },
        has: function has(key) {
          return !!rolesMap.get(key);
        },
        keys: function keys() {
          return roles2.map(function(_ref5) {
            var _ref6 = _slicedToArray(_ref5, 1), key = _ref6[0];
            return key;
          });
        },
        values: function values() {
          return roles2.map(function(_ref7) {
            var _ref8 = _slicedToArray(_ref7, 2), values2 = _ref8[1];
            return values2;
          });
        }
      };
      var _default = (0, _iterationDecorator.default)(rolesMap, rolesMap.entries());
      exports.default = _default;
    }
  });

  // ../../../node_modules/dequal/lite/index.js
  var require_lite = __commonJS({
    "../../../node_modules/dequal/lite/index.js"(exports) {
      var has = Object.prototype.hasOwnProperty;
      function dequal(foo, bar) {
        var ctor, len;
        if (foo === bar) return true;
        if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
          if (ctor === Date) return foo.getTime() === bar.getTime();
          if (ctor === RegExp) return foo.toString() === bar.toString();
          if (ctor === Array) {
            if ((len = foo.length) === bar.length) {
              while (len-- && dequal(foo[len], bar[len])) ;
            }
            return len === -1;
          }
          if (!ctor || typeof foo === "object") {
            len = 0;
            for (ctor in foo) {
              if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
              if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
            }
            return Object.keys(bar).length === len;
          }
        }
        return foo !== foo && bar !== bar;
      }
      exports.dequal = dequal;
    }
  });

  // ../../../node_modules/aria-query/lib/elementRoleMap.js
  var require_elementRoleMap = __commonJS({
    "../../../node_modules/aria-query/lib/elementRoleMap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _lite = require_lite();
      var _iterationDecorator = _interopRequireDefault(require_iterationDecorator());
      var _rolesMap = _interopRequireDefault(require_rolesMap());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _slicedToArray(arr, i2) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i2) || _unsupportedIterableToArray(arr, i2) || _nonIterableRest();
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _iterableToArrayLimit(arr, i2) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i2 && _arr.length === i2) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i2 = 0;
            var F = function F2() {
            };
            return { s: F, n: function n() {
              if (i2 >= o.length) return { done: true };
              return { done: false, value: o[i2++] };
            }, e: function e(_e2) {
              throw _e2;
            }, f: F };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return { s: function s() {
          it = it.call(o);
        }, n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        }, e: function e(_e3) {
          didErr = true;
          err = _e3;
        }, f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        } };
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++) {
          arr2[i2] = arr[i2];
        }
        return arr2;
      }
      var elementRoles2 = [];
      var keys = _rolesMap.default.keys();
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        role = _rolesMap.default.get(key);
        if (role) {
          concepts = [].concat(role.baseConcepts, role.relatedConcepts);
          for (k = 0; k < concepts.length; k++) {
            relation = concepts[k];
            if (relation.module === "HTML") {
              (function() {
                var concept = relation.concept;
                if (concept) {
                  var elementRoleRelation = elementRoles2.find(function(relation2) {
                    return (0, _lite.dequal)(relation2, concept);
                  });
                  var roles2;
                  if (elementRoleRelation) {
                    roles2 = elementRoleRelation[1];
                  } else {
                    roles2 = [];
                  }
                  var isUnique = true;
                  for (var _i = 0; _i < roles2.length; _i++) {
                    if (roles2[_i] === key) {
                      isUnique = false;
                      break;
                    }
                  }
                  if (isUnique) {
                    roles2.push(key);
                  }
                  elementRoles2.push([concept, roles2]);
                }
              })();
            }
          }
        }
      }
      var key;
      var role;
      var concepts;
      var relation;
      var k;
      var i;
      var elementRoleMap = {
        entries: function entries() {
          return elementRoles2;
        },
        forEach: function forEach(fn) {
          var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
          var _iterator = _createForOfIteratorHelper(elementRoles2), _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var _step$value = _slicedToArray(_step.value, 2), _key = _step$value[0], values = _step$value[1];
              fn.call(thisArg, values, _key, elementRoles2);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        },
        get: function get(key2) {
          var item = elementRoles2.find(function(tuple) {
            return key2.name === tuple[0].name && (0, _lite.dequal)(key2.attributes, tuple[0].attributes);
          });
          return item && item[1];
        },
        has: function has(key2) {
          return !!elementRoleMap.get(key2);
        },
        keys: function keys2() {
          return elementRoles2.map(function(_ref) {
            var _ref2 = _slicedToArray(_ref, 1), key2 = _ref2[0];
            return key2;
          });
        },
        values: function values() {
          return elementRoles2.map(function(_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2), values2 = _ref4[1];
            return values2;
          });
        }
      };
      var _default = (0, _iterationDecorator.default)(elementRoleMap, elementRoleMap.entries());
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/roleElementMap.js
  var require_roleElementMap = __commonJS({
    "../../../node_modules/aria-query/lib/roleElementMap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;
      var _iterationDecorator = _interopRequireDefault(require_iterationDecorator());
      var _rolesMap = _interopRequireDefault(require_rolesMap());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _slicedToArray(arr, i2) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i2) || _unsupportedIterableToArray(arr, i2) || _nonIterableRest();
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _iterableToArrayLimit(arr, i2) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i2 && _arr.length === i2) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
        if (!it) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i2 = 0;
            var F = function F2() {
            };
            return { s: F, n: function n() {
              if (i2 >= o.length) return { done: true };
              return { done: false, value: o[i2++] };
            }, e: function e(_e2) {
              throw _e2;
            }, f: F };
          }
          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return { s: function s() {
          it = it.call(o);
        }, n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        }, e: function e(_e3) {
          didErr = true;
          err = _e3;
        }, f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        } };
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++) {
          arr2[i2] = arr[i2];
        }
        return arr2;
      }
      var roleElement = [];
      var keys = _rolesMap.default.keys();
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        role = _rolesMap.default.get(key);
        relationConcepts = [];
        if (role) {
          concepts = [].concat(role.baseConcepts, role.relatedConcepts);
          for (k = 0; k < concepts.length; k++) {
            relation = concepts[k];
            if (relation.module === "HTML") {
              concept = relation.concept;
              if (concept != null) {
                relationConcepts.push(concept);
              }
            }
          }
          if (relationConcepts.length > 0) {
            roleElement.push([key, relationConcepts]);
          }
        }
      }
      var key;
      var role;
      var relationConcepts;
      var concepts;
      var relation;
      var concept;
      var k;
      var i;
      var roleElementMap = {
        entries: function entries() {
          return roleElement;
        },
        forEach: function forEach(fn) {
          var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
          var _iterator = _createForOfIteratorHelper(roleElement), _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var _step$value = _slicedToArray(_step.value, 2), _key = _step$value[0], values = _step$value[1];
              fn.call(thisArg, values, _key, roleElement);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        },
        get: function get(key2) {
          var item = roleElement.find(function(tuple) {
            return tuple[0] === key2 ? true : false;
          });
          return item && item[1];
        },
        has: function has(key2) {
          return !!roleElementMap.get(key2);
        },
        keys: function keys2() {
          return roleElement.map(function(_ref) {
            var _ref2 = _slicedToArray(_ref, 1), key2 = _ref2[0];
            return key2;
          });
        },
        values: function values() {
          return roleElement.map(function(_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2), values2 = _ref4[1];
            return values2;
          });
        }
      };
      var _default = (0, _iterationDecorator.default)(roleElementMap, roleElementMap.entries());
      exports.default = _default;
    }
  });

  // ../../../node_modules/aria-query/lib/index.js
  var require_lib2 = __commonJS({
    "../../../node_modules/aria-query/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.roles = exports.roleElements = exports.elementRoles = exports.dom = exports.aria = void 0;
      var _ariaPropsMap = _interopRequireDefault(require_ariaPropsMap());
      var _domMap = _interopRequireDefault(require_domMap());
      var _rolesMap = _interopRequireDefault(require_rolesMap());
      var _elementRoleMap = _interopRequireDefault(require_elementRoleMap());
      var _roleElementMap = _interopRequireDefault(require_roleElementMap());
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var aria = _ariaPropsMap.default;
      exports.aria = aria;
      var dom = _domMap.default;
      exports.dom = dom;
      var roles2 = _rolesMap.default;
      exports.roles = roles2;
      var elementRoles2 = _elementRoleMap.default;
      exports.elementRoles = elementRoles2;
      var roleElements2 = _roleElementMap.default;
      exports.roleElements = roleElements2;
    }
  });

  // ../../../node_modules/lz-string/libs/lz-string.js
  var require_lz_string = __commonJS({
    "../../../node_modules/lz-string/libs/lz-string.js"(exports, module2) {
      var LZString = (function() {
        var f = String.fromCharCode;
        var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        var baseReverseDic = {};
        function getBaseValue(alphabet, character) {
          if (!baseReverseDic[alphabet]) {
            baseReverseDic[alphabet] = {};
            for (var i = 0; i < alphabet.length; i++) {
              baseReverseDic[alphabet][alphabet.charAt(i)] = i;
            }
          }
          return baseReverseDic[alphabet][character];
        }
        var LZString2 = {
          compressToBase64: function(input) {
            if (input == null) return "";
            var res = LZString2._compress(input, 6, function(a) {
              return keyStrBase64.charAt(a);
            });
            switch (res.length % 4) {
              // To produce valid Base64
              default:
              // When could this happen ?
              case 0:
                return res;
              case 1:
                return res + "===";
              case 2:
                return res + "==";
              case 3:
                return res + "=";
            }
          },
          decompressFromBase64: function(input) {
            if (input == null) return "";
            if (input == "") return null;
            return LZString2._decompress(input.length, 32, function(index) {
              return getBaseValue(keyStrBase64, input.charAt(index));
            });
          },
          compressToUTF16: function(input) {
            if (input == null) return "";
            return LZString2._compress(input, 15, function(a) {
              return f(a + 32);
            }) + " ";
          },
          decompressFromUTF16: function(compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString2._decompress(compressed.length, 16384, function(index) {
              return compressed.charCodeAt(index) - 32;
            });
          },
          //compress into uint8array (UCS-2 big endian format)
          compressToUint8Array: function(uncompressed) {
            var compressed = LZString2.compress(uncompressed);
            var buf = new Uint8Array(compressed.length * 2);
            for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
              var current_value = compressed.charCodeAt(i);
              buf[i * 2] = current_value >>> 8;
              buf[i * 2 + 1] = current_value % 256;
            }
            return buf;
          },
          //decompress from uint8array (UCS-2 big endian format)
          decompressFromUint8Array: function(compressed) {
            if (compressed === null || compressed === void 0) {
              return LZString2.decompress(compressed);
            } else {
              var buf = new Array(compressed.length / 2);
              for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
              }
              var result = [];
              buf.forEach(function(c) {
                result.push(f(c));
              });
              return LZString2.decompress(result.join(""));
            }
          },
          //compress into a string that is already URI encoded
          compressToEncodedURIComponent: function(input) {
            if (input == null) return "";
            return LZString2._compress(input, 6, function(a) {
              return keyStrUriSafe.charAt(a);
            });
          },
          //decompress from an output of compressToEncodedURIComponent
          decompressFromEncodedURIComponent: function(input) {
            if (input == null) return "";
            if (input == "") return null;
            input = input.replace(/ /g, "+");
            return LZString2._decompress(input.length, 32, function(index) {
              return getBaseValue(keyStrUriSafe, input.charAt(index));
            });
          },
          compress: function(uncompressed) {
            return LZString2._compress(uncompressed, 16, function(a) {
              return f(a);
            });
          },
          _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
            for (ii = 0; ii < uncompressed.length; ii += 1) {
              context_c = uncompressed.charAt(ii);
              if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                context_dictionary[context_c] = context_dictSize++;
                context_dictionaryToCreate[context_c] = true;
              }
              context_wc = context_w + context_c;
              if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                context_w = context_wc;
              } else {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                  if (context_w.charCodeAt(0) < 256) {
                    for (i = 0; i < context_numBits; i++) {
                      context_data_val = context_data_val << 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 8; i++) {
                      context_data_val = context_data_val << 1 | value & 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value = value >> 1;
                    }
                  } else {
                    value = 1;
                    for (i = 0; i < context_numBits; i++) {
                      context_data_val = context_data_val << 1 | value;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value = 0;
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 16; i++) {
                      context_data_val = context_data_val << 1 | value & 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value = value >> 1;
                    }
                  }
                  context_enlargeIn--;
                  if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                  }
                  delete context_dictionaryToCreate[context_w];
                } else {
                  value = context_dictionary[context_w];
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                context_dictionary[context_wc] = context_dictSize++;
                context_w = String(context_c);
              }
            }
            if (context_w !== "") {
              if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 8; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                } else {
                  value = 1;
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = 0;
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 16; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
              } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
            }
            value = 2;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1 | value & 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
            while (true) {
              context_data_val = context_data_val << 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data.push(getCharFromInt(context_data_val));
                break;
              } else context_data_position++;
            }
            return context_data.join("");
          },
          decompress: function(compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString2._decompress(compressed.length, 32768, function(index) {
              return compressed.charCodeAt(index);
            });
          },
          _decompress: function(length, resetValue, getNextValue) {
            var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
            for (i = 0; i < 3; i += 1) {
              dictionary[i] = i;
            }
            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            switch (next = bits) {
              case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                c = f(bits);
                break;
              case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                c = f(bits);
                break;
              case 2:
                return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
              if (data.index > length) {
                return "";
              }
              bits = 0;
              maxpower = Math.pow(2, numBits);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              switch (c = bits) {
                case 0:
                  bits = 0;
                  maxpower = Math.pow(2, 8);
                  power = 1;
                  while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                      data.position = resetValue;
                      data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                  }
                  dictionary[dictSize++] = f(bits);
                  c = dictSize - 1;
                  enlargeIn--;
                  break;
                case 1:
                  bits = 0;
                  maxpower = Math.pow(2, 16);
                  power = 1;
                  while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                      data.position = resetValue;
                      data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                  }
                  dictionary[dictSize++] = f(bits);
                  c = dictSize - 1;
                  enlargeIn--;
                  break;
                case 2:
                  return result.join("");
              }
              if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
              }
              if (dictionary[c]) {
                entry = dictionary[c];
              } else {
                if (c === dictSize) {
                  entry = w + w.charAt(0);
                } else {
                  return null;
                }
              }
              result.push(entry);
              dictionary[dictSize++] = w + entry.charAt(0);
              enlargeIn--;
              w = entry;
              if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
              }
            }
          }
        };
        return LZString2;
      })();
      if (typeof define === "function" && define.amd) {
        define(function() {
          return LZString;
        });
      } else if (typeof module2 !== "undefined" && module2 != null) {
        module2.exports = LZString;
      } else if (typeof angular !== "undefined" && angular != null) {
        angular.module("LZString", []).factory("LZString", function() {
          return LZString;
        });
      }
    }
  });

  // source/browserGlobalShim.js
  globalThis.global ||= globalThis;

  // ContextLifecycle/ContextScanner.js
  var ContextScanner = class {
    constructor(rootDoc = document, rootWin = window, options = {}) {
      this.options = {
        preferTopWindow: true,
        waitForDynamicFrames: true,
        quietTime: 800,
        maxWait: 8e3,
        ...options
      };
      const resolvedRoot = this.resolveRootContext(rootDoc, rootWin);
      this.rootDocument = resolvedRoot.document;
      this.rootWindow = resolvedRoot.window;
      this.contextCounter = 0;
    }
    async scanAllContextsAsync() {
      if (this.options.waitForDynamicFrames) {
        await this.waitForFramesOrStable(this.rootDocument, {
          quietTime: this.options.quietTime,
          maxWait: this.options.maxWait
        });
      }
      return this.scanAllContexts();
    }
    scanAllContexts() {
      const rootContext = this.createPageContext();
      const contexts = [rootContext];
      const contextMap = {
        [rootContext.contextId]: rootContext
      };
      this.scanChildFrames(rootContext, contexts, contextMap);
      return {
        rootContext,
        contexts,
        contextMap
      };
    }
    resolveRootContext(rootDoc, rootWin) {
      if (!this.options.preferTopWindow) {
        return {
          document: rootDoc || document,
          window: rootWin || window
        };
      }
      try {
        if (rootWin && rootWin.top && rootWin.top !== rootWin) {
          return {
            document: rootWin.top.document,
            window: rootWin.top
          };
        }
      } catch (error) {
        console.warn("\u7121\u6CD5\u63D0\u5347\u5230 top window\uFF0C\u6539\u7528\u76EE\u524D window", error);
      }
      return {
        document: rootDoc || document,
        window: rootWin || window
      };
    }
    createPageContext() {
      return {
        contextId: this.createContextId("page"),
        type: "page",
        name: "page",
        parentContextId: null,
        openerContextId: null,
        windowRef: this.rootWindow || null,
        documentRef: this.rootDocument || null,
        frameElement: null,
        frameSelector: null,
        url: this.safeGetUrl(this.rootWindow),
        children: []
      };
    }
    scanChildFrames(parentContext, contexts, contextMap) {
      const parentDoc = parentContext?.documentRef;
      if (!parentDoc) return;
      const frameElements = this.collectFrameElementsDeep(parentDoc);
      frameElements.forEach((frameEl, index) => {
        const frameSelector = this.buildFrameSelector(frameEl, index);
        console.log("[Debug ContextScanner] scanning iframe", this.getFrameDebugInfo(frameEl, index, frameSelector));
        const frameWin = this.safeGetFrameWindow(frameEl);
        const frameDoc = this.safeGetFrameDocument(frameWin, frameEl, index, frameSelector);
        const frameContext = {
          contextId: this.createContextId("iframe"),
          type: "iframe",
          name: `${parentContext.name}_iframe_${index}`,
          parentContextId: parentContext.contextId,
          openerContextId: null,
          windowRef: frameWin,
          documentRef: frameDoc,
          frameElement: frameEl,
          frameSelector,
          url: this.safeGetUrl(frameWin),
          children: []
        };
        parentContext.children.push(frameContext.contextId);
        contexts.push(frameContext);
        contextMap[frameContext.contextId] = frameContext;
        if (frameDoc) {
          this.scanChildFrames(frameContext, contexts, contextMap);
        }
      });
    }
    collectFrameElementsDeep(rootNode) {
      const results = [];
      const visitedShadowRoots = /* @__PURE__ */ new WeakSet();
      const walk = (node) => {
        if (!node) return;
        if (node.querySelectorAll) {
          const localFrames = Array.from(node.querySelectorAll("iframe, frame"));
          results.push(...localFrames);
        }
        const walker = node.ownerDocument ? node.ownerDocument.createTreeWalker(
          node,
          NodeFilter.SHOW_ELEMENT
        ) : document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
        let current = walker.currentNode;
        while (current) {
          if (current.shadowRoot && !visitedShadowRoots.has(current.shadowRoot)) {
            visitedShadowRoots.add(current.shadowRoot);
            walk(current.shadowRoot);
          }
          current = walker.nextNode();
        }
      };
      walk(rootNode);
      return Array.from(new Set(results));
    }
    buildFrameSelector(frameEl, index = 0) {
      if (!frameEl) return null;
      const escapeCss = (value) => {
        if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
        return String(value).replace(/"/g, '\\"');
      };
      const tagName2 = (frameEl.tagName || "iframe").toLowerCase();
      if (frameEl.id) {
        return `${tagName2}#${escapeCss(frameEl.id)}`;
      }
      if (frameEl.name) {
        return `${tagName2}[name="${escapeCss(frameEl.name)}"]`;
      }
      const title = frameEl.getAttribute("title");
      if (title) {
        return `${tagName2}[title="${escapeCss(title)}"]`;
      }
      const testId = frameEl.getAttribute("data-testid");
      if (testId) {
        return `${tagName2}[data-testid="${escapeCss(testId)}"]`;
      }
      const containerSelector = this.buildStableAncestorSelector(frameEl);
      if (containerSelector) {
        return `${containerSelector} ${tagName2}`;
      }
      const src = frameEl.getAttribute("src");
      if (src) {
        return `${tagName2}[src="${escapeCss(src)}"]`;
      }
      return `${tagName2}:nth-of-type(${index + 1})`;
    }
    buildStableAncestorSelector(frameEl) {
      const escapeCss = (value) => {
        if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
        return String(value).replace(/"/g, '\\"');
      };
      let current = frameEl?.parentElement;
      while (current && current !== this.rootDocument?.documentElement) {
        const tagName2 = (current.tagName || "").toLowerCase();
        if (current.id && !this.isLikelyDynamicValue(current.id)) {
          return `#${escapeCss(current.id)}`;
        }
        const testId = current.getAttribute?.("data-testid");
        if (testId) {
          return `${tagName2}[data-testid="${escapeCss(testId)}"]`;
        }
        const stableDataAttr = this.getStableDataAttributeSelector(current, tagName2, escapeCss);
        if (stableDataAttr) {
          return stableDataAttr;
        }
        const classSelector = this.getStableClassSelector(current, tagName2, escapeCss);
        if (classSelector) {
          return classSelector;
        }
        current = current.parentElement;
      }
      return null;
    }
    getStableDataAttributeSelector(element, tagName2, escapeCss) {
      const ignored = /* @__PURE__ */ new Set(["style", "class", "id"]);
      for (const attr2 of Array.from(element.attributes || [])) {
        if (!attr2.name.startsWith("data-") || ignored.has(attr2.name)) continue;
        if (!attr2.value || this.isLikelyDynamicValue(attr2.value)) continue;
        return `${tagName2}[${attr2.name}="${escapeCss(attr2.value)}"]`;
      }
      return null;
    }
    getStableClassSelector(element, tagName2, escapeCss) {
      const stableClasses = Array.from(element.classList || []).filter((className2) => !this.isLikelyDynamicValue(className2));
      if (!stableClasses.length) return null;
      return `${tagName2}.${stableClasses.map(escapeCss).join(".")}`;
    }
    isLikelyDynamicValue(value) {
      const text = String(value || "").trim();
      if (!text) return true;
      return /\d{4,}/.test(text) || /[a-f0-9]{8,}/i.test(text) || /^(active|selected|open|show|hidden|visible|disabled)$/i.test(text);
    }
    createContextId(type) {
      const id = `ctx_${type}_${this.contextCounter}`;
      this.contextCounter += 1;
      return id;
    }
    safeGetFrameWindow(frameEl) {
      try {
        return frameEl?.contentWindow || null;
      } catch (error) {
        console.warn("\u7121\u6CD5\u53D6\u5F97 iframe.contentWindow", error);
        return null;
      }
    }
    safeGetFrameDocument(frameWin, frameEl = null, index = 0, frameSelector = null) {
      try {
        return frameWin?.document || null;
      } catch (error) {
        console.warn("[Debug ContextScanner] Failed to access iframe.document", {
          frame: this.getFrameDebugInfo(frameEl, index, frameSelector),
          frameUrl: this.safeGetUrl(frameWin),
          errorName: error?.name,
          errorMessage: error?.message,
          error
        });
        return null;
      }
    }
    getFrameDebugInfo(frameEl, index = 0, frameSelector = null) {
      if (!frameEl) return null;
      return {
        index,
        id: frameEl.id || null,
        name: frameEl.name || null,
        title: frameEl.getAttribute?.("title") || null,
        src: frameEl.getAttribute?.("src") || null,
        resolvedSrc: frameEl.src || null,
        selector: frameSelector || this.buildFrameSelector(frameEl, index),
        tagName: frameEl.tagName || null
      };
    }
    safeGetUrl(win) {
      try {
        return win?.location?.href || null;
      } catch (error) {
        return null;
      }
    }
    waitForFramesOrStable(doc, { quietTime = 800, maxWait = 8e3 } = {}) {
      return new Promise((resolve) => {
        if (!doc) {
          resolve();
          return;
        }
        let quietTimer = null;
        let maxTimer = null;
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          observer.disconnect();
          clearTimeout(quietTimer);
          clearTimeout(maxTimer);
          resolve();
        };
        const hasAnyFrameNow = () => {
          try {
            return this.collectFrameElementsDeep(doc).length > 0;
          } catch (error) {
            return false;
          }
        };
        const resetQuietTimer = () => {
          clearTimeout(quietTimer);
          quietTimer = setTimeout(() => {
            finish();
          }, quietTime);
        };
        const observer = new MutationObserver(() => {
          resetQuietTimer();
          if (hasAnyFrameNow()) {
            resetQuietTimer();
          }
        });
        observer.observe(doc, {
          childList: true,
          subtree: true,
          attributes: true
        });
        resetQuietTimer();
        maxTimer = setTimeout(() => {
          finish();
        }, maxWait);
      });
    }
    // 視覺化顯示目前已經建立的 Tree
    printContextTree(rootContext, contextMap, depth = 0) {
      const indent = "  ".repeat(depth);
      console.log(
        `${indent}- ${rootContext.name} [${rootContext.type}] (${rootContext.contextId})`
      );
      rootContext.children.forEach((childId) => {
        const child = contextMap[childId];
        if (child) {
          this.printContextTree(child, contextMap, depth + 1);
        }
      });
    }
    debugTable(contexts) {
      console.table(
        contexts.map((ctx) => ({
          contextId: ctx.contextId,
          type: ctx.type,
          name: ctx.name,
          parentContextId: ctx.parentContextId,
          frameSelector: ctx.frameSelector,
          hasWindow: !!ctx.windowRef,
          hasDocument: !!ctx.documentRef,
          childrenCount: ctx.children.length,
          url: ctx.url,
          frameTitle: ctx.frameElement?.getAttribute?.("title") || null,
          frameSrc: ctx.frameElement?.getAttribute?.("src") || null
        }))
      );
    }
  };

  // ContextLifecycle/ContextRegistry.js
  var ContextRegistry = class {
    constructor() {
      this.contextMap = /* @__PURE__ */ new Map();
    }
    // ===== 註冊 =====
    register(context) {
      if (!context?.contextId) return null;
      const normalizedContext = {
        children: [],
        ...context
      };
      if (!Array.isArray(normalizedContext.children)) {
        normalizedContext.children = [];
      }
      this.contextMap.set(normalizedContext.contextId, normalizedContext);
      return normalizedContext;
    }
    registerMany(contexts = []) {
      const results = [];
      contexts.forEach((context) => {
        const registered = this.register(context);
        if (registered) {
          results.push(registered);
        }
      });
      return results;
    }
    // ===== 查詢 =====
    hasContext(contextId) {
      if (!contextId) return false;
      return this.contextMap.has(contextId);
    }
    getContext(contextId) {
      if (!contextId) return null;
      return this.contextMap.get(contextId) || null;
    }
    getAllContexts() {
      return Array.from(this.contextMap.values());
    }
    getContextsByType(type) {
      return this.getAllContexts().filter((ctx) => ctx.type === type);
    }
    getRootContexts() {
      return this.getAllContexts().filter((ctx) => !ctx.parentContextId);
    }
    // ===== 關係查詢 =====
    getParent(contextId) {
      const context = this.getContext(contextId);
      if (!context?.parentContextId) return null;
      return this.getContext(context.parentContextId);
    }
    getChildren(contextId) {
      const context = this.getContext(contextId);
      if (!context || !Array.isArray(context.children)) return [];
      return context.children.map((childId) => this.getContext(childId)).filter(Boolean);
    }
    getPath(contextId) {
      const path = [];
      let current = this.getContext(contextId);
      while (current) {
        path.unshift(current);
        if (!current.parentContextId) break;
        current = this.getContext(current.parentContextId);
      }
      return path;
    }
    getPathIds(contextId) {
      return this.getPath(contextId).map((ctx) => ctx.contextId);
    }
    getPathNames(contextId) {
      return this.getPath(contextId).map((ctx) => ctx.name);
    }
    // ===== 更新 =====
    updateContext(contextId, patch = {}) {
      const existing = this.getContext(contextId);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...patch
      };
      if (!Array.isArray(updated.children)) {
        updated.children = [];
      }
      this.contextMap.set(contextId, updated);
      return updated;
    }
    // ===== 刪除 =====
    removeContext(contextId) {
      const target = this.getContext(contextId);
      if (!target) return false;
      if (target.parentContextId) {
        const parent = this.getContext(target.parentContextId);
        if (parent) {
          parent.children = parent.children.filter((id) => id !== contextId);
          this.contextMap.set(parent.contextId, parent);
        }
      }
      const children = [...target.children || []];
      children.forEach((childId) => {
        this.removeContext(childId);
      });
      this.contextMap.delete(contextId);
      return true;
    }
    clear() {
      this.contextMap.clear();
    }
    // ===== debug =====
    printTree() {
      const roots = this.getRootContexts();
      roots.forEach((root) => {
        this.printSubTree(root.contextId, 0);
      });
    }
    printSubTree(contextId, depth = 0) {
      const context = this.getContext(contextId);
      if (!context) return;
      const indent = "  ".repeat(depth);
      console.log(
        `${indent}- ${context.name} [${context.type}] (${context.contextId})`
      );
      (context.children || []).forEach((childId) => {
        this.printSubTree(childId, depth + 1);
      });
    }
  };

  // RecorderStore.js
  var RecorderStore = class {
    constructor() {
      this.state = {
        isRecording: true,
        // 錄製結果
        actions: [],
        currentActionIndex: 0,
        // 已初始化的 listener
        activeListenerContextIds: /* @__PURE__ */ new Set(),
        // context 註冊資訊（先簡單存，之後可交給 ContextRegistry）
        contexts: /* @__PURE__ */ new Map(),
        // 當前動作相關
        currentAction: null,
        lastAction: null,
        // input / click / dblclick / debounce 暫存
        pendingActionTimers: /* @__PURE__ */ new Map(),
        // drag session
        dragSession: {
          isDragging: false,
          sourceContextId: null,
          sourceElementInfo: null,
          targetContextId: null,
          targetElementInfo: null
        },
        // popup 狀態
        pendingPopup: null,
        // 通知訂閱者用
        subscribers: /* @__PURE__ */ new Set()
      };
    }
    // ===== 基本讀取 =====
    getState() {
      return this.state;
    }
    getActions() {
      return this.state.actions;
    }
    getCurrentAction() {
      return this.state.currentAction;
    }
    getLastAction() {
      return this.state.lastAction;
    }
    isRecording() {
      return this.state.isRecording;
    }
    // ===== 訂閱 / 通知 =====
    subscribe(callback) {
      if (typeof callback !== "function") return () => {
      };
      this.state.subscribers.add(callback);
      return () => {
        this.state.subscribers.delete(callback);
      };
    }
    notify() {
      this.state.subscribers.forEach((callback) => {
        try {
          callback(this.state);
        } catch (error) {
          console.error("RecorderStore subscriber error:", error);
        }
      });
    }
    // ===== 錄製開關 =====
    setRecording(value) {
      this.state.isRecording = !!value;
      this.notify();
    }
    // ===== Action 管理 =====
    addAction(action) {
      if (!action || typeof action !== "object") return null;
      const normalizedAction = {
        id: `action_${this.state.currentActionIndex}`,
        index: this.state.currentActionIndex,
        timestamp: Date.now(),
        ...action
      };
      this.state.actions.push(normalizedAction);
      this.state.lastAction = normalizedAction;
      this.state.currentAction = normalizedAction;
      this.state.currentActionIndex += 1;
      this.notify();
      return normalizedAction;
    }
    removeLastAction() {
      const removedAction = this.state.actions.pop() || null;
      this.state.lastAction = this.state.actions[this.state.actions.length - 1] || null;
      this.state.currentAction = this.state.lastAction;
      this.notify();
      return removedAction;
    }
    updateCurrentAction(patch) {
      if (!this.state.currentAction || !patch || typeof patch !== "object") return;
      Object.assign(this.state.currentAction, patch);
      this.state.lastAction = this.state.currentAction;
      this.notify();
    }
    setCurrentAction(action) {
      this.state.currentAction = action || null;
      if (action) {
        this.state.lastAction = action;
      }
      this.notify();
    }
    clearCurrentAction() {
      this.state.currentAction = null;
      this.notify();
    }
    clearActions() {
      this.state.actions = [];
      this.state.currentActionIndex = 0;
      this.state.currentAction = null;
      this.state.lastAction = null;
      this.notify();
    }
    // ===== Listener 管理 =====
    hasListener(contextId) {
      if (!contextId) return false;
      return this.state.activeListenerContextIds.has(contextId);
    }
    registerListener(contextId) {
      if (!contextId) return;
      this.state.activeListenerContextIds.add(contextId);
      this.notify();
    }
    unregisterListener(contextId) {
      if (!contextId) return;
      this.state.activeListenerContextIds.delete(contextId);
      this.notify();
    }
    clearListeners() {
      this.state.activeListenerContextIds.clear();
      this.notify();
    }
    // ===== Context 管理 =====
    registerContext(context) {
      if (!context?.contextId) return;
      this.state.contexts.set(context.contextId, context);
      this.notify();
    }
    registerContexts(contexts = []) {
      contexts.forEach((context) => this.registerContext(context));
    }
    getContext(contextId) {
      if (!contextId) return null;
      return this.state.contexts.get(contextId) || null;
    }
    getAllContexts() {
      return Array.from(this.state.contexts.values());
    }
    removeContext(contextId) {
      if (!contextId) return;
      this.state.contexts.delete(contextId);
      this.state.activeListenerContextIds.delete(contextId);
      this.notify();
    }
    clearContexts() {
      this.state.contexts.clear();
      this.state.activeListenerContextIds.clear();
      this.notify();
    }
    // ===== Timer / debounce 管理 =====
    setPendingTimer(key, timerId) {
      if (!key) return;
      this.clearPendingTimer(key);
      this.state.pendingActionTimers.set(key, timerId);
    }
    getPendingTimer(key) {
      if (!key) return null;
      return this.state.pendingActionTimers.get(key) || null;
    }
    clearPendingTimer(key) {
      if (!key) return;
      const timerId = this.state.pendingActionTimers.get(key);
      if (timerId) {
        clearTimeout(timerId);
      }
      this.state.pendingActionTimers.delete(key);
    }
    clearAllPendingTimers() {
      this.state.pendingActionTimers.forEach((timerId) => {
        clearTimeout(timerId);
      });
      this.state.pendingActionTimers.clear();
    }
    // ===== Drag session =====
    // 修改 RecorderStore.js
    startDragSession({ sourceContextId = null, sourceElementInfo = null, sourcePath = null } = {}) {
      this.state.dragSession = {
        isDragging: true,
        sourceContextId,
        sourceElementInfo,
        sourcePath,
        // <=== 必須新增這一行，把解析好的路徑存起來！
        targetContextId: null,
        targetElementInfo: null
      };
      this.notify();
    }
    updateDragTarget({ targetContextId = null, targetElementInfo = null } = {}) {
      if (!this.state.dragSession.isDragging) return;
      this.state.dragSession.targetContextId = targetContextId;
      this.state.dragSession.targetElementInfo = targetElementInfo;
      this.notify();
    }
    getDragSession() {
      return this.state.dragSession;
    }
    endDragSession() {
      const finishedSession = { ...this.state.dragSession };
      this.state.dragSession = {
        isDragging: false,
        sourceContextId: null,
        sourceElementInfo: null,
        targetContextId: null,
        targetElementInfo: null
      };
      this.notify();
      return finishedSession;
    }
    // ===== Popup 狀態 =====
    setPendingPopup(popupInfo) {
      this.state.pendingPopup = popupInfo || null;
      this.notify();
    }
    getPendingPopup() {
      return this.state.pendingPopup;
    }
    clearPendingPopup() {
      this.state.pendingPopup = null;
      this.notify();
    }
    // ===== reset =====
    reset() {
      this.clearAllPendingTimers();
      this.state.isRecording = true;
      this.state.actions = [];
      this.state.currentActionIndex = 0;
      this.state.activeListenerContextIds.clear();
      this.state.contexts.clear();
      this.state.currentAction = null;
      this.state.lastAction = null;
      this.state.dragSession = {
        isDragging: false,
        sourceContextId: null,
        sourceElementInfo: null,
        targetContextId: null,
        targetElementInfo: null
      };
      this.state.pendingPopup = null;
      this.notify();
    }
  };

  // ContextLifecycle/NavigationTracker.js
  var NavigationTracker = class {
    constructor({
      onNavigationDetected = null,
      onLinkClickDetected = null,
      navigationCheckDelay = 300
    } = {}) {
      this.onNavigationDetected = onNavigationDetected;
      this.onLinkClickDetected = onLinkClickDetected;
      this.navigationCheckDelay = navigationCheckDelay;
      this.originalPushState = null;
      this.originalReplaceState = null;
      this.lastUrl = null;
      this.isStarted = false;
      this.handlePopState = this.handlePopState.bind(this);
      this.handleHashChange = this.handleHashChange.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }
    start() {
      if (this.isStarted) {
        console.log("[NavigationTracker] already started");
        return;
      }
      this.lastUrl = this.getCurrentUrl();
      this.overrideHistoryMethods();
      window.addEventListener("popstate", this.handlePopState);
      window.addEventListener("hashchange", this.handleHashChange);
      document.addEventListener("click", this.handleDocumentClick, true);
      this.isStarted = true;
      console.log("[NavigationTracker] started");
    }
    stop() {
      if (!this.isStarted) {
        console.log("[NavigationTracker] not started");
        return;
      }
      this.restoreHistoryMethods();
      window.removeEventListener("popstate", this.handlePopState);
      window.removeEventListener("hashchange", this.handleHashChange);
      document.removeEventListener("click", this.handleDocumentClick, true);
      this.isStarted = false;
      console.log("[NavigationTracker] stopped");
    }
    overrideHistoryMethods() {
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;
      const self2 = this;
      history.pushState = function(...args) {
        const previousUrl = self2.getCurrentUrl();
        const result = self2.originalPushState.apply(history, args);
        self2.checkNavigation({
          source: "pushState",
          previousUrlCandidate: previousUrl
        });
        return result;
      };
      history.replaceState = function(...args) {
        const previousUrl = self2.getCurrentUrl();
        const result = self2.originalReplaceState.apply(history, args);
        self2.checkNavigation({
          source: "replaceState",
          previousUrlCandidate: previousUrl
        });
        return result;
      };
    }
    restoreHistoryMethods() {
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
        this.originalPushState = null;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
        this.originalReplaceState = null;
      }
    }
    handlePopState() {
      this.checkNavigation({
        source: "popstate"
      });
    }
    handleHashChange() {
      this.checkNavigation({
        source: "hashchange"
      });
    }
    handleDocumentClick(event) {
      const link = event.target?.closest?.("a[href]");
      if (!link) return;
      const linkInfo = this.buildLinkInfo(link, event);
      console.log("[NavigationTracker] link click detected:", linkInfo);
      if (typeof this.onLinkClickDetected === "function") {
        try {
          this.onLinkClickDetected(linkInfo);
        } catch (error) {
          console.error("[NavigationTracker] onLinkClickDetected error:", error);
        }
      }
      setTimeout(() => {
        this.checkNavigation({
          source: "link-click",
          previousUrlCandidate: linkInfo.currentUrl,
          trigger: linkInfo
        });
      }, this.navigationCheckDelay);
    }
    buildLinkInfo(linkElement, event = null) {
      return {
        href: this.safeGetHref(linkElement),
        target: linkElement?.getAttribute?.("target") || null,
        rel: linkElement?.getAttribute?.("rel") || null,
        text: this.extractText(linkElement),
        currentUrl: this.getCurrentUrl(),
        isBlankTarget: linkElement?.getAttribute?.("target") === "_blank",
        ctrlKey: !!event?.ctrlKey,
        metaKey: !!event?.metaKey,
        shiftKey: !!event?.shiftKey,
        altKey: !!event?.altKey,
        button: event?.button ?? null
      };
    }
    checkNavigation({
      source = "unknown",
      previousUrlCandidate = null,
      trigger = null
    } = {}) {
      const currentUrl = this.getCurrentUrl();
      const previousUrl = previousUrlCandidate || this.lastUrl;
      if (!currentUrl) {
        return;
      }
      if (currentUrl === this.lastUrl) {
        return;
      }
      const navigationInfo = {
        navigationId: this.createNavigationId(),
        source,
        previousUrl,
        currentUrl,
        timestamp: Date.now(),
        trigger
      };
      this.lastUrl = currentUrl;
      console.log("[NavigationTracker] navigation detected:", navigationInfo);
      if (typeof this.onNavigationDetected === "function") {
        try {
          this.onNavigationDetected(navigationInfo);
        } catch (error) {
          console.error("[NavigationTracker] onNavigationDetected error:", error);
        }
      }
    }
    getCurrentUrl() {
      try {
        return window.location.href;
      } catch (error) {
        return null;
      }
    }
    getLastTrackedUrl() {
      return this.lastUrl;
    }
    safeGetHref(linkElement) {
      try {
        return linkElement?.href || null;
      } catch (error) {
        return null;
      }
    }
    extractText(element) {
      if (!element) return null;
      try {
        const ariaLabel = element.getAttribute?.("aria-label");
        if (ariaLabel) return ariaLabel.trim();
        const title = element.getAttribute?.("title");
        if (title) return title.trim();
        const text = element.textContent?.trim();
        if (text) {
          return text.replace(/\s+/g, " ").slice(0, 120);
        }
        return null;
      } catch (error) {
        return null;
      }
    }
    createNavigationId() {
      return `nav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  };

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

  // ../../../node_modules/css-selector-generator/esm/utilities-iselement.js
  function isElement(input) {
    return typeof input === "object" && input !== null && input.nodeType === Node.ELEMENT_NODE;
  }

  // ../../../node_modules/css-selector-generator/esm/types.js
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

  // ../../../node_modules/css-selector-generator/esm/utilities-typescript.js
  function isEnumValue(haystack, needle) {
    return Object.values(haystack).includes(needle);
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-messages.js
  var libraryName = "CssSelectorGenerator";
  function showWarning(id = "unknown problem", ...args) {
    console.warn(`${libraryName}: ${id}`, ...args);
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-options.js
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
    useScope: false,
    ignoreGeneratedClassNames: false
  };
  function sanitizeBoolean(input) {
    return !!input;
  }
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
    return input != null && typeof input === "object" && "nodeType" in input && typeof input.nodeType === "number";
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
      combineWithinSelector: sanitizeBoolean(options.combineWithinSelector),
      combineBetweenSelectors: sanitizeBoolean(options.combineBetweenSelectors),
      includeTag: sanitizeBoolean(options.includeTag),
      maxCombinations: sanitizeMaxNumber(options.maxCombinations),
      maxCandidates: sanitizeMaxNumber(options.maxCandidates),
      useScope: sanitizeBoolean(options.useScope),
      maxResults: sanitizeMaxNumber(options.maxResults),
      ignoreGeneratedClassNames: sanitizeBoolean(options.ignoreGeneratedClassNames)
    };
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-data.js
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

  // ../../../node_modules/css-selector-generator/esm/utilities-dom.js
  function testSelector(elements, selector2, root) {
    const result = Array.from(sanitizeRoot(root, elements[0]).querySelectorAll(selector2));
    return result.length === elements.length && elements.every((element) => result.includes(element));
  }
  function getElementParents(element, root) {
    root = root !== null && root !== void 0 ? root : getRootNode(element);
    const result = [];
    let parent = element;
    while (parent && parent !== root) {
      if (isElement(parent)) {
        result.push(parent);
      }
      parent = parent.parentNode;
    }
    return result;
  }
  function getParents(elements, root) {
    return getIntersection(elements.map((element) => getElementParents(element, root)));
  }
  function getRootNode(element) {
    return element.ownerDocument.querySelector(":root");
  }

  // ../../../node_modules/css-selector-generator/esm/constants.js
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

  // ../../../node_modules/css-selector-generator/esm/selector-attribute.js
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
    const tagName2 = element.tagName.toLowerCase();
    if (["input", "option"].includes(tagName2) && nodeName === "value") {
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
  function getElementAttributeSelectors(element, _options) {
    const validAttributes = Array.from(element.attributes).filter((attributeNode) => isValidAttributeNode(attributeNode, element)).map(sanitizeAttributeData);
    return [
      ...validAttributes.map(attributeNodeToSimplifiedSelector),
      ...validAttributes.map(attributeNodeToSelector)
    ];
  }
  function getAttributeSelectors(elements, options) {
    const elementSelectors = elements.map((el) => getElementAttributeSelectors(el, options));
    return getIntersection(elementSelectors);
  }

  // ../../../node_modules/css-selector-generator/esm/selector-class.js
  var WORD_LIKE_PATTERN = /^[a-z_-]{3,}$/i;
  var CONSONANT_PATTERN = /[bcdfghjklmnpqrstvwxyz]{4,}/i;
  function isWordLikeClassName(className2) {
    if (!WORD_LIKE_PATTERN.test(className2)) {
      return false;
    }
    if (className2.includes("_") && !className2.includes("__")) {
      return false;
    }
    if (/^(css|sc|jsx|emotion|makeStyles|MuiButton|MuiBox)-/i.test(className2)) {
      return false;
    }
    const words = className2.split(/--|__|[-]|(?<=[a-z])(?=[A-Z])/).filter((word) => word.length > 0);
    if (words.length === 0) {
      return false;
    }
    if (words.length === 1 && words[0].length < 4) {
      return false;
    }
    for (const word of words) {
      if (word.length <= 2) {
        return false;
      }
      if (CONSONANT_PATTERN.test(word)) {
        return false;
      }
    }
    return true;
  }
  function getElementClassSelectors(element, options) {
    var _a;
    const classNames = ((_a = element.getAttribute("class")) !== null && _a !== void 0 ? _a : "").trim().split(/\s+/).filter((item) => !INVALID_CLASS_RE.test(item));
    let filteredClassNames = classNames;
    if (options === null || options === void 0 ? void 0 : options.ignoreGeneratedClassNames) {
      const matchWhitelist = createPatternMatcher(options.whitelist);
      filteredClassNames = classNames.filter((className2) => {
        const selector2 = `.${sanitizeSelectorItem(className2)}`;
        if (matchWhitelist(selector2)) {
          return true;
        }
        return isWordLikeClassName(className2);
      });
    }
    return filteredClassNames.map((item) => `.${sanitizeSelectorItem(item)}`);
  }
  function getClassSelectors(elements, options) {
    const elementSelectors = elements.map((el) => getElementClassSelectors(el, options));
    return getIntersection(elementSelectors);
  }

  // ../../../node_modules/css-selector-generator/esm/selector-id.js
  function getElementIdSelectors(element, _options) {
    var _a;
    const id = (_a = element.getAttribute("id")) !== null && _a !== void 0 ? _a : "";
    const selector2 = `#${sanitizeSelectorItem(id)}`;
    const rootNode = element.getRootNode({ composed: false });
    return !INVALID_ID_RE.test(id) && testSelector([element], selector2, rootNode) ? [selector2] : [];
  }
  function getIdSelector(elements, options) {
    return elements.length === 0 || elements.length > 1 ? [] : getElementIdSelectors(elements[0], options);
  }

  // ../../../node_modules/css-selector-generator/esm/selector-nth-child.js
  function getElementNthChildSelector(element, _options) {
    const parent = element.parentNode;
    const siblings = parent && "children" in parent ? parent.children : null;
    if (siblings) {
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] === element) {
          return [`:nth-child(${String(i + 1)})`];
        }
      }
    }
    return [];
  }
  function getNthChildSelector(elements, options) {
    return getIntersection(elements.map((el) => getElementNthChildSelector(el, options)));
  }

  // ../../../node_modules/css-selector-generator/esm/selector-tag.js
  function getElementTagSelectors(element, _options) {
    return [
      sanitizeSelectorItem(element.tagName.toLowerCase())
    ];
  }
  function getTagSelector(elements, options) {
    const selectors = [
      ...new Set(flattenArray(elements.map((el) => getElementTagSelectors(el, options))))
    ];
    return selectors.length === 0 || selectors.length > 1 ? [] : [selectors[0]];
  }

  // ../../../node_modules/css-selector-generator/esm/selector-nth-of-type.js
  function getElementNthOfTypeSelector(element, _options) {
    const tag = getTagSelector([element])[0];
    const parent = element.parentNode;
    const parentElement = parent && "children" in parent ? parent : null;
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
  function getNthOfTypeSelector(elements, options) {
    return getIntersection(elements.map((el) => getElementNthOfTypeSelector(el, options)));
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-powerset.js
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

  // ../../../node_modules/css-selector-generator/esm/utilities-cartesian.js
  function* cartesianProductGenerator(input = {}) {
    const entries = Object.entries(input);
    if (entries.length === 0)
      return;
    const stack = [
      { index: entries.length - 1, partial: {} }
    ];
    while (stack.length > 0) {
      const item = stack.pop();
      if (!item)
        break;
      const { index, partial } = item;
      if (index < 0) {
        yield partial;
        continue;
      }
      const [key, values] = entries[index];
      for (let i = values.length - 1; i >= 0; i--) {
        stack.push({
          index: index - 1,
          partial: Object.assign(Object.assign({}, partial), { [key]: values[i] })
        });
      }
    }
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-selectors.js
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
  function getElementSelectorsByType(element, selectorType, options) {
    return ELEMENT_SELECTOR_TYPE_GETTERS[selectorType](element, options);
  }
  function getSelectorsByType(elements, selector_type, options) {
    const getter = SELECTOR_TYPE_GETTERS[selector_type];
    return getter(elements, options);
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
  function* allSelectorsGenerator(elements, options) {
    const yieldedSelectors = /* @__PURE__ */ new Set();
    const selectors_list = getSelectorsList(elements, options);
    for (const selector2 of selectorTypeCombinationsGenerator(selectors_list, options)) {
      if (!yieldedSelectors.has(selector2)) {
        yieldedSelectors.add(selector2);
        yield selector2;
      }
    }
  }
  function getSelectorsList(elements, options) {
    const { blacklist, whitelist, combineWithinSelector, maxCombinations } = options;
    const matchBlacklist = createPatternMatcher(blacklist);
    const matchWhitelist = createPatternMatcher(whitelist);
    const reducer = (data, selector_type) => {
      const selectors_by_type = getSelectorsByType(elements, selector_type, options);
      const filtered_selectors = filterSelectors(selectors_by_type, matchBlacklist, matchWhitelist);
      const found_selectors = orderSelectors(filtered_selectors, matchWhitelist);
      data[selector_type] = combineWithinSelector ? Array.from(powerSetGenerator(found_selectors, { maxResults: maxCombinations })) : found_selectors.map((item) => [item]);
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
    const combinations2 = combineBetweenSelectors ? getPowerSet(selectors, { maxResults: maxCandidates }) : selectors.map((item) => [item]);
    return includeTag ? combinations2.map(addTagTypeIfNeeded) : combinations2;
  }
  function* selectorTypeCombinationsGenerator(selectors_list, options) {
    for (const item of combineSelectorTypes(options)) {
      yield* constructedSelectorsGenerator(item, selectors_list);
    }
  }
  function* constructedSelectorsGenerator(selector_types, selectors_by_type) {
    const data = {};
    for (const selector_type of selector_types) {
      const selector_variants = selectors_by_type[selector_type];
      if (selector_variants && selector_variants.length > 0) {
        data[selector_type] = selector_variants;
      }
    }
    for (const combination of cartesianProductGenerator(data)) {
      yield constructSelector(combination);
    }
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
      ...selectors.map((selector2) => rootSelector + OPERATOR.DESCENDANT + selector2),
      ...selectors.map((selector2) => rootSelector + OPERATOR.CHILD + selector2)
    ];
  }
  function* candidatesGenerator(selectors, rootSelector) {
    if (rootSelector === "") {
      yield* selectors;
    } else {
      for (const selector2 of selectors) {
        yield* generateCandidateCombinations([selector2], rootSelector);
      }
    }
  }
  function* selectorWithinRootGenerator(elements, root, rootSelector = "", options) {
    const elementSelectorsIterator = allSelectorsGenerator(elements, options);
    for (const candidateSelector of candidatesGenerator(elementSelectorsIterator, rootSelector)) {
      if (testSelector(elements, candidateSelector, root)) {
        yield candidateSelector;
      }
    }
    return;
  }
  function* closestIdentifiableParentGenerator(elements, root, rootSelector = "", options) {
    if (elements.length === 0) {
      return null;
    }
    const candidatesList = [
      elements.length > 1 ? elements : [],
      ...getParents(elements, root).map((element) => [element])
    ];
    for (const currentElements of candidatesList) {
      for (const selectorWithinRoot of selectorWithinRootGenerator(currentElements, root, rootSelector, options)) {
        yield {
          foundElements: currentElements,
          selector: selectorWithinRoot
        };
      }
    }
  }
  function* selectorGenerator({ elements, root, rootSelector = "", options }) {
    let currentRoot = root;
    let partialSelector = rootSelector;
    let shouldContinue = true;
    while (shouldContinue) {
      let foundAny = false;
      for (const item of closestIdentifiableParentGenerator(elements, currentRoot, partialSelector, options)) {
        const { foundElements, selector: selector2 } = item;
        foundAny = true;
        if (testSelector(elements, selector2, root)) {
          yield selector2;
        } else {
          currentRoot = foundElements[0];
          partialSelector = selector2;
          break;
        }
      }
      if (!foundAny) {
        shouldContinue = false;
      }
    }
  }
  function sanitizeSelectorNeedle(needle) {
    if (needle instanceof NodeList || needle instanceof HTMLCollection) {
      needle = Array.from(needle);
    }
    const elements = (Array.isArray(needle) ? needle : [needle]).filter(isElement);
    return [...new Set(elements)];
  }

  // ../../../node_modules/css-selector-generator/esm/utilities-element-data.js
  function createElementSelectorData(selector2) {
    return {
      value: selector2,
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
    let selector2 = "";
    pattern.forEach((selectorType) => {
      var _a;
      const selectorsOfType = (_a = selectors[selectorType]) !== null && _a !== void 0 ? _a : [];
      selectorsOfType.forEach(({ value, include }) => {
        if (include) {
          selector2 += value;
        }
      });
    });
    return operator + selector2;
  }

  // ../../../node_modules/css-selector-generator/esm/selector-fallback.js
  function getElementFallbackSelector(element, root) {
    const parentElements = getElementParents(element, root).reverse();
    const isShadowRoot = root instanceof ShadowRoot;
    const elementsData = parentElements.map((element2, index) => {
      var _a;
      const elementData = createElementData(
        element2,
        [CSS_SELECTOR_TYPE.nthchild],
        // do not use child combinator for the first element in ShadowRoot
        isShadowRoot && index === 0 ? OPERATOR.NONE : OPERATOR.CHILD
      );
      ((_a = elementData.selectors.nthchild) !== null && _a !== void 0 ? _a : []).forEach((selectorData) => {
        selectorData.include = true;
      });
      return elementData;
    });
    const prefix = isShadowRoot ? "" : root ? ":scope" : ":root";
    return [prefix, ...elementsData.map(constructElementSelector)].join("");
  }
  function getFallbackSelector(elements, root) {
    return elements.map((element) => getElementFallbackSelector(element, root)).join(SELECTOR_SEPARATOR);
  }

  // ../../../node_modules/css-selector-generator/esm/index.js
  function getCssSelector(needle, custom_options = {}) {
    const options = Object.assign(Object.assign({}, custom_options), { maxResults: 1 });
    const generator = cssSelectorGenerator(needle, options);
    const firstResult = generator.next();
    return firstResult.value;
  }
  function* cssSelectorGenerator(needle, custom_options = {}) {
    var _a;
    const elements = sanitizeSelectorNeedle(needle);
    const options = sanitizeOptions(elements[0], custom_options);
    const root = (_a = options.root) !== null && _a !== void 0 ? _a : getRootNode(elements[0]);
    let foundResults = 0;
    for (const selector2 of selectorGenerator({
      elements,
      options,
      root,
      rootSelector: ""
    })) {
      yield selector2;
      foundResults++;
      if (foundResults >= options.maxResults) {
        return;
      }
    }
    if (elements.length > 1) {
      yield elements.map((element) => getCssSelector(element, options)).join(SELECTOR_SEPARATOR);
      foundResults++;
      if (foundResults >= options.maxResults) {
        return;
      }
    }
    const rootWasProvided = custom_options.root !== void 0;
    yield getFallbackSelector(elements, options.useScope || rootWasProvided ? root : void 0);
  }

  // usecases/DOMParserService.js
  var import_optimal_select = __toESM(require_lib());

  // ../../../node_modules/@medv/finder/finder.js
  var acceptedAttrNames = /* @__PURE__ */ new Set(["role", "name", "aria-label", "rel", "href"]);
  function attr(name, value) {
    let nameIsOk = acceptedAttrNames.has(name);
    nameIsOk ||= name.startsWith("data-") && wordLike(name);
    let valueIsOk = wordLike(value) && value.length < 100;
    valueIsOk ||= value.startsWith("#") && wordLike(value.slice(1));
    return nameIsOk && valueIsOk;
  }
  function idName(name) {
    return wordLike(name);
  }
  function className(name) {
    return wordLike(name);
  }
  function tagName(name) {
    return true;
  }
  function finder(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(`Can't generate CSS selector for non-element node type.`);
    }
    if (input.tagName.toLowerCase() === "html") {
      return "html";
    }
    const defaults = {
      root: document.body,
      idName,
      className,
      tagName,
      attr,
      timeoutMs: 1e3,
      seedMinLength: 3,
      optimizedMinLength: 2,
      maxNumberOfPathChecks: Infinity
    };
    const startTime = /* @__PURE__ */ new Date();
    const config2 = { ...defaults, ...options };
    const rootDocument = findRootDocument(config2.root, defaults);
    let foundPath;
    let count = 0;
    for (const candidate of search(input, config2, rootDocument)) {
      const elapsedTimeMs = (/* @__PURE__ */ new Date()).getTime() - startTime.getTime();
      if (elapsedTimeMs > config2.timeoutMs || count >= config2.maxNumberOfPathChecks) {
        const fPath = fallback(input, rootDocument);
        if (!fPath) {
          throw new Error(`Timeout: Can't find a unique selector after ${config2.timeoutMs}ms`);
        }
        return selector(fPath);
      }
      count++;
      if (unique(candidate, rootDocument)) {
        foundPath = candidate;
        break;
      }
    }
    if (!foundPath) {
      throw new Error(`Selector was not found.`);
    }
    const optimized = [
      ...optimize(foundPath, input, config2, rootDocument, startTime)
    ];
    optimized.sort(byPenalty);
    if (optimized.length > 0) {
      return selector(optimized[0]);
    }
    return selector(foundPath);
  }
  function* search(input, config2, rootDocument) {
    const stack = [];
    let paths = [];
    let current = input;
    let i = 0;
    while (current && current !== rootDocument) {
      const level = tie(current, config2);
      for (const node of level) {
        node.level = i;
      }
      stack.push(level);
      current = current.parentElement;
      i++;
      paths.push(...combinations(stack));
      if (i >= config2.seedMinLength) {
        paths.sort(byPenalty);
        for (const candidate of paths) {
          yield candidate;
        }
        paths = [];
      }
    }
    paths.sort(byPenalty);
    for (const candidate of paths) {
      yield candidate;
    }
  }
  function wordLike(name) {
    if (/^[a-z\-]{3,}$/i.test(name)) {
      const words = name.split(/-|[A-Z]/);
      for (const word of words) {
        if (word.length <= 2) {
          return false;
        }
        if (/[^aeiou]{4,}/i.test(word)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  function tie(element, config2) {
    const level = [];
    const elementId = element.getAttribute("id");
    if (elementId && config2.idName(elementId)) {
      level.push({
        name: "#" + CSS.escape(elementId),
        penalty: 0
      });
    }
    for (let i = 0; i < element.classList.length; i++) {
      const name = element.classList[i];
      if (config2.className(name)) {
        level.push({
          name: "." + CSS.escape(name),
          penalty: 1
        });
      }
    }
    for (let i = 0; i < element.attributes.length; i++) {
      const attr2 = element.attributes[i];
      if (config2.attr(attr2.name, attr2.value)) {
        level.push({
          name: `[${CSS.escape(attr2.name)}="${CSS.escape(attr2.value)}"]`,
          penalty: 2
        });
      }
    }
    const tagName2 = element.tagName.toLowerCase();
    if (config2.tagName(tagName2)) {
      level.push({
        name: tagName2,
        penalty: 5
      });
      const index = indexOf(element, tagName2);
      if (index !== void 0) {
        level.push({
          name: nthOfType(tagName2, index),
          penalty: 10
        });
      }
    }
    const nth = indexOf(element);
    if (nth !== void 0) {
      level.push({
        name: nthChild(tagName2, nth),
        penalty: 50
      });
    }
    return level;
  }
  function selector(path) {
    let node = path[0];
    let query = node.name;
    for (let i = 1; i < path.length; i++) {
      const level = path[i].level || 0;
      if (node.level === level - 1) {
        query = `${path[i].name} > ${query}`;
      } else {
        query = `${path[i].name} ${query}`;
      }
      node = path[i];
    }
    return query;
  }
  function penalty(path) {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
  }
  function byPenalty(a, b) {
    return penalty(a) - penalty(b);
  }
  function indexOf(input, tagName2) {
    const parent = input.parentNode;
    if (!parent) {
      return void 0;
    }
    let child = parent.firstChild;
    if (!child) {
      return void 0;
    }
    let i = 0;
    while (child) {
      if (child.nodeType === Node.ELEMENT_NODE && (tagName2 === void 0 || child.tagName.toLowerCase() === tagName2)) {
        i++;
      }
      if (child === input) {
        break;
      }
      child = child.nextSibling;
    }
    return i;
  }
  function fallback(input, rootDocument) {
    let i = 0;
    let current = input;
    const path = [];
    while (current && current !== rootDocument) {
      const tagName2 = current.tagName.toLowerCase();
      const index = indexOf(current, tagName2);
      if (index === void 0) {
        return;
      }
      path.push({
        name: nthOfType(tagName2, index),
        penalty: NaN,
        level: i
      });
      current = current.parentElement;
      i++;
    }
    if (unique(path, rootDocument)) {
      return path;
    }
  }
  function nthChild(tagName2, index) {
    if (tagName2 === "html") {
      return "html";
    }
    return `${tagName2}:nth-child(${index})`;
  }
  function nthOfType(tagName2, index) {
    if (tagName2 === "html") {
      return "html";
    }
    return `${tagName2}:nth-of-type(${index})`;
  }
  function* combinations(stack, path = []) {
    if (stack.length > 0) {
      for (let node of stack[0]) {
        yield* combinations(stack.slice(1, stack.length), path.concat(node));
      }
    } else {
      yield path;
    }
  }
  function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
      return rootNode;
    }
    if (rootNode === defaults.root) {
      return rootNode.ownerDocument;
    }
    return rootNode;
  }
  function unique(path, rootDocument) {
    const css = selector(path);
    switch (rootDocument.querySelectorAll(css).length) {
      case 0:
        throw new Error(`Can't select any node with this selector: ${css}`);
      case 1:
        return true;
      default:
        return false;
    }
  }
  function* optimize(path, input, config2, rootDocument, startTime) {
    if (path.length > 2 && path.length > config2.optimizedMinLength) {
      for (let i = 1; i < path.length - 1; i++) {
        const elapsedTimeMs = (/* @__PURE__ */ new Date()).getTime() - startTime.getTime();
        if (elapsedTimeMs > config2.timeoutMs) {
          return;
        }
        const newPath = [...path];
        newPath.splice(i, 1);
        if (unique(newPath, rootDocument) && rootDocument.querySelector(selector(newPath)) === input) {
          yield newPath;
          yield* optimize(newPath, input, config2, rootDocument, startTime);
        }
      }
    }
  }

  // ../../../node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js
  var prettyFormat = __toESM(require_build());

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/polyfills/array.from.mjs
  var toStr = Object.prototype.toString;
  function isCallable(fn) {
    return typeof fn === "function" || toStr.call(fn) === "[object Function]";
  }
  function toInteger(value) {
    var number = Number(value);
    if (isNaN(number)) {
      return 0;
    }
    if (number === 0 || !isFinite(number)) {
      return number;
    }
    return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
  }
  var maxSafeInteger = Math.pow(2, 53) - 1;
  function toLength(value) {
    var len = toInteger(value);
    return Math.min(Math.max(len, 0), maxSafeInteger);
  }
  function arrayFrom(arrayLike, mapFn) {
    var C = Array;
    var items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError("Array.from requires an array-like object - not null or undefined");
    }
    if (typeof mapFn !== "undefined") {
      if (!isCallable(mapFn)) {
        throw new TypeError("Array.from: when provided, the second argument must be a function");
      }
    }
    var len = toLength(items.length);
    var A = isCallable(C) ? Object(new C(len)) : new Array(len);
    var k = 0;
    var kValue;
    while (k < len) {
      kValue = items[k];
      if (mapFn) {
        A[k] = mapFn(kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = len;
    return A;
  }

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/polyfills/SetLike.mjs
  function _typeof(obj) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
      return typeof obj2;
    } : function(obj2) {
      return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", { writable: false });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return _typeof(key) === "symbol" ? key : String(key);
  }
  function _toPrimitive(input, hint) {
    if (_typeof(input) !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint || "default");
      if (_typeof(res) !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  var SetLike = /* @__PURE__ */ (function() {
    function SetLike3() {
      var items = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      _classCallCheck(this, SetLike3);
      _defineProperty(this, "items", void 0);
      this.items = items;
    }
    _createClass(SetLike3, [{
      key: "add",
      value: function add(value) {
        if (this.has(value) === false) {
          this.items.push(value);
        }
        return this;
      }
    }, {
      key: "clear",
      value: function clear() {
        this.items = [];
      }
    }, {
      key: "delete",
      value: function _delete(value) {
        var previousLength = this.items.length;
        this.items = this.items.filter(function(item) {
          return item !== value;
        });
        return previousLength !== this.items.length;
      }
    }, {
      key: "forEach",
      value: function forEach(callbackfn) {
        var _this = this;
        this.items.forEach(function(item) {
          callbackfn(item, item, _this);
        });
      }
    }, {
      key: "has",
      value: function has(value) {
        return this.items.indexOf(value) !== -1;
      }
    }, {
      key: "size",
      get: function get() {
        return this.items.length;
      }
    }]);
    return SetLike3;
  })();
  var SetLike_default = typeof Set === "undefined" ? Set : SetLike;

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/getRole.mjs
  function getLocalName(element) {
    var _element$localName;
    return (
      // eslint-disable-next-line no-restricted-properties -- actual guard for environments without localName
      (_element$localName = element.localName) !== null && _element$localName !== void 0 ? _element$localName : (
        // eslint-disable-next-line no-restricted-properties -- required for the fallback
        element.tagName.toLowerCase()
      )
    );
  }
  var localNameToRoleMappings = {
    article: "article",
    aside: "complementary",
    button: "button",
    datalist: "listbox",
    dd: "definition",
    details: "group",
    dialog: "dialog",
    dt: "term",
    fieldset: "group",
    figure: "figure",
    // WARNING: Only with an accessible name
    form: "form",
    footer: "contentinfo",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    header: "banner",
    hr: "separator",
    html: "document",
    legend: "legend",
    li: "listitem",
    math: "math",
    main: "main",
    menu: "list",
    nav: "navigation",
    ol: "list",
    optgroup: "group",
    // WARNING: Only in certain context
    option: "option",
    output: "status",
    progress: "progressbar",
    // WARNING: Only with an accessible name
    section: "region",
    summary: "button",
    table: "table",
    tbody: "rowgroup",
    textarea: "textbox",
    tfoot: "rowgroup",
    // WARNING: Only in certain context
    td: "cell",
    th: "columnheader",
    thead: "rowgroup",
    tr: "row",
    ul: "list"
  };
  var prohibitedAttributes = {
    caption: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    code: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    deletion: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    emphasis: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    generic: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby", "aria-roledescription"]),
    insertion: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    paragraph: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    presentation: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    strong: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    subscript: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    superscript: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"])
  };
  function hasGlobalAriaAttributes(element, role) {
    return [
      "aria-atomic",
      "aria-busy",
      "aria-controls",
      "aria-current",
      "aria-describedby",
      "aria-details",
      // "disabled",
      "aria-dropeffect",
      // "errormessage",
      "aria-flowto",
      "aria-grabbed",
      // "haspopup",
      "aria-hidden",
      // "invalid",
      "aria-keyshortcuts",
      "aria-label",
      "aria-labelledby",
      "aria-live",
      "aria-owns",
      "aria-relevant",
      "aria-roledescription"
    ].some(function(attributeName) {
      var _prohibitedAttributes;
      return element.hasAttribute(attributeName) && !((_prohibitedAttributes = prohibitedAttributes[role]) !== null && _prohibitedAttributes !== void 0 && _prohibitedAttributes.has(attributeName));
    });
  }
  function ignorePresentationalRole(element, implicitRole) {
    return hasGlobalAriaAttributes(element, implicitRole);
  }
  function getRole(element) {
    var explicitRole = getExplicitRole(element);
    if (explicitRole === null || explicitRole === "presentation") {
      var implicitRole = getImplicitRole(element);
      if (explicitRole !== "presentation" || ignorePresentationalRole(element, implicitRole || "")) {
        return implicitRole;
      }
    }
    return explicitRole;
  }
  function getImplicitRole(element) {
    var mappedByTag = localNameToRoleMappings[getLocalName(element)];
    if (mappedByTag !== void 0) {
      return mappedByTag;
    }
    switch (getLocalName(element)) {
      case "a":
      case "area":
      case "link":
        if (element.hasAttribute("href")) {
          return "link";
        }
        break;
      case "img":
        if (element.getAttribute("alt") === "" && !ignorePresentationalRole(element, "img")) {
          return "presentation";
        }
        return "img";
      case "input": {
        var _ref = element, type = _ref.type;
        switch (type) {
          case "button":
          case "image":
          case "reset":
          case "submit":
            return "button";
          case "checkbox":
          case "radio":
            return type;
          case "range":
            return "slider";
          case "email":
          case "tel":
          case "text":
          case "url":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "textbox";
          case "search":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "searchbox";
          case "number":
            return "spinbutton";
          default:
            return null;
        }
      }
      case "select":
        if (element.hasAttribute("multiple") || element.size > 1) {
          return "listbox";
        }
        return "combobox";
    }
    return null;
  }
  function getExplicitRole(element) {
    var role = element.getAttribute("role");
    if (role !== null) {
      var explicitRole = role.trim().split(" ")[0];
      if (explicitRole.length > 0) {
        return explicitRole;
      }
    }
    return null;
  }

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/util.mjs
  function isElement2(node) {
    return node !== null && node.nodeType === node.ELEMENT_NODE;
  }
  function isHTMLTableCaptionElement(node) {
    return isElement2(node) && getLocalName(node) === "caption";
  }
  function isHTMLInputElement(node) {
    return isElement2(node) && getLocalName(node) === "input";
  }
  function isHTMLOptGroupElement(node) {
    return isElement2(node) && getLocalName(node) === "optgroup";
  }
  function isHTMLSelectElement(node) {
    return isElement2(node) && getLocalName(node) === "select";
  }
  function isHTMLTableElement(node) {
    return isElement2(node) && getLocalName(node) === "table";
  }
  function isHTMLTextAreaElement(node) {
    return isElement2(node) && getLocalName(node) === "textarea";
  }
  function safeWindow(node) {
    var _ref = node.ownerDocument === null ? node : node.ownerDocument, defaultView = _ref.defaultView;
    if (defaultView === null) {
      throw new TypeError("no window available");
    }
    return defaultView;
  }
  function isHTMLFieldSetElement(node) {
    return isElement2(node) && getLocalName(node) === "fieldset";
  }
  function isHTMLLegendElement(node) {
    return isElement2(node) && getLocalName(node) === "legend";
  }
  function isHTMLSlotElement(node) {
    return isElement2(node) && getLocalName(node) === "slot";
  }
  function isSVGElement(node) {
    return isElement2(node) && node.ownerSVGElement !== void 0;
  }
  function isSVGSVGElement(node) {
    return isElement2(node) && getLocalName(node) === "svg";
  }
  function isSVGTitleElement(node) {
    return isSVGElement(node) && getLocalName(node) === "title";
  }
  function queryIdRefs(node, attributeName) {
    if (isElement2(node) && node.hasAttribute(attributeName)) {
      var ids = node.getAttribute(attributeName).split(" ");
      var root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
      return ids.map(function(id) {
        return root.getElementById(id);
      }).filter(
        function(element) {
          return element !== null;
        }
        // TODO: why does this not narrow?
      );
    }
    return [];
  }
  function hasAnyConcreteRoles(node, roles2) {
    if (isElement2(node)) {
      return roles2.indexOf(getRole(node)) !== -1;
    }
    return false;
  }

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/accessible-name-and-description.mjs
  function asFlatString(s) {
    return s.trim().replace(/\s\s+/g, " ");
  }
  function isHidden(node, getComputedStyleImplementation) {
    if (!isElement2(node)) {
      return false;
    }
    if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true") {
      return true;
    }
    var style = getComputedStyleImplementation(node);
    return style.getPropertyValue("display") === "none" || style.getPropertyValue("visibility") === "hidden";
  }
  function isControl(node) {
    return hasAnyConcreteRoles(node, ["button", "combobox", "listbox", "textbox"]) || hasAbstractRole(node, "range");
  }
  function hasAbstractRole(node, role) {
    if (!isElement2(node)) {
      return false;
    }
    switch (role) {
      case "range":
        return hasAnyConcreteRoles(node, ["meter", "progressbar", "scrollbar", "slider", "spinbutton"]);
      default:
        throw new TypeError("No knowledge about abstract role '".concat(role, "'. This is likely a bug :("));
    }
  }
  function querySelectorAllSubtree(element, selectors) {
    var elements = arrayFrom(element.querySelectorAll(selectors));
    queryIdRefs(element, "aria-owns").forEach(function(root) {
      elements.push.apply(elements, arrayFrom(root.querySelectorAll(selectors)));
    });
    return elements;
  }
  function querySelectedOptions(listbox) {
    if (isHTMLSelectElement(listbox)) {
      return listbox.selectedOptions || querySelectorAllSubtree(listbox, "[selected]");
    }
    return querySelectorAllSubtree(listbox, '[aria-selected="true"]');
  }
  function isMarkedPresentational(node) {
    return hasAnyConcreteRoles(node, ["none", "presentation"]);
  }
  function isNativeHostLanguageTextAlternativeElement(node) {
    return isHTMLTableCaptionElement(node);
  }
  function allowsNameFromContent(node) {
    return hasAnyConcreteRoles(node, ["button", "cell", "checkbox", "columnheader", "gridcell", "heading", "label", "legend", "link", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "radio", "row", "rowheader", "switch", "tab", "tooltip", "treeitem"]);
  }
  function isDescendantOfNativeHostLanguageTextAlternativeElement(node) {
    return false;
  }
  function getValueOfTextbox(element) {
    if (isHTMLInputElement(element) || isHTMLTextAreaElement(element)) {
      return element.value;
    }
    return element.textContent || "";
  }
  function getTextualContent(declaration) {
    var content = declaration.getPropertyValue("content");
    if (/^["'].*["']$/.test(content)) {
      return content.slice(1, -1);
    }
    return "";
  }
  function isLabelableElement(element) {
    var localName = getLocalName(element);
    return localName === "button" || localName === "input" && element.getAttribute("type") !== "hidden" || localName === "meter" || localName === "output" || localName === "progress" || localName === "select" || localName === "textarea";
  }
  function findLabelableElement(element) {
    if (isLabelableElement(element)) {
      return element;
    }
    var labelableElement = null;
    element.childNodes.forEach(function(childNode) {
      if (labelableElement === null && isElement2(childNode)) {
        var descendantLabelableElement = findLabelableElement(childNode);
        if (descendantLabelableElement !== null) {
          labelableElement = descendantLabelableElement;
        }
      }
    });
    return labelableElement;
  }
  function getControlOfLabel(label) {
    if (label.control !== void 0) {
      return label.control;
    }
    var htmlFor = label.getAttribute("for");
    if (htmlFor !== null) {
      return label.ownerDocument.getElementById(htmlFor);
    }
    return findLabelableElement(label);
  }
  function getLabels(element) {
    var labelsProperty = element.labels;
    if (labelsProperty === null) {
      return labelsProperty;
    }
    if (labelsProperty !== void 0) {
      return arrayFrom(labelsProperty);
    }
    if (!isLabelableElement(element)) {
      return null;
    }
    var document2 = element.ownerDocument;
    return arrayFrom(document2.querySelectorAll("label")).filter(function(label) {
      return getControlOfLabel(label) === element;
    });
  }
  function getSlotContents(slot) {
    var assignedNodes = slot.assignedNodes();
    if (assignedNodes.length === 0) {
      return arrayFrom(slot.childNodes);
    }
    return assignedNodes;
  }
  function computeTextAlternative(root) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var consultedNodes = new SetLike_default();
    var window2 = safeWindow(root);
    var _options$compute = options.compute, compute = _options$compute === void 0 ? "name" : _options$compute, _options$computedStyl = options.computedStyleSupportsPseudoElements, computedStyleSupportsPseudoElements = _options$computedStyl === void 0 ? options.getComputedStyle !== void 0 : _options$computedStyl, _options$getComputedS = options.getComputedStyle, getComputedStyle = _options$getComputedS === void 0 ? window2.getComputedStyle.bind(window2) : _options$getComputedS, _options$hidden = options.hidden, hidden = _options$hidden === void 0 ? false : _options$hidden;
    function computeMiscTextAlternative(node, context) {
      var accumulatedText = "";
      if (isElement2(node) && computedStyleSupportsPseudoElements) {
        var pseudoBefore = getComputedStyle(node, "::before");
        var beforeContent = getTextualContent(pseudoBefore);
        accumulatedText = "".concat(beforeContent, " ").concat(accumulatedText);
      }
      var childNodes = isHTMLSlotElement(node) ? getSlotContents(node) : arrayFrom(node.childNodes).concat(queryIdRefs(node, "aria-owns"));
      childNodes.forEach(function(child) {
        var result = computeTextAlternative3(child, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false,
          recursion: true
        });
        var display = isElement2(child) ? getComputedStyle(child).getPropertyValue("display") : "inline";
        var separator = display !== "inline" ? " " : "";
        accumulatedText += "".concat(separator).concat(result).concat(separator);
      });
      if (isElement2(node) && computedStyleSupportsPseudoElements) {
        var pseudoAfter = getComputedStyle(node, "::after");
        var afterContent = getTextualContent(pseudoAfter);
        accumulatedText = "".concat(accumulatedText, " ").concat(afterContent);
      }
      return accumulatedText.trim();
    }
    function useAttribute(element, attributeName) {
      var attribute = element.getAttributeNode(attributeName);
      if (attribute !== null && !consultedNodes.has(attribute) && attribute.value.trim() !== "") {
        consultedNodes.add(attribute);
        return attribute.value;
      }
      return null;
    }
    function computeTooltipAttributeValue(node) {
      if (!isElement2(node)) {
        return null;
      }
      return useAttribute(node, "title");
    }
    function computeElementTextAlternative(node) {
      if (!isElement2(node)) {
        return null;
      }
      if (isHTMLFieldSetElement(node)) {
        consultedNodes.add(node);
        var children = arrayFrom(node.childNodes);
        for (var i = 0; i < children.length; i += 1) {
          var child = children[i];
          if (isHTMLLegendElement(child)) {
            return computeTextAlternative3(child, {
              isEmbeddedInLabel: false,
              isReferenced: false,
              recursion: false
            });
          }
        }
      } else if (isHTMLTableElement(node)) {
        consultedNodes.add(node);
        var _children = arrayFrom(node.childNodes);
        for (var _i = 0; _i < _children.length; _i += 1) {
          var _child = _children[_i];
          if (isHTMLTableCaptionElement(_child)) {
            return computeTextAlternative3(_child, {
              isEmbeddedInLabel: false,
              isReferenced: false,
              recursion: false
            });
          }
        }
      } else if (isSVGSVGElement(node)) {
        consultedNodes.add(node);
        var _children2 = arrayFrom(node.childNodes);
        for (var _i2 = 0; _i2 < _children2.length; _i2 += 1) {
          var _child2 = _children2[_i2];
          if (isSVGTitleElement(_child2)) {
            return _child2.textContent;
          }
        }
        return null;
      } else if (getLocalName(node) === "img" || getLocalName(node) === "area") {
        var nameFromAlt = useAttribute(node, "alt");
        if (nameFromAlt !== null) {
          return nameFromAlt;
        }
      } else if (isHTMLOptGroupElement(node)) {
        var nameFromLabel = useAttribute(node, "label");
        if (nameFromLabel !== null) {
          return nameFromLabel;
        }
      }
      if (isHTMLInputElement(node) && (node.type === "button" || node.type === "submit" || node.type === "reset")) {
        var nameFromValue = useAttribute(node, "value");
        if (nameFromValue !== null) {
          return nameFromValue;
        }
        if (node.type === "submit") {
          return "Submit";
        }
        if (node.type === "reset") {
          return "Reset";
        }
      }
      var labels = getLabels(node);
      if (labels !== null && labels.length !== 0) {
        consultedNodes.add(node);
        return arrayFrom(labels).map(function(element) {
          return computeTextAlternative3(element, {
            isEmbeddedInLabel: true,
            isReferenced: false,
            recursion: true
          });
        }).filter(function(label) {
          return label.length > 0;
        }).join(" ");
      }
      if (isHTMLInputElement(node) && node.type === "image") {
        var _nameFromAlt = useAttribute(node, "alt");
        if (_nameFromAlt !== null) {
          return _nameFromAlt;
        }
        var nameFromTitle = useAttribute(node, "title");
        if (nameFromTitle !== null) {
          return nameFromTitle;
        }
        return "Submit Query";
      }
      if (hasAnyConcreteRoles(node, ["button"])) {
        var nameFromSubTree = computeMiscTextAlternative(node, {
          isEmbeddedInLabel: false,
          isReferenced: false
        });
        if (nameFromSubTree !== "") {
          return nameFromSubTree;
        }
      }
      return null;
    }
    function computeTextAlternative3(current, context) {
      if (consultedNodes.has(current)) {
        return "";
      }
      if (!hidden && isHidden(current, getComputedStyle) && !context.isReferenced) {
        consultedNodes.add(current);
        return "";
      }
      var labelAttributeNode = isElement2(current) ? current.getAttributeNode("aria-labelledby") : null;
      var labelElements = labelAttributeNode !== null && !consultedNodes.has(labelAttributeNode) ? queryIdRefs(current, "aria-labelledby") : [];
      if (compute === "name" && !context.isReferenced && labelElements.length > 0) {
        consultedNodes.add(labelAttributeNode);
        return labelElements.map(function(element) {
          return computeTextAlternative3(element, {
            isEmbeddedInLabel: context.isEmbeddedInLabel,
            isReferenced: true,
            // this isn't recursion as specified, otherwise we would skip
            // `aria-label` in
            // <input id="myself" aria-label="foo" aria-labelledby="myself"
            recursion: false
          });
        }).join(" ");
      }
      var skipToStep2E = context.recursion && isControl(current) && compute === "name";
      if (!skipToStep2E) {
        var ariaLabel = (isElement2(current) && current.getAttribute("aria-label") || "").trim();
        if (ariaLabel !== "" && compute === "name") {
          consultedNodes.add(current);
          return ariaLabel;
        }
        if (!isMarkedPresentational(current)) {
          var elementTextAlternative = computeElementTextAlternative(current);
          if (elementTextAlternative !== null) {
            consultedNodes.add(current);
            return elementTextAlternative;
          }
        }
      }
      if (hasAnyConcreteRoles(current, ["menu"])) {
        consultedNodes.add(current);
        return "";
      }
      if (skipToStep2E || context.isEmbeddedInLabel || context.isReferenced) {
        if (hasAnyConcreteRoles(current, ["combobox", "listbox"])) {
          consultedNodes.add(current);
          var selectedOptions = querySelectedOptions(current);
          if (selectedOptions.length === 0) {
            return isHTMLInputElement(current) ? current.value : "";
          }
          return arrayFrom(selectedOptions).map(function(selectedOption) {
            return computeTextAlternative3(selectedOption, {
              isEmbeddedInLabel: context.isEmbeddedInLabel,
              isReferenced: false,
              recursion: true
            });
          }).join(" ");
        }
        if (hasAbstractRole(current, "range")) {
          consultedNodes.add(current);
          if (current.hasAttribute("aria-valuetext")) {
            return current.getAttribute("aria-valuetext");
          }
          if (current.hasAttribute("aria-valuenow")) {
            return current.getAttribute("aria-valuenow");
          }
          return current.getAttribute("value") || "";
        }
        if (hasAnyConcreteRoles(current, ["textbox"])) {
          consultedNodes.add(current);
          return getValueOfTextbox(current);
        }
      }
      if (allowsNameFromContent(current) || isElement2(current) && context.isReferenced || isNativeHostLanguageTextAlternativeElement(current) || isDescendantOfNativeHostLanguageTextAlternativeElement(current)) {
        var accumulatedText2F = computeMiscTextAlternative(current, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false
        });
        if (accumulatedText2F !== "") {
          consultedNodes.add(current);
          return accumulatedText2F;
        }
      }
      if (current.nodeType === current.TEXT_NODE) {
        consultedNodes.add(current);
        return current.textContent || "";
      }
      if (context.recursion) {
        consultedNodes.add(current);
        return computeMiscTextAlternative(current, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false
        });
      }
      var tooltipAttributeValue = computeTooltipAttributeValue(current);
      if (tooltipAttributeValue !== null) {
        consultedNodes.add(current);
        return tooltipAttributeValue;
      }
      consultedNodes.add(current);
      return "";
    }
    return asFlatString(computeTextAlternative3(root, {
      isEmbeddedInLabel: false,
      // by spec computeAccessibleDescription starts with the referenced elements as roots
      isReferenced: compute === "description",
      recursion: false
    }));
  }

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/accessible-description.mjs
  function _typeof2(obj) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
      return typeof obj2;
    } : function(obj2) {
      return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    }, _typeof2(obj);
  }
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty2(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
    return target;
  }
  function _defineProperty2(obj, key, value) {
    key = _toPropertyKey2(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey2(arg) {
    var key = _toPrimitive2(arg, "string");
    return _typeof2(key) === "symbol" ? key : String(key);
  }
  function _toPrimitive2(input, hint) {
    if (_typeof2(input) !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint || "default");
      if (_typeof2(res) !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function computeAccessibleDescription(root) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var description = queryIdRefs(root, "aria-describedby").map(function(element) {
      return computeTextAlternative(element, _objectSpread(_objectSpread({}, options), {}, {
        compute: "description"
      }));
    }).join(" ");
    if (description === "") {
      var title = root.getAttribute("title");
      description = title === null ? "" : title;
    }
    return description;
  }

  // ../../../node_modules/@testing-library/dom/node_modules/dom-accessibility-api/dist/accessible-name.mjs
  function prohibitsNaming(node) {
    return hasAnyConcreteRoles(node, ["caption", "code", "deletion", "emphasis", "generic", "insertion", "paragraph", "presentation", "strong", "subscript", "superscript"]);
  }
  function computeAccessibleName(root) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (prohibitsNaming(root)) {
      return "";
    }
    return computeTextAlternative(root, options);
  }

  // ../../../node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js
  var import_aria_query = __toESM(require_lib2());
  var import_lz_string = __toESM(require_lz_string());
  function escapeHTML(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  var printProps = (keys, props, config2, indentation, depth, refs, printer) => {
    const indentationNext = indentation + config2.indent;
    const colors = config2.colors;
    return keys.map((key) => {
      const value = props[key];
      let printed = printer(value, config2, indentationNext, depth, refs);
      if (typeof value !== "string") {
        if (printed.indexOf("\n") !== -1) {
          printed = config2.spacingOuter + indentationNext + printed + config2.spacingOuter + indentation;
        }
        printed = "{" + printed + "}";
      }
      return config2.spacingInner + indentation + colors.prop.open + key + colors.prop.close + "=" + colors.value.open + printed + colors.value.close;
    }).join("");
  };
  var NodeTypeTextNode = 3;
  var printChildren = (children, config2, indentation, depth, refs, printer) => children.map((child) => {
    const printedChild = typeof child === "string" ? printText(child, config2) : printer(child, config2, indentation, depth, refs);
    if (printedChild === "" && typeof child === "object" && child !== null && child.nodeType !== NodeTypeTextNode) {
      return "";
    }
    return config2.spacingOuter + indentation + printedChild;
  }).join("");
  var printText = (text, config2) => {
    const contentColor = config2.colors.content;
    return contentColor.open + escapeHTML(text) + contentColor.close;
  };
  var printComment = (comment, config2) => {
    const commentColor = config2.colors.comment;
    return commentColor.open + "<!--" + escapeHTML(comment) + "-->" + commentColor.close;
  };
  var printElement = (type, printedProps, printedChildren, config2, indentation) => {
    const tagColor = config2.colors.tag;
    return tagColor.open + "<" + type + (printedProps && tagColor.close + printedProps + config2.spacingOuter + indentation + tagColor.open) + (printedChildren ? ">" + tagColor.close + printedChildren + config2.spacingOuter + indentation + tagColor.open + "</" + type : (printedProps && !config2.min ? "" : " ") + "/") + ">" + tagColor.close;
  };
  var printElementAsLeaf = (type, config2) => {
    const tagColor = config2.colors.tag;
    return tagColor.open + "<" + type + tagColor.close + " \u2026" + tagColor.open + " />" + tagColor.close;
  };
  var ELEMENT_NODE$1 = 1;
  var TEXT_NODE$1 = 3;
  var COMMENT_NODE$1 = 8;
  var FRAGMENT_NODE = 11;
  var ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/;
  var isCustomElement = (val) => {
    const {
      tagName: tagName2
    } = val;
    return Boolean(typeof tagName2 === "string" && tagName2.includes("-") || typeof val.hasAttribute === "function" && val.hasAttribute("is"));
  };
  var testNode = (val) => {
    const constructorName = val.constructor.name;
    const {
      nodeType
    } = val;
    return nodeType === ELEMENT_NODE$1 && (ELEMENT_REGEXP.test(constructorName) || isCustomElement(val)) || nodeType === TEXT_NODE$1 && constructorName === "Text" || nodeType === COMMENT_NODE$1 && constructorName === "Comment" || nodeType === FRAGMENT_NODE && constructorName === "DocumentFragment";
  };
  function nodeIsText(node) {
    return node.nodeType === TEXT_NODE$1;
  }
  function nodeIsComment(node) {
    return node.nodeType === COMMENT_NODE$1;
  }
  function nodeIsFragment(node) {
    return node.nodeType === FRAGMENT_NODE;
  }
  function createDOMElementFilter(filterNode) {
    return {
      test: (val) => {
        var _val$constructor2;
        return ((val == null || (_val$constructor2 = val.constructor) == null ? void 0 : _val$constructor2.name) || isCustomElement(val)) && testNode(val);
      },
      serialize: (node, config2, indentation, depth, refs, printer) => {
        if (nodeIsText(node)) {
          return printText(node.data, config2);
        }
        if (nodeIsComment(node)) {
          return printComment(node.data, config2);
        }
        const type = nodeIsFragment(node) ? "DocumentFragment" : node.tagName.toLowerCase();
        if (++depth > config2.maxDepth) {
          return printElementAsLeaf(type, config2);
        }
        return printElement(type, printProps(nodeIsFragment(node) ? [] : Array.from(node.attributes).map((attr2) => attr2.name).sort(), nodeIsFragment(node) ? {} : Array.from(node.attributes).reduce((props, attribute) => {
          props[attribute.name] = attribute.value;
          return props;
        }, {}), config2, indentation + config2.indent, depth, refs, printer), printChildren(Array.prototype.slice.call(node.childNodes || node.children).filter(filterNode), config2, indentation + config2.indent, depth, refs, printer), config2, indentation);
      }
    };
  }
  var picocolors = null;
  var readFileSync = null;
  var codeFrameColumns = null;
  try {
    const nodeRequire = module && module.require;
    readFileSync = nodeRequire.call(module, "fs").readFileSync;
    codeFrameColumns = nodeRequire.call(module, "@babel/code-frame").codeFrameColumns;
    picocolors = nodeRequire.call(module, "picocolors");
  } catch {
  }
  function getCodeFrame(frame) {
    const locationStart = frame.indexOf("(") + 1;
    const locationEnd = frame.indexOf(")");
    const frameLocation = frame.slice(locationStart, locationEnd);
    const frameLocationElements = frameLocation.split(":");
    const [filename, line, column] = [frameLocationElements[0], parseInt(frameLocationElements[1], 10), parseInt(frameLocationElements[2], 10)];
    let rawFileContents = "";
    try {
      rawFileContents = readFileSync(filename, "utf-8");
    } catch {
      return "";
    }
    const codeFrame = codeFrameColumns(rawFileContents, {
      start: {
        line,
        column
      }
    }, {
      highlightCode: true,
      linesBelow: 0
    });
    return picocolors.dim(frameLocation) + "\n" + codeFrame + "\n";
  }
  function getUserCodeFrame() {
    if (!readFileSync || !codeFrameColumns) {
      return "";
    }
    const err = new Error();
    const firstClientCodeFrame = err.stack.split("\n").slice(1).find((frame) => !frame.includes("node_modules/"));
    return getCodeFrame(firstClientCodeFrame);
  }
  var TEXT_NODE = 3;
  function jestFakeTimersAreEnabled() {
    if (typeof jest !== "undefined" && jest !== null) {
      return (
        // legacy timers
        setTimeout._isMockFunction === true || // modern timers
        // eslint-disable-next-line prefer-object-has-own -- not supported by our support matrix
        Object.prototype.hasOwnProperty.call(setTimeout, "clock")
      );
    }
    return false;
  }
  function getDocument() {
    if (typeof window === "undefined") {
      throw new Error("Could not find default container");
    }
    return window.document;
  }
  function getWindowFromNode(node) {
    if (node.defaultView) {
      return node.defaultView;
    } else if (node.ownerDocument && node.ownerDocument.defaultView) {
      return node.ownerDocument.defaultView;
    } else if (node.window) {
      return node.window;
    } else if (node.ownerDocument && node.ownerDocument.defaultView === null) {
      throw new Error("It looks like the window object is not available for the provided node.");
    } else if (node.then instanceof Function) {
      throw new Error("It looks like you passed a Promise object instead of a DOM node. Did you do something like `fireEvent.click(screen.findBy...` when you meant to use a `getBy` query `fireEvent.click(screen.getBy...`, or await the findBy query `fireEvent.click(await screen.findBy...`?");
    } else if (Array.isArray(node)) {
      throw new Error("It looks like you passed an Array instead of a DOM node. Did you do something like `fireEvent.click(screen.getAllBy...` when you meant to use a `getBy` query `fireEvent.click(screen.getBy...`?");
    } else if (typeof node.debug === "function" && typeof node.logTestingPlaygroundURL === "function") {
      throw new Error("It looks like you passed a `screen` object. Did you do something like `fireEvent.click(screen, ...` when you meant to use a query, e.g. `fireEvent.click(screen.getBy..., `?");
    } else {
      throw new Error("The given node is not an Element, the node type is: " + typeof node + ".");
    }
  }
  function checkContainerType(container) {
    if (!container || !(typeof container.querySelector === "function") || !(typeof container.querySelectorAll === "function")) {
      throw new TypeError("Expected container to be an Element, a Document or a DocumentFragment but got " + getTypeName(container) + ".");
    }
    function getTypeName(object) {
      if (typeof object === "object") {
        return object === null ? "null" : object.constructor.name;
      }
      return typeof object;
    }
  }
  var shouldHighlight = () => {
    if (typeof process === "undefined") {
      return false;
    }
    let colors;
    try {
      var _process$env;
      const colorsJSON = (_process$env = process.env) == null ? void 0 : _process$env.COLORS;
      if (colorsJSON) {
        colors = JSON.parse(colorsJSON);
      }
    } catch {
    }
    if (typeof colors === "boolean") {
      return colors;
    } else {
      return process.versions !== void 0 && process.versions.node !== void 0;
    }
  };
  var {
    DOMCollection
  } = prettyFormat.plugins;
  var ELEMENT_NODE = 1;
  var COMMENT_NODE = 8;
  function filterCommentsAndDefaultIgnoreTagsTags(value) {
    return value.nodeType !== COMMENT_NODE && (value.nodeType !== ELEMENT_NODE || !value.matches(getConfig().defaultIgnore));
  }
  function prettyDOM(dom, maxLength, options) {
    if (options === void 0) {
      options = {};
    }
    if (!dom) {
      dom = getDocument().body;
    }
    if (typeof maxLength !== "number") {
      maxLength = typeof process !== "undefined" && typeof process.env !== "undefined" && process.env.DEBUG_PRINT_LIMIT || 7e3;
    }
    if (maxLength === 0) {
      return "";
    }
    if (dom.documentElement) {
      dom = dom.documentElement;
    }
    let domTypeName = typeof dom;
    if (domTypeName === "object") {
      domTypeName = dom.constructor.name;
    } else {
      dom = {};
    }
    if (!("outerHTML" in dom)) {
      throw new TypeError("Expected an element or document but got " + domTypeName);
    }
    const {
      filterNode = filterCommentsAndDefaultIgnoreTagsTags,
      ...prettyFormatOptions
    } = options;
    const debugContent = prettyFormat.format(dom, {
      plugins: [createDOMElementFilter(filterNode), DOMCollection],
      printFunctionName: false,
      highlight: shouldHighlight(),
      ...prettyFormatOptions
    });
    return maxLength !== void 0 && dom.outerHTML.length > maxLength ? debugContent.slice(0, maxLength) + "..." : debugContent;
  }
  var logDOM = function() {
    const userCodeFrame = getUserCodeFrame();
    if (userCodeFrame) {
      console.log(prettyDOM(...arguments) + "\n\n" + userCodeFrame);
    } else {
      console.log(prettyDOM(...arguments));
    }
  };
  var config = {
    testIdAttribute: "data-testid",
    asyncUtilTimeout: 1e3,
    // asyncWrapper and advanceTimersWrapper is to support React's async `act` function.
    // forcing react-testing-library to wrap all async functions would've been
    // a total nightmare (consider wrapping every findBy* query and then also
    // updating `within` so those would be wrapped too. Total nightmare).
    // so we have this config option that's really only intended for
    // react-testing-library to use. For that reason, this feature will remain
    // undocumented.
    asyncWrapper: (cb) => cb(),
    unstable_advanceTimersWrapper: (cb) => cb(),
    eventWrapper: (cb) => cb(),
    // default value for the `hidden` option in `ByRole` queries
    defaultHidden: false,
    // default value for the `ignore` option in `ByText` queries
    defaultIgnore: "script, style",
    // showOriginalStackTrace flag to show the full error stack traces for async errors
    showOriginalStackTrace: false,
    // throw errors w/ suggestions for better queries. Opt in so off by default.
    throwSuggestions: false,
    // called when getBy* queries fail. (message, container) => Error
    getElementError(message, container) {
      const prettifiedDOM = prettyDOM(container);
      const error = new Error([message, "Ignored nodes: comments, " + config.defaultIgnore + "\n" + prettifiedDOM].filter(Boolean).join("\n\n"));
      error.name = "TestingLibraryElementError";
      return error;
    },
    _disableExpensiveErrorDiagnostics: false,
    computedStyleSupportsPseudoElements: false
  };
  function runWithExpensiveErrorDiagnosticsDisabled(callback) {
    try {
      config._disableExpensiveErrorDiagnostics = true;
      return callback();
    } finally {
      config._disableExpensiveErrorDiagnostics = false;
    }
  }
  function getConfig() {
    return config;
  }
  var labelledNodeNames = ["button", "meter", "output", "progress", "select", "textarea", "input"];
  function getTextContent(node) {
    if (labelledNodeNames.includes(node.nodeName.toLowerCase())) {
      return "";
    }
    if (node.nodeType === TEXT_NODE) return node.textContent;
    return Array.from(node.childNodes).map((childNode) => getTextContent(childNode)).join("");
  }
  function getLabelContent(element) {
    let textContent;
    if (element.tagName.toLowerCase() === "label") {
      textContent = getTextContent(element);
    } else {
      textContent = element.value || element.textContent;
    }
    return textContent;
  }
  function getRealLabels(element) {
    if (element.labels !== void 0) {
      var _labels;
      return (_labels = element.labels) != null ? _labels : [];
    }
    if (!isLabelable(element)) return [];
    const labels = element.ownerDocument.querySelectorAll("label");
    return Array.from(labels).filter((label) => label.control === element);
  }
  function isLabelable(element) {
    return /BUTTON|METER|OUTPUT|PROGRESS|SELECT|TEXTAREA/.test(element.tagName) || element.tagName === "INPUT" && element.getAttribute("type") !== "hidden";
  }
  function getLabels2(container, element, _temp) {
    let {
      selector: selector2 = "*"
    } = _temp === void 0 ? {} : _temp;
    const ariaLabelledBy = element.getAttribute("aria-labelledby");
    const labelsId = ariaLabelledBy ? ariaLabelledBy.split(" ") : [];
    return labelsId.length ? labelsId.map((labelId) => {
      const labellingElement = container.querySelector('[id="' + labelId + '"]');
      return labellingElement ? {
        content: getLabelContent(labellingElement),
        formControl: null
      } : {
        content: "",
        formControl: null
      };
    }) : Array.from(getRealLabels(element)).map((label) => {
      const textToMatch = getLabelContent(label);
      const formControlSelector = "button, input, meter, output, progress, select, textarea";
      const labelledFormControl = Array.from(label.querySelectorAll(formControlSelector)).filter((formControlElement) => formControlElement.matches(selector2))[0];
      return {
        content: textToMatch,
        formControl: labelledFormControl
      };
    });
  }
  function assertNotNullOrUndefined(matcher) {
    if (matcher === null || matcher === void 0) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- implicitly converting `T` to `string`
        "It looks like " + matcher + " was passed instead of a matcher. Did you do something like getByText(" + matcher + ")?"
      );
    }
  }
  function fuzzyMatches(textToMatch, node, matcher, normalizer) {
    if (typeof textToMatch !== "string") {
      return false;
    }
    assertNotNullOrUndefined(matcher);
    const normalizedText = normalizer(textToMatch);
    if (typeof matcher === "string" || typeof matcher === "number") {
      return normalizedText.toLowerCase().includes(matcher.toString().toLowerCase());
    } else if (typeof matcher === "function") {
      return matcher(normalizedText, node);
    } else {
      return matchRegExp(matcher, normalizedText);
    }
  }
  function matches(textToMatch, node, matcher, normalizer) {
    if (typeof textToMatch !== "string") {
      return false;
    }
    assertNotNullOrUndefined(matcher);
    const normalizedText = normalizer(textToMatch);
    if (matcher instanceof Function) {
      return matcher(normalizedText, node);
    } else if (matcher instanceof RegExp) {
      return matchRegExp(matcher, normalizedText);
    } else {
      return normalizedText === String(matcher);
    }
  }
  function getDefaultNormalizer(_temp) {
    let {
      trim = true,
      collapseWhitespace = true
    } = _temp === void 0 ? {} : _temp;
    return (text) => {
      let normalizedText = text;
      normalizedText = trim ? normalizedText.trim() : normalizedText;
      normalizedText = collapseWhitespace ? normalizedText.replace(/\s+/g, " ") : normalizedText;
      return normalizedText;
    };
  }
  function makeNormalizer(_ref) {
    let {
      trim,
      collapseWhitespace,
      normalizer
    } = _ref;
    if (!normalizer) {
      return getDefaultNormalizer({
        trim,
        collapseWhitespace
      });
    }
    if (typeof trim !== "undefined" || typeof collapseWhitespace !== "undefined") {
      throw new Error('trim and collapseWhitespace are not supported with a normalizer. If you want to use the default trim and collapseWhitespace logic in your normalizer, use "getDefaultNormalizer({trim, collapseWhitespace})" and compose that into your normalizer');
    }
    return normalizer;
  }
  function matchRegExp(matcher, text) {
    const match = matcher.test(text);
    if (matcher.global && matcher.lastIndex !== 0) {
      console.warn("To match all elements we had to reset the lastIndex of the RegExp because the global flag is enabled. We encourage to remove the global flag from the RegExp.");
      matcher.lastIndex = 0;
    }
    return match;
  }
  function getNodeText(node) {
    if (node.matches("input[type=submit], input[type=button], input[type=reset]")) {
      return node.value;
    }
    return Array.from(node.childNodes).filter((child) => child.nodeType === TEXT_NODE && Boolean(child.textContent)).map((c) => c.textContent).join("");
  }
  var elementRoleList = buildElementRoleList(import_aria_query.elementRoles);
  function isSubtreeInaccessible(element) {
    if (element.hidden === true) {
      return true;
    }
    if (element.getAttribute("aria-hidden") === "true") {
      return true;
    }
    const window2 = element.ownerDocument.defaultView;
    if (window2.getComputedStyle(element).display === "none") {
      return true;
    }
    return false;
  }
  function isInaccessible(element, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      isSubtreeInaccessible: isSubtreeInaccessibleImpl = isSubtreeInaccessible
    } = options;
    const window2 = element.ownerDocument.defaultView;
    if (window2.getComputedStyle(element).visibility === "hidden") {
      return true;
    }
    let currentElement = element;
    while (currentElement) {
      if (isSubtreeInaccessibleImpl(currentElement)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }
  function getImplicitAriaRoles(currentNode) {
    for (const {
      match,
      roles: roles2
    } of elementRoleList) {
      if (match(currentNode)) {
        return [...roles2];
      }
    }
    return [];
  }
  function buildElementRoleList(elementRolesMap) {
    function makeElementSelector(_ref) {
      let {
        name,
        attributes
      } = _ref;
      return "" + name + attributes.map((_ref2) => {
        let {
          name: attributeName,
          value,
          constraints = []
        } = _ref2;
        const shouldNotExist = constraints.indexOf("undefined") !== -1;
        const shouldBeNonEmpty = constraints.indexOf("set") !== -1;
        const hasExplicitValue = typeof value !== "undefined";
        if (hasExplicitValue) {
          return "[" + attributeName + '="' + value + '"]';
        } else if (shouldNotExist) {
          return ":not([" + attributeName + "])";
        } else if (shouldBeNonEmpty) {
          return "[" + attributeName + "]:not([" + attributeName + '=""])';
        }
        return "[" + attributeName + "]";
      }).join("");
    }
    function getSelectorSpecificity(_ref3) {
      let {
        attributes = []
      } = _ref3;
      return attributes.length;
    }
    function bySelectorSpecificity(_ref4, _ref5) {
      let {
        specificity: leftSpecificity
      } = _ref4;
      let {
        specificity: rightSpecificity
      } = _ref5;
      return rightSpecificity - leftSpecificity;
    }
    function match(element) {
      let {
        attributes = []
      } = element;
      const typeTextIndex = attributes.findIndex((attribute) => attribute.value && attribute.name === "type" && attribute.value === "text");
      if (typeTextIndex >= 0) {
        attributes = [...attributes.slice(0, typeTextIndex), ...attributes.slice(typeTextIndex + 1)];
      }
      const selector2 = makeElementSelector({
        ...element,
        attributes
      });
      return (node) => {
        if (typeTextIndex >= 0 && node.type !== "text") {
          return false;
        }
        return node.matches(selector2);
      };
    }
    let result = [];
    for (const [element, roles2] of elementRolesMap.entries()) {
      result = [...result, {
        match: match(element),
        roles: Array.from(roles2),
        specificity: getSelectorSpecificity(element)
      }];
    }
    return result.sort(bySelectorSpecificity);
  }
  function getRoles(container, _temp) {
    let {
      hidden = false
    } = _temp === void 0 ? {} : _temp;
    function flattenDOM(node) {
      return [node, ...Array.from(node.children).reduce((acc, child) => [...acc, ...flattenDOM(child)], [])];
    }
    return flattenDOM(container).filter((element) => {
      return hidden === false ? isInaccessible(element) === false : true;
    }).reduce((acc, node) => {
      let roles2 = [];
      if (node.hasAttribute("role")) {
        roles2 = node.getAttribute("role").split(" ").slice(0, 1);
      } else {
        roles2 = getImplicitAriaRoles(node);
      }
      return roles2.reduce((rolesAcc, role) => Array.isArray(rolesAcc[role]) ? {
        ...rolesAcc,
        [role]: [...rolesAcc[role], node]
      } : {
        ...rolesAcc,
        [role]: [node]
      }, acc);
    }, {});
  }
  function prettyRoles(dom, _ref6) {
    let {
      hidden,
      includeDescription
    } = _ref6;
    const roles2 = getRoles(dom, {
      hidden
    });
    return Object.entries(roles2).filter((_ref7) => {
      let [role] = _ref7;
      return role !== "generic";
    }).map((_ref8) => {
      let [role, elements] = _ref8;
      const delimiterBar = "-".repeat(50);
      const elementsString = elements.map((el) => {
        const nameString = 'Name "' + computeAccessibleName(el, {
          computedStyleSupportsPseudoElements: getConfig().computedStyleSupportsPseudoElements
        }) + '":\n';
        const domString = prettyDOM(el.cloneNode(false));
        if (includeDescription) {
          const descriptionString = 'Description "' + computeAccessibleDescription(el, {
            computedStyleSupportsPseudoElements: getConfig().computedStyleSupportsPseudoElements
          }) + '":\n';
          return "" + nameString + descriptionString + domString;
        }
        return "" + nameString + domString;
      }).join("\n\n");
      return role + ":\n\n" + elementsString + "\n\n" + delimiterBar;
    }).join("\n");
  }
  function computeAriaSelected(element) {
    if (element.tagName === "OPTION") {
      return element.selected;
    }
    return checkBooleanAttribute(element, "aria-selected");
  }
  function computeAriaBusy(element) {
    return element.getAttribute("aria-busy") === "true";
  }
  function computeAriaChecked(element) {
    if ("indeterminate" in element && element.indeterminate) {
      return void 0;
    }
    if ("checked" in element) {
      return element.checked;
    }
    return checkBooleanAttribute(element, "aria-checked");
  }
  function computeAriaPressed(element) {
    return checkBooleanAttribute(element, "aria-pressed");
  }
  function computeAriaCurrent(element) {
    var _ref9, _checkBooleanAttribut;
    return (_ref9 = (_checkBooleanAttribut = checkBooleanAttribute(element, "aria-current")) != null ? _checkBooleanAttribut : element.getAttribute("aria-current")) != null ? _ref9 : false;
  }
  function computeAriaExpanded(element) {
    return checkBooleanAttribute(element, "aria-expanded");
  }
  function checkBooleanAttribute(element, attribute) {
    const attributeValue = element.getAttribute(attribute);
    if (attributeValue === "true") {
      return true;
    }
    if (attributeValue === "false") {
      return false;
    }
    return void 0;
  }
  function computeHeadingLevel(element) {
    const implicitHeadingLevels = {
      H1: 1,
      H2: 2,
      H3: 3,
      H4: 4,
      H5: 5,
      H6: 6
    };
    const ariaLevelAttribute = element.getAttribute("aria-level") && Number(element.getAttribute("aria-level"));
    return ariaLevelAttribute || implicitHeadingLevels[element.tagName];
  }
  function computeAriaValueNow(element) {
    const valueNow = element.getAttribute("aria-valuenow");
    return valueNow === null ? void 0 : +valueNow;
  }
  function computeAriaValueMax(element) {
    const valueMax = element.getAttribute("aria-valuemax");
    return valueMax === null ? void 0 : +valueMax;
  }
  function computeAriaValueMin(element) {
    const valueMin = element.getAttribute("aria-valuemin");
    return valueMin === null ? void 0 : +valueMin;
  }
  function computeAriaValueText(element) {
    const valueText = element.getAttribute("aria-valuetext");
    return valueText === null ? void 0 : valueText;
  }
  var normalize = getDefaultNormalizer();
  function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  }
  function getRegExpMatcher(string) {
    return new RegExp(escapeRegExp(string.toLowerCase()), "i");
  }
  function makeSuggestion(queryName, element, content, _ref) {
    let {
      variant,
      name
    } = _ref;
    let warning = "";
    const queryOptions = {};
    const queryArgs = [["Role", "TestId"].includes(queryName) ? content : getRegExpMatcher(content)];
    if (name) {
      queryOptions.name = getRegExpMatcher(name);
    }
    if (queryName === "Role" && isInaccessible(element)) {
      queryOptions.hidden = true;
      warning = "Element is inaccessible. This means that the element and all its children are invisible to screen readers.\n    If you are using the aria-hidden prop, make sure this is the right choice for your case.\n    ";
    }
    if (Object.keys(queryOptions).length > 0) {
      queryArgs.push(queryOptions);
    }
    const queryMethod = variant + "By" + queryName;
    return {
      queryName,
      queryMethod,
      queryArgs,
      variant,
      warning,
      toString() {
        if (warning) {
          console.warn(warning);
        }
        let [text, options] = queryArgs;
        text = typeof text === "string" ? "'" + text + "'" : text;
        options = options ? ", { " + Object.entries(options).map((_ref2) => {
          let [k, v] = _ref2;
          return k + ": " + v;
        }).join(", ") + " }" : "";
        return queryMethod + "(" + text + options + ")";
      }
    };
  }
  function canSuggest(currentMethod, requestedMethod, data) {
    return data && (!requestedMethod || requestedMethod.toLowerCase() === currentMethod.toLowerCase());
  }
  function getSuggestedQuery(element, variant, method) {
    var _element$getAttribute, _getImplicitAriaRoles;
    if (variant === void 0) {
      variant = "get";
    }
    if (element.matches(getConfig().defaultIgnore)) {
      return void 0;
    }
    const role = (_element$getAttribute = element.getAttribute("role")) != null ? _element$getAttribute : (_getImplicitAriaRoles = getImplicitAriaRoles(element)) == null ? void 0 : _getImplicitAriaRoles[0];
    if (role !== "generic" && canSuggest("Role", method, role)) {
      return makeSuggestion("Role", element, role, {
        variant,
        name: computeAccessibleName(element, {
          computedStyleSupportsPseudoElements: getConfig().computedStyleSupportsPseudoElements
        })
      });
    }
    const labelText = getLabels2(document, element).map((label) => label.content).join(" ");
    if (canSuggest("LabelText", method, labelText)) {
      return makeSuggestion("LabelText", element, labelText, {
        variant
      });
    }
    const placeholderText = element.getAttribute("placeholder");
    if (canSuggest("PlaceholderText", method, placeholderText)) {
      return makeSuggestion("PlaceholderText", element, placeholderText, {
        variant
      });
    }
    const textContent = normalize(getNodeText(element));
    if (canSuggest("Text", method, textContent)) {
      return makeSuggestion("Text", element, textContent, {
        variant
      });
    }
    if (canSuggest("DisplayValue", method, element.value)) {
      return makeSuggestion("DisplayValue", element, normalize(element.value), {
        variant
      });
    }
    const alt = element.getAttribute("alt");
    if (canSuggest("AltText", method, alt)) {
      return makeSuggestion("AltText", element, alt, {
        variant
      });
    }
    const title = element.getAttribute("title");
    if (canSuggest("Title", method, title)) {
      return makeSuggestion("Title", element, title, {
        variant
      });
    }
    const testId = element.getAttribute(getConfig().testIdAttribute);
    if (canSuggest("TestId", method, testId)) {
      return makeSuggestion("TestId", element, testId, {
        variant
      });
    }
    return void 0;
  }
  function copyStackTrace(target, source) {
    target.stack = source.stack.replace(source.message, target.message);
  }
  function waitFor(callback, _ref) {
    let {
      container = getDocument(),
      timeout = getConfig().asyncUtilTimeout,
      showOriginalStackTrace = getConfig().showOriginalStackTrace,
      stackTraceError,
      interval = 50,
      onTimeout = (error) => {
        Object.defineProperty(error, "message", {
          value: getConfig().getElementError(error.message, container).message
        });
        return error;
      },
      mutationObserverOptions = {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      }
    } = _ref;
    if (typeof callback !== "function") {
      throw new TypeError("Received `callback` arg must be a function");
    }
    return new Promise(async (resolve, reject) => {
      let lastError, intervalId, observer;
      let finished = false;
      let promiseStatus = "idle";
      const overallTimeoutTimer = setTimeout(handleTimeout, timeout);
      const usingJestFakeTimers = jestFakeTimersAreEnabled();
      if (usingJestFakeTimers) {
        const {
          unstable_advanceTimersWrapper: advanceTimersWrapper
        } = getConfig();
        checkCallback();
        while (!finished) {
          if (!jestFakeTimersAreEnabled()) {
            const error = new Error("Changed from using fake timers to real timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to real timers. For more info, please go to https://github.com/testing-library/dom-testing-library/issues/830");
            if (!showOriginalStackTrace) copyStackTrace(error, stackTraceError);
            reject(error);
            return;
          }
          await advanceTimersWrapper(async () => {
            jest.advanceTimersByTime(interval);
          });
          if (finished) {
            break;
          }
          checkCallback();
        }
      } else {
        try {
          checkContainerType(container);
        } catch (e) {
          reject(e);
          return;
        }
        intervalId = setInterval(checkRealTimersCallback, interval);
        const {
          MutationObserver: MutationObserver2
        } = getWindowFromNode(container);
        observer = new MutationObserver2(checkRealTimersCallback);
        observer.observe(container, mutationObserverOptions);
        checkCallback();
      }
      function onDone(error, result) {
        finished = true;
        clearTimeout(overallTimeoutTimer);
        if (!usingJestFakeTimers) {
          clearInterval(intervalId);
          observer.disconnect();
        }
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
      function checkRealTimersCallback() {
        if (jestFakeTimersAreEnabled()) {
          const error = new Error("Changed from using real timers to fake timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to fake timers. For more info, please go to https://github.com/testing-library/dom-testing-library/issues/830");
          if (!showOriginalStackTrace) copyStackTrace(error, stackTraceError);
          return reject(error);
        } else {
          return checkCallback();
        }
      }
      function checkCallback() {
        if (promiseStatus === "pending") return;
        try {
          const result = runWithExpensiveErrorDiagnosticsDisabled(callback);
          if (typeof (result == null ? void 0 : result.then) === "function") {
            promiseStatus = "pending";
            result.then((resolvedValue) => {
              promiseStatus = "resolved";
              onDone(null, resolvedValue);
            }, (rejectedValue) => {
              promiseStatus = "rejected";
              lastError = rejectedValue;
            });
          } else {
            onDone(null, result);
          }
        } catch (error) {
          lastError = error;
        }
      }
      function handleTimeout() {
        let error;
        if (lastError) {
          error = lastError;
          if (!showOriginalStackTrace && error.name === "TestingLibraryElementError") {
            copyStackTrace(error, stackTraceError);
          }
        } else {
          error = new Error("Timed out in waitFor.");
          if (!showOriginalStackTrace) {
            copyStackTrace(error, stackTraceError);
          }
        }
        onDone(onTimeout(error), null);
      }
    });
  }
  function waitForWrapper(callback, options) {
    const stackTraceError = new Error("STACK_TRACE_MESSAGE");
    return getConfig().asyncWrapper(() => waitFor(callback, {
      stackTraceError,
      ...options
    }));
  }
  function getElementError(message, container) {
    return getConfig().getElementError(message, container);
  }
  function getMultipleElementsFoundError(message, container) {
    return getElementError(message + "\n\n(If this is intentional, then use the `*AllBy*` variant of the query (like `queryAllByText`, `getAllByText`, or `findAllByText`)).", container);
  }
  function queryAllByAttribute(attribute, container, text, _temp) {
    let {
      exact = true,
      collapseWhitespace,
      trim,
      normalizer
    } = _temp === void 0 ? {} : _temp;
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    return Array.from(container.querySelectorAll("[" + attribute + "]")).filter((node) => matcher(node.getAttribute(attribute), node, text, matchNormalizer));
  }
  function makeSingleQuery(allQuery, getMultipleError2) {
    return function(container) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const els = allQuery(container, ...args);
      if (els.length > 1) {
        const elementStrings = els.map((element) => getElementError(null, element).message).join("\n\n");
        throw getMultipleElementsFoundError(getMultipleError2(container, ...args) + "\n\nHere are the matching elements:\n\n" + elementStrings, container);
      }
      return els[0] || null;
    };
  }
  function getSuggestionError(suggestion, container) {
    return getConfig().getElementError("A better query is available, try this:\n" + suggestion.toString() + "\n", container);
  }
  function makeGetAllQuery(allQuery, getMissingError2) {
    return function(container) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      const els = allQuery(container, ...args);
      if (!els.length) {
        throw getConfig().getElementError(getMissingError2(container, ...args), container);
      }
      return els;
    };
  }
  function makeFindQuery(getter) {
    return (container, text, options, waitForOptions) => {
      return waitForWrapper(() => {
        return getter(container, text, options);
      }, {
        container,
        ...waitForOptions
      });
    };
  }
  var wrapSingleQueryWithSuggestion = (query, queryAllByName, variant) => function(container) {
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    const element = query(container, ...args);
    const [{
      suggest = getConfig().throwSuggestions
    } = {}] = args.slice(-1);
    if (element && suggest) {
      const suggestion = getSuggestedQuery(element, variant);
      if (suggestion && !queryAllByName.endsWith(suggestion.queryName)) {
        throw getSuggestionError(suggestion.toString(), container);
      }
    }
    return element;
  };
  var wrapAllByQueryWithSuggestion = (query, queryAllByName, variant) => function(container) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }
    const els = query(container, ...args);
    const [{
      suggest = getConfig().throwSuggestions
    } = {}] = args.slice(-1);
    if (els.length && suggest) {
      const uniqueSuggestionMessages = [...new Set(els.map((element) => {
        var _getSuggestedQuery;
        return (_getSuggestedQuery = getSuggestedQuery(element, variant)) == null ? void 0 : _getSuggestedQuery.toString();
      }))];
      if (
        // only want to suggest if all the els have the same suggestion.
        uniqueSuggestionMessages.length === 1 && !queryAllByName.endsWith(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: Can this be null at runtime?
          getSuggestedQuery(els[0], variant).queryName
        )
      ) {
        throw getSuggestionError(uniqueSuggestionMessages[0], container);
      }
    }
    return els;
  };
  function buildQueries(queryAllBy, getMultipleError2, getMissingError2) {
    const queryBy = wrapSingleQueryWithSuggestion(makeSingleQuery(queryAllBy, getMultipleError2), queryAllBy.name, "query");
    const getAllBy = makeGetAllQuery(queryAllBy, getMissingError2);
    const getBy = makeSingleQuery(getAllBy, getMultipleError2);
    const getByWithSuggestions = wrapSingleQueryWithSuggestion(getBy, queryAllBy.name, "get");
    const getAllWithSuggestions = wrapAllByQueryWithSuggestion(getAllBy, queryAllBy.name.replace("query", "get"), "getAll");
    const findAllBy = makeFindQuery(wrapAllByQueryWithSuggestion(getAllBy, queryAllBy.name, "findAll"));
    const findBy = makeFindQuery(wrapSingleQueryWithSuggestion(getBy, queryAllBy.name, "find"));
    return [queryBy, getAllWithSuggestions, getByWithSuggestions, findAllBy, findBy];
  }
  function queryAllLabels(container) {
    return Array.from(container.querySelectorAll("label,input")).map((node) => {
      return {
        node,
        textToMatch: getLabelContent(node)
      };
    }).filter((_ref) => {
      let {
        textToMatch
      } = _ref;
      return textToMatch !== null;
    });
  }
  var queryAllLabelsByText = function(container, text, _temp) {
    let {
      exact = true,
      trim,
      collapseWhitespace,
      normalizer
    } = _temp === void 0 ? {} : _temp;
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    const textToMatchByLabels = queryAllLabels(container);
    return textToMatchByLabels.filter((_ref2) => {
      let {
        node,
        textToMatch
      } = _ref2;
      return matcher(textToMatch, node, text, matchNormalizer);
    }).map((_ref3) => {
      let {
        node
      } = _ref3;
      return node;
    });
  };
  var queryAllByLabelText = function(container, text, _temp2) {
    let {
      selector: selector2 = "*",
      exact = true,
      collapseWhitespace,
      trim,
      normalizer
    } = _temp2 === void 0 ? {} : _temp2;
    checkContainerType(container);
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    const matchingLabelledElements = Array.from(container.querySelectorAll("*")).filter((element) => {
      return getRealLabels(element).length || element.hasAttribute("aria-labelledby");
    }).reduce((labelledElements, labelledElement) => {
      const labelList = getLabels2(container, labelledElement, {
        selector: selector2
      });
      labelList.filter((label) => Boolean(label.formControl)).forEach((label) => {
        if (matcher(label.content, label.formControl, text, matchNormalizer) && label.formControl) {
          labelledElements.push(label.formControl);
        }
      });
      const labelsValue = labelList.filter((label) => Boolean(label.content)).map((label) => label.content);
      if (matcher(labelsValue.join(" "), labelledElement, text, matchNormalizer)) {
        labelledElements.push(labelledElement);
      }
      if (labelsValue.length > 1) {
        labelsValue.forEach((labelValue, index) => {
          if (matcher(labelValue, labelledElement, text, matchNormalizer)) {
            labelledElements.push(labelledElement);
          }
          const labelsFiltered = [...labelsValue];
          labelsFiltered.splice(index, 1);
          if (labelsFiltered.length > 1) {
            if (matcher(labelsFiltered.join(" "), labelledElement, text, matchNormalizer)) {
              labelledElements.push(labelledElement);
            }
          }
        });
      }
      return labelledElements;
    }, []).concat(queryAllByAttribute("aria-label", container, text, {
      exact,
      normalizer: matchNormalizer
    }));
    return Array.from(new Set(matchingLabelledElements)).filter((element) => element.matches(selector2));
  };
  var getAllByLabelText = function(container, text) {
    for (var _len = arguments.length, rest = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      rest[_key - 2] = arguments[_key];
    }
    const els = queryAllByLabelText(container, text, ...rest);
    if (!els.length) {
      const labels = queryAllLabelsByText(container, text, ...rest);
      if (labels.length) {
        const tagNames = labels.map((label) => getTagNameOfElementAssociatedWithLabelViaFor(container, label)).filter((tagName2) => !!tagName2);
        if (tagNames.length) {
          throw getConfig().getElementError(tagNames.map((tagName2) => "Found a label with the text of: " + text + ", however the element associated with this label (<" + tagName2 + " />) is non-labellable [https://html.spec.whatwg.org/multipage/forms.html#category-label]. If you really need to label a <" + tagName2 + " />, you can use aria-label or aria-labelledby instead.").join("\n\n"), container);
        } else {
          throw getConfig().getElementError("Found a label with the text of: " + text + `, however no form control was found associated to that label. Make sure you're using the "for" attribute or "aria-labelledby" attribute correctly.`, container);
        }
      } else {
        throw getConfig().getElementError("Unable to find a label with the text of: " + text, container);
      }
    }
    return els;
  };
  function getTagNameOfElementAssociatedWithLabelViaFor(container, label) {
    const htmlFor = label.getAttribute("for");
    if (!htmlFor) {
      return null;
    }
    const element = container.querySelector('[id="' + htmlFor + '"]');
    return element ? element.tagName.toLowerCase() : null;
  }
  var getMultipleError$7 = (c, text) => "Found multiple elements with the text of: " + text;
  var queryByLabelText = wrapSingleQueryWithSuggestion(makeSingleQuery(queryAllByLabelText, getMultipleError$7), queryAllByLabelText.name, "query");
  var getByLabelText = makeSingleQuery(getAllByLabelText, getMultipleError$7);
  var findAllByLabelText = makeFindQuery(wrapAllByQueryWithSuggestion(getAllByLabelText, getAllByLabelText.name, "findAll"));
  var findByLabelText = makeFindQuery(wrapSingleQueryWithSuggestion(getByLabelText, getAllByLabelText.name, "find"));
  var getAllByLabelTextWithSuggestions = wrapAllByQueryWithSuggestion(getAllByLabelText, getAllByLabelText.name, "getAll");
  var getByLabelTextWithSuggestions = wrapSingleQueryWithSuggestion(getByLabelText, getAllByLabelText.name, "get");
  var queryAllByLabelTextWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByLabelText, queryAllByLabelText.name, "queryAll");
  var queryAllByPlaceholderText = function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    checkContainerType(args[0]);
    return queryAllByAttribute("placeholder", ...args);
  };
  var getMultipleError$6 = (c, text) => "Found multiple elements with the placeholder text of: " + text;
  var getMissingError$6 = (c, text) => "Unable to find an element with the placeholder text of: " + text;
  var queryAllByPlaceholderTextWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByPlaceholderText, queryAllByPlaceholderText.name, "queryAll");
  var [queryByPlaceholderText, getAllByPlaceholderText, getByPlaceholderText, findAllByPlaceholderText, findByPlaceholderText] = buildQueries(queryAllByPlaceholderText, getMultipleError$6, getMissingError$6);
  var queryAllByText = function(container, text, _temp) {
    let {
      selector: selector2 = "*",
      exact = true,
      collapseWhitespace,
      trim,
      ignore = getConfig().defaultIgnore,
      normalizer
    } = _temp === void 0 ? {} : _temp;
    checkContainerType(container);
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    let baseArray = [];
    if (typeof container.matches === "function" && container.matches(selector2)) {
      baseArray = [container];
    }
    return [...baseArray, ...Array.from(container.querySelectorAll(selector2))].filter((node) => !ignore || !node.matches(ignore)).filter((node) => matcher(getNodeText(node), node, text, matchNormalizer));
  };
  var getMultipleError$5 = (c, text) => "Found multiple elements with the text: " + text;
  var getMissingError$5 = function(c, text, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      collapseWhitespace,
      trim,
      normalizer,
      selector: selector2
    } = options;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    const normalizedText = matchNormalizer(text.toString());
    const isNormalizedDifferent = normalizedText !== text.toString();
    const isCustomSelector = (selector2 != null ? selector2 : "*") !== "*";
    return "Unable to find an element with the text: " + (isNormalizedDifferent ? normalizedText + " (normalized from '" + text + "')" : text) + (isCustomSelector ? ", which matches selector '" + selector2 + "'" : "") + ". This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.";
  };
  var queryAllByTextWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByText, queryAllByText.name, "queryAll");
  var [queryByText, getAllByText, getByText, findAllByText, findByText] = buildQueries(queryAllByText, getMultipleError$5, getMissingError$5);
  var queryAllByDisplayValue = function(container, value, _temp) {
    let {
      exact = true,
      collapseWhitespace,
      trim,
      normalizer
    } = _temp === void 0 ? {} : _temp;
    checkContainerType(container);
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    return Array.from(container.querySelectorAll("input,textarea,select")).filter((node) => {
      if (node.tagName === "SELECT") {
        const selectedOptions = Array.from(node.options).filter((option) => option.selected);
        return selectedOptions.some((optionNode) => matcher(getNodeText(optionNode), optionNode, value, matchNormalizer));
      } else {
        return matcher(node.value, node, value, matchNormalizer);
      }
    });
  };
  var getMultipleError$4 = (c, value) => "Found multiple elements with the display value: " + value + ".";
  var getMissingError$4 = (c, value) => "Unable to find an element with the display value: " + value + ".";
  var queryAllByDisplayValueWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByDisplayValue, queryAllByDisplayValue.name, "queryAll");
  var [queryByDisplayValue, getAllByDisplayValue, getByDisplayValue, findAllByDisplayValue, findByDisplayValue] = buildQueries(queryAllByDisplayValue, getMultipleError$4, getMissingError$4);
  var VALID_TAG_REGEXP = /^(img|input|area|.+-.+)$/i;
  var queryAllByAltText = function(container, alt, options) {
    if (options === void 0) {
      options = {};
    }
    checkContainerType(container);
    return queryAllByAttribute("alt", container, alt, options).filter((node) => VALID_TAG_REGEXP.test(node.tagName));
  };
  var getMultipleError$3 = (c, alt) => "Found multiple elements with the alt text: " + alt;
  var getMissingError$3 = (c, alt) => "Unable to find an element with the alt text: " + alt;
  var queryAllByAltTextWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByAltText, queryAllByAltText.name, "queryAll");
  var [queryByAltText, getAllByAltText, getByAltText, findAllByAltText, findByAltText] = buildQueries(queryAllByAltText, getMultipleError$3, getMissingError$3);
  var isSvgTitle = (node) => {
    var _node$parentElement;
    return node.tagName.toLowerCase() === "title" && ((_node$parentElement = node.parentElement) == null ? void 0 : _node$parentElement.tagName.toLowerCase()) === "svg";
  };
  var queryAllByTitle = function(container, text, _temp) {
    let {
      exact = true,
      collapseWhitespace,
      trim,
      normalizer
    } = _temp === void 0 ? {} : _temp;
    checkContainerType(container);
    const matcher = exact ? matches : fuzzyMatches;
    const matchNormalizer = makeNormalizer({
      collapseWhitespace,
      trim,
      normalizer
    });
    return Array.from(container.querySelectorAll("[title], svg > title")).filter((node) => matcher(node.getAttribute("title"), node, text, matchNormalizer) || isSvgTitle(node) && matcher(getNodeText(node), node, text, matchNormalizer));
  };
  var getMultipleError$2 = (c, title) => "Found multiple elements with the title: " + title + ".";
  var getMissingError$2 = (c, title) => "Unable to find an element with the title: " + title + ".";
  var queryAllByTitleWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByTitle, queryAllByTitle.name, "queryAll");
  var [queryByTitle, getAllByTitle, getByTitle, findAllByTitle, findByTitle] = buildQueries(queryAllByTitle, getMultipleError$2, getMissingError$2);
  var queryAllByRole = function(container, role, _temp) {
    let {
      hidden = getConfig().defaultHidden,
      name,
      description,
      queryFallbacks = false,
      selected,
      busy,
      checked,
      pressed,
      current,
      level,
      expanded,
      value: {
        now: valueNow,
        min: valueMin,
        max: valueMax,
        text: valueText
      } = {}
    } = _temp === void 0 ? {} : _temp;
    checkContainerType(container);
    if (selected !== void 0) {
      var _allRoles$get;
      if (((_allRoles$get = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get.props["aria-selected"]) === void 0) {
        throw new Error('"aria-selected" is not supported on role "' + role + '".');
      }
    }
    if (busy !== void 0) {
      var _allRoles$get2;
      if (((_allRoles$get2 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get2.props["aria-busy"]) === void 0) {
        throw new Error('"aria-busy" is not supported on role "' + role + '".');
      }
    }
    if (checked !== void 0) {
      var _allRoles$get3;
      if (((_allRoles$get3 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get3.props["aria-checked"]) === void 0) {
        throw new Error('"aria-checked" is not supported on role "' + role + '".');
      }
    }
    if (pressed !== void 0) {
      var _allRoles$get4;
      if (((_allRoles$get4 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get4.props["aria-pressed"]) === void 0) {
        throw new Error('"aria-pressed" is not supported on role "' + role + '".');
      }
    }
    if (current !== void 0) {
      var _allRoles$get5;
      if (((_allRoles$get5 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get5.props["aria-current"]) === void 0) {
        throw new Error('"aria-current" is not supported on role "' + role + '".');
      }
    }
    if (level !== void 0) {
      if (role !== "heading") {
        throw new Error('Role "' + role + '" cannot have "level" property.');
      }
    }
    if (valueNow !== void 0) {
      var _allRoles$get6;
      if (((_allRoles$get6 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get6.props["aria-valuenow"]) === void 0) {
        throw new Error('"aria-valuenow" is not supported on role "' + role + '".');
      }
    }
    if (valueMax !== void 0) {
      var _allRoles$get7;
      if (((_allRoles$get7 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get7.props["aria-valuemax"]) === void 0) {
        throw new Error('"aria-valuemax" is not supported on role "' + role + '".');
      }
    }
    if (valueMin !== void 0) {
      var _allRoles$get8;
      if (((_allRoles$get8 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get8.props["aria-valuemin"]) === void 0) {
        throw new Error('"aria-valuemin" is not supported on role "' + role + '".');
      }
    }
    if (valueText !== void 0) {
      var _allRoles$get9;
      if (((_allRoles$get9 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get9.props["aria-valuetext"]) === void 0) {
        throw new Error('"aria-valuetext" is not supported on role "' + role + '".');
      }
    }
    if (expanded !== void 0) {
      var _allRoles$get0;
      if (((_allRoles$get0 = import_aria_query.roles.get(role)) == null ? void 0 : _allRoles$get0.props["aria-expanded"]) === void 0) {
        throw new Error('"aria-expanded" is not supported on role "' + role + '".');
      }
    }
    const subtreeIsInaccessibleCache = /* @__PURE__ */ new WeakMap();
    function cachedIsSubtreeInaccessible(element) {
      if (!subtreeIsInaccessibleCache.has(element)) {
        subtreeIsInaccessibleCache.set(element, isSubtreeInaccessible(element));
      }
      return subtreeIsInaccessibleCache.get(element);
    }
    return Array.from(container.querySelectorAll(
      // Only query elements that can be matched by the following filters
      makeRoleSelector(role)
    )).filter((node) => {
      const isRoleSpecifiedExplicitly = node.hasAttribute("role");
      if (isRoleSpecifiedExplicitly) {
        const roleValue = node.getAttribute("role");
        if (queryFallbacks) {
          return roleValue.split(" ").filter(Boolean).some((roleAttributeToken) => roleAttributeToken === role);
        }
        const [firstRoleAttributeToken] = roleValue.split(" ");
        return firstRoleAttributeToken === role;
      }
      const implicitRoles = getImplicitAriaRoles(node);
      return implicitRoles.some((implicitRole) => {
        return implicitRole === role;
      });
    }).filter((element) => {
      if (selected !== void 0) {
        return selected === computeAriaSelected(element);
      }
      if (busy !== void 0) {
        return busy === computeAriaBusy(element);
      }
      if (checked !== void 0) {
        return checked === computeAriaChecked(element);
      }
      if (pressed !== void 0) {
        return pressed === computeAriaPressed(element);
      }
      if (current !== void 0) {
        return current === computeAriaCurrent(element);
      }
      if (expanded !== void 0) {
        return expanded === computeAriaExpanded(element);
      }
      if (level !== void 0) {
        return level === computeHeadingLevel(element);
      }
      if (valueNow !== void 0 || valueMax !== void 0 || valueMin !== void 0 || valueText !== void 0) {
        let valueMatches = true;
        if (valueNow !== void 0) {
          valueMatches && (valueMatches = valueNow === computeAriaValueNow(element));
        }
        if (valueMax !== void 0) {
          valueMatches && (valueMatches = valueMax === computeAriaValueMax(element));
        }
        if (valueMin !== void 0) {
          valueMatches && (valueMatches = valueMin === computeAriaValueMin(element));
        }
        if (valueText !== void 0) {
          var _computeAriaValueText;
          valueMatches && (valueMatches = matches((_computeAriaValueText = computeAriaValueText(element)) != null ? _computeAriaValueText : null, element, valueText, (text) => text));
        }
        return valueMatches;
      }
      return true;
    }).filter((element) => {
      if (name === void 0) {
        return true;
      }
      return matches(computeAccessibleName(element, {
        computedStyleSupportsPseudoElements: getConfig().computedStyleSupportsPseudoElements
      }), element, name, (text) => text);
    }).filter((element) => {
      if (description === void 0) {
        return true;
      }
      return matches(computeAccessibleDescription(element, {
        computedStyleSupportsPseudoElements: getConfig().computedStyleSupportsPseudoElements
      }), element, description, (text) => text);
    }).filter((element) => {
      return hidden === false ? isInaccessible(element, {
        isSubtreeInaccessible: cachedIsSubtreeInaccessible
      }) === false : true;
    });
  };
  function makeRoleSelector(role) {
    var _roleElements$get;
    const explicitRoleSelector = '*[role~="' + role + '"]';
    const roleRelations = (_roleElements$get = import_aria_query.roleElements.get(role)) != null ? _roleElements$get : /* @__PURE__ */ new Set();
    const implicitRoleSelectors = new Set(Array.from(roleRelations).map((_ref) => {
      let {
        name
      } = _ref;
      return name;
    }));
    return [explicitRoleSelector].concat(Array.from(implicitRoleSelectors)).join(",");
  }
  var getNameHint = (name) => {
    let nameHint = "";
    if (name === void 0) {
      nameHint = "";
    } else if (typeof name === "string") {
      nameHint = ' and name "' + name + '"';
    } else {
      nameHint = " and name `" + name + "`";
    }
    return nameHint;
  };
  var getMultipleError$1 = function(c, role, _temp2) {
    let {
      name
    } = _temp2 === void 0 ? {} : _temp2;
    return 'Found multiple elements with the role "' + role + '"' + getNameHint(name);
  };
  var getMissingError$1 = function(container, role, _temp3) {
    let {
      hidden = getConfig().defaultHidden,
      name,
      description
    } = _temp3 === void 0 ? {} : _temp3;
    if (getConfig()._disableExpensiveErrorDiagnostics) {
      return 'Unable to find role="' + role + '"' + getNameHint(name);
    }
    let roles2 = "";
    Array.from(container.children).forEach((childElement) => {
      roles2 += prettyRoles(childElement, {
        hidden,
        includeDescription: description !== void 0
      });
    });
    let roleMessage;
    if (roles2.length === 0) {
      if (hidden === false) {
        roleMessage = "There are no accessible roles. But there might be some inaccessible roles. If you wish to access them, then set the `hidden` option to `true`. Learn more about this here: https://testing-library.com/docs/dom-testing-library/api-queries#byrole";
      } else {
        roleMessage = "There are no available roles.";
      }
    } else {
      roleMessage = ("\nHere are the " + (hidden === false ? "accessible" : "available") + " roles:\n\n  " + roles2.replace(/\n/g, "\n  ").replace(/\n\s\s\n/g, "\n\n") + "\n").trim();
    }
    let nameHint = "";
    if (name === void 0) {
      nameHint = "";
    } else if (typeof name === "string") {
      nameHint = ' and name "' + name + '"';
    } else {
      nameHint = " and name `" + name + "`";
    }
    let descriptionHint = "";
    if (description === void 0) {
      descriptionHint = "";
    } else if (typeof description === "string") {
      descriptionHint = ' and description "' + description + '"';
    } else {
      descriptionHint = " and description `" + description + "`";
    }
    return ("\nUnable to find an " + (hidden === false ? "accessible " : "") + 'element with the role "' + role + '"' + nameHint + descriptionHint + "\n\n" + roleMessage).trim();
  };
  var queryAllByRoleWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByRole, queryAllByRole.name, "queryAll");
  var [queryByRole, getAllByRole, getByRole, findAllByRole, findByRole] = buildQueries(queryAllByRole, getMultipleError$1, getMissingError$1);
  var getTestIdAttribute = () => getConfig().testIdAttribute;
  var queryAllByTestId = function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    checkContainerType(args[0]);
    return queryAllByAttribute(getTestIdAttribute(), ...args);
  };
  var getMultipleError = (c, id) => "Found multiple elements by: [" + getTestIdAttribute() + '="' + id + '"]';
  var getMissingError = (c, id) => "Unable to find an element by: [" + getTestIdAttribute() + '="' + id + '"]';
  var queryAllByTestIdWithSuggestions = wrapAllByQueryWithSuggestion(queryAllByTestId, queryAllByTestId.name, "queryAll");
  var [queryByTestId, getAllByTestId, getByTestId, findAllByTestId, findByTestId] = buildQueries(queryAllByTestId, getMultipleError, getMissingError);
  var queries = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    queryAllByLabelText: queryAllByLabelTextWithSuggestions,
    queryByLabelText,
    getAllByLabelText: getAllByLabelTextWithSuggestions,
    getByLabelText: getByLabelTextWithSuggestions,
    findAllByLabelText,
    findByLabelText,
    queryByPlaceholderText,
    queryAllByPlaceholderText: queryAllByPlaceholderTextWithSuggestions,
    getByPlaceholderText,
    getAllByPlaceholderText,
    findAllByPlaceholderText,
    findByPlaceholderText,
    queryByText,
    queryAllByText: queryAllByTextWithSuggestions,
    getByText,
    getAllByText,
    findAllByText,
    findByText,
    queryByDisplayValue,
    queryAllByDisplayValue: queryAllByDisplayValueWithSuggestions,
    getByDisplayValue,
    getAllByDisplayValue,
    findAllByDisplayValue,
    findByDisplayValue,
    queryByAltText,
    queryAllByAltText: queryAllByAltTextWithSuggestions,
    getByAltText,
    getAllByAltText,
    findAllByAltText,
    findByAltText,
    queryByTitle,
    queryAllByTitle: queryAllByTitleWithSuggestions,
    getByTitle,
    getAllByTitle,
    findAllByTitle,
    findByTitle,
    queryByRole,
    queryAllByRole: queryAllByRoleWithSuggestions,
    getAllByRole,
    getByRole,
    findAllByRole,
    findByRole,
    queryByTestId,
    queryAllByTestId: queryAllByTestIdWithSuggestions,
    getByTestId,
    getAllByTestId,
    findAllByTestId,
    findByTestId
  });
  function getQueriesForElement(element, queries$1, initialValue2) {
    if (queries$1 === void 0) {
      queries$1 = queries;
    }
    if (initialValue2 === void 0) {
      initialValue2 = {};
    }
    return Object.keys(queries$1).reduce((helpers, key) => {
      const fn = queries$1[key];
      helpers[key] = fn.bind(null, element);
      return helpers;
    }, initialValue2);
  }
  var eventMap = {
    // Clipboard Events
    copy: {
      EventType: "ClipboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    cut: {
      EventType: "ClipboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    paste: {
      EventType: "ClipboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    // Composition Events
    compositionEnd: {
      EventType: "CompositionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    compositionStart: {
      EventType: "CompositionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    compositionUpdate: {
      EventType: "CompositionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    // Keyboard Events
    keyDown: {
      EventType: "KeyboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        charCode: 0,
        composed: true
      }
    },
    keyPress: {
      EventType: "KeyboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        charCode: 0,
        composed: true
      }
    },
    keyUp: {
      EventType: "KeyboardEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        charCode: 0,
        composed: true
      }
    },
    // Focus Events
    focus: {
      EventType: "FocusEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false,
        composed: true
      }
    },
    blur: {
      EventType: "FocusEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false,
        composed: true
      }
    },
    focusIn: {
      EventType: "FocusEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    focusOut: {
      EventType: "FocusEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    // Form Events
    change: {
      EventType: "Event",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    input: {
      EventType: "InputEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    invalid: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: true
      }
    },
    submit: {
      EventType: "Event",
      defaultInit: {
        bubbles: true,
        cancelable: true
      }
    },
    reset: {
      EventType: "Event",
      defaultInit: {
        bubbles: true,
        cancelable: true
      }
    },
    // Mouse Events
    click: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        button: 0,
        composed: true
      }
    },
    contextMenu: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    dblClick: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    drag: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    dragEnd: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    dragEnter: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    dragExit: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    dragLeave: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    dragOver: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    dragStart: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    drop: {
      EventType: "DragEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    mouseDown: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    mouseEnter: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false,
        composed: true
      }
    },
    mouseLeave: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false,
        composed: true
      }
    },
    mouseMove: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    mouseOut: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    mouseOver: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    mouseUp: {
      EventType: "MouseEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    // Selection Events
    select: {
      EventType: "Event",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    // Touch Events
    touchCancel: {
      EventType: "TouchEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    touchEnd: {
      EventType: "TouchEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    touchMove: {
      EventType: "TouchEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    touchStart: {
      EventType: "TouchEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    // UI Events
    resize: {
      EventType: "UIEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    scroll: {
      EventType: "UIEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    // Wheel Events
    wheel: {
      EventType: "WheelEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    // Media Events
    abort: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    canPlay: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    canPlayThrough: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    durationChange: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    emptied: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    encrypted: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    ended: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    loadedData: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    loadedMetadata: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    loadStart: {
      EventType: "ProgressEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    pause: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    play: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    playing: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    progress: {
      EventType: "ProgressEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    rateChange: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    seeked: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    seeking: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    stalled: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    suspend: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    timeUpdate: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    volumeChange: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    waiting: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    // Events
    load: {
      // TODO: load events can be UIEvent or Event depending on what generated them
      // This is where this abstraction breaks down.
      // But the common targets are <img />, <script /> and window.
      // Neither of these targets receive a UIEvent
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    error: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    // Animation Events
    animationStart: {
      EventType: "AnimationEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    animationEnd: {
      EventType: "AnimationEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    animationIteration: {
      EventType: "AnimationEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    // Transition Events
    transitionCancel: {
      EventType: "TransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    transitionEnd: {
      EventType: "TransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true
      }
    },
    transitionRun: {
      EventType: "TransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    transitionStart: {
      EventType: "TransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    // pointer events
    pointerOver: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    pointerEnter: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    pointerDown: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    pointerMove: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    pointerUp: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    pointerCancel: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    pointerOut: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true,
        composed: true
      }
    },
    pointerLeave: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    gotPointerCapture: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    lostPointerCapture: {
      EventType: "PointerEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false,
        composed: true
      }
    },
    // history events
    popState: {
      EventType: "PopStateEvent",
      defaultInit: {
        bubbles: true,
        cancelable: false
      }
    },
    // window events
    offline: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    online: {
      EventType: "Event",
      defaultInit: {
        bubbles: false,
        cancelable: false
      }
    },
    pageHide: {
      EventType: "PageTransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true
      }
    },
    pageShow: {
      EventType: "PageTransitionEvent",
      defaultInit: {
        bubbles: true,
        cancelable: true
      }
    }
  };
  var eventAliasMap = {
    doubleClick: "dblClick"
  };
  function fireEvent(element, event) {
    return getConfig().eventWrapper(() => {
      if (!event) {
        throw new Error("Unable to fire an event - please provide an event object.");
      }
      if (!element) {
        throw new Error('Unable to fire a "' + event.type + '" event - please provide a DOM element.');
      }
      return element.dispatchEvent(event);
    });
  }
  function createEvent(eventName, node, init, _temp) {
    let {
      EventType = "Event",
      defaultInit = {}
    } = _temp === void 0 ? {} : _temp;
    if (!node) {
      throw new Error('Unable to fire a "' + eventName + '" event - please provide a DOM element.');
    }
    const eventInit = {
      ...defaultInit,
      ...init
    };
    const {
      target: {
        value,
        files,
        ...targetProperties
      } = {}
    } = eventInit;
    if (value !== void 0) {
      setNativeValue(node, value);
    }
    if (files !== void 0) {
      Object.defineProperty(node, "files", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: files
      });
    }
    Object.assign(node, targetProperties);
    const window2 = getWindowFromNode(node);
    const EventConstructor = window2[EventType] || window2.Event;
    let event;
    if (typeof EventConstructor === "function") {
      event = new EventConstructor(eventName, eventInit);
    } else {
      event = window2.document.createEvent(EventType);
      const {
        bubbles,
        cancelable,
        detail,
        ...otherInit
      } = eventInit;
      event.initEvent(eventName, bubbles, cancelable, detail);
      Object.keys(otherInit).forEach((eventKey) => {
        event[eventKey] = otherInit[eventKey];
      });
    }
    const dataTransferProperties = ["dataTransfer", "clipboardData"];
    dataTransferProperties.forEach((dataTransferKey) => {
      const dataTransferValue = eventInit[dataTransferKey];
      if (typeof dataTransferValue === "object") {
        if (typeof window2.DataTransfer === "function") {
          Object.defineProperty(event, dataTransferKey, {
            value: Object.getOwnPropertyNames(dataTransferValue).reduce((acc, propName) => {
              Object.defineProperty(acc, propName, {
                value: dataTransferValue[propName]
              });
              return acc;
            }, new window2.DataTransfer())
          });
        } else {
          Object.defineProperty(event, dataTransferKey, {
            value: dataTransferValue
          });
        }
      }
    });
    return event;
  }
  Object.keys(eventMap).forEach((key) => {
    const {
      EventType,
      defaultInit
    } = eventMap[key];
    const eventName = key.toLowerCase();
    createEvent[key] = (node, init) => createEvent(eventName, node, init, {
      EventType,
      defaultInit
    });
    fireEvent[key] = (node, init) => fireEvent(node, createEvent[key](node, init));
  });
  function setNativeValue(element, value) {
    const {
      set: valueSetter
    } = Object.getOwnPropertyDescriptor(element, "value") || {};
    const prototype = Object.getPrototypeOf(element);
    const {
      set: prototypeValueSetter
    } = Object.getOwnPropertyDescriptor(prototype, "value") || {};
    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else {
      if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        throw new Error("The given element does not have a value setter");
      }
    }
  }
  Object.keys(eventAliasMap).forEach((aliasKey) => {
    const key = eventAliasMap[aliasKey];
    fireEvent[aliasKey] = function() {
      return fireEvent[key](...arguments);
    };
  });
  function unindent(string) {
    return string.replace(/[ \t]*[\n][ \t]*/g, "\n");
  }
  function encode(value) {
    return import_lz_string.default.compressToEncodedURIComponent(unindent(value));
  }
  function getPlaygroundUrl(markup) {
    return "https://testing-playground.com/#markup=" + encode(markup);
  }
  var debug = (element, maxLength, options) => Array.isArray(element) ? element.forEach((el) => logDOM(el, maxLength, options)) : logDOM(element, maxLength, options);
  var logTestingPlaygroundURL = function(element) {
    if (element === void 0) {
      element = getDocument().body;
    }
    if (!element || !("innerHTML" in element)) {
      console.log("The element you're providing isn't a valid DOM element.");
      return;
    }
    if (!element.innerHTML) {
      console.log("The provided element doesn't have any children.");
      return;
    }
    const playgroundUrl = getPlaygroundUrl(element.innerHTML);
    console.log("Open this URL in your browser\n\n" + playgroundUrl);
    return playgroundUrl;
  };
  var initialValue = {
    debug,
    logTestingPlaygroundURL
  };
  var screen = typeof document !== "undefined" && document.body ? getQueriesForElement(document.body, queries, initialValue) : Object.keys(queries).reduce((helpers, key) => {
    helpers[key] = () => {
      throw new TypeError("For queries bound to document.body a global document has to be available... Learn more: https://testing-library.com/s/screen-global-error");
    };
    return helpers;
  }, initialValue);

  // ../../../node_modules/dom-accessibility-api/dist/polyfills/array.from.mjs
  var toStr2 = Object.prototype.toString;
  function isCallable2(fn) {
    return typeof fn === "function" || toStr2.call(fn) === "[object Function]";
  }
  function toInteger2(value) {
    var number = Number(value);
    if (isNaN(number)) {
      return 0;
    }
    if (number === 0 || !isFinite(number)) {
      return number;
    }
    return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
  }
  var maxSafeInteger2 = Math.pow(2, 53) - 1;
  function toLength2(value) {
    var len = toInteger2(value);
    return Math.min(Math.max(len, 0), maxSafeInteger2);
  }
  function arrayFrom2(arrayLike, mapFn) {
    var C = Array;
    var items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError("Array.from requires an array-like object - not null or undefined");
    }
    if (typeof mapFn !== "undefined") {
      if (!isCallable2(mapFn)) {
        throw new TypeError("Array.from: when provided, the second argument must be a function");
      }
    }
    var len = toLength2(items.length);
    var A = isCallable2(C) ? Object(new C(len)) : new Array(len);
    var k = 0;
    var kValue;
    while (k < len) {
      kValue = items[k];
      if (mapFn) {
        A[k] = mapFn(kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = len;
    return A;
  }

  // ../../../node_modules/dom-accessibility-api/dist/polyfills/SetLike.mjs
  function _typeof3(o) {
    "@babel/helpers - typeof";
    return _typeof3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof3(o);
  }
  function _classCallCheck2(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties2(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey3(descriptor.key), descriptor);
    }
  }
  function _createClass2(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties2(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties2(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", { writable: false });
    return Constructor;
  }
  function _defineProperty3(obj, key, value) {
    key = _toPropertyKey3(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey3(t) {
    var i = _toPrimitive3(t, "string");
    return "symbol" == _typeof3(i) ? i : i + "";
  }
  function _toPrimitive3(t, r) {
    if ("object" != _typeof3(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof3(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  var SetLike2 = /* @__PURE__ */ (function() {
    function SetLike3() {
      var items = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      _classCallCheck2(this, SetLike3);
      _defineProperty3(this, "items", void 0);
      this.items = items;
    }
    return _createClass2(SetLike3, [{
      key: "add",
      value: function add(value) {
        if (this.has(value) === false) {
          this.items.push(value);
        }
        return this;
      }
    }, {
      key: "clear",
      value: function clear() {
        this.items = [];
      }
    }, {
      key: "delete",
      value: function _delete(value) {
        var previousLength = this.items.length;
        this.items = this.items.filter(function(item) {
          return item !== value;
        });
        return previousLength !== this.items.length;
      }
    }, {
      key: "forEach",
      value: function forEach(callbackfn) {
        var _this = this;
        this.items.forEach(function(item) {
          callbackfn(item, item, _this);
        });
      }
    }, {
      key: "has",
      value: function has(value) {
        return this.items.indexOf(value) !== -1;
      }
    }, {
      key: "size",
      get: function get() {
        return this.items.length;
      }
    }]);
  })();
  var SetLike_default2 = typeof Set === "undefined" ? Set : SetLike2;

  // ../../../node_modules/dom-accessibility-api/dist/getRole.mjs
  function getLocalName2(element) {
    var _element$localName;
    return (
      // eslint-disable-next-line no-restricted-properties -- actual guard for environments without localName
      (_element$localName = element.localName) !== null && _element$localName !== void 0 ? _element$localName : (
        // eslint-disable-next-line no-restricted-properties -- required for the fallback
        element.tagName.toLowerCase()
      )
    );
  }
  var localNameToRoleMappings2 = {
    article: "article",
    aside: "complementary",
    button: "button",
    datalist: "listbox",
    dd: "definition",
    details: "group",
    dialog: "dialog",
    dt: "term",
    fieldset: "group",
    figure: "figure",
    // WARNING: Only with an accessible name
    form: "form",
    footer: "contentinfo",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    header: "banner",
    hr: "separator",
    html: "document",
    legend: "legend",
    li: "listitem",
    math: "math",
    main: "main",
    menu: "list",
    nav: "navigation",
    ol: "list",
    optgroup: "group",
    // WARNING: Only in certain context
    option: "option",
    output: "status",
    progress: "progressbar",
    // WARNING: Only with an accessible name
    section: "region",
    summary: "button",
    table: "table",
    tbody: "rowgroup",
    textarea: "textbox",
    tfoot: "rowgroup",
    // WARNING: Only in certain context
    td: "cell",
    th: "columnheader",
    thead: "rowgroup",
    tr: "row",
    ul: "list"
  };
  var prohibitedAttributes2 = {
    caption: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    code: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    deletion: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    emphasis: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    generic: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby", "aria-roledescription"]),
    insertion: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    none: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    paragraph: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    presentation: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    strong: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    subscript: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"]),
    superscript: /* @__PURE__ */ new Set(["aria-label", "aria-labelledby"])
  };
  function hasGlobalAriaAttributes2(element, role) {
    return [
      "aria-atomic",
      "aria-busy",
      "aria-controls",
      "aria-current",
      "aria-description",
      "aria-describedby",
      "aria-details",
      // "disabled",
      "aria-dropeffect",
      // "errormessage",
      "aria-flowto",
      "aria-grabbed",
      // "haspopup",
      "aria-hidden",
      // "invalid",
      "aria-keyshortcuts",
      "aria-label",
      "aria-labelledby",
      "aria-live",
      "aria-owns",
      "aria-relevant",
      "aria-roledescription"
    ].some(function(attributeName) {
      var _prohibitedAttributes;
      return element.hasAttribute(attributeName) && !((_prohibitedAttributes = prohibitedAttributes2[role]) !== null && _prohibitedAttributes !== void 0 && _prohibitedAttributes.has(attributeName));
    });
  }
  function ignorePresentationalRole2(element, implicitRole) {
    return hasGlobalAriaAttributes2(element, implicitRole);
  }
  function getRole2(element) {
    var explicitRole = getExplicitRole2(element);
    if (explicitRole === null || presentationRoles.indexOf(explicitRole) !== -1) {
      var implicitRole = getImplicitRole2(element);
      if (presentationRoles.indexOf(explicitRole || "") === -1 || ignorePresentationalRole2(element, implicitRole || "")) {
        return implicitRole;
      }
    }
    return explicitRole;
  }
  function getImplicitRole2(element) {
    var mappedByTag = localNameToRoleMappings2[getLocalName2(element)];
    if (mappedByTag !== void 0) {
      return mappedByTag;
    }
    switch (getLocalName2(element)) {
      case "a":
      case "area":
      case "link":
        if (element.hasAttribute("href")) {
          return "link";
        }
        break;
      case "img":
        if (element.getAttribute("alt") === "" && !ignorePresentationalRole2(element, "img")) {
          return "presentation";
        }
        return "img";
      case "input": {
        var _ref = element, type = _ref.type;
        switch (type) {
          case "button":
          case "image":
          case "reset":
          case "submit":
            return "button";
          case "checkbox":
          case "radio":
            return type;
          case "range":
            return "slider";
          case "email":
          case "tel":
          case "text":
          case "url":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "textbox";
          case "search":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "searchbox";
          case "number":
            return "spinbutton";
          default:
            return null;
        }
      }
      case "select":
        if (element.hasAttribute("multiple") || element.size > 1) {
          return "listbox";
        }
        return "combobox";
    }
    return null;
  }
  function getExplicitRole2(element) {
    var role = element.getAttribute("role");
    if (role !== null) {
      var explicitRole = role.trim().split(" ")[0];
      if (explicitRole.length > 0) {
        return explicitRole;
      }
    }
    return null;
  }

  // ../../../node_modules/dom-accessibility-api/dist/util.mjs
  var presentationRoles = ["presentation", "none"];
  function isElement3(node) {
    return node !== null && node.nodeType === node.ELEMENT_NODE;
  }
  function isHTMLTableCaptionElement2(node) {
    return isElement3(node) && getLocalName2(node) === "caption";
  }
  function isHTMLInputElement2(node) {
    return isElement3(node) && getLocalName2(node) === "input";
  }
  function isHTMLOptGroupElement2(node) {
    return isElement3(node) && getLocalName2(node) === "optgroup";
  }
  function isHTMLSelectElement2(node) {
    return isElement3(node) && getLocalName2(node) === "select";
  }
  function isHTMLTableElement2(node) {
    return isElement3(node) && getLocalName2(node) === "table";
  }
  function isHTMLTextAreaElement2(node) {
    return isElement3(node) && getLocalName2(node) === "textarea";
  }
  function safeWindow2(node) {
    var _ref = node.ownerDocument === null ? node : node.ownerDocument, defaultView = _ref.defaultView;
    if (defaultView === null) {
      throw new TypeError("no window available");
    }
    return defaultView;
  }
  function isHTMLFieldSetElement2(node) {
    return isElement3(node) && getLocalName2(node) === "fieldset";
  }
  function isHTMLLegendElement2(node) {
    return isElement3(node) && getLocalName2(node) === "legend";
  }
  function isHTMLSlotElement2(node) {
    return isElement3(node) && getLocalName2(node) === "slot";
  }
  function isSVGElement2(node) {
    return isElement3(node) && node.ownerSVGElement !== void 0;
  }
  function isSVGSVGElement2(node) {
    return isElement3(node) && getLocalName2(node) === "svg";
  }
  function isSVGTitleElement2(node) {
    return isSVGElement2(node) && getLocalName2(node) === "title";
  }
  function queryIdRefs2(node, attributeName) {
    if (isElement3(node) && node.hasAttribute(attributeName)) {
      var ids = node.getAttribute(attributeName).split(" ");
      var root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
      return ids.map(function(id) {
        return root.getElementById(id);
      }).filter(
        function(element) {
          return element !== null;
        }
        // TODO: why does this not narrow?
      );
    }
    return [];
  }
  function hasAnyConcreteRoles2(node, roles2) {
    if (isElement3(node)) {
      return roles2.indexOf(getRole2(node)) !== -1;
    }
    return false;
  }

  // ../../../node_modules/dom-accessibility-api/dist/accessible-name-and-description.mjs
  function asFlatString2(s) {
    return s.trim().replace(/\s\s+/g, " ");
  }
  function isHidden2(node, getComputedStyleImplementation) {
    if (!isElement3(node)) {
      return false;
    }
    if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true") {
      return true;
    }
    var style = getComputedStyleImplementation(node);
    return style.getPropertyValue("display") === "none" || style.getPropertyValue("visibility") === "hidden";
  }
  function isControl2(node) {
    return hasAnyConcreteRoles2(node, ["button", "combobox", "listbox", "textbox"]) || hasAbstractRole2(node, "range");
  }
  function hasAbstractRole2(node, role) {
    if (!isElement3(node)) {
      return false;
    }
    switch (role) {
      case "range":
        return hasAnyConcreteRoles2(node, ["meter", "progressbar", "scrollbar", "slider", "spinbutton"]);
      default:
        throw new TypeError("No knowledge about abstract role '".concat(role, "'. This is likely a bug :("));
    }
  }
  function querySelectorAllSubtree2(element, selectors) {
    var elements = arrayFrom2(element.querySelectorAll(selectors));
    queryIdRefs2(element, "aria-owns").forEach(function(root) {
      elements.push.apply(elements, arrayFrom2(root.querySelectorAll(selectors)));
    });
    return elements;
  }
  function querySelectedOptions2(listbox) {
    if (isHTMLSelectElement2(listbox)) {
      return listbox.selectedOptions || querySelectorAllSubtree2(listbox, "[selected]");
    }
    return querySelectorAllSubtree2(listbox, '[aria-selected="true"]');
  }
  function isMarkedPresentational2(node) {
    return hasAnyConcreteRoles2(node, presentationRoles);
  }
  function isNativeHostLanguageTextAlternativeElement2(node) {
    return isHTMLTableCaptionElement2(node);
  }
  function allowsNameFromContent2(node) {
    return hasAnyConcreteRoles2(node, ["button", "cell", "checkbox", "columnheader", "gridcell", "heading", "label", "legend", "link", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "radio", "row", "rowheader", "switch", "tab", "tooltip", "treeitem"]);
  }
  function isDescendantOfNativeHostLanguageTextAlternativeElement2(node) {
    return false;
  }
  function getValueOfTextbox2(element) {
    if (isHTMLInputElement2(element) || isHTMLTextAreaElement2(element)) {
      return element.value;
    }
    return element.textContent || "";
  }
  function getTextualContent2(declaration) {
    var content = declaration.getPropertyValue("content");
    if (/^["'].*["']$/.test(content)) {
      return content.slice(1, -1);
    }
    return "";
  }
  function isLabelableElement2(element) {
    var localName = getLocalName2(element);
    return localName === "button" || localName === "input" && element.getAttribute("type") !== "hidden" || localName === "meter" || localName === "output" || localName === "progress" || localName === "select" || localName === "textarea";
  }
  function findLabelableElement2(element) {
    if (isLabelableElement2(element)) {
      return element;
    }
    var labelableElement = null;
    element.childNodes.forEach(function(childNode) {
      if (labelableElement === null && isElement3(childNode)) {
        var descendantLabelableElement = findLabelableElement2(childNode);
        if (descendantLabelableElement !== null) {
          labelableElement = descendantLabelableElement;
        }
      }
    });
    return labelableElement;
  }
  function getControlOfLabel2(label) {
    if (label.control !== void 0) {
      return label.control;
    }
    var htmlFor = label.getAttribute("for");
    if (htmlFor !== null) {
      return label.ownerDocument.getElementById(htmlFor);
    }
    return findLabelableElement2(label);
  }
  function getLabels3(element) {
    var labelsProperty = element.labels;
    if (labelsProperty === null) {
      return labelsProperty;
    }
    if (labelsProperty !== void 0) {
      return arrayFrom2(labelsProperty);
    }
    if (!isLabelableElement2(element)) {
      return null;
    }
    var document2 = element.ownerDocument;
    return arrayFrom2(document2.querySelectorAll("label")).filter(function(label) {
      return getControlOfLabel2(label) === element;
    });
  }
  function getSlotContents2(slot) {
    var assignedNodes = slot.assignedNodes();
    if (assignedNodes.length === 0) {
      return arrayFrom2(slot.childNodes);
    }
    return assignedNodes;
  }
  function computeTextAlternative2(root) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var consultedNodes = new SetLike_default2();
    var computedStyles = typeof Map === "undefined" ? void 0 : /* @__PURE__ */ new Map();
    var window2 = safeWindow2(root);
    var _options$compute = options.compute, compute = _options$compute === void 0 ? "name" : _options$compute, _options$computedStyl = options.computedStyleSupportsPseudoElements, computedStyleSupportsPseudoElements = _options$computedStyl === void 0 ? options.getComputedStyle !== void 0 : _options$computedStyl, _options$getComputedS = options.getComputedStyle, uncachedGetComputedStyle = _options$getComputedS === void 0 ? window2.getComputedStyle.bind(window2) : _options$getComputedS, _options$hidden = options.hidden, hidden = _options$hidden === void 0 ? false : _options$hidden;
    var getComputedStyle = function getComputedStyle2(el, pseudoElement) {
      if (pseudoElement !== void 0) {
        throw new Error("use uncachedGetComputedStyle directly for pseudo elements");
      }
      if (computedStyles === void 0) {
        return uncachedGetComputedStyle(el);
      }
      var cachedStyles = computedStyles.get(el);
      if (cachedStyles) {
        return cachedStyles;
      }
      var style = uncachedGetComputedStyle(el, pseudoElement);
      computedStyles.set(el, style);
      return style;
    };
    function computeMiscTextAlternative(node, context) {
      var accumulatedText = "";
      if (isElement3(node) && computedStyleSupportsPseudoElements) {
        var pseudoBefore = uncachedGetComputedStyle(node, "::before");
        var beforeContent = getTextualContent2(pseudoBefore);
        accumulatedText = "".concat(beforeContent, " ").concat(accumulatedText);
      }
      var childNodes = isHTMLSlotElement2(node) ? getSlotContents2(node) : arrayFrom2(node.childNodes).concat(queryIdRefs2(node, "aria-owns"));
      childNodes.forEach(function(child) {
        var result = computeTextAlternative3(child, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false,
          recursion: true
        });
        var display = isElement3(child) ? getComputedStyle(child).getPropertyValue("display") : "inline";
        var separator = display !== "inline" ? " " : "";
        accumulatedText += "".concat(separator).concat(result).concat(separator);
      });
      if (isElement3(node) && computedStyleSupportsPseudoElements) {
        var pseudoAfter = uncachedGetComputedStyle(node, "::after");
        var afterContent = getTextualContent2(pseudoAfter);
        accumulatedText = "".concat(accumulatedText, " ").concat(afterContent);
      }
      return accumulatedText.trim();
    }
    function useAttribute(element, attributeName) {
      var attribute = element.getAttributeNode(attributeName);
      if (attribute !== null && !consultedNodes.has(attribute) && attribute.value.trim() !== "") {
        consultedNodes.add(attribute);
        return attribute.value;
      }
      return null;
    }
    function computeTooltipAttributeValue(node) {
      if (!isElement3(node)) {
        return null;
      }
      return useAttribute(node, "title");
    }
    function computeElementTextAlternative(node) {
      if (!isElement3(node)) {
        return null;
      }
      if (isHTMLFieldSetElement2(node)) {
        consultedNodes.add(node);
        var children = arrayFrom2(node.childNodes);
        for (var i = 0; i < children.length; i += 1) {
          var child = children[i];
          if (isHTMLLegendElement2(child)) {
            return computeTextAlternative3(child, {
              isEmbeddedInLabel: false,
              isReferenced: false,
              recursion: false
            });
          }
        }
      } else if (isHTMLTableElement2(node)) {
        consultedNodes.add(node);
        var _children = arrayFrom2(node.childNodes);
        for (var _i = 0; _i < _children.length; _i += 1) {
          var _child = _children[_i];
          if (isHTMLTableCaptionElement2(_child)) {
            return computeTextAlternative3(_child, {
              isEmbeddedInLabel: false,
              isReferenced: false,
              recursion: false
            });
          }
        }
      } else if (isSVGSVGElement2(node)) {
        consultedNodes.add(node);
        var _children2 = arrayFrom2(node.childNodes);
        for (var _i2 = 0; _i2 < _children2.length; _i2 += 1) {
          var _child2 = _children2[_i2];
          if (isSVGTitleElement2(_child2)) {
            return _child2.textContent;
          }
        }
        return null;
      } else if (getLocalName2(node) === "img" || getLocalName2(node) === "area") {
        var nameFromAlt = useAttribute(node, "alt");
        if (nameFromAlt !== null) {
          return nameFromAlt;
        }
      } else if (isHTMLOptGroupElement2(node)) {
        var nameFromLabel = useAttribute(node, "label");
        if (nameFromLabel !== null) {
          return nameFromLabel;
        }
      }
      if (isHTMLInputElement2(node) && (node.type === "button" || node.type === "submit" || node.type === "reset")) {
        var nameFromValue = useAttribute(node, "value");
        if (nameFromValue !== null) {
          return nameFromValue;
        }
        if (node.type === "submit") {
          return "Submit";
        }
        if (node.type === "reset") {
          return "Reset";
        }
      }
      var labels = getLabels3(node);
      if (labels !== null && labels.length !== 0) {
        consultedNodes.add(node);
        return arrayFrom2(labels).map(function(element) {
          return computeTextAlternative3(element, {
            isEmbeddedInLabel: true,
            isReferenced: false,
            recursion: true
          });
        }).filter(function(label) {
          return label.length > 0;
        }).join(" ");
      }
      if (isHTMLInputElement2(node) && node.type === "image") {
        var _nameFromAlt = useAttribute(node, "alt");
        if (_nameFromAlt !== null) {
          return _nameFromAlt;
        }
        var nameFromTitle = useAttribute(node, "title");
        if (nameFromTitle !== null) {
          return nameFromTitle;
        }
        return "Submit Query";
      }
      if (hasAnyConcreteRoles2(node, ["button"])) {
        var nameFromSubTree = computeMiscTextAlternative(node, {
          isEmbeddedInLabel: false,
          isReferenced: false
        });
        if (nameFromSubTree !== "") {
          return nameFromSubTree;
        }
      }
      return null;
    }
    function computeTextAlternative3(current, context) {
      if (consultedNodes.has(current)) {
        return "";
      }
      if (!hidden && isHidden2(current, getComputedStyle) && !context.isReferenced) {
        consultedNodes.add(current);
        return "";
      }
      var labelAttributeNode = isElement3(current) ? current.getAttributeNode("aria-labelledby") : null;
      var labelElements = labelAttributeNode !== null && !consultedNodes.has(labelAttributeNode) ? queryIdRefs2(current, "aria-labelledby") : [];
      if (compute === "name" && !context.isReferenced && labelElements.length > 0) {
        consultedNodes.add(labelAttributeNode);
        return labelElements.map(function(element) {
          return computeTextAlternative3(element, {
            isEmbeddedInLabel: context.isEmbeddedInLabel,
            isReferenced: true,
            // this isn't recursion as specified, otherwise we would skip
            // `aria-label` in
            // <input id="myself" aria-label="foo" aria-labelledby="myself"
            recursion: false
          });
        }).join(" ");
      }
      var skipToStep2E = context.recursion && isControl2(current) && compute === "name";
      if (!skipToStep2E) {
        var ariaLabel = (isElement3(current) && current.getAttribute("aria-label") || "").trim();
        if (ariaLabel !== "" && compute === "name") {
          consultedNodes.add(current);
          return ariaLabel;
        }
        if (!isMarkedPresentational2(current)) {
          var elementTextAlternative = computeElementTextAlternative(current);
          if (elementTextAlternative !== null) {
            consultedNodes.add(current);
            return elementTextAlternative;
          }
        }
      }
      if (hasAnyConcreteRoles2(current, ["menu"])) {
        consultedNodes.add(current);
        return "";
      }
      if (skipToStep2E || context.isEmbeddedInLabel || context.isReferenced) {
        if (hasAnyConcreteRoles2(current, ["combobox", "listbox"])) {
          consultedNodes.add(current);
          var selectedOptions = querySelectedOptions2(current);
          if (selectedOptions.length === 0) {
            return isHTMLInputElement2(current) ? current.value : "";
          }
          return arrayFrom2(selectedOptions).map(function(selectedOption) {
            return computeTextAlternative3(selectedOption, {
              isEmbeddedInLabel: context.isEmbeddedInLabel,
              isReferenced: false,
              recursion: true
            });
          }).join(" ");
        }
        if (hasAbstractRole2(current, "range")) {
          consultedNodes.add(current);
          if (current.hasAttribute("aria-valuetext")) {
            return current.getAttribute("aria-valuetext");
          }
          if (current.hasAttribute("aria-valuenow")) {
            return current.getAttribute("aria-valuenow");
          }
          return current.getAttribute("value") || "";
        }
        if (hasAnyConcreteRoles2(current, ["textbox"])) {
          consultedNodes.add(current);
          return getValueOfTextbox2(current);
        }
      }
      if (allowsNameFromContent2(current) || isElement3(current) && context.isReferenced || isNativeHostLanguageTextAlternativeElement2(current) || isDescendantOfNativeHostLanguageTextAlternativeElement2(current)) {
        var accumulatedText2F = computeMiscTextAlternative(current, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false
        });
        if (accumulatedText2F !== "") {
          consultedNodes.add(current);
          return accumulatedText2F;
        }
      }
      if (current.nodeType === current.TEXT_NODE) {
        consultedNodes.add(current);
        return current.textContent || "";
      }
      if (context.recursion) {
        consultedNodes.add(current);
        return computeMiscTextAlternative(current, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: false
        });
      }
      var tooltipAttributeValue = computeTooltipAttributeValue(current);
      if (tooltipAttributeValue !== null) {
        consultedNodes.add(current);
        return tooltipAttributeValue;
      }
      consultedNodes.add(current);
      return "";
    }
    return asFlatString2(computeTextAlternative3(root, {
      isEmbeddedInLabel: false,
      // by spec computeAccessibleDescription starts with the referenced elements as roots
      isReferenced: compute === "description",
      recursion: false
    }));
  }

  // ../../../node_modules/dom-accessibility-api/dist/accessible-name.mjs
  function prohibitsNaming2(node) {
    return hasAnyConcreteRoles2(node, ["caption", "code", "deletion", "emphasis", "generic", "insertion", "none", "paragraph", "presentation", "strong", "subscript", "superscript"]);
  }
  function computeAccessibleName2(root) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (prohibitsNaming2(root)) {
      return "";
    }
    return computeTextAlternative2(root, options);
  }

  // usecases/DOMParserService.js
  var DOMParserService = class {
    constructor(contexts = {}) {
      this.mainWindow = contexts?.mainWindow || window;
      this.currentDoc = null;
      this.DIALOG_SELECTORS = DIALOG_SELECTORS;
      this.priSize = 4;
      this.priority = {
        0: "ByRole",
        1: "ByTitle",
        2: "ByText",
        3: "ByDomPath",
        4: "ByPlaceholder",
        5: "ByAltText",
        6: "ByLabel"
      };
      this.allAttributeInfo = {
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
        ByRole: { name: null, role: null, index: null },
        ByLabel: {},
        ByPlaceholder: {},
        ByText: { text: null },
        ByTitle: { title: null },
        ByAltText: {},
        ByDomPath: { csspath: null, shadowChain: [], options: [] }
      };
      this.weight = { WL: 0.4, Wc: 0.6, Wa: 1, Wcl: 1, Wt: 1, Wn: 3 };
      this.customDynamicIdPatterns = [];
    }
    getDocumentByWindowType(windowType) {
      if (windowType === "iframe") {
        return this.iframeWindow?.document || null;
      }
      return this.mainWindow?.document || document;
    }
    getOpenSourcePath(e, sourceWin = null) {
      if (!e) return [null, null, null];
      const ownerDoc = e.ownerDocument;
      const realRoot = e.getRootNode();
      const isElementInDocument = ownerDoc?.contains(e) || realRoot?.host && ownerDoc?.contains(realRoot.host);
      if (!ownerDoc || !isElementInDocument) {
        console.warn("[DOMParser] ?\uF077?\u648C\u8116??\u51BD?\u6485\u7949??\uF2E8\u8FA3\u929D\u54E8??\uE91C\u5CAB\u95AB??\u61AD\u671B?", e);
        return null;
      }
      console.log("[Debug DOMParser] \u7507?\uEBED\u95AB???\uF077?:", e);
      this.cleanInfo();
      this.setInfo(e);
      this.clearPlaywrightObj();
      const shadowChain = this.getShadowChain(e);
      let isUniqueObj = { ByRole: false, ByTitle: false, ByDomPath: false, ByText: false };
      const cssatt = ["id", "attribute", "class", "tag", "nthchild"];
      const optPri = ["id", "data-testid", "data-thread-id", "data-action", "class", "name", "placeholder", "href", "src"];
      let csskey = 0, optkey = 0, finderkey = 0, structuralkey = 0;
      let selector2 = "";
      try {
        selector2 = getCssSelector(e, {
          selectors: cssatt,
          root: realRoot,
          blacklist: [
            (sel) => {
              if (typeof sel === "string") {
                if (sel.startsWith("#")) return this.isDynamicGeneratedId(sel.slice(1));
                if (sel.startsWith(".")) return this.isDynamicOrUnstableClass(sel.slice(1));
              }
              return false;
            }
          ]
        });
        if (this.findUniqueWithShadowChain(selector2, shadowChain, e)) {
          isUniqueObj.ByDomPath = true;
          csskey = 1;
        }
      } catch (err) {
        console.warn("[DOMParser] css-selector-generator \u95AB??\u61AD\u671B?", err);
      }
      let opt_selector = "";
      try {
        opt_selector = (0, import_optimal_select.select)(e, {
          root: realRoot,
          priority: optPri,
          ignore: {
            // 霈????蕪?賣瘙箏???class 閰脖?閰脩 (? true 隞?”敹賜)
            class: (className2) => this.isDynamicOrUnstableClass(className2),
            attribute: (name, value, defaultPredicate) => {
              if (name === "id") return this.isDynamicGeneratedId(value);
              return typeof defaultPredicate === "function" ? defaultPredicate(name, value) : false;
            }
          }
        });
        if (this.findUniqueWithShadowChain(opt_selector, shadowChain, e)) {
          isUniqueObj.ByDomPath = true;
          optkey = 1;
        }
      } catch (err) {
        console.warn("[DOMParser] optimal-select \u95AB??\u61AD\u671B?", err);
      }
      let finder_selector = "";
      try {
        finder_selector = finder(e, {
          root: realRoot,
          idName: (name) => !this.isDynamicGeneratedId(name),
          // ?芣????胯?蝛拙? Class ????閮梯◤ finder 雿輻
          className: (name) => !this.isDynamicOrUnstableClass(name)
        });
        if (this.findUniqueWithShadowChain(finder_selector, shadowChain, e)) {
          isUniqueObj.ByDomPath = true;
          finderkey = 1;
        }
      } catch (err) {
        console.warn("[DOMParser] finder \u95AB??\u61AD\u671B?", err);
      }
      const structural_selector = this.getStructuralCssPath(e, realRoot);
      if (this.findUniqueWithShadowChain(structural_selector, shadowChain, e)) {
        isUniqueObj.ByDomPath = true;
        structuralkey = 1;
      }
      let csspath = this.analyzeCssPath(selector2, csskey);
      let optpath = this.analyzeCssPath(opt_selector, optkey);
      let finderpath = this.analyzeCssPath(finder_selector, finderkey);
      let structuralpath = this.analyzeCssPath(structural_selector, structuralkey);
      console.log("csspath: ", csspath);
      console.log("optpath: ", optpath);
      console.log("finderpath: ", finderpath);
      console.log("structuralpath: ", structuralpath);
      const rankedDomPathOptions = this.rankDomPaths([csspath, optpath, finderpath, structuralpath]).filter((option) => !this.hasUnstableAttributeSelector(option.path));
      const bestDomPathOption = rankedDomPathOptions[0];
      const structuralOption = rankedDomPathOptions.find((option) => option.path === structuralpath.path);
      const orderedDomPathOptions = structuralOption ? [
        ...rankedDomPathOptions.filter((option) => option.path !== structuralOption.path),
        structuralOption
      ] : rankedDomPathOptions;
      const domPathOptions = orderedDomPathOptions.map((option) => ({ ...option, shadowChain }));
      this.playwrightObj.ByDomPath.csspath = bestDomPathOption?.path || "";
      this.playwrightObj.ByDomPath.shadowChain = bestDomPathOption ? shadowChain : [];
      this.playwrightObj.ByDomPath.options = domPathOptions;
      if (this.getPlaywrightRole(e, sourceWin)) {
        isUniqueObj.ByRole = true;
      }
      if (this.checkUniqueByTitle(e)) {
        isUniqueObj.ByTitle = true;
      }
      if (this.checkUniqueByText(e)) {
        isUniqueObj.ByText = true;
      }
      let newObj = {};
      for (let i = 0; i < this.priSize; i++) {
        let key = this.priority[i];
        if (isUniqueObj[key]) {
          newObj[i] = { funName: key, obj: this.playwrightObj[key] };
        }
      }
      return newObj;
    }
    bestDomPath(paths) {
      return this.rankDomPaths(paths)[0]?.path || null;
    }
    rankDomPaths(paths) {
      const WL = this.weight.WL;
      const Wc = this.weight.Wc;
      const Wa = this.weight.Wa;
      const Wcl = this.weight.Wcl;
      const Wt = this.weight.Wt;
      const Wn = this.weight.Wn;
      const ranked = [];
      const seen = /* @__PURE__ */ new Set();
      for (const p of paths) {
        if (!p || !p.path || seen.has(p.path)) continue;
        const { length, a, cl, t, n, U } = p;
        const Lscore = 1 / (1 + length);
        const Cscore = 1 / (1 + Wa * a + Wcl * cl + Wt * t + Wn * n);
        const Score = U * (WL * Lscore + Wc * Cscore);
        seen.add(p.path);
        ranked.push({ ...p, score: Score });
      }
      return ranked.sort((a, b) => b.score - a.score);
    }
    // ?? ?啣??寞?嚗?憭?喳閫??憟賜??? ID 閬?
    setCustomDynamicIdRules(rulesArray) {
      if (!Array.isArray(rulesArray)) return;
      this.customDynamicIdPatterns = rulesArray.map((ruleStr) => {
        try {
          return new RegExp(ruleStr, "i");
        } catch (e) {
          console.error(`[DOMParser] ?\u22A5??\uF113\u8FE4?\uF2EC\u201D?\uE742?\u95AC\uE431?: ${ruleStr}`, e);
          return null;
        }
      }).filter((regex) => regex !== null);
    }
    analyzeCssPath(cssPath, unique2) {
      const obj = {
        path: cssPath || "",
        length: 0,
        a: 0,
        cl: 0,
        t: 0,
        n: 0,
        U: unique2
      };
      if (!cssPath || typeof cssPath !== "string") {
        return obj;
      }
      obj.length = cssPath.split(/>|\s+/).filter(Boolean).length;
      const attrMatches = cssPath.match(/\[[^\]]+\]/g);
      obj.a = attrMatches ? attrMatches.length : 0;
      const classMatches = cssPath.match(/\.[^\s\#\.\[:>]+/g);
      obj.cl = classMatches ? classMatches.length : 0;
      const cleanedForTag = cssPath.replace(/:[a-zA-Z-]+\([^)]+\)/g, "").replace(/\.[a-zA-Z0-9_-]+/g, "").replace(/\[[^\]]+\]/g, "");
      const tagMatches = cleanedForTag.match(/\b[a-zA-Z][a-zA-Z0-9]*\b/g);
      obj.t = tagMatches ? tagMatches.length : 0;
      const nthMatches = cssPath.match(/:nth-(child|of-type)\([^)]+\)/g);
      obj.n = nthMatches ? nthMatches.length : 0;
      return obj;
    }
    getStructuralCssPath(el, root) {
      if (!(el instanceof Element) || !root) return "";
      const parts = [];
      let current = el;
      while (current instanceof Element && current !== root) {
        const tagName2 = current.tagName.toLowerCase();
        const parent = current.parentElement;
        parts.unshift(`${tagName2}:nth-of-type(${this.getElementTypeIndex(current)})`);
        if (!parent || parent === root || tagName2 === "html") break;
        current = parent;
      }
      return parts.join(" > ");
    }
    getElementTypeIndex(el) {
      let index = 1;
      let sibling = el.previousElementSibling;
      const tagName2 = el.tagName;
      while (sibling) {
        if (sibling.tagName === tagName2) index++;
        sibling = sibling.previousElementSibling;
      }
      return index;
    }
    hasUnstableAttributeSelector(selector2) {
      if (typeof selector2 !== "string") return true;
      return /\[style\b(?:[~|^$*]?=)?/i.test(selector2);
    }
    findUnique(path, doc) {
      if (!path) return false;
      try {
        const element = doc.querySelectorAll(path);
        return element.length === 1;
      } catch (e) {
        return false;
      }
    }
    isShadowRoot(root) {
      return root && root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && root.host instanceof Element;
    }
    getBestOpenSourceSelector(el, root) {
      if (!el || !root) return "";
      const candidates = [];
      const cssatt = ["id", "attribute", "class", "tag", "nthchild"];
      const optPri = ["id", "data-testid", "data-thread-id", "data-action", "class", "name", "placeholder", "href", "src"];
      try {
        const selector2 = getCssSelector(el, {
          selectors: cssatt,
          root,
          blacklist: [
            (sel) => {
              if (typeof sel !== "string") return false;
              if (sel.startsWith("#")) return this.isDynamicGeneratedId(sel.slice(1));
              if (sel.startsWith(".")) return this.isDynamicOrUnstableClass(sel.slice(1));
              return false;
            }
          ]
        });
        candidates.push(this.analyzeCssPath(selector2, this.findUnique(selector2, root) ? 1 : 0));
      } catch (err) {
        console.warn("[DOMParser] css-selector-generator shadow host \u95AB??\u61AD\u671B?", err);
      }
      try {
        const selector2 = (0, import_optimal_select.select)(el, {
          root,
          priority: optPri,
          ignore: {
            class: (className2) => this.isDynamicOrUnstableClass(className2),
            attribute: (name, value, defaultPredicate) => {
              if (name === "id") return this.isDynamicGeneratedId(value);
              return typeof defaultPredicate === "function" ? defaultPredicate(name, value) : false;
            }
          }
        });
        candidates.push(this.analyzeCssPath(selector2, this.findUnique(selector2, root) ? 1 : 0));
      } catch (err) {
        console.warn("[DOMParser] optimal-select shadow host \u95AB??\u61AD\u671B?", err);
      }
      try {
        const selector2 = finder(el, {
          root,
          idName: (name) => !this.isDynamicGeneratedId(name),
          className: (name) => !this.isDynamicOrUnstableClass(name)
        });
        candidates.push(this.analyzeCssPath(selector2, this.findUnique(selector2, root) ? 1 : 0));
      } catch (err) {
        console.warn("[DOMParser] finder shadow host \u95AB??\u61AD\u671B?", err);
      }
      return this.rankDomPaths(candidates).filter((option) => !this.hasUnstableAttributeSelector(option.path))[0]?.path || "";
    }
    getShadowChain(el) {
      const chain = [];
      let root = el?.getRootNode?.();
      while (this.isShadowRoot(root)) {
        const host = root.host;
        const parentRoot = host.getRootNode();
        const hostSelector = this.getBestOpenSourceSelector(host, parentRoot);
        if (!hostSelector) break;
        chain.unshift({ hostSelector });
        root = parentRoot;
      }
      return chain;
    }
    resolveShadowMatches(baseRoot, shadowChain, targetSelector) {
      let roots = [baseRoot];
      for (const step of shadowChain || []) {
        const nextRoots = [];
        for (const root of roots) {
          const hosts = Array.from(root.querySelectorAll(step.hostSelector));
          for (const host of hosts) {
            if (host.shadowRoot) nextRoots.push(host.shadowRoot);
          }
        }
        roots = nextRoots;
      }
      return roots.flatMap((root) => Array.from(root.querySelectorAll(targetSelector)));
    }
    findUniqueWithShadowChain(path, shadowChain, targetEl) {
      if (!path || !targetEl?.ownerDocument) return false;
      try {
        if (!shadowChain?.length) {
          const root = targetEl.getRootNode();
          const matches3 = Array.from(root.querySelectorAll(path));
          return matches3.length === 1 && matches3[0] === targetEl;
        }
        const matches2 = this.resolveShadowMatches(targetEl.ownerDocument, shadowChain, path);
        return matches2.length === 1 && matches2[0] === targetEl;
      } catch (e) {
        return false;
      }
    }
    getTestingLibraryRole(el) {
      if (!el) return null;
      if (el.hasAttribute("role")) {
        return el.getAttribute("role");
      }
      try {
        const rolesMap = getRoles(el);
        for (const [roleName, elements] of Object.entries(rolesMap)) {
          if (elements.includes(el)) {
            return roleName;
          }
        }
      } catch (e) {
        console.warn("[DOMParser] Testing Library getRoles \u95AB??\u61AD\u671B?", e);
      }
      return null;
    }
    getPlaywrightRole(el, sourceWin) {
      if (!(el instanceof Element)) return false;
      const container = this.currentDoc.body || this.currentDoc;
      if (el.tagName === "ION-BUTTON") {
        const name2 = (el.textContent || el.innerText || "").trim().replace(/\s+/g, " ");
        if (name2 && this.isUniqueIonButtonText(el, name2, container)) {
          this.playwrightObj.ByRole.index = null;
          this.playwrightObj.ByRole.name = name2;
          this.playwrightObj.ByRole.role = "button";
          this.playwrightObj.ByRole.exact = false;
          return true;
        }
      }
      const role = this.getTestingLibraryRole(el);
      if (!role || role === "generic" || role === "presentation") {
        return false;
      }
      let name = "";
      try {
        name = computeAccessibleName2(el);
      } catch (e) {
        console.warn("[DOMParser] computeAccessibleName ?\u6F5B??\u822A\u708A", e);
      }
      try {
        const options = name ? { name, exact: true } : {};
        const matches2 = queryAllByRoleWithSuggestions(container, role, options);
        const index = matches2.indexOf(el);
        if (index !== -1) {
          this.playwrightObj.ByRole.index = index;
          this.playwrightObj.ByRole.name = name || null;
          this.playwrightObj.ByRole.role = role;
          this.playwrightObj.ByRole.exact = !this.hasGeneratedIconNameRisk(el);
          return true;
        }
        return false;
      } catch (error) {
        console.warn("[DOMParser] Testing Library ByRole \u95AB??\u61AD\u671B?", error);
        return false;
      }
    }
    checkUniqueByText(el) {
      if (!this.currentDoc) return false;
      const container = this.currentDoc.body || this.currentDoc;
      const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
      if (!text) return false;
      try {
        const matches2 = queryAllByTextWithSuggestions(container, text, { exact: true });
        if (matches2.length === 1 && matches2[0] === el) {
          this.playwrightObj.ByText.text = text;
          return true;
        }
      } catch (error) {
        console.warn("[DOMParser] Testing Library ByText \u95AB??\u61AD\u671B?", error);
      }
      return false;
    }
    hasGeneratedIconNameRisk(el) {
      return !!el.querySelector?.(
        'i[class*="fa"], span[class*="fa-"], [class*="material-icons"], [class*="icon-"]'
      );
    }
    isUniqueIonButtonText(el, text, container) {
      if (el.tagName !== "ION-BUTTON") return false;
      const matches2 = Array.from(container.querySelectorAll("ion-button")).filter((button) => {
        const buttonText = (button.textContent || button.innerText || "").trim().replace(/\s+/g, " ");
        return buttonText === text;
      });
      return matches2.length === 1 && matches2[0] === el;
    }
    checkUniqueByTitle(el) {
      if (!this.currentDoc) return false;
      const container = this.currentDoc.body || this.currentDoc;
      const title = el.getAttribute("title");
      if (!title) return false;
      try {
        const matches2 = queryAllByTitleWithSuggestions(container, title, { exact: true });
        if (matches2.length === 1 && matches2[0] === el) {
          this.playwrightObj.ByTitle.title = title;
          return true;
        }
      } catch (error) {
        console.warn("[DOMParser] Testing Library ByTitle \u95AB??\u61AD\u671B?", error);
      }
      return false;
    }
    // ?? ?啣?嚗?瞈曆?蝛拙??隤???蝝??? Class
    isDynamicOrUnstableClass(className2) {
      if (typeof className2 !== "string") return true;
      const val = className2.trim();
      if (!val) return true;
      const stateClasses = /^(active|focus|hover|visited|disabled|selected|checked|hydrated|md|ios|ion-activated|ion-focused|ion-touched|ion-dirty|ion-valid|ion-invalid|gjs-[a-zA-Z0-9_-]+)$/i;
      const cssInJsLike = /^(css-|sc-|styled-).*[a-zA-Z0-9_-]{4,}$/i;
      const utilityClasses = /^(p|m|px|py|mx|my|w|h|text|bg|flex|grid|col|row|rounded|shadow|border)-[a-z0-9]+$/i;
      const pureHash = /^[a-z0-9]{8,15}$/i;
      return stateClasses.test(val) || cssInJsLike.test(val) || utilityClasses.test(val) || pureHash.test(val);
    }
    setInfo(el) {
      if (!el) return;
      this.currentDoc = el.ownerDocument || document;
      this.allAttributeInfo.tagName = el.tagName || null;
      this.allAttributeInfo.id = el.id || null;
      this.allAttributeInfo.className = el.className || null;
      this.allAttributeInfo.title = el.title || null;
      const rawText = el.innerText || el.textContent || "";
      this.allAttributeInfo.text = rawText.trim().replace(/\s+/g, " ") || null;
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
        ByRole: { name: null, role: null, index: null },
        ByLabel: {},
        ByPlaceholder: {},
        ByText: { text: null },
        ByTitle: { title: null },
        ByAltText: {},
        ByDomPath: { csspath: null, shadowChain: [], options: [] }
      };
    }
    getPriority() {
      return this.priority;
    }
    getPriSize() {
      return this.priSize;
    }
    isDynamicGeneratedId(id) {
      if (typeof id !== "string") return false;
      const value = id.trim();
      if (!value) return false;
      for (const pattern of this.customDynamicIdPatterns) {
        if (pattern.test(value)) {
          console.log(`[DOMParser] ?\uE743\uF34B?\u5541\u6CF5?\uF389\uF2AE\u6470\uEAF2\u5114(Excel)\u95AC\uE431??\uF112???ID: ${value}`);
          return true;
        }
      }
      const grapesLikeId = /^i[a-z0-9]{3,5}$/i;
      const ionicGeneratedId = /^ion-(input|textarea|select|checkbox|radio|toggle|range|datetime)-\d+(-lbl)?$/i;
      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const hashLike = /^[a-z0-9_-]{10,}$/i;
      const frameworkDynamic = /^(mui-|radix-|chakra-|el-|headlessui-|rc-tabs-).*\d+.*$/i;
      const pureNumbers = /^\d+$/;
      return grapesLikeId.test(value) || ionicGeneratedId.test(value) || uuidLike.test(value) || hashLike.test(value) || frameworkDynamic.test(value) || pureNumbers.test(value);
    }
  };

  // entities/PlaywrightCommand.js
  var PlaywrightCommand = class {
    constructor() {
      this.init();
    }
    // 將原本在 constructor 的邏輯抽出來，方便後續 clearCode 時呼叫
    init() {
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
      return [...this.code_import, ...this.codeOutsider_up, ...this.codeWindows, ...this.code, ...this.codeOutsider_down];
    }
    // ==========================================
    // 新增：相容新版 MainApp1.js 所需的介面方法
    // ==========================================
    appendCode(line) {
      this.codeSetter(line);
    }
    getCode() {
      return this.codeGetter();
    }
    clearCode() {
      this.init();
    }
  };

  // usecases/PlaywrightCodeGenerator.js
  var PlaywrightCodeGenerator = class {
    // 1. 移除 userActionDB 依賴，改為單純接收 DOM 服務與 Command 參照
    constructor(domService, command, pageAlias = "page") {
      this.domService = domService;
      this.command = command;
      this.typedText = "";
      this.pageAlias = pageAlias;
      this.contextAliasMap = /* @__PURE__ */ new Map();
      this.contextMap = /* @__PURE__ */ new Map();
    }
    // 2. 改為直接回傳程式碼字串，將寫入動作交還給 MainApp1 處理
    generate(action) {
      if (!action) {
        console.warn("generate: action \u4E0D\u5B58\u5728");
        return null;
      }
      console.log("Generating code for action: ", action);
      if (action.type === "navigate") {
        return `await page.goto('${action.url}');`;
      }
      if (action.type === "dialog") {
        const winPrefix = this._getContextPrefix(action.sourceWindow);
        let dialogAction = "await dialog.dismiss();";
        if (action.dialogType === "alert") {
          dialogAction = "await dialog.accept();";
        } else if (action.dialogType === "confirm") {
          dialogAction = action.result ? "await dialog.accept();" : "await dialog.dismiss();";
        } else if (action.dialogType === "prompt") {
          dialogAction = action.result === null ? "await dialog.dismiss();" : `await dialog.accept(${this.quoteForCode(action.result)});`;
        }
        const dialogCode = [
          `${winPrefix}.once('dialog', async dialog => {`,
          "  console.log(`Dialog message: ${dialog.message()}`);",
          `  ${dialogAction}`,
          "});"
        ];
        const codeArr = this.command.code;
        const lastLine = codeArr.length > 0 ? codeArr[codeArr.length - 1] : null;
        if (lastLine && lastLine.trim().startsWith("await ")) {
          return {
            isReplace: true,
            code: [
              ...dialogCode,
              lastLine
            ]
          };
        }
        return dialogCode;
      }
      if (action.type === "popup") {
        const popupName = action.popupId || "newPopup";
        const codeArr = this.command.code;
        const lastLine = codeArr.length > 0 ? codeArr[codeArr.length - 1] : null;
        if (lastLine && lastLine.includes("await")) {
          const contextMatch = lastLine.match(/await\s+([^\.]+)\./);
          const contextPrefix = contextMatch ? contextMatch[1] : this.pageAlias;
          const cleanAction = lastLine.trim().replace(/^await\s+/, "").replace(/;$/, "");
          return {
            isReplace: true,
            code: [
              `const [${popupName}] = await Promise.all([`,
              `  ${contextPrefix}.waitForEvent('popup'),`,
              `  ${cleanAction}`,
              `]);`
            ]
          };
        }
        return `const ${popupName} = await ${this.pageAlias}.waitForEvent('popup');`;
      }
      let sourcepath = action.preParsedSourcePath || null;
      let targetpath = null;
      let inputText = action.inputText || "default";
      let inputKey = action.keyboard || "default";
      let selectValue = action.selectedValue || "default";
      if (typeof action.getSourceElement === "function") {
        const needsSourceParsing = !sourcepath || Array.isArray(sourcepath) && sourcepath[0] === null;
        if (needsSourceParsing && action.getSourceElement()) {
          sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type);
        }
        if (action.type === "dragANDdrop" && typeof action.getTargetElement === "function" && action.getTargetElement()) {
          targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
        }
        if (action.type === "input" && !action.inputText) {
          const srcEl = action.getSourceElement();
          inputText = srcEl ? srcEl.innerText || srcEl.value || "" : "";
        }
        if (action.type === "change" && !action.selectedValue) {
          const srcEl = action.getSourceElement();
          if (srcEl && srcEl.options && srcEl.selectedIndex >= 0) {
            selectValue = srcEl.value || srcEl.options[srcEl.selectedIndex]?.value || "";
          }
        }
      }
      const sourceWindow = action.sourceWindow || (typeof action.getSourceWindow === "function" ? action.getSourceWindow() : "page");
      const targetWindow = action.targetWindow || (typeof action.getTargetWindow === "function" ? action.getTargetWindow() : "page");
      let generatedCode = null;
      if (action.type === "dragANDdrop") {
        generatedCode = this.dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow);
      } else if (action.type === "click" || action.type === "checkBox") {
        generatedCode = this.clickSetter(action, sourcepath, sourceWindow);
      } else if (action.type === "dbclick") {
        generatedCode = this.doubleClickSetter(action, sourcepath, sourceWindow);
      } else if (action.type === "input" || action.type === "color") {
        generatedCode = this.inputSetter(action, sourcepath, sourceWindow, inputText);
      } else if (action.type === "range") {
        generatedCode = this.rangeSetter(action, sourcepath, sourceWindow, inputText);
      } else if (action.type === "keyboard") {
        generatedCode = this.keyboardSetter(inputKey, sourceWindow);
      } else if (action.type === "change") {
        generatedCode = this.changeSetter(action, sourcepath, selectValue, sourceWindow);
      }
      console.log("[Debug PlaywrightCodeGenerator] generatedCode", {
        actionType: action.type,
        sourceWindow,
        sourcepath,
        generatedCode
      });
      return generatedCode;
    }
    // ==========================================
    // 以下為具體的生成與組裝邏輯 Helper
    // ==========================================
    // 從解析結果中挑出權重最高(最優先)的 Selector 方法
    _getBestPath(paths) {
      if (!paths) return null;
      for (let i = 0; i < this.domService.priSize; i++) {
        if (paths[i]) return paths[i];
      }
      return null;
    }
    // 特殊字元跳脫，避免 Playwright 語法出錯
    replacePath(cssPath) {
      return cssPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    quoteForCode(value) {
      return JSON.stringify(String(value ?? ""));
    }
    // 3. 解析 ContextId 為 Playwright 的操作變數前綴
    // 3. 解析 ContextId 為 Playwright 的操作變數前綴
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    _getContextPrefix(winVar) {
      const context = this.contextMap.get(winVar);
      console.log("[Debug PlaywrightCodeGenerator] _getContextPrefix", {
        winVar,
        contextType: context?.type || null,
        contextId: context?.contextId || null,
        parentContextId: context?.parentContextId || null,
        frameSelector: context?.frameSelector || null,
        url: context?.url || null
      });
      if (context?.type === "iframe") {
        if (this._isUsableIframeContext(context)) {
          return this._buildFrameLocatorChain(context);
        }
        console.warn("[PlaywrightCodeGenerator] iframe context is stale or mismatched; falling back to parent context", {
          contextId: context.contextId,
          parentContextId: context.parentContextId,
          frameSelector: context.frameSelector
        });
        return this._getBaseContextAlias(this.contextMap.get(context.parentContextId));
      }
      if (this.contextAliasMap && this.contextAliasMap.has(winVar)) {
        const alias = this.contextAliasMap.get(winVar);
        return alias === "page_0" || alias === "page" ? this.pageAlias : alias;
      }
      if (typeof winVar === "string" && winVar.startsWith("ctx_")) {
        const autoAlias = winVar.replace("ctx_", "");
        return autoAlias === "page_0" || autoAlias === "page" ? this.pageAlias : autoAlias;
      }
      return this.pageAlias;
    }
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    setContexts(contexts = [], rootAlias = this.pageAlias) {
      if (!Array.isArray(contexts)) return;
      const baseAlias = rootAlias || this.pageAlias;
      contexts.forEach((ctx) => {
        if (!ctx?.contextId) return;
        this.contextMap.set(ctx.contextId, ctx);
        let alias = "";
        if (!ctx.contextId || ctx.contextId === "ctx_page_0") {
          alias = baseAlias;
        } else {
          alias = ctx.contextId.replace(/^ctx_/, "");
          if (ctx.type === "iframe" && baseAlias && baseAlias !== "page") {
            alias = `${baseAlias}_${alias}`;
          }
        }
        this.contextAliasMap.set(ctx.contextId, alias);
      });
    }
    _buildFrameLocatorChain(context) {
      const chain = [];
      let current = context;
      while (current?.type === "iframe") {
        if (!this._isUsableIframeContext(current)) {
          console.warn("[PlaywrightCodeGenerator] skipped unusable iframe context in locator chain", {
            contextId: current.contextId,
            parentContextId: current.parentContextId,
            frameSelector: current.frameSelector
          });
          current = this.contextMap.get(current.parentContextId);
          break;
        }
        chain.unshift(current);
        current = this.contextMap.get(current.parentContextId);
      }
      let prefix = this._getBaseContextAlias(current);
      console.log("[Debug PlaywrightCodeGenerator] _buildFrameLocatorChain", {
        baseContextId: current?.contextId || null,
        baseType: current?.type || null,
        initialPrefix: prefix,
        chain: chain.map((frameContext) => ({
          contextId: frameContext.contextId,
          parentContextId: frameContext.parentContextId,
          frameSelector: frameContext.frameSelector,
          url: frameContext.url
        }))
      });
      chain.forEach((frameContext) => {
        const selector2 = this._frameSelectorToLocatorSelector(frameContext.frameSelector);
        console.log("[Debug PlaywrightCodeGenerator] frame selector resolved", {
          contextId: frameContext.contextId,
          rawFrameSelector: frameContext.frameSelector,
          locatorSelector: selector2
        });
        prefix += `.locator(${this.quoteForCode(selector2)}).contentFrame()`;
      });
      return prefix;
    }
    _getBaseContextAlias(context) {
      if (!context) return this.pageAlias;
      if (this.contextAliasMap.has(context.contextId)) {
        const alias = this.contextAliasMap.get(context.contextId);
        return alias === "page_0" || alias === "page" ? this.pageAlias : alias;
      }
      if (context.type === "page") return this.pageAlias;
      return context.contextId?.replace(/^ctx_/, "") || this.pageAlias;
    }
    _isUsableIframeContext(context) {
      if (context?.type !== "iframe") return false;
      const frameElement = context.frameElement;
      const tagName2 = frameElement?.tagName?.toLowerCase();
      if (!frameElement || tagName2 !== "iframe" && tagName2 !== "frame") return false;
      if (frameElement.isConnected === false) return false;
      const parentContext = this.contextMap.get(context.parentContextId);
      if (parentContext?.documentRef && frameElement.ownerDocument !== parentContext.documentRef) {
        return false;
      }
      return true;
    }
    _frameSelectorToLocatorSelector(frameSelector) {
      if (!frameSelector) return "iframe";
      return frameSelector;
    }
    declareContexts(contexts, rootAlias) {
      this.setContexts(contexts, rootAlias);
      return [];
      if (!contexts || !Array.isArray(contexts)) return [];
      const generatedDeclarations = [];
      contexts.forEach((ctx) => {
        let alias = "";
        if (!ctx.contextId || ctx.contextId === "ctx_page_0") {
          alias = rootAlias;
        } else {
          alias = ctx.contextId.replace(/^ctx_/, "");
          if (ctx.type === "iframe" && rootAlias && rootAlias !== "page") {
            alias = `${rootAlias}_${alias}`;
          }
        }
        this.contextAliasMap.set(ctx.contextId, alias);
      });
      contexts.forEach((ctx) => {
        if (ctx.type === "iframe") {
          const alias = this.contextAliasMap.get(ctx.contextId);
          const parentAlias = this.contextAliasMap.get(ctx.parentContextId) || rootAlias;
          const selector2 = ctx.frameSelector || `iframe:nth-of-type(1)`;
          const declaration = `const ${alias} = ${parentAlias}.frameLocator(${this.quoteForCode(selector2)});`;
          if (this.command && typeof this.command.appendCode === "function") {
            this.command.appendCode(declaration);
          }
          generatedDeclarations.push(declaration);
        }
      });
      return generatedDeclarations;
    }
    // 4. 新增共用的 Locator 字串組裝器，統整舊版 switch 邏輯
    _buildLocatorString(winPrefix, methodObj) {
      const { funName, obj } = methodObj;
      switch (funName) {
        case "ByRole": {
          const hasName = obj.name !== null && obj.name !== void 0 && obj.name !== "";
          const exactOption = obj.exact === false ? "" : ", exact: true";
          const roleLocator = hasName ? `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}"${exactOption} })` : `${winPrefix}.getByRole("${obj.role}")`;
          const hasIndex = obj.index !== null && obj.index !== void 0;
          return hasIndex ? `${roleLocator}.nth(${obj.index})` : roleLocator;
        }
        case "ByTitle":
          return `${winPrefix}.getByTitle("${obj.title}", { exact: true })`;
        case "ByText":
          return `${winPrefix}.getByText("${obj.text}", { exact: true })`;
        case "ByDomPath":
          return this._buildDomPathLocator(winPrefix, obj);
        default:
          return `${winPrefix}.locator("unknown")`;
      }
    }
    _buildDomPathLocator(winPrefix, obj) {
      let locator = winPrefix;
      for (const step of obj.shadowChain || []) {
        locator += `.locator(${this.quoteForCode(step.hostSelector)})`;
      }
      locator += `.locator(${this.quoteForCode(obj.csspath)})`;
      return locator;
    }
    changeSetter(action, sourcepath, selectedValue, sourceWindow) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const code = `await ${this._buildLocatorString(winPrefix, best)}.selectOption({ value: ${JSON.stringify(selectedValue)} });`;
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return code;
    }
    keyboardSetter(inputKey, sourceWindow) {
      const winPrefix = this._getContextPrefix(sourceWindow);
      if (inputKey === "Backspace") {
        return `await ${winPrefix}.keyboard.press('Backspace');`;
      }
      return `await ${winPrefix}.keyboard.press(${this.quoteForCode(inputKey)});`;
    }
    dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow) {
      const bestSou = this._getBestPath(sourcepath);
      const bestTar = this._getBestPath(targetpath);
      if (!bestSou || !bestTar) return null;
      const souWinPrefix = this._getContextPrefix(sourceWindow);
      const tarWinPrefix = this._getContextPrefix(targetWindow);
      const souLocator = this._buildLocatorString(souWinPrefix, bestSou);
      const tarLocator = this._buildLocatorString(tarWinPrefix, bestTar);
      this.updateUserActionDB(action, bestSou.funName, bestSou.obj, "source");
      this.updateUserActionDB(action, bestTar.funName, bestTar.obj, "target");
      return `await ${souLocator}.dragTo(${tarLocator});`;
    }
    clickSetter(action, sourcepath, sourceWindow) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return `await ${locator}.click();`;
    }
    doubleClickSetter(action, sourcepath, sourceWindow) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return `await ${locator}.dblclick();`;
    }
    inputSetter(action, sourcepath, sourceWindow, inputText) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return `await ${locator}.fill(${this.quoteForCode(inputText)});`;
    }
    rangeSetter(action, sourcepath, sourceWindow, value) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return `await ${locator}.fill(${this.quoteForCode(value)});`;
    }
    // 5. 將原本對全域陣列 Index 的更新，改為直接對傳入的 Action 實體屬性做更新 (解耦)
    updateUserActionDB(action, funName, obj, targetType = "source") {
      if (!action || typeof action.setSourceMethod !== "function") return;
      let data = "";
      if (funName === "ByTitle") data = obj.title;
      else if (funName === "ByText") data = obj.text;
      else if (funName === "ByDomPath") data = obj.csspath;
      else if (funName === "ByRole") {
        const parts = [`role: ${obj.role}`];
        if (obj.name !== null && obj.name !== void 0 && obj.name !== "") {
          parts.push(`name: "${obj.name}"`);
        }
        if (obj.index !== null && obj.index !== void 0) {
          parts.push(`index: ${obj.index}`);
        }
        data = parts.join(" ");
      }
      if (targetType === "drop" || targetType === "target") {
        action.setTargetMethod(funName);
        action.setTargetData(data);
        if (funName === "ByDomPath") {
          action.targetDomPathChain = obj.shadowChain || [];
          action.targetDomPathOptions = Array.isArray(obj.options) ? obj.options : [];
        }
      } else {
        action.setSourceMethod(funName);
        action.setSourceData(data);
        if (funName === "ByDomPath") {
          action.sourceDomPathChain = obj.shadowChain || [];
          action.sourceDomPathOptions = Array.isArray(obj.options) ? obj.options : [];
        }
      }
    }
    static initListener() {
      window.addEventListener("message", (event) => {
        const data = event.data;
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
      this.sourceDomPathChain = [];
      this.sourceDomPathOptions = [];
      this.targetMethod = null;
      this.targetData = null;
      this.targetDomPathChain = [];
      this.targetDomPathOptions = [];
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

  // interfaces/HoverInspector.js
  var HoverInspector = class {
    constructor(doc, win, options = {}) {
      this.doc = doc;
      this.win = win;
      this.color = options.color || "#ff5fb7";
      this.box = null;
      this.label = null;
      this.create();
    }
    create() {
      if (!this.doc?.documentElement) return;
      this.box = this.doc.createElement("div");
      this.label = this.doc.createElement("div");
      Object.assign(this.box.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "2147483647",
        border: `2px solid ${this.color}`,
        outline: "1px dashed rgba(126, 66, 255, 0.9)",
        outlineOffset: "-4px",
        background: "rgba(255, 95, 183, 0.14)",
        boxSizing: "border-box",
        display: "none"
      });
      Object.assign(this.label.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "2147483647",
        maxWidth: "80vw",
        padding: "4px 8px",
        fontSize: "12px",
        lineHeight: "18px",
        fontFamily: "Consolas, Monaco, monospace",
        color: "#4a2340",
        background: "#fff0f7",
        border: "1px solid #ff9fd1",
        borderRadius: "3px",
        boxShadow: "0 2px 10px rgba(255, 95, 183, 0.28)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "none"
      });
      this.doc.documentElement.appendChild(this.box);
      this.doc.documentElement.appendChild(this.label);
    }
    show(element, text) {
      if (!this.box || !this.label || !element || element === this.box || element === this.label) return;
      const rect = element.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      Object.assign(this.box.style, {
        display: "block",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      this.label.textContent = text || "";
      const labelTop = rect.bottom + 6 > this.win.innerHeight - 28 ? Math.max(0, rect.top - 30) : rect.bottom + 6;
      Object.assign(this.label.style, {
        display: text ? "block" : "none",
        left: `${Math.max(0, Math.min(rect.left, this.win.innerWidth - 40))}px`,
        top: `${labelTop}px`
      });
    }
    hide() {
      if (this.box) this.box.style.display = "none";
      if (this.label) this.label.style.display = "none";
    }
  };

  // interfaces/OuterEventListener.js
  var OuterEventListener = class {
    constructor(contexts, domParserService, onActionRecorded) {
      this.contexts = contexts;
      this.mainWindow = contexts?.mainWindow || window;
      this.mainDocument = this.mainWindow?.document || document;
      this.domParserService = domParserService;
      this.onActionRecorded = onActionRecorded;
      this.contextId = contexts?.contextId || "page";
      this.DOMElement = new DOMElement();
      this.currentHoveredElement = null;
      this.typedText = "";
      this.timer = null;
      this.initialInputValues = /* @__PURE__ */ new WeakMap();
      this.lastUserTypedAt = /* @__PURE__ */ new WeakMap();
      this.userEditedInputs = /* @__PURE__ */ new WeakSet();
      this.lastColorInput = /* @__PURE__ */ new WeakMap();
      this.dragStart = { x: 0, y: 0 };
      this.isDragging = false;
      this.DRAG_THRESHOLD = 5;
      this.dragSource = null;
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      this.suppressClickUntil = 0;
      this.hoverInspector = new HoverInspector(this.mainDocument, this.mainWindow);
      this.lastPreviewTarget = null;
      this.hoverHighlightEnabled = true;
      this.hoverPreviewSessionEnabled = false;
      this.isRecording = false;
    }
    init() {
      if (!this.mainWindow || !this.mainDocument) {
        console.warn("mainWindow \u4E0D\u5B58\u5728\uFF0C\u8DF3\u904E OuterEventListener.init()");
        return;
      }
      this.mainDocument.addEventListener("click", this.clickHandler.bind(this), true);
      this.mainDocument.addEventListener("mousedown", this.mousedownHandler.bind(this), true);
      this.mainDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this), true);
      this.mainDocument.addEventListener("mouseout", this.mouseoutHandler.bind(this), true);
      this.mainDocument.addEventListener("mouseleave", this.hideHoverPreview.bind(this), true);
      this.mainDocument.addEventListener("mouseup", this.mouseupHandler.bind(this), true);
      this.mainWindow.addEventListener("dragstart", this.dragStartHandler.bind(this));
      this.mainDocument.addEventListener("dblclick", this.dblClickHandler.bind(this), true);
      this.mainDocument.addEventListener("keydown", this.keydownHandler.bind(this));
      this.mainDocument.addEventListener("change", this.changeHandler.bind(this), true);
      this.mainDocument.addEventListener("input", this.inputHandler.bind(this), true);
      this.mainDocument.addEventListener("dragover", (e) => {
        if (this.isRecording) e.preventDefault();
      });
      this.mainDocument.addEventListener("drop", this.dropHandler.bind(this), true);
      this.mainWindow.addEventListener("message", this.messageHandler.bind(this));
      this.loadHoverHighlightPreference();
      this.bindHoverHighlightPreference();
    }
    messageHandler(e) {
      const msg = e.data;
      switch (msg.type) {
        case "START_RECORDING":
          this.setRecordingState(true, { allowHoverPreview: true });
          this.snapshotInitialInputValues();
          break;
        case "STOP_RECORDING":
          this.setRecordingState(false, { allowHoverPreview: false });
          clearTimeout(this.timer);
          break;
      }
    }
    // 統一封裝與派發 Action 的方法
    dispatchAction(action_type, sourceElement, targetElement = null, extraData = {}) {
      const currentEventElement = sourceElement || targetElement;
      if (currentEventElement) {
        this.DOMElement.setElementData(currentEventElement, action_type);
      }
      const action = ActionInterpreter.interpretDrag(
        action_type,
        sourceElement,
        targetElement,
        this.contextId,
        // 將事件的來源綁定當前的 contextId
        targetElement ? this.contextId : ""
      );
      if (extraData.keyboard) action.setKeyboard(extraData.keyboard);
      if (extraData.inputText !== void 0) action.setInputText(extraData.inputText);
      if (extraData.selectedValue !== void 0) action.setSelectedValue(extraData.selectedValue);
      if (extraData.selectedText !== void 0) action.setSelectedText(extraData.selectedText);
      if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);
      if (extraData.isDragStart) action.isDragStart = true;
      if (extraData.isDrop) action.isDrop = true;
      if (typeof this.onActionRecorded === "function") {
        this.onActionRecorded(action);
      } else {
        console.warn("OuterEventListener: onActionRecorded callback \u5C1A\u672A\u7D81\u5B9A", action);
      }
    }
    dropHandler(e) {
      if (!this.isRecording) return;
      e.preventDefault();
      this.currentHoveredElement = e.target;
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
    }
    inputHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      const tag = e.target.tagName.toLowerCase();
      const type = e.target.getAttribute("type");
      const isRange = this.isRangeInput(e.target);
      if (isRange) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.currentHoveredElement = e.target;
          this.dispatchAction("range", this.currentHoveredElement, null, {
            inputText: e.target.value
          });
        }, 250);
        return;
      }
      if (this.isColorInput(e.target)) {
        this.recordColorInput(e.target);
        return;
      }
      const isTextInput = tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type)) || tag === "textarea" || e.target.isContentEditable;
      if (!isTextInput) return;
      if (!this.shouldRecordTextInputEvent(e.target)) return;
      clearTimeout(this.timer);
      const target = e.target;
      this.timer = setTimeout(() => {
        if (!this.isRecording || !this.shouldRecordTextInputEvent(target)) return;
        this.currentHoveredElement = target;
        this.dispatchAction("input", this.currentHoveredElement, null, {
          inputText: this.getInputValue(target)
        });
      }, 500);
    }
    changeHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      const tag = e.target.tagName;
      const type = e.target.type;
      if (this.isRangeInput(e.target)) return;
      if (this.isColorInput(e.target)) {
        this.recordColorInput(e.target);
        return;
      }
      const isSelect = tag === "SELECT";
      const isCheckbox = tag === "INPUT" && type === "checkbox";
      if (!isSelect && !isCheckbox) return;
      if (isCheckbox) {
        this.dispatchAction("checkBox", this.getCheckboxClickTarget(e.target));
        return;
      }
      if (isSelect) {
        this.setReloadSuppressWindow();
      }
      const action_type = isSelect ? "change" : "checkBox";
      this.dispatchAction(action_type, e.target, null, isSelect ? {
        selectedValue: e.target.value,
        selectedText: e.target.options?.[e.target.selectedIndex]?.text || ""
      } : {});
    }
    keydownHandler(e) {
      if (!this.isRecording) return;
      if (e.isTrusted && e.target && this.isTextEditingKey(e) && this.isTextInputElement(e.target)) {
        this.lastUserTypedAt.set(e.target, Date.now());
        this.userEditedInputs.add(e.target);
      }
      if (e.key === "Backspace") {
        this.currentHoveredElement = e.target;
        this.dispatchAction("keyboard", this.currentHoveredElement, null, {
          keyboard: e.key
        });
      }
    }
    dblClickHandler(e) {
      if (!this.isRecording) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      this.currentHoveredElement = e.target;
      this.dispatchAction("dbclick", this.currentHoveredElement);
    }
    dragStartHandler(e) {
      if (!this.isRecording) return;
      const target = e.target;
      if (!target) return;
      if (this.isRangeInput(target)) return;
      if (target.getAttribute("draggable") === "true") {
        this.hideHoverPreview();
        this.dispatchAction("dragANDdrop", target, null, { isDragStart: true });
      }
    }
    mousedownHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.isRangeInput(e.target)) return;
      if (!this.isMouseDragCandidate(e.target)) return;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
      this.dragSource = this.getDragSourceElement(e.target);
      this.mouseDownFlag = true;
      this.dragStepFlag = 1;
      this.hideHoverPreview();
    }
    mousemoveHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.isRangeInput(e.target)) return;
      this.currentHoveredElement = this.getDragTargetElement(e.target);
      if (this.shouldPreviewHover()) {
        this.previewHoveredElement(this.currentHoveredElement);
      } else {
        this.hideHoverPreview();
      }
      if (!this.dragStart || this.dragStepFlag !== 1) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
        this.isDragging = true;
        this.dragStepFlag = 2;
        this.mouseDownFlag = false;
        this.dispatchAction("dragANDdrop", this.dragSource, null, { isDragStart: true });
      }
    }
    previewHoveredElement(element) {
      if (!element || element === this.lastPreviewTarget) return;
      this.lastPreviewTarget = element;
      try {
        const sourcePath = this.domParserService.getOpenSourcePath(element, this.mainWindow);
        this.hoverInspector?.show(element, this.formatLocatorPreview(sourcePath));
      } catch (error) {
        console.warn("[Recorder] Unable to preview hovered locator", error);
        this.hoverInspector?.show(element, "");
      }
    }
    shouldPreviewHover() {
      return this.hoverPreviewSessionEnabled && this.hoverHighlightEnabled && !this.mouseDownFlag && !this.isDragging && this.dragStepFlag === 0;
    }
    setRecordingState(isRecording, options = {}) {
      this.isRecording = isRecording === true;
      this.setHoverPreviewSessionEnabled(options.allowHoverPreview === true);
      if (!this.isRecording) this.hideHoverPreview();
    }
    setHoverPreviewSessionEnabled(enabled) {
      this.hoverPreviewSessionEnabled = enabled === true;
      if (!this.hoverPreviewSessionEnabled) this.hideHoverPreview();
    }
    loadHoverHighlightPreference() {
      try {
        if (typeof chrome === "undefined" || !chrome.storage?.local) return;
        chrome.storage.local.get(["hoverHighlightEnabled", "hoverPreviewSessionEnabled"], (result) => {
          this.setHoverHighlightEnabled(result.hoverHighlightEnabled !== false);
          this.setHoverPreviewSessionEnabled(result.hoverPreviewSessionEnabled === true);
        });
      } catch (error) {
        console.warn("[Recorder] Unable to load hover highlight preference", error);
      }
    }
    bindHoverHighlightPreference() {
      try {
        if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== "local" || !changes.hoverHighlightEnabled) return;
          this.setHoverHighlightEnabled(changes.hoverHighlightEnabled.newValue !== false);
        });
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== "local" || !changes.hoverPreviewSessionEnabled) return;
          this.setHoverPreviewSessionEnabled(changes.hoverPreviewSessionEnabled.newValue === true);
        });
      } catch (error) {
        console.warn("[Recorder] Unable to bind hover highlight preference", error);
      }
    }
    setHoverHighlightEnabled(enabled) {
      this.hoverHighlightEnabled = enabled !== false;
      if (!this.hoverHighlightEnabled) this.hideHoverPreview();
    }
    mouseoutHandler(e) {
      if (!e.relatedTarget) this.hideHoverPreview();
    }
    hideHoverPreview() {
      this.hoverInspector?.hide();
      this.lastPreviewTarget = null;
    }
    formatLocatorPreview(sourcePath) {
      const best = this.getBestPreviewPath(sourcePath);
      if (!best) return "";
      const { funName, obj } = best;
      const quote = (value) => JSON.stringify(String(value ?? ""));
      if (funName === "ByRole") {
        const role = quote(obj.role);
        if (obj.name !== null && obj.name !== void 0 && obj.name !== "") {
          const exactOption = obj.exact === false ? "" : ", exact: true";
          const nth = obj.index !== null && obj.index !== void 0 ? `.nth(${obj.index})` : "";
          return `getByRole(${role}, { name: ${quote(obj.name)}${exactOption} })${nth}`;
        }
        return `getByRole(${role})`;
      }
      if (funName === "ByText") return `getByText(${quote(obj.text)}, { exact: true })`;
      if (funName === "ByTitle") return `getByTitle(${quote(obj.title)}, { exact: true })`;
      if (funName === "ByDomPath") return `locator(${quote(obj.csspath)})`;
      return funName;
    }
    getBestPreviewPath(sourcePath) {
      if (!sourcePath) return null;
      for (let i = 0; i < this.domParserService.priSize; i++) {
        if (sourcePath[i]) return sourcePath[i];
      }
      return null;
    }
    mouseupHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      if (this.isFileInput(e.target)) return;
      if (this.isDragging) {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentHoveredElement = this.getDragTargetElement(e.target);
        this.mouseDownFlag = false;
        this.dragStepFlag = 0;
        this.suppressClickUntil = Date.now() + 300;
        this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
        return;
      }
      this.resetMouseDragState();
    }
    clickHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (Date.now() < this.suppressClickUntil) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      const target = this.getComposedEventTarget(e);
      if (this.isFileInput(target)) return;
      if (this.isRangeInput(target)) return;
      if (this.isCheckboxOrCheckboxLabel(target)) return;
      if (target.tagName === "LABEL" && !this.isRadioOrRadioLabel(target)) return;
      if (target.tagName === "SELECT") return;
      let clickable = target;
      if (target.tagName === "INPUT") {
        const label = target.parentElement?.querySelector(`label[for="${target.id}"]`);
        clickable = label || target.closest(`button, a, [role="button"], [onclick], i, svg`) || target;
      } else {
        clickable = target.closest(`button, a, [role="button"], [onclick], i, svg`) || target;
      }
      this.currentHoveredElement = clickable;
      this.dispatchAction("click", this.currentHoveredElement);
    }
    isRangeInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "range";
    }
    isColorInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "color";
    }
    isFileInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "file";
    }
    recordColorInput(element) {
      const value = element?.value;
      if (!value) return;
      const lastRecord = this.lastColorInput.get(element);
      if (lastRecord?.value === value && Date.now() - lastRecord.ts < 500) return;
      this.lastColorInput.set(element, { value, ts: Date.now() });
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.currentHoveredElement = element;
        this.dispatchAction("color", this.currentHoveredElement, null, {
          inputText: value
        });
      }, 150);
    }
    getDragSourceElement(element) {
      return element?.closest?.(".gjs-layer-move, [data-toggle-move]") || element;
    }
    getComposedEventTarget(e) {
      const interactive = this.getFirstComposedElement(e, "button, a, [role='button'], [onclick], input, textarea, select, label, [data-thread-id], .thread-item");
      return interactive || e.target;
    }
    getFirstComposedElement(e, selector2) {
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      for (const item of path) {
        if (item?.nodeType !== 1) continue;
        if (item.matches?.(selector2)) return item;
        const closest = item.closest?.(selector2);
        if (closest) return closest;
      }
      return null;
    }
    isMouseDragCandidate(element) {
      return !!element?.closest?.(".gjs-layer-move, [data-toggle-move]");
    }
    getDragTargetElement(element) {
      return element?.closest?.(".gjs-layer, .gjs-layer-item, [data-layer-id], [data-gjs-type]") || element;
    }
    resetMouseDragState() {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.dragSource = null;
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
    }
    snapshotInitialInputValues() {
      try {
        this.initialInputValues = /* @__PURE__ */ new WeakMap();
        this.userEditedInputs = /* @__PURE__ */ new WeakSet();
        this.mainDocument?.querySelectorAll?.("input, textarea, [contenteditable='true']").forEach((element) => {
          this.initialInputValues.set(element, this.getInputValue(element));
        });
      } catch (error) {
        console.warn("[Recorder] Unable to snapshot initial input values", error);
      }
    }
    getInputValue(element) {
      return element?.value ?? element?.innerText ?? "";
    }
    shouldRecordTextInputEvent(element) {
      if (!this.userEditedInputs.has(element)) return false;
      const value = this.getInputValue(element);
      if (this.initialInputValues.get(element) === value) return false;
      const lastTypedAt = this.lastUserTypedAt.get(element) || 0;
      return Date.now() - lastTypedAt <= 1500;
    }
    isTextEditingKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      return e.key?.length === 1 || ["Backspace", "Delete"].includes(e.key);
    }
    isTextInputElement(element) {
      const tag = element?.tagName?.toLowerCase();
      const type = element?.getAttribute?.("type");
      return tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type)) || tag === "textarea" || element?.isContentEditable;
    }
    setReloadSuppressWindow(ms = 1500) {
      try {
        this.mainWindow?.sessionStorage?.setItem("__recorderSuppressUntil", String(Date.now() + ms));
      } catch (error) {
        console.warn("[Recorder] Unable to set reload suppress window", error);
      }
    }
    shouldSuppressSyntheticPageEvent() {
      try {
        const until = Number(this.mainWindow?.sessionStorage?.getItem("__recorderSuppressUntil") || 0);
        return Date.now() < until;
      } catch (error) {
        return false;
      }
    }
    getCheckboxClickTarget(input) {
      const wrappingLabel = input.closest?.("label");
      if (wrappingLabel) return wrappingLabel;
      if (input.id) {
        const escapedId = String(input.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const explicitLabel = input.ownerDocument?.querySelector?.(`label[for="${escapedId}"]`);
        if (explicitLabel) return explicitLabel;
      }
      return input;
    }
    isCheckboxOrCheckboxLabel(element) {
      if (!element) return false;
      if (element.matches?.('input[type="checkbox"]')) return true;
      const label = element.closest?.("label");
      if (!label?.querySelector?.('input[type="checkbox"]')) return false;
      if (element.closest?.('button, a, [role="button"], [onclick]')) return false;
      return true;
    }
    isRadioOrRadioLabel(element) {
      if (!element) return false;
      if (element.matches?.('input[type="radio"]')) return true;
      return !!element.closest?.("label")?.querySelector?.('input[type="radio"]');
    }
  };

  // interfaces/IframeEventListener.js
  var IframeEventListener = class {
    // 1. 移除 command, userActionDB 等依賴，改為接收 onActionRecorded 回呼函式
    constructor(contexts, domParserService, onActionRecorded) {
      this.contexts = contexts;
      this.iframeWindow = contexts?.iframeWindow || null;
      this.iframeDocument = this.iframeWindow?.document || null;
      this.domParserService = domParserService;
      this.onActionRecorded = onActionRecorded;
      this.contextId = contexts?.contextId || "iframe";
      this.DOMElement = new DOMElement();
      this.currentHoveredElement = null;
      this.clickFlag = 0;
      this.clickTimeOut = null;
      this.DOUBLE_CLICK_DELAY = 250;
      this.inputTimer = 0;
      this.INPUT_DELAY = 500;
      this.initialInputValues = /* @__PURE__ */ new WeakMap();
      this.lastUserTypedAt = /* @__PURE__ */ new WeakMap();
      this.userEditedInputs = /* @__PURE__ */ new WeakSet();
      this.lastColorInput = /* @__PURE__ */ new WeakMap();
      this.dragStart = { x: 0, y: 0 };
      this.isDragging = false;
      this.DRAG_THRESHOLD = 5;
      this.dragSource = null;
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      this.hoverInspector = new HoverInspector(this.iframeDocument, this.iframeWindow);
      this.lastPreviewTarget = null;
      this.hoverHighlightEnabled = true;
      this.hoverPreviewSessionEnabled = false;
      this.isRecording = false;
    }
    init() {
      if (!this.iframeWindow || !this.iframeDocument) {
        console.warn("iframe \u4E0D\u5B58\u5728\uFF0C\u8DF3\u904E IframeEventListener.init()");
        return;
      }
      this.iframeDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this));
      this.iframeDocument.addEventListener("mouseout", this.mouseoutHandler.bind(this), true);
      this.iframeDocument.addEventListener("mouseleave", this.hideHoverPreview.bind(this), true);
      this.iframeDocument.addEventListener("mousedown", this.mousedownHandler.bind(this));
      this.iframeDocument.addEventListener("mouseup", this.mouseupHandler.bind(this));
      this.iframeDocument.addEventListener("keydown", this.keydownHandler.bind(this));
      this.iframeDocument.addEventListener("input", this.inputHandler.bind(this));
      this.iframeWindow.addEventListener("drop", this.dropHandler.bind(this));
      this.iframeWindow.addEventListener("blur", this.hideHoverPreview.bind(this));
      this.iframeDocument.addEventListener("click", this.clickHandler.bind(this), true);
      this.iframeDocument.addEventListener("change", this.changeHandler.bind(this), true);
      this.iframeDocument.addEventListener("dragover", (e) => {
        if (this.isRecording) e.preventDefault();
      });
      this.iframeWindow.addEventListener("message", this.messageHandler.bind(this));
      this.loadHoverHighlightPreference();
      this.bindHoverHighlightPreference();
    }
    // 【新增】處理 SELECT 與 Checkbox 的改變
    changeHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      const tag = e.target.tagName;
      const type = e.target.type;
      const isSelect = tag === "SELECT";
      const isCheckbox = tag === "INPUT" && type === "checkbox";
      if (!isSelect && !isCheckbox) return;
      if (isCheckbox) {
        this.dispatchAction("checkBox", this.getCheckboxClickTarget(e.target));
        return;
      }
      if (isSelect) {
        this.setReloadSuppressWindow();
      }
      const action_type = isSelect ? "change" : "checkBox";
      this.dispatchAction(action_type, e.target, null, isSelect ? {
        selectedValue: e.target.value,
        selectedText: e.target.options?.[e.target.selectedIndex]?.text || ""
      } : {});
    }
    messageHandler(e) {
      const msg = e.data;
      switch (msg.type) {
        case "START_RECORDING":
          this.setRecordingState(true, { allowHoverPreview: true });
          this.snapshotInitialInputValues();
          break;
        case "STOP_RECORDING":
          this.setRecordingState(false, { allowHoverPreview: false });
          clearTimeout(this.inputTimer);
          break;
      }
    }
    // 2. 建立統一的派發 Action 方法
    dispatchAction(action_type, sourceElement, targetElement = null, extraData = {}) {
      const currentEventElement = sourceElement || targetElement;
      if (currentEventElement) {
        this.DOMElement.setElementData(currentEventElement, action_type);
      }
      console.log("[Debug IframeEventListener] dispatchAction", {
        actionType: action_type,
        contextId: this.contextId,
        sourceTag: sourceElement?.tagName || null,
        sourceId: sourceElement?.id || null,
        sourceClass: sourceElement?.className || null,
        sourceDataGjsType: sourceElement?.getAttribute?.("data-gjs-type") || null,
        targetTag: targetElement?.tagName || null,
        targetId: targetElement?.id || null,
        targetClass: targetElement?.className || null,
        targetDataGjsType: targetElement?.getAttribute?.("data-gjs-type") || null,
        extraData
      });
      const action = ActionInterpreter.interpretDrag(
        action_type,
        sourceElement,
        targetElement,
        this.contextId,
        targetElement ? this.contextId : ""
      );
      if (extraData.inputText !== void 0) action.setInputText(extraData.inputText);
      if (extraData.selectedValue !== void 0) action.setSelectedValue(extraData.selectedValue);
      if (extraData.selectedText !== void 0) action.setSelectedText(extraData.selectedText);
      if (extraData.preParsedSourcePath) action.preParsedSourcePath = extraData.preParsedSourcePath;
      if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);
      if (extraData.isDragStart) action.isDragStart = true;
      if (extraData.isDrop) action.isDrop = true;
      if (typeof this.onActionRecorded === "function") {
        this.onActionRecorded(action);
      } else {
        console.warn("IframeEventListener: onActionRecorded callback \u5C1A\u672A\u7D81\u5B9A", action);
      }
    }
    clickHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      if (this.isFileInput(e.target)) return;
    }
    dropHandler(e) {
      if (!this.isRecording) return;
      this.currentHoveredElement = e.target;
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
    }
    inputHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      const tag = e.target.tagName.toLowerCase();
      const type = e.target.getAttribute("type");
      const isRange = this.isRangeInput(e.target);
      if (isRange) {
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(() => {
          this.currentHoveredElement = e.target;
          this.dispatchAction("range", this.currentHoveredElement, null, {
            inputText: e.target.value
          });
        }, 250);
        return;
      }
      const isTextInput = tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type)) || tag === "textarea" || e.target.isContentEditable;
      if (!isTextInput) return;
      if (!this.shouldRecordTextInputEvent(e.target)) return;
      clearTimeout(this.inputTimer);
      const target = e.target;
      this.inputTimer = setTimeout(() => {
        if (!this.isRecording || !this.shouldRecordTextInputEvent(target)) return;
        this.currentHoveredElement = target;
        this.dispatchAction("input", this.currentHoveredElement, null, {
          inputText: this.getInputValue(target)
        });
      }, this.INPUT_DELAY);
    }
    keydownHandler(e) {
      if (!this.isRecording || !e.isTrusted || !e.target) return;
      if (!this.isTextEditingKey(e) || !this.isTextInputElement(e.target)) return;
      this.lastUserTypedAt.set(e.target, Date.now());
      this.userEditedInputs.add(e.target);
    }
    mouseupHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      if (this.shouldSuppressSyntheticPageEvent()) return;
      const target = this.getComposedEventTarget(e);
      if (this.isFileInput(target)) return;
      if (this.isRangeInput(target)) {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.mouseDownFlag = false;
        this.dragStepFlag = 0;
        return;
      }
      if (this.isColorInput(e.target)) {
        this.recordColorInput(e.target);
        return;
      }
      if (this.isCheckboxOrCheckboxLabel(target)) return;
      if (target.tagName === "LABEL" && !this.isRadioOrRadioLabel(target)) return;
      if (target.tagName === "SELECT") return;
      console.log("[Debug IframeListener] mouseup \u89F8\u767C, isDragging:", this.isDragging);
      if (this.isDragging) {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentHoveredElement = target;
        this.mouseDownFlag = false;
        this.dragStepFlag = 0;
        this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
      } else {
        const preParsedSourcePath = this.preParseSourcePath(target);
        this.clickFlag += 1;
        if (this.clickFlag === 1) {
          this.clickTimeOut = setTimeout(() => {
            this.clickFlag = 0;
            this.isDragging = false;
            this.dragStart = { x: 0, y: 0 };
            this.dispatchAction("click", target, null, { preParsedSourcePath });
          }, this.DOUBLE_CLICK_DELAY);
        } else if (this.clickFlag === 2) {
          clearTimeout(this.clickTimeOut);
          this.clickFlag = 0;
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };
          this.dispatchAction("dbclick", target, null, { preParsedSourcePath });
        }
      }
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
    }
    preParseSourcePath(element) {
      try {
        return this.domParserService.getOpenSourcePath(element, this.iframeWindow);
      } catch (error) {
        console.warn("[Recorder] Unable to pre-parse iframe click locator", error);
        return null;
      }
    }
    mousedownHandler(e) {
      if (!this.isRecording) return;
      if (this.isRangeInput(e.target)) return;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
      this.dragSource = e.target;
      this.mouseDownFlag = true;
      this.dragStepFlag = 1;
      this.hideHoverPreview();
    }
    mousemoveHandler(e) {
      if (!this.isRecording) return;
      if (this.isRangeInput(e.target)) return;
      this.currentHoveredElement = e.target;
      if (this.shouldPreviewHover()) {
        this.previewHoveredElement(this.currentHoveredElement);
      } else {
        this.hideHoverPreview();
      }
      if (!this.dragStart || this.dragStepFlag !== 1) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
        this.isDragging = true;
        this.dragStepFlag = 2;
        this.mouseDownFlag = false;
        this.dispatchAction("dragANDdrop", this.dragSource, null, { isDragStart: true });
      }
    }
    previewHoveredElement(element) {
      if (!element || element === this.lastPreviewTarget) return;
      this.lastPreviewTarget = element;
      try {
        const sourcePath = this.domParserService.getOpenSourcePath(element, this.iframeWindow);
        this.hoverInspector?.show(element, this.formatLocatorPreview(sourcePath));
      } catch (error) {
        console.warn("[Recorder] Unable to preview hovered iframe locator", error);
        this.hoverInspector?.show(element, "");
      }
    }
    shouldPreviewHover() {
      return this.hoverPreviewSessionEnabled && this.hoverHighlightEnabled && !this.mouseDownFlag && !this.isDragging && this.dragStepFlag === 0;
    }
    setRecordingState(isRecording, options = {}) {
      this.isRecording = isRecording === true;
      this.setHoverPreviewSessionEnabled(options.allowHoverPreview === true);
      if (!this.isRecording) this.hideHoverPreview();
    }
    setHoverPreviewSessionEnabled(enabled) {
      this.hoverPreviewSessionEnabled = enabled === true;
      if (!this.hoverPreviewSessionEnabled) this.hideHoverPreview();
    }
    loadHoverHighlightPreference() {
      try {
        if (typeof chrome === "undefined" || !chrome.storage?.local) return;
        chrome.storage.local.get(["hoverHighlightEnabled", "hoverPreviewSessionEnabled"], (result) => {
          this.setHoverHighlightEnabled(result.hoverHighlightEnabled !== false);
          this.setHoverPreviewSessionEnabled(result.hoverPreviewSessionEnabled === true);
        });
      } catch (error) {
        console.warn("[Recorder] Unable to load iframe hover highlight preference", error);
      }
    }
    bindHoverHighlightPreference() {
      try {
        if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== "local" || !changes.hoverHighlightEnabled) return;
          this.setHoverHighlightEnabled(changes.hoverHighlightEnabled.newValue !== false);
        });
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== "local" || !changes.hoverPreviewSessionEnabled) return;
          this.setHoverPreviewSessionEnabled(changes.hoverPreviewSessionEnabled.newValue === true);
        });
      } catch (error) {
        console.warn("[Recorder] Unable to bind iframe hover highlight preference", error);
      }
    }
    setHoverHighlightEnabled(enabled) {
      this.hoverHighlightEnabled = enabled !== false;
      if (!this.hoverHighlightEnabled) this.hideHoverPreview();
    }
    mouseoutHandler(e) {
      if (!e.relatedTarget) this.hideHoverPreview();
    }
    hideHoverPreview() {
      this.hoverInspector?.hide();
      this.lastPreviewTarget = null;
    }
    formatLocatorPreview(sourcePath) {
      const best = this.getBestPreviewPath(sourcePath);
      if (!best) return "";
      const { funName, obj } = best;
      const quote = (value) => JSON.stringify(String(value ?? ""));
      if (funName === "ByRole") {
        const role = quote(obj.role);
        if (obj.name !== null && obj.name !== void 0 && obj.name !== "") {
          const exactOption = obj.exact === false ? "" : ", exact: true";
          const nth = obj.index !== null && obj.index !== void 0 ? `.nth(${obj.index})` : "";
          return `getByRole(${role}, { name: ${quote(obj.name)}${exactOption} })${nth}`;
        }
        return `getByRole(${role})`;
      }
      if (funName === "ByText") return `getByText(${quote(obj.text)}, { exact: true })`;
      if (funName === "ByTitle") return `getByTitle(${quote(obj.title)}, { exact: true })`;
      if (funName === "ByDomPath") return `locator(${quote(obj.csspath)})`;
      return funName;
    }
    getBestPreviewPath(sourcePath) {
      if (!sourcePath) return null;
      for (let i = 0; i < this.domParserService.priSize; i++) {
        if (sourcePath[i]) return sourcePath[i];
      }
      return null;
    }
    isRangeInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "range";
    }
    isColorInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "color";
    }
    isFileInput(element) {
      return element?.tagName === "INPUT" && element.getAttribute("type") === "file";
    }
    recordColorInput(element) {
      const value = element?.value;
      if (!value) return;
      const lastRecord = this.lastColorInput.get(element);
      if (lastRecord?.value === value && Date.now() - lastRecord.ts < 500) return;
      this.lastColorInput.set(element, { value, ts: Date.now() });
      clearTimeout(this.inputTimer);
      this.inputTimer = setTimeout(() => {
        this.currentHoveredElement = element;
        this.dispatchAction("color", this.currentHoveredElement, null, {
          inputText: value
        });
      }, 150);
    }
    getComposedEventTarget(e) {
      const interactive = this.getFirstComposedElement(e, "button, a, [role='button'], [onclick], input, textarea, select, label, [data-thread-id], .thread-item");
      return interactive || e.target;
    }
    getFirstComposedElement(e, selector2) {
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      for (const item of path) {
        if (item?.nodeType !== 1) continue;
        if (item.matches?.(selector2)) return item;
        const closest = item.closest?.(selector2);
        if (closest) return closest;
      }
      return null;
    }
    snapshotInitialInputValues() {
      try {
        this.initialInputValues = /* @__PURE__ */ new WeakMap();
        this.userEditedInputs = /* @__PURE__ */ new WeakSet();
        this.iframeDocument?.querySelectorAll?.("input, textarea, [contenteditable='true']").forEach((element) => {
          this.initialInputValues.set(element, this.getInputValue(element));
        });
      } catch (error) {
        console.warn("[Recorder] Unable to snapshot initial input values", error);
      }
    }
    getInputValue(element) {
      return element?.value ?? element?.innerText ?? "";
    }
    shouldRecordTextInputEvent(element) {
      if (!this.userEditedInputs.has(element)) return false;
      const value = this.getInputValue(element);
      if (this.initialInputValues.get(element) === value) return false;
      const lastTypedAt = this.lastUserTypedAt.get(element) || 0;
      return Date.now() - lastTypedAt <= 1500;
    }
    isTextEditingKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      return e.key?.length === 1 || ["Backspace", "Delete"].includes(e.key);
    }
    isTextInputElement(element) {
      const tag = element?.tagName?.toLowerCase();
      const type = element?.getAttribute?.("type");
      return tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type)) || tag === "textarea" || element?.isContentEditable;
    }
    setReloadSuppressWindow(ms = 1500) {
      try {
        this.iframeWindow?.sessionStorage?.setItem("__recorderSuppressUntil", String(Date.now() + ms));
      } catch (error) {
        console.warn("[Recorder] Unable to set reload suppress window", error);
      }
    }
    shouldSuppressSyntheticPageEvent() {
      try {
        const until = Number(this.iframeWindow?.sessionStorage?.getItem("__recorderSuppressUntil") || 0);
        return Date.now() < until;
      } catch (error) {
        return false;
      }
    }
    getCheckboxClickTarget(input) {
      const wrappingLabel = input.closest?.("label");
      if (wrappingLabel) return wrappingLabel;
      if (input.id) {
        const escapedId = String(input.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const explicitLabel = input.ownerDocument?.querySelector?.(`label[for="${escapedId}"]`);
        if (explicitLabel) return explicitLabel;
      }
      return input;
    }
    isCheckboxOrCheckboxLabel(element) {
      if (!element) return false;
      if (element.matches?.('input[type="checkbox"]')) return true;
      const label = element.closest?.("label");
      if (!label?.querySelector?.('input[type="checkbox"]')) return false;
      if (element.closest?.('button, a, [role="button"], [onclick]')) return false;
      return true;
    }
    isRadioOrRadioLabel(element) {
      if (!element) return false;
      if (element.matches?.('input[type="radio"]')) return true;
      return !!element.closest?.("label")?.querySelector?.('input[type="radio"]');
    }
  };

  // custom-rules.json
  var custom_rules_default = {
    version: "1.0",
    lastUpdated: "2026-06-15",
    dynamicIdRules: [
      {
        description: "MobiWebX / GrapesJS \u81EA\u52D5\u7522\u751F\u7684\u77ED\u78BC ID\uFF0C\u4EE5 i \u958B\u982D\u4E26\u63A5 3 \u5230 6 \u78BC\u5C0F\u5BEB\u82F1\u6578\u5B57\uFF08\u4F8B\u5982: ijen, i5e6, iorym, i0hcyk\uFF09",
        pattern: "^i[a-z0-9]{3,6}$"
      },
      {
        description: "MobiWebX / GrapesJS \u8907\u88FD\u6216\u5DE2\u72C0\u5143\u4EF6\u5F8C\u7522\u751F\u7684\u77ED\u78BC\u6D41\u6C34\u5C3E\u78BC\uFF08\u4F8B\u5982: ie9yg-2-2, if7f-2, i5a7-4\uFF09",
        pattern: "^i[a-z0-9]{1,6}(?:-\\d+)+$"
      },
      {
        description: "\u529F\u80FD\u8A9E\u610F\u578B\u5143\u4EF6 ID \u52A0\u4E0A\u52D5\u614B\u6578\u5B57\u5C3E\u78BC\uFF0C\u5E38\u898B\u65BC\u767B\u5165\u3001\u8A3B\u518A\u3001\u932F\u8AA4\u8A0A\u606F\u3001\u793E\u7FA4\u767B\u5165\u6309\u9215\uFF08\u4F8B\u5982: username-input-4-2, error-message-container-2-2-2, google-btn-2-2\uFF09",
        pattern: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)+-\\d+(?:-\\d+)*$"
      },
      {
        description: "Ionic ion-input \u81EA\u52D5\u7522\u751F\u7684 label \u95DC\u806F ID\uFF08\u4F8B\u5982: ion-input-2-lbl, ion-input-8-lbl\uFF09",
        pattern: "^ion-input-\\d+-lbl$"
      },
      {
        description: "Ionic Tabs \u81EA\u52D5\u7522\u751F\u7684 tab button \u95DC\u806F ID\uFF08\u4F8B\u5982: tab-button-tab-schedule, tab-button-tab-speaker\uFF09",
        pattern: "^tab-button-tab-[a-z0-9-]+$"
      },
      {
        description: "SVG \u6216\u532F\u5165\u5716\u793A\u8907\u88FD\u5F8C\u7522\u751F\u7684 ID\uFF0C\u5E38\u898B\u65BC Capa_1 \u5F8C\u63A5\u6578\u5B57\u5C3E\u78BC\uFF08\u4F8B\u5982: Capa_1-2-2\uFF09",
        pattern: "^Capa_1(?:-\\d+)*$"
      },
      {
        description: "Web Component / Shadow DOM \u5167\u90E8\u56FA\u5B9A\u4F46\u6703\u91CD\u8907\u51FA\u73FE\u7684\u80CC\u666F\u5BB9\u5668 ID\uFF08\u4F8B\u5982: background-content\uFF09",
        pattern: "^background-content$"
      }
    ]
  };

  // MainApp.js
  console.log("\u{1F680} [System] bundle.js \u5DF2\u7D93\u6210\u529F\u88AB Chrome \u6CE8\u5165\u5230\u9019\u500B\u7DB2\u9801\uFF01", window.location.href);
  var MainApp = class {
    // 建構子：初始化所有子系統。允許傳入自訂的 document 與 window，預設為當前網頁的
    constructor(rootDoc = document, rootWin = window) {
      console.log("\u{1F3D7}\uFE0F [MainApp] \u9032\u5165 constructor\uFF01");
      this.rootDoc = rootDoc;
      this.rootWin = rootWin;
      this.isStarted = false;
      this.scanResult = null;
      this.activeListeners = [];
      this.hoverPreviewSessionEnabled = false;
      this.dynamicFrameObserver = null;
      this.dynamicFrameScanTimer = null;
      this.setupBackgroundMessageListener();
      this.setupNativeDialogListener();
      this.registry = new ContextRegistry();
      this.store = new RecorderStore();
      this.domParserService = new DOMParserService({
        mainWindow: rootWin
      });
      if (custom_rules_default && Array.isArray(custom_rules_default.dynamicIdRules)) {
        const ruleStrings = custom_rules_default.dynamicIdRules.map((rule) => rule.pattern);
        this.domParserService.setCustomDynamicIdRules(ruleStrings);
        console.log("\u2705 [MainApp] \u5DF2\u6210\u529F\u8F09\u5165\u81EA\u5B9A\u7FA9\u52D5\u614B ID \u898F\u5247\u6578\u91CF\uFF1A", ruleStrings.length);
      }
      this.command = new PlaywrightCommand();
      this.pageAlias = "page";
      this.codeGenerator = new PlaywrightCodeGenerator(this.domParserService, this.command, this.pageAlias);
      this.navigationTracker = new NavigationTracker({
        rootWindow: this.rootWin,
        onNavigationDetected: (navInfo) => {
          const action = {
            type: "navigate",
            ...navInfo,
            url: navInfo.currentUrl || navInfo.url || window.location.href,
            ts: Date.now()
          };
          const newLine = this.appendGeneratedCode(action);
          this.attachGeneratedCodeToAction(action, newLine);
          const savedAction = this.addGeneratedAction(action, newLine);
          this.syncToGlobalStorage(newLine, savedAction);
        }
      });
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["latestPopupAlias", "recorderStatus"], (result) => {
          if (window.opener && result.latestPopupAlias) {
            this.pageAlias = result.latestPopupAlias;
            this.codeGenerator.pageAlias = this.pageAlias;
            console.log(`\u{1F194} [MainApp] \u8A8D\u9818\u8EAB\u5206\u6210\u529F\uFF01\u6211\u7684 Playwright \u8B8A\u6578\u540D\u7A31\u662F: ${this.pageAlias}`);
            chrome.storage.local.remove("latestPopupAlias");
          }
          if (result.recorderStatus === "recording") {
            this.autoStart();
          }
        });
      }
    }
    // 🌟 貼上這個新方法：專門處理 Background 傳來的跨世界/原生 Popup 事件
    // ==================== myrecorderRestructure/MainApp1.js ====================
    // 將這段函式加在 MainApp1 類別裡面
    // 接收 Background 傳來的原生 Popup 通知
    setupBackgroundMessageListener() {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (this.isStarted && message.type === "NATIVE_POPUP_DETECTED") {
          console.log("\u{1F30D} [MainApp] \u63A5\u6536\u5230 Background \u50B3\u4F86\u7684\u65B0\u8996\u7A97\u60C5\u5831\uFF1A", message.url);
          const action = {
            type: "popup",
            popupId: message.popupId,
            url: message.url,
            ts: Date.now()
          };
          const newLine = this.appendGeneratedCode(action);
          this.attachGeneratedCodeToAction(action, newLine);
          const savedAction = this.addGeneratedAction(action, newLine);
          this.syncToGlobalStorage(newLine, savedAction);
          try {
            chrome.runtime.sendMessage({
              type: "display_code",
              code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
            }).catch(() => {
            });
            chrome.runtime.sendMessage({
              type: "display_useraction",
              action: this.getActions()
            }).catch(() => {
            });
          } catch (e) {
            console.warn("[MainApp] UI \u540C\u6B65\u5931\u6557:", e);
          }
        }
        return false;
      });
    }
    setupNativeDialogListener() {
      this.rootWin.addEventListener("message", (event) => {
        const msg = event.data;
        if (msg?.source !== "RECORDER_PAGE_HOOK") return;
        if (msg.type !== "RECORDER_NATIVE_DIALOG") return;
        if (!this.isStarted) return;
        if (event.source !== this.rootWin && !this.isKnownFrameSource(event.source)) return;
        this.handleUserAction({
          type: "dialog",
          dialogType: msg.dialogType,
          message: msg.message,
          result: msg.result,
          defaultValue: msg.defaultValue,
          frameUrl: msg.frameUrl,
          fromIframe: msg.fromIframe === true,
          sourceWindow: "ctx_page_0",
          ts: Date.now()
        });
      });
    }
    isKnownFrameSource(sourceWindow) {
      if (!sourceWindow || !this.registry || typeof this.registry.getContextsByType !== "function") return false;
      return this.registry.getContextsByType("iframe").some((ctx) => ctx.windowRef === sourceWindow);
    }
    // 統一處理來自各個 Listener (Page/Iframe/Popup) 的互動動作
    handleUserAction(action) {
      if (!this.isStarted) return;
      console.log("[Debug MainApp] \u63A5\u6536\u5230 Action:", action.type, action);
      if (action.type === "dragANDdrop") {
        if (action.isDragStart) {
          const sourcePath = this.domParserService.getOpenSourcePath(
            action.getSourceElement(),
            action.sourceWindow
          );
          console.log("[Debug MainApp] \u9810\u89E3\u6790\u5B8C\u6210\u7684\u8DEF\u5F91:", sourcePath);
          this.store.startDragSession({
            sourceContextId: action.sourceWindow,
            sourceElementInfo: action.getSourceElement(),
            sourcePath
            // 預先存好解析結果
          });
          return;
        }
        if (action.isDrop) {
          const session = this.store.getDragSession();
          if (!session.isDragging) return;
          action.setSourceWindow(session.sourceContextId);
          action.setSourceElement(session.sourceElementInfo);
          action.preParsedSourcePath = session.sourcePath;
          this.store.endDragSession();
        }
      }
      const newLine = this.appendGeneratedCode(action);
      this.attachGeneratedCodeToAction(action, newLine);
      const savedAction = this.addGeneratedAction(action, newLine);
      this.syncToGlobalStorage(newLine, savedAction);
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "display_code",
          code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
        }).catch(() => {
        });
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.getActions()
        }).catch(() => {
        });
      }
    }
    // 啟動錄製器
    // 檔案：myrecorderRestructure/MainApp.js
    start() {
      if (this.isStarted) return this.getState();
      this.hoverPreviewSessionEnabled = true;
      const scanner = new ContextScanner(this.rootDoc, this.rootWin);
      this.scanResult = scanner.scanAllContexts();
      this.registry.registerMany(this.scanResult.contexts);
      this.syncRegistryToStore();
      const allContexts = this.registry.getAllContexts();
      this.codeGenerator.setContexts(allContexts, this.pageAlias);
      const gotoAction = {
        type: "navigate",
        url: window.location.href,
        ts: Date.now()
      };
      const initialBatchCode = [];
      const gotoResult = this.codeGenerator.generate(gotoAction);
      if (gotoResult) {
        initialBatchCode.push(gotoResult);
        this.command.appendCode(gotoResult);
        this.attachGeneratedCodeToAction(gotoAction, {
          code: [gotoResult],
          isReplace: false
        });
        this.store.addAction(gotoAction);
      }
      if (initialBatchCode.length > 0) {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: "APPEND_RECORD_DATA",
            newCode: initialBatchCode,
            // 傳送陣列
            isReplace: false,
            newAction: gotoAction
            // 關聯最後一個動作
          }).catch(() => {
          });
        }
      }
      this.isStarted = true;
      this.store.setRecording(true);
      this.bindListenersToContexts(allContexts);
      this.startDynamicFrameWatcher();
      return this.getState();
    }
    // 🌟 關鍵新增：專門給新分頁(Popup)或重新整理後的頁面「自動接續錄製」使用
    autoStart() {
      if (this.isStarted) return;
      this.hoverPreviewSessionEnabled = false;
      console.log(`\u{1F680} [MainApp] \u5075\u6E2C\u5230\u7CFB\u7D71\u6B63\u5728\u9304\u88FD\u4E2D\uFF0C\u81EA\u52D5\u555F\u52D5\u76E3\u807D\u5668\uFF01(\u8EAB\u5206: ${this.pageAlias})`);
      const scanner = new ContextScanner(this.rootDoc, this.rootWin);
      this.scanResult = scanner.scanAllContexts();
      this.registry.registerMany(this.scanResult.contexts);
      this.syncRegistryToStore();
      const allContexts = this.registry.getAllContexts();
      this.codeGenerator.setContexts(allContexts, this.pageAlias);
      this.isStarted = true;
      this.store.setRecording(true);
      this.bindListenersToContexts(allContexts);
      this.startDynamicFrameWatcher();
    }
    // 停止錄製器
    stop() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isRecordingSessionActive: false });
      }
      if (!this.isStarted) return this.getState();
      this.stopDynamicFrameWatcher();
      this.navigationTracker.stop();
      this.activeListeners.forEach((l) => {
        if (typeof l.setRecordingState === "function") {
          l.setRecordingState(false, { allowHoverPreview: false });
        } else {
          l.isRecording = false;
          l.hoverInspector?.hide?.();
          l.lastPreviewTarget = null;
        }
      });
      this.store.setRecording(false);
      this.isStarted = false;
      this.hoverPreviewSessionEnabled = false;
      return this.getState();
    }
    startDynamicFrameWatcher() {
      if (this.dynamicFrameObserver || !this.rootDoc?.documentElement) return;
      if (typeof MutationObserver === "undefined") return;
      const hasFrameNode = (node) => {
        if (!node) return false;
        if (node.nodeType === 1 && node.matches?.("iframe, frame")) return true;
        return !!node.querySelector?.("iframe, frame");
      };
      this.dynamicFrameObserver = new MutationObserver((mutations) => {
        const shouldRescan = mutations.some((mutation) => {
          if (mutation.type === "childList") {
            return Array.from(mutation.addedNodes || []).some(hasFrameNode);
          }
          if (mutation.type === "attributes") {
            return mutation.target?.matches?.("iframe, frame");
          }
          return false;
        });
        if (shouldRescan) {
          this.scheduleDynamicFrameRescan("iframe mutation");
        }
      });
      this.dynamicFrameObserver.observe(this.rootDoc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"]
      });
    }
    stopDynamicFrameWatcher() {
      if (this.dynamicFrameObserver) {
        this.dynamicFrameObserver.disconnect();
        this.dynamicFrameObserver = null;
      }
      if (this.dynamicFrameScanTimer) {
        clearTimeout(this.dynamicFrameScanTimer);
        this.dynamicFrameScanTimer = null;
      }
    }
    scheduleDynamicFrameRescan(reason = "dynamic iframe") {
      if (!this.isStarted) return;
      clearTimeout(this.dynamicFrameScanTimer);
      this.dynamicFrameScanTimer = setTimeout(() => {
        this.dynamicFrameScanTimer = null;
        this.rescanAndBindDynamicFrames(reason);
      }, 800);
    }
    rescanAndBindDynamicFrames(reason = "dynamic iframe") {
      if (!this.isStarted) return;
      console.log("[Debug MainApp] rescan contexts for dynamic iframe", { reason });
      const scanner = new ContextScanner(this.rootDoc, this.rootWin);
      this.scanResult = scanner.scanAllContexts();
      this.registry.registerMany(this.scanResult.contexts);
      this.syncRegistryToStore();
      this.refreshGeneratorContexts();
      this.bindListenersToContexts(this.registry.getAllContexts());
    }
    // 完全重置錄製器 (清除所有資料)
    reset() {
      this.stop();
      this.registry.clear();
      this.store.reset();
      if (typeof this.command.clearCode === "function") {
        this.command.clearCode();
      } else {
        this.command = new PlaywrightCommand();
        this.codeGenerator.command = this.command;
      }
      this.scanResult = null;
      this.activeListeners = [];
      this.isStarted = false;
      return this.getState();
    }
    // 處理新彈出的視窗 (Popup)
    // 處理新彈出的視窗 (Popup)
    // 處理新彈出的視窗 (Popup)
    handleNewPopup(popupData) {
      console.log("[pop up detected]");
      const action = {
        type: "popup",
        popupId: popupData.popupId,
        url: popupData.popupUrl || "",
        ts: Date.now()
      };
      this.store.setPendingPopup(popupData);
      const newLine = this.appendGeneratedCode(action);
      this.attachGeneratedCodeToAction(action, newLine);
      const savedAction = this.addGeneratedAction(action, newLine);
      this.syncToGlobalStorage(newLine, savedAction);
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "display_code",
          code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
        }).catch(() => {
        });
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.getActions()
        }).catch(() => {
        });
      }
    }
    // 將 Registry 裡的環境資料同步到 Store 中集中管理
    syncRegistryToStore() {
      this.store.registerContexts(this.registry.getAllContexts());
    }
    // 核心邏輯：將「動作資料」轉譯為「程式碼字串」並存起來
    // 以下為各種 Getter 方法，用於提供對外取得內部狀態的介面
    // 取得錄製到的所有動作列表
    // 取得錄製到的所有動作列表 (安全過濾版)
    getActions() {
      return this.store.getActions().map((act) => {
        return this.decorateActionForDisplay(act);
      });
    }
    decorateActionForDisplay(action) {
      const safeAct = { ...action };
      delete safeAct.source;
      delete safeAct.target;
      safeAct.displaySourceWindow = this.getDisplayContextName(safeAct.sourceWindow);
      safeAct.displayTargetWindow = this.getDisplayContextName(safeAct.targetWindow);
      return safeAct;
    }
    getDisplayContextName(contextId) {
      if (!contextId) return "";
      if (this.codeGenerator && typeof this.codeGenerator._getContextPrefix === "function") {
        return this.codeGenerator._getContextPrefix(contextId);
      }
      return contextId;
    }
    // 取得產生的完整 Playwright 程式碼字串
    getGeneratedCode() {
      return this.command.getCode();
    }
    // 取得整個 App 的綜合狀態 (通常打包傳給 Popup 介面渲染使用)
    getState() {
      return {
        isStarted: this.isStarted,
        isRecording: this.store.isRecording(),
        actions: this.store.getActions(),
        currentAction: this.store.getCurrentAction(),
        contexts: this.store.getAllContexts(),
        generatedCode: this.command.getCode()
      };
    }
    // 取得供開發者除錯用的詳細狀態
    debugState() {
      return {
        scanResult: this.scanResult,
        registry: this.registry.getAllContexts(),
        store: this.store.getState(),
        code: this.command.getCode(),
        isStarted: this.isStarted
      };
    }
    // [新增] 動態為掃描到的每一個 Context 掛載對應的事件監聽器
    // 動態為掃描到的每一個 Context 掛載對應的事件監聽器
    bindListenersToContexts(contexts) {
      contexts.forEach((ctx) => {
        if (this.store.hasListener(ctx.contextId)) return;
        if (ctx.type === "iframe" && !ctx.documentRef) {
          const frameId = ctx.frameElement?.id || "(no id)";
          const frameName = ctx.frameElement?.name || "(no name)";
          const frameSrc = ctx.frameElement?.getAttribute?.("src") || "(no src)";
          const resolvedSrc = ctx.frameElement?.src || "(no resolved src)";
          console.warn(
            `[Debug MainApp] unable to bind iframe listener: contextId=${ctx.contextId}, id=${frameId}, name=${frameName}, selector=${ctx.frameSelector || "(no selector)"}, src=${frameSrc}, resolvedSrc=${resolvedSrc}`
          );
          console.warn("[Debug MainApp] skip iframe listener because documentRef is null", {
            contextId: ctx.contextId,
            locator: ctx.frameSelector,
            url: ctx.url,
            frameId,
            frameName,
            frameSrc: ctx.frameElement?.getAttribute?.("src") || null,
            resolvedSrc: ctx.frameElement?.src || null
          });
          return;
        }
        let listener = null;
        const listenerContexts = {
          contextId: ctx.contextId,
          // 如果是主頁或彈出視窗，就把它的 windowRef 當作 mainWindow
          mainWindow: ctx.type === "page" || ctx.type === "popup" ? ctx.windowRef : this.rootWin,
          // 如果是 iframe，就把它的 windowRef 給 iframeWindow
          iframeWindow: ctx.type === "iframe" ? ctx.windowRef : null
        };
        if (ctx.type === "page" || ctx.type === "popup") {
          listener = new OuterEventListener(
            listenerContexts,
            this.domParserService,
            (action) => this.handleUserAction(action)
          );
        } else if (ctx.type === "iframe") {
          listener = new IframeEventListener(
            listenerContexts,
            this.domParserService,
            (action) => this.handleUserAction(action)
          );
        }
        if (listener) {
          listener.init();
          if (typeof listener.setRecordingState === "function") {
            listener.setRecordingState(this.isStarted, {
              allowHoverPreview: this.hoverPreviewSessionEnabled === true
            });
          } else {
            listener.isRecording = this.isStarted;
          }
          this.activeListeners.push(listener);
          this.store.registerListener(ctx.contextId);
        }
      });
      const activeIframes = this.registry.getContextsByType("iframe").filter((iframeCtx) => this.store.hasListener(iframeCtx.contextId)).map((iframeCtx) => ({
        contextId: iframeCtx.contextId,
        locator: iframeCtx.frameSelector,
        url: iframeCtx.url,
        hasDocument: !!iframeCtx.documentRef
      }));
      console.table(activeIframes);
    }
    appendGeneratedCode(action) {
      this.refreshGeneratorContexts();
      const result = this.codeGenerator.generate(action);
      console.log("[Debug MainApp] appendGeneratedCode result", {
        actionType: action?.type || null,
        sourceWindow: action?.sourceWindow || null,
        result
      });
      if (!result) return null;
      let codeToReturn = result;
      let isReplace = false;
      if (typeof result === "object" && result.isReplace) {
        codeToReturn = result.code;
        isReplace = true;
        this.command.code.pop();
        if (Array.isArray(codeToReturn)) {
          codeToReturn.forEach((l) => this.command.codeSetter(l));
        }
      } else {
        if (typeof this.command.codeSetter === "function") {
          this.command.codeSetter(codeToReturn);
        } else {
          this.command.appendCode(codeToReturn);
        }
      }
      console.log("[Debug MainApp] appendGeneratedCode stored", {
        codeToReturn,
        isReplace,
        commandCode: this.command.code
      });
      return { code: codeToReturn, isReplace };
    }
    attachGeneratedCodeToAction(action, codeResult) {
      if (!action || !codeResult || !codeResult.code) return;
      const lines = Array.isArray(codeResult.code) ? codeResult.code : [codeResult.code];
      action.generatedCodeLines = lines;
      action.generatedCodeLine = lines[lines.length - 1] || "";
      action.generatedCodeReplacesPrevious = codeResult.isReplace === true;
    }
    addGeneratedAction(action, codeResult) {
      let replacedAction = null;
      if (codeResult?.isReplace && typeof this.store.removeLastAction === "function") {
        replacedAction = this.store.removeLastAction();
      }
      if (replacedAction) {
        action.triggerAction = this.decorateActionForDisplay(replacedAction);
      }
      return this.store.addAction(action);
    }
    setHoverPreviewSessionEnabled(enabled) {
      this.hoverPreviewSessionEnabled = enabled === true;
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set({ hoverPreviewSessionEnabled: this.hoverPreviewSessionEnabled });
        }
      } catch (error) {
        console.warn("[MainApp] Unable to persist hover preview session state", error);
      }
      this.activeListeners.forEach((listener) => {
        if (typeof listener.setHoverPreviewSessionEnabled === "function") {
          listener.setHoverPreviewSessionEnabled(this.hoverPreviewSessionEnabled);
        }
      });
    }
    refreshGeneratorContexts() {
      const allContexts = this.registry.getAllContexts();
      this.codeGenerator.setContexts(allContexts, this.pageAlias);
    }
    // 🌟 關鍵新增：統一處理增量同步到 Background 的機制
    syncToGlobalStorage(codeResult, action) {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
      const safeAct = this.decorateActionForDisplay(action);
      chrome.runtime.sendMessage({
        type: "APPEND_RECORD_DATA",
        newCode: codeResult ? codeResult.code : null,
        isReplace: codeResult ? codeResult.isReplace : false,
        // 傳遞覆寫訊號
        newAction: safeAct
      }).catch(() => {
      });
      console.log("[Debug MainApp] syncToGlobalStorage sent", {
        newCode: codeResult ? codeResult.code : null,
        isReplace: codeResult ? codeResult.isReplace : false,
        actionType: safeAct?.type || null,
        sourceWindow: safeAct?.sourceWindow || null
      });
    }
  };

  // setupRecorderBridge.js
  function setupRecorderBridge({ MainApp: MainApp2 }) {
    let app = null;
    let isRecording = false;
    function ensureApp() {
      if (!app) {
        app = new MainApp2(document, window);
      }
      return app;
    }
    function getGeneratedCodeLines() {
      if (!app) return [];
      const code = app.getGeneratedCode();
      if (Array.isArray(code)) {
        return code;
      }
      return typeof code === "string" ? code.split("\n") : [];
    }
    function pushActionsAndCode() {
      if (!app) return;
      const localActions = typeof app.getActions === "function" ? app.getActions() : [];
      const localCode = getGeneratedCodeLines();
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["globalActions", "globalCode"], (result) => {
          const historyActions = result.globalActions || [];
          const historyCode = result.globalCode || [];
          let mergedActions = localActions;
          let mergedCode = localCode;
          if (localActions.length < historyActions.length && isRecording) {
            mergedActions = [...historyActions, ...localActions.slice(-1)];
            mergedCode = [...historyCode, ...localCode.slice(-1)];
            if (typeof app.setActions === "function") app.setActions(mergedActions);
          }
          chrome.storage.local.set({
            globalActions: mergedActions,
            globalCode: mergedCode
          });
          chrome.runtime.sendMessage({
            type: "RECORDER_ACTIONS_UPDATE",
            action: mergedActions
          });
          chrome.runtime.sendMessage({
            type: "RECORDER_CODE_UPDATE",
            code: mergedCode
          });
        });
      }
    }
    function startRecording() {
      const instance = ensureApp();
      if (typeof instance.setHoverPreviewSessionEnabled === "function") {
        instance.setHoverPreviewSessionEnabled(true);
      }
      if (!isRecording) {
        instance.start();
        isRecording = true;
        chrome.runtime.sendMessage({
          type: "RECORDER_STATUS_UPDATE",
          status: "recording"
        });
      }
    }
    function stopRecording() {
      if (!app) return;
      if (typeof app.stop === "function") {
        app.stop();
      }
      isRecording = false;
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ hoverPreviewSessionEnabled: false });
      }
      chrome.runtime.sendMessage({
        type: "RECORDER_STATUS_UPDATE",
        status: "idle"
      });
    }
    function clearRecording() {
      if (app && typeof app.reset === "function") {
        app.reset();
      }
      chrome.runtime.sendMessage({ type: "RECORDER_ACTIONS_UPDATE", action: [] });
      chrome.runtime.sendMessage({ type: "RECORDER_CODE_UPDATE", code: [] });
      chrome.runtime.sendMessage({ type: "RECORDER_STATUS_UPDATE", status: "idle" });
      isRecording = false;
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ hoverPreviewSessionEnabled: false });
      }
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message?.type) return;
      if (window !== window.top) return;
      if (message.type === "START_RECORDING") {
        startRecording();
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "STOP_RECORDING") {
        stopRecording();
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "CLEAR_RECORDING") {
        clearRecording();
        sendResponse({ ok: true });
        return;
      }
    });
    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data || event.data.source !== "RECORDER_EXTENSION") return;
      if (window !== window.top) return;
      if (event.data.type === "START_RECORDING") startRecording();
      if (event.data.type === "STOP_RECORDING") stopRecording();
      if (event.data.type === "CLEAR_RECORDING") clearRecording();
    });
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      if (window === window.top) {
        chrome.storage.local.get(["recorderStatus"], (result) => {
          console.log(`\u{1F309} [Bridge] \u9802\u5C64\u8996\u7A97\u555F\u52D5\uFF0C\u6AA2\u67E5\u5168\u57DF\u72C0\u614B:`, result);
          if (result && result.recorderStatus === "recording") {
            console.log("\u{1F30D} [Bridge] \u5075\u6E2C\u5230\u5168\u57DF\u9304\u88FD\u72C0\u614B\u70BA ON\uFF0C\u6E96\u5099\u81EA\u52D5\u559A\u9192\uFF01");
            const autoStart = () => {
              console.log("\u23F3 [Bridge] DOM \u6E96\u5099\u5B8C\u7562\uFF0C\u5EFA\u7ACB MainApp \u8B93\u5B83\u63A5\u7BA1\u81EA\u52D5\u555F\u52D5\uFF01");
              ensureApp();
              isRecording = true;
            };
            if (document.readyState === "complete" || document.readyState === "interactive") {
              setTimeout(autoStart, 1e3);
            } else {
              window.addEventListener("load", () => setTimeout(autoStart, 1e3));
            }
          } else {
            console.log("\u{1F4A4} [Bridge] \u672A\u5075\u6E2C\u5230\u9304\u88FD\u72C0\u614B\uFF0C\u7B49\u5F85\u624B\u52D5\u555F\u52D5\u3002");
          }
        });
      }
    }
  }

  // index.js
  setupRecorderBridge({ MainApp });
})();
/*! Bundled license information:

react-is/cjs/react-is.development.js:
  (** @license React v17.0.2
   * react-is.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
