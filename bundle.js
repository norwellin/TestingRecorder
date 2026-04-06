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

  // ../../../node_modules/optimal-select/lib/adapt.js
  var require_adapt = __commonJS({
    "../../../node_modules/optimal-select/lib/adapt.js"(exports, module) {
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
    "../../../node_modules/optimal-select/lib/match.js"(exports, module) {
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

  // ../../../node_modules/optimal-select/lib/optimize.js
  var require_optimize = __commonJS({
    "../../../node_modules/optimal-select/lib/optimize.js"(exports, module) {
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

  // ../../../node_modules/unique-selector/lib/getID.js
  var require_getID = __commonJS({
    "../../../node_modules/unique-selector/lib/getID.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getClasses.js
  var require_getClasses = __commonJS({
    "../../../node_modules/unique-selector/lib/getClasses.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getCombinations.js
  var require_getCombinations = __commonJS({
    "../../../node_modules/unique-selector/lib/getCombinations.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getAttributes.js
  var require_getAttributes = __commonJS({
    "../../../node_modules/unique-selector/lib/getAttributes.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/isElement.js
  var require_isElement = __commonJS({
    "../../../node_modules/unique-selector/lib/isElement.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getNthChild.js
  var require_getNthChild = __commonJS({
    "../../../node_modules/unique-selector/lib/getNthChild.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getTag.js
  var require_getTag = __commonJS({
    "../../../node_modules/unique-selector/lib/getTag.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/isUnique.js
  var require_isUnique = __commonJS({
    "../../../node_modules/unique-selector/lib/isUnique.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/getParents.js
  var require_getParents = __commonJS({
    "../../../node_modules/unique-selector/lib/getParents.js"(exports) {
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

  // ../../../node_modules/unique-selector/lib/index.js
  var require_lib2 = __commonJS({
    "../../../node_modules/unique-selector/lib/index.js"(exports) {
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
      function getAllSelectors(el, selectors, attributesToIgnore) {
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
        var elementSelectors = getAllSelectors(element, selectorTypes, attributesToIgnore);
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
        const frameWin = this.safeGetFrameWindow(frameEl);
        const frameDoc = this.safeGetFrameDocument(frameWin);
        const frameContext = {
          contextId: this.createContextId("iframe"),
          type: "iframe",
          name: `${parentContext.name}_iframe_${index}`,
          parentContextId: parentContext.contextId,
          openerContextId: null,
          windowRef: frameWin,
          documentRef: frameDoc,
          frameElement: frameEl,
          frameSelector: this.buildFrameSelector(frameEl, index),
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
      const tagName = (frameEl.tagName || "iframe").toLowerCase();
      if (frameEl.id) {
        return `${tagName}#${escapeCss(frameEl.id)}`;
      }
      if (frameEl.name) {
        return `${tagName}[name="${escapeCss(frameEl.name)}"]`;
      }
      const title = frameEl.getAttribute("title");
      if (title) {
        return `${tagName}[title="${escapeCss(title)}"]`;
      }
      const testId = frameEl.getAttribute("data-testid");
      if (testId) {
        return `${tagName}[data-testid="${escapeCss(testId)}"]`;
      }
      const src = frameEl.getAttribute("src");
      if (src) {
        return `${tagName}[src="${escapeCss(src)}"]`;
      }
      return `${tagName}:nth-of-type(${index + 1})`;
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
    safeGetFrameDocument(frameWin) {
      try {
        return frameWin?.document || null;
      } catch (error) {
        console.warn("\u7121\u6CD5\u53D6\u5F97 iframe.document\uFF0C\u53EF\u80FD\u8DE8\u7DB2\u57DF\u6216\u53D7\u9650\u5236", error);
        return null;
      }
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
    startDragSession({ sourceContextId = null, sourceElementInfo = null } = {}) {
      this.state.dragSession = {
        isDragging: true,
        sourceContextId,
        sourceElementInfo,
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
      const self = this;
      history.pushState = function(...args) {
        const previousUrl = self.getCurrentUrl();
        const result = self.originalPushState.apply(history, args);
        self.checkNavigation({
          source: "pushState",
          previousUrlCandidate: previousUrl
        });
        return result;
      };
      history.replaceState = function(...args) {
        const previousUrl = self.getCurrentUrl();
        const result = self.originalReplaceState.apply(history, args);
        self.checkNavigation({
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
  function testSelector(elements, selector, root) {
    const result = Array.from(sanitizeRoot(root, elements[0]).querySelectorAll(selector));
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
  function isWordLikeClassName(className) {
    if (!WORD_LIKE_PATTERN.test(className)) {
      return false;
    }
    if (className.includes("_") && !className.includes("__")) {
      return false;
    }
    if (/^(css|sc|jsx|emotion|makeStyles|MuiButton|MuiBox)-/i.test(className)) {
      return false;
    }
    const words = className.split(/--|__|[-]|(?<=[a-z])(?=[A-Z])/).filter((word) => word.length > 0);
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
      filteredClassNames = classNames.filter((className) => {
        const selector = `.${sanitizeSelectorItem(className)}`;
        if (matchWhitelist(selector)) {
          return true;
        }
        return isWordLikeClassName(className);
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
    const selector = `#${sanitizeSelectorItem(id)}`;
    const rootNode = element.getRootNode({ composed: false });
    return !INVALID_ID_RE.test(id) && testSelector([element], selector, rootNode) ? [selector] : [];
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
    for (const selector of selectorTypeCombinationsGenerator(selectors_list, options)) {
      if (!yieldedSelectors.has(selector)) {
        yieldedSelectors.add(selector);
        yield selector;
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
    const combinations = combineBetweenSelectors ? getPowerSet(selectors, { maxResults: maxCandidates }) : selectors.map((item) => [item]);
    return includeTag ? combinations.map(addTagTypeIfNeeded) : combinations;
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
      ...selectors.map((selector) => rootSelector + OPERATOR.DESCENDANT + selector),
      ...selectors.map((selector) => rootSelector + OPERATOR.CHILD + selector)
    ];
  }
  function* candidatesGenerator(selectors, rootSelector) {
    if (rootSelector === "") {
      yield* selectors;
    } else {
      for (const selector of selectors) {
        yield* generateCandidateCombinations([selector], rootSelector);
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
        const { foundElements, selector } = item;
        foundAny = true;
        if (testSelector(elements, selector, root)) {
          yield selector;
        } else {
          currentRoot = foundElements[0];
          partialSelector = selector;
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
    for (const selector of selectorGenerator({
      elements,
      options,
      root,
      rootSelector: ""
    })) {
      yield selector;
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
  var import_unique_selector = __toESM(require_lib2());
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
        ByDomPath: { csspath: null }
      };
      this.weight = { WL: 0.4, Wc: 0.6, Wa: 1, Wcl: 1, Wt: 1, Wn: 3 };
    }
    getDocumentByWindowType(windowType) {
      if (windowType === "iframe") {
        return this.iframeWindow?.document || null;
      }
      return this.mainWindow?.document || document;
    }
    getOpenSourcePath(e, sourceWin = null) {
      if (!e) return [null, null, null];
      this.cleanInfo();
      this.setInfo(e);
      this.clearPlaywrightObj();
      let isUniqueObj = { ByTitle: false, ByDomPath: false, ByText: false };
      let doc = this.currentDoc;
      let cssatt, optPri, uniPri;
      if (doc !== this.mainWindow.document) {
        cssatt = ["tag", "class", "attribute", "nthchild"];
        optPri = ["tag", "class", "attribute"];
        uniPri = ["Tag", "Class", "Attributes", "NthChild"];
      } else {
        cssatt = ["class", "attribute", "tag", "nthchild"];
        optPri = ["class", "attribute", "tag"];
        uniPri = ["Class", "Attributes", "Tag", "NthChild"];
      }
      let csskey = 0, optkey = 0, unikey = 0;
      const selector = getCssSelector(e, { selectors: cssatt, blacklist: ["id"], root: doc });
      if (this.findUnique(selector, doc)) {
        isUniqueObj.ByDomPath = true;
        csskey = 1;
      }
      let opt_selector = (0, import_optimal_select.select)(e, { root: doc, priority: optPri, ignore: { id: true } });
      if (this.findUnique(opt_selector, doc)) {
        isUniqueObj.ByDomPath = true;
        optkey = 1;
      }
      let dom_selector = (0, import_unique_selector.default)(e, { selectorTypes: uniPri });
      if (this.findUnique(dom_selector, doc)) {
        isUniqueObj.ByDomPath = true;
        unikey = 1;
      }
      let csspath = this.analyzeCssPath(selector, csskey);
      let optpath = this.analyzeCssPath(opt_selector, optkey);
      let unipath = this.analyzeCssPath(dom_selector, unikey);
      this.playwrightObj.ByDomPath.csspath = this.bestDomPath([csspath, optpath, unipath]);
      if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
        this.playwrightObj.ByTitle.title = this.allAttributeInfo.title;
        isUniqueObj.ByTitle = true;
      }
      if (this.checkUniqueByText(this.allAttributeInfo.text)) {
        this.playwrightObj.ByText.text = this.allAttributeInfo.text;
        isUniqueObj.ByText = true;
      }
      let newObj = {};
      for (let i = 0; i < this.priSize; i++) {
        let key = this.priority[i];
        if (isUniqueObj[key]) newObj[i] = { funName: key, obj: this.playwrightObj[key] };
      }
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
      let targetDoc = this.currentDoc || el.ownerDocument || document;
      let containerEl = null;
      for (const sel of this.DIALOG_SELECTORS) {
        containerEl = el.closest(sel);
        if (containerEl) break;
      }
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
      return isUnique;
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
      if (!this.currentDoc) return false;
      return this.currentDoc.querySelectorAll(path).length === 1;
    }
    checkUniqueByRole(role, name, roleIndex) {
      if (!role || !name || !this.currentDoc) return { isUnique: false, total: 0 };
      const elements = Array.from(this.currentDoc.querySelectorAll(`[role="${role}"]`));
      const matched = elements.filter((el) => el.innerText.trim() === name);
      return matched.length === 1;
    }
    checkUniqueByTitle(title) {
      if (!this.currentDoc) return false;
      const elements = this.currentDoc.querySelectorAll(`[title="${title}"]`);
      return elements.length === 1;
    }
    checkUniqueByDom(path) {
      if (!this.currentDoc) return false;
      return this.currentDoc.querySelectorAll(path).length === 1;
    }
    checkUniqueByText(text) {
      if (!this.currentDoc) return false;
      const elements = Array.from(this.currentDoc.querySelectorAll("*"));
      const matched = elements.filter((el) => el.textContent.trim() === text);
      return matched.length === 1;
    }
    // 設定當前解析元素的屬性，並動態綁定其所屬的 Document
    setInfo(el) {
      if (!el) return;
      this.currentDoc = el.ownerDocument || document;
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
      let sourcepath = null;
      let targetpath = null;
      let inputText = action.inputText || "default";
      let inputKey = action.keyboard || "default";
      let selectLabel = action.selectedText || "default";
      if (typeof action.getSourceElement === "function") {
        sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type);
        if (action.type === "dragANDdrop" && typeof action.getTargetElement === "function") {
          targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
        }
        if (action.type === "input" && !action.inputText) {
          const srcEl = action.getSourceElement();
          inputText = srcEl ? srcEl.innerText || srcEl.value || "" : "";
        }
        if (action.type === "change" && !action.selectedText) {
          const srcEl = action.getSourceElement();
          if (srcEl && srcEl.options && srcEl.selectedIndex >= 0) {
            selectLabel = srcEl.options[srcEl.selectedIndex]?.text || "";
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
      } else if (action.type === "input") {
        generatedCode = this.inputSetter(action, sourcepath, sourceWindow, inputText);
      } else if (action.type === "keyboard") {
        generatedCode = this.keyboardSetter(inputKey, sourceWindow);
      } else if (action.type === "change") {
        generatedCode = this.changeSetter(action, sourcepath, selectLabel, sourceWindow);
      }
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
    // 3. 解析 ContextId 為 Playwright 的操作變數前綴
    // 3. 解析 ContextId 為 Playwright 的操作變數前綴
    _getContextPrefix(winVar) {
      if (this.contextAliasMap && this.contextAliasMap.has(winVar)) {
        return this.contextAliasMap.get(winVar);
      }
      if (typeof winVar === "string" && winVar.startsWith("ctx_")) {
        const autoAlias = winVar.replace("ctx_", "");
        return autoAlias === "page_0" ? this.pageAlias : autoAlias;
      }
      if (!winVar || winVar === "page" || winVar === "ctx_page_0") {
        return this.pageAlias;
      }
      return winVar;
    }
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js
    declareContexts(contexts, rootAlias) {
      if (!contexts || !Array.isArray(contexts)) return [];
      const generatedDeclarations = [];
      contexts.forEach((ctx) => {
        let alias = "";
        if (!ctx.contextId || ctx.contextId === "ctx_page_0") {
          alias = rootAlias;
        } else {
          alias = ctx.contextId.replace(/^ctx_/, "");
        }
        this.contextAliasMap.set(ctx.contextId, alias);
      });
      contexts.forEach((ctx) => {
        if (ctx.type === "iframe") {
          const alias = this.contextAliasMap.get(ctx.contextId);
          const parentAlias = this.contextAliasMap.get(ctx.parentContextId) || rootAlias;
          const selector = ctx.frameSelector || `iframe:nth-of-type(1)`;
          const declaration = `const ${alias} = ${parentAlias}.frameLocator('${this.replacePath(selector)}');`;
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
        case "ByRole":
          if (obj.index <= 0) return `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}" })`;
          return `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}" }).nth(${obj.index})`;
        case "ByTitle":
          return `${winPrefix}.getByTitle("${obj.title}", { exact: true })`;
        case "ByText":
          return `${winPrefix}.getByText("${obj.text}", { exact: true })`;
        case "ByDomPath":
          return `${winPrefix}.locator("${this.replacePath(obj.csspath)}")`;
        default:
          return `${winPrefix}.locator("unknown")`;
      }
    }
    changeSetter(action, sourcepath, selectedValue, sourceWindow) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      let code = "";
      if (best.funName === "ByDomPath") {
        code = `await ${winPrefix}.locator('${this.replacePath(best.obj.csspath)}').selectOption({ label: ${JSON.stringify(selectedValue)} });`;
      } else {
        code = `await ${this._buildLocatorString(winPrefix, best)}.selectOption({ label: ${JSON.stringify(selectedValue)} });`;
      }
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return code;
    }
    keyboardSetter(inputKey, sourceWindow) {
      const winPrefix = this._getContextPrefix(sourceWindow);
      if (inputKey === "Backspace") {
        return `await ${winPrefix}.keyboard.press('Backspace');`;
      }
      return `await ${winPrefix}.keyboard.press('${inputKey}');`;
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
      if (best.funName === "ByDomPath") {
        return `await ${winPrefix}.click("${this.replacePath(best.obj.csspath)}");`;
      }
      return `await ${locator}.click();`;
    }
    doubleClickSetter(action, sourcepath, sourceWindow) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      if (best.funName === "ByDomPath") {
        return `await ${winPrefix}.dblclick("${this.replacePath(best.obj.csspath)}");`;
      }
      return `await ${locator}.dblclick();`;
    }
    inputSetter(action, sourcepath, sourceWindow, inputText) {
      const best = this._getBestPath(sourcepath);
      if (!best) return null;
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source");
      return `await ${locator}.fill('${inputText}');`;
    }
    // 5. 將原本對全域陣列 Index 的更新，改為直接對傳入的 Action 實體屬性做更新 (解耦)
    updateUserActionDB(action, funName, obj, targetType = "source") {
      if (!action || typeof action.setSourceMethod !== "function") return;
      let data = "";
      if (funName === "ByTitle") data = obj.title;
      else if (funName === "ByText") data = obj.text;
      else if (funName === "ByDomPath") data = obj.csspath;
      if (targetType === "drop" || targetType === "target") {
        action.setTargetMethod(funName);
        action.setTargetData(data);
      } else {
        action.setSourceMethod(funName);
        action.setSourceData(data);
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
      this.isRecording = false;
    }
    init() {
      if (!this.mainWindow || !this.mainDocument) {
        console.warn("mainWindow \u4E0D\u5B58\u5728\uFF0C\u8DF3\u904E OuterEventListener.init()");
        return;
      }
      this.mainDocument.addEventListener("click", this.clickHandler.bind(this), true);
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
    }
    messageHandler(e) {
      const msg = e.data;
      switch (msg.type) {
        case "START_RECORDING":
          this.isRecording = true;
          break;
        case "STOP_RECORDING":
          this.isRecording = false;
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
      if (extraData.inputText) action.setInputText(extraData.inputText);
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
      if (!this.isRecording) return;
      const tag = e.target.tagName.toLowerCase();
      const type = e.target.getAttribute("type");
      const isTextInput = tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type)) || tag === "textarea" || e.target.isContentEditable;
      if (!isTextInput) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.currentHoveredElement = e.target;
        this.dispatchAction("input", this.currentHoveredElement, null, {
          inputText: e.target.value || e.target.innerText
        });
      }, 500);
    }
    changeHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      const tag = e.target.tagName;
      const type = e.target.type;
      const isSelect = tag === "SELECT";
      const isCheckbox = tag === "INPUT" && type === "checkbox";
      if (!isSelect && !isCheckbox) return;
      const action_type = isSelect ? "change" : "checkBox";
      this.dispatchAction(action_type, e.target);
    }
    keydownHandler(e) {
      if (!this.isRecording) return;
      if (e.key === "Backspace") {
        this.currentHoveredElement = e.target;
        this.dispatchAction("keyboard", this.currentHoveredElement, null, {
          keyboard: e.key
        });
      }
    }
    dblClickHandler(e) {
      if (!this.isRecording) return;
      this.currentHoveredElement = e.target;
      this.dispatchAction("dbclick", this.currentHoveredElement);
    }
    dragStartHandler(e) {
      if (!this.isRecording) return;
      const target = e.target;
      if (!target) return;
      if (target.getAttribute("draggable") === "true") {
        this.dispatchAction("dragANDdrop", target, null, { isDragStart: true });
      }
    }
    clickHandler(e) {
      if (!this.isRecording) return;
      if (e.target.tagName === "LABEL" || e.target.tagName === "SELECT") return;
      let clickable = e.target;
      if (e.target.tagName === "INPUT") {
        const label = e.target.parentElement?.querySelector(`label[for="${e.target.id}"]`);
        clickable = label || e.target.closest(`button, a, [role="button"], [onclick], i, svg`) || e.target;
      } else {
        clickable = e.target.closest(`button, a, [role="button"], [onclick], i, svg`) || e.target;
      }
      this.currentHoveredElement = clickable;
      this.dispatchAction("click", this.currentHoveredElement);
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
      this.dragStart = { x: 0, y: 0 };
      this.isDragging = false;
      this.DRAG_THRESHOLD = 5;
      this.dragSource = null;
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      this.isRecording = false;
    }
    init() {
      if (!this.iframeWindow || !this.iframeDocument) {
        console.warn("iframe \u4E0D\u5B58\u5728\uFF0C\u8DF3\u904E IframeEventListener.init()");
        return;
      }
      this.iframeDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this));
      this.iframeDocument.addEventListener("mousedown", this.mousedownHandler.bind(this));
      this.iframeDocument.addEventListener("mouseup", this.mouseupHandler.bind(this));
      this.iframeDocument.addEventListener("input", this.inputHandler.bind(this));
      this.iframeWindow.addEventListener("drop", this.dropHandler.bind(this));
      this.iframeDocument.addEventListener("click", this.clickHandler.bind(this), true);
      this.iframeDocument.addEventListener("dragover", (e) => {
        if (this.isRecording) e.preventDefault();
      });
      this.iframeWindow.addEventListener("message", this.messageHandler.bind(this));
    }
    messageHandler(e) {
      const msg = e.data;
      switch (msg.type) {
        case "START_RECORDING":
          this.isRecording = true;
          break;
        case "STOP_RECORDING":
          this.isRecording = false;
          break;
      }
    }
    // 2. 建立統一的派發 Action 方法
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
        targetElement ? this.contextId : ""
      );
      if (extraData.inputText) action.setInputText(extraData.inputText);
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
      if (!this.isRecording) return;
    }
    dropHandler(e) {
      if (!this.isRecording) return;
      this.currentHoveredElement = e.target;
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
    }
    inputHandler(e) {
      if (!this.isRecording || !e.isTrusted) return;
      clearTimeout(this.inputTimer);
      this.inputTimer = setTimeout(() => {
        this.currentHoveredElement = e.target;
        this.dispatchAction("input", this.currentHoveredElement, null, {
          inputText: e.target.value || e.target.innerText
        });
      }, this.INPUT_DELAY);
    }
    mouseupHandler(e) {
      if (!this.isRecording) return;
      if (this.isDragging) {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentHoveredElement = e.target;
        this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
      } else {
        this.clickFlag += 1;
        if (this.clickFlag === 1) {
          this.clickTimeOut = setTimeout(() => {
            this.clickFlag = 0;
            this.isDragging = false;
            this.dragStart = { x: 0, y: 0 };
            this.dispatchAction("click", e.target);
          }, this.DOUBLE_CLICK_DELAY);
        } else if (this.clickFlag === 2) {
          clearTimeout(this.clickTimeOut);
          this.clickFlag = 0;
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };
          this.dispatchAction("dbclick", e.target);
        }
      }
      this.dragStepFlag = 0;
    }
    mousedownHandler(e) {
      if (!this.isRecording) return;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
      this.dragSource = e.target;
      this.mouseDownFlag = true;
      this.dragStepFlag = 1;
    }
    mousemoveHandler(e) {
      if (!this.isRecording) return;
      this.currentHoveredElement = e.target;
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
      this.setupBackgroundMessageListener();
      this.registry = new ContextRegistry();
      this.store = new RecorderStore();
      this.domParserService = new DOMParserService({
        mainWindow: rootWin
      });
      this.command = new PlaywrightCommand();
      this.pageAlias = "page";
      this.codeGenerator = new PlaywrightCodeGenerator(this.domParserService, this.command, this.pageAlias);
      if (window.opener && typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["latestPopupAlias"], (result) => {
          if (result.latestPopupAlias) {
            this.pageAlias = result.latestPopupAlias;
            this.codeGenerator.pageAlias = this.pageAlias;
            console.log(`\u{1F194} [MainApp] \u8A8D\u9818\u8EAB\u5206\u6210\u529F\uFF01\u66F4\u65B0 Generator \u8B8A\u6578\u70BA: ${this.pageAlias}`);
          }
        });
      }
      this.navigationTracker = new NavigationTracker({
        rootWindow: this.rootWin,
        onNavigate: (navInfo) => {
          const action = { type: "navigate", ...navInfo, ts: Date.now() };
          const newLine = this.appendGeneratedCode(action);
          const savedAction = this.store.addAction(action);
          this.syncToGlobalStorage(newLine, savedAction);
        }
      });
      this.pageAlias = "page";
      if (window.opener && typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["latestPopupAlias"], (result) => {
          if (result.latestPopupAlias) {
            this.pageAlias = result.latestPopupAlias;
            console.log(`\u{1F194} [MainApp] \u8A8D\u9818\u8EAB\u5206\u6210\u529F\uFF01\u6211\u7684 Playwright \u8B8A\u6578\u540D\u7A31\u662F: ${this.pageAlias}`);
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
          const savedAction = this.store.addAction(action);
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
    // 統一處理來自各個 Listener (Page/Iframe/Popup) 的互動動作
    handleUserAction(action) {
      if (!this.isStarted) return;
      if (action.type === "dragANDdrop") {
        if (action.isDragStart) {
          this.store.startDragSession({
            sourceContextId: action.sourceWindow,
            sourceElementInfo: action.getSourceElement()
          });
          return;
        }
        if (action.isDrop) {
          const session = this.store.getDragSession();
          if (!session.isDragging) return;
          action.setSourceWindow(session.sourceContextId);
          action.setSourceElement(session.sourceElementInfo);
          this.store.endDragSession();
        }
      }
      const newLine = this.appendGeneratedCode(action);
      const savedAction = this.store.addAction(action);
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
    start() {
      if (this.isStarted) return this.getState();
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isRecordingSessionActive: true }, () => {
          if (chrome.runtime.lastError) {
            console.error("\u274C [MainApp] \u5BEB\u5165\u5168\u57DF\u9304\u88FD\u72C0\u614B\u5931\u6557:", chrome.runtime.lastError);
          } else {
            console.log("\u{1F4BE} [MainApp] \u5DF2\u6210\u529F\u5C07\u300C\u9304\u88FD\u4E2D\u300D\u72C0\u614B\u5BEB\u5165\u5168\u57DF\u8CC7\u6599\u5EAB\uFF01(isRecordingSessionActive: true)");
          }
        });
      } else {
        console.warn("\u26A0\uFE0F [MainApp] \u627E\u4E0D\u5230 chrome.storage API\uFF0C\u7121\u6CD5\u540C\u6B65\u8DE8\u8996\u7A97\u72C0\u614B\uFF01\u8ACB\u6AA2\u67E5 manifest.json \u662F\u5426\u6709 storage \u6B0A\u9650\u3002");
      }
      const scanner = new ContextScanner(this.rootDoc, this.rootWin);
      this.scanResult = scanner.scanAllContexts();
      console.log("\u{1F50D} [Debug] Scanner \u6383\u63CF\u5230\u7684\u6240\u6709 Contexts:", this.scanResult.contexts);
      this.registry.clear();
      this.registry.registerMany(this.scanResult.contexts);
      this.syncRegistryToStore();
      const allContexts = this.registry.getAllContexts();
      console.log("\u{1F50D} [Debug] Registry \u4E2D\u7684 Contexts (\u6E96\u5099\u50B3\u7D66 Generator):", allContexts);
      const declarations = this.codeGenerator.declareContexts(allContexts, this.pageAlias);
      console.log("\u{1F50D} [Debug] Generator \u7522\u51FA\u7684\u5BA3\u544A\u5167\u5BB9:", declarations);
      if (declarations && declarations.length > 0) {
        declarations.forEach((line) => {
          this.syncToGlobalStorage({ code: line, isReplace: false }, null);
        });
      }
      console.log("\u{1F30D} [MainApp] \u9801\u9762\u6383\u63CF\u5B8C\u6210\uFF01\u7576\u524D\u7684 Context \u6A39\u72C0\u7D50\u69CB\uFF1A");
      this.registry.printTree();
      this.navigationTracker.start();
      this.bindListenersToContexts(this.registry.getAllContexts());
      this.activeListeners.forEach((l) => l.isRecording = true);
      this.store.setRecording(true);
      this.isStarted = true;
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["generatedCode"], (result) => {
          if (!result.generatedCode || result.generatedCode.length === 0) {
            const gotoAction = {
              type: "navigate",
              url: window.location.href,
              ts: Date.now()
            };
            const newLine = this.appendGeneratedCode(gotoAction);
            const savedAction = this.store.addAction(gotoAction);
            this.syncToGlobalStorage(newLine, savedAction);
          }
        });
      }
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["generatedCodeBody"], (result) => {
          if (!result.generatedCodeBody || result.generatedCodeBody.length === 0) {
            const gotoAction = { type: "navigate", url: window.location.href, ts: Date.now() };
            const codeResult = this.appendGeneratedCode(gotoAction);
            const savedAction = this.store.addAction(gotoAction);
            this.syncToGlobalStorage(codeResult, savedAction);
          }
        });
      }
      return this.getState();
    }
    // 停止錄製器
    stop() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isRecordingSessionActive: false });
      }
      if (!this.isStarted) return this.getState();
      this.navigationTracker.stop();
      this.activeListeners.forEach((l) => l.isRecording = false);
      this.store.setRecording(false);
      this.isStarted = false;
      return this.getState();
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
      const popupDoc = popupData?.popupDocument;
      const popupWin = popupData?.popupWindow;
      if (popupDoc) {
        const scanner = new ContextScanner(popupDoc, popupWin, { rootType: "popup" });
        const result = scanner.scanAllContexts();
        this.registry.registerMany(result.contexts);
        this.syncRegistryToStore();
        this.bindListenersToContexts(result.contexts);
      }
      const action = {
        type: "popup",
        popupId: popupData.popupId,
        url: popupData.popupUrl || "",
        ts: Date.now()
      };
      this.store.setPendingPopup(popupData);
      const newLine = this.appendGeneratedCode(action);
      const savedAction = this.store.addAction(action);
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
        const safeAct = { ...act };
        delete safeAct.source;
        delete safeAct.target;
        return safeAct;
      });
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
          listener.isRecording = this.isStarted;
          this.activeListeners.push(listener);
          this.store.registerListener(ctx.contextId);
        }
      });
    }
    appendGeneratedCode(action) {
      const result = this.codeGenerator.generate(action);
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
      return { code: codeToReturn, isReplace };
    }
    // 🌟 關鍵新增：統一處理增量同步到 Background 的機制
    syncToGlobalStorage(codeResult, action) {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
      const safeAct = { ...action };
      delete safeAct.source;
      delete safeAct.target;
      chrome.runtime.sendMessage({
        type: "APPEND_RECORD_DATA",
        newCode: codeResult ? codeResult.code : null,
        isReplace: codeResult ? codeResult.isReplace : false,
        // 傳遞覆寫訊號
        newAction: safeAct
      }).catch(() => {
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
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message?.type) return;
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
      if (event.data.type === "START_RECORDING") startRecording();
      if (event.data.type === "STOP_RECORDING") stopRecording();
      if (event.data.type === "CLEAR_RECORDING") clearRecording();
    });
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["isRecordingSessionActive"], (result) => {
        console.log(`\u{1F309} [Bridge] \u65B0\u8996\u7A97\u555F\u52D5\uFF0C\u6AA2\u67E5\u5168\u57DF\u72C0\u614B:`, result);
        if (result && result.isRecordingSessionActive) {
          console.log("\u{1F30D} [Bridge] \u5075\u6E2C\u5230\u5168\u57DF\u9304\u88FD\u72C0\u614B\u70BA ON\uFF0C\u6E96\u5099\u81EA\u52D5\u547C\u53EB startRecording()\uFF01");
          const autoStart = () => {
            console.log("\u23F3 [Bridge] DOM \u6E96\u5099\u5B8C\u7562\uFF0C\u5F37\u5236\u559A\u9192\u9304\u88FD\u5668\uFF01");
            startRecording();
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

  // index.js
  setupRecorderBridge({ MainApp });
})();
