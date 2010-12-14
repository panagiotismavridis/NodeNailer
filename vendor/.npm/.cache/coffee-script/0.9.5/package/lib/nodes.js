(function() {
  var Access, Arr, Assign, Base, Call, Class, Closure, Code, Comment, Existence, Expressions, Extends, For, IDENTIFIER, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, NEGATE, NO, Obj, Op, Param, Parens, Push, Range, Return, SIMPLENUM, Scope, Slice, Splat, Switch, TAB, THIS, TRAILING_WHITESPACE, Throw, Try, UTILITIES, Value, While, YES, compact, del, ends, extend, flatten, last, merge, multident, starts, unfoldSoak, utility, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Scope = require('./scope').Scope;
  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;
  exports.extend = extend;
  YES = function() {
    return true;
  };
  NO = function() {
    return false;
  };
  THIS = function() {
    return this;
  };
  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };
  exports.Base = Base = function() {
    function Base() {}
    Base.prototype.compile = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || node.isPureStatement() || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };
    Base.prototype.compileClosure = function(o) {
      if (this.containsPureStatement()) {
        throw SyntaxError('cannot include a pure statement in an expression.');
      }
      o.sharedScope = o.scope;
      return Closure.wrap(this).compileNode(o);
    };
    Base.prototype.cache = function(o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compile(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compile(o, level), ref.value];
        } else {
          return [sub, ref];
        }
      }
    };
    Base.prototype.compileLoopReference = function(o, name) {
      var src, tmp, _ref;
      src = tmp = this.compile(o, LEVEL_LIST);
      if (!((-Infinity < (_ref = +src) && _ref < Infinity) || IDENTIFIER.test(src) && o.scope.check(src, true))) {
        src = "" + (tmp = o.scope.freeVariable(name)) + " = " + src;
      }
      return [src, tmp];
    };
    Base.prototype.makeReturn = function() {
      return new Return(this);
    };
    Base.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(false, function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    Base.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    Base.prototype.containsPureStatement = function() {
      return this.isPureStatement() || this.contains(function(node) {
        return node.isPureStatement();
      });
    };
    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref, _ref2;
      if (!this.children) {
        return this;
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (this[attr]) {
          _ref2 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(crossScope, func);
      });
    };
    Base.prototype.invert = function() {
      return new Op('!', this);
    };
    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    Base.prototype.children = [];
    Base.prototype.isStatement = NO;
    Base.prototype.isPureStatement = NO;
    Base.prototype.isComplex = YES;
    Base.prototype.isChainable = NO;
    Base.prototype.isAssignable = NO;
    Base.prototype.unwrap = THIS;
    Base.prototype.unfoldSoak = NO;
    Base.prototype.assigns = NO;
    return Base;
  }();
  exports.Expressions = Expressions = function() {
    function Expressions(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }
    __extends(Expressions, Base);
    Expressions.prototype.children = ['expressions'];
    Expressions.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };
    Expressions.prototype.pop = function() {
      return this.expressions.pop();
    };
    Expressions.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };
    Expressions.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };
    Expressions.prototype.isEmpty = function() {
      return !this.expressions.length;
    };
    Expressions.prototype.isStatement = function(o) {
      var exp, _i, _len, _ref;
      _ref = this.expressions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        exp = _ref[_i];
        if (exp.isPureStatement() || exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };
    Expressions.prototype.makeReturn = function() {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn();
          break;
        }
      }
      return this;
    };
    Expressions.prototype.compile = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Expressions.__super__.compile.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };
    Expressions.prototype.compileNode = function(o) {
      var code, codes, node, top, _i, _len, _ref;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      codes = [];
      _ref = this.expressions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (top) {
          node.front = true;
          code = node.compile(o);
          codes.push(node.isStatement(o) ? code : this.tab + code + ';');
        } else {
          codes.push(node.compile(o, LEVEL_LIST));
        }
      }
      if (top) {
        return codes.join('\n');
      }
      code = codes.join(', ') || 'void 0';
      if (codes.length > 1 && o.level >= LEVEL_LIST) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Expressions.prototype.compileRoot = function(o) {
      var code;
      o.indent = this.tab = o.bare ? '' : TAB;
      o.scope = new Scope(null, this, null);
      o.level = LEVEL_TOP;
      code = this.compileWithDeclarations(o);
      code = code.replace(TRAILING_WHITESPACE, '');
      if (o.bare) {
        return code;
      } else {
        return "(function() {\n" + code + "\n}).call(this);\n";
      }
    };
    Expressions.prototype.compileWithDeclarations = function(o) {
      var code, exp, i, post, rest, scope, _len, _ref;
      code = post = '';
      _ref = this.expressions;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        exp = _ref[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o.level = LEVEL_TOP;
      if (i) {
        rest = this.expressions.splice(i, this.expressions.length);
        code = this.compileNode(o);
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (!o.globals && o.scope.hasDeclarations(this)) {
        code += "" + this.tab + "var " + (scope.compiledDeclarations()) + ";\n";
      }
      if (scope.hasAssignments(this)) {
        code += "" + this.tab + "var " + (multident(scope.compiledAssignments(), this.tab)) + ";\n";
      }
      return code + post;
    };
    Expressions.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Expressions) {
        return nodes[0];
      }
      return new Expressions(nodes);
    };
    return Expressions;
  }();
  exports.Literal = Literal = function() {
    function Literal(value) {
      this.value = value;
    }
    __extends(Literal, Base);
    Literal.prototype.makeReturn = function() {
      if (this.isPureStatement()) {
        return this;
      } else {
        return new Return(this);
      }
    };
    Literal.prototype.isPureStatement = function() {
      var _ref;
      return (_ref = this.value) === 'break' || _ref === 'continue' || _ref === 'debugger';
    };
    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    Literal.prototype.isComplex = NO;
    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };
    Literal.prototype.compile = function() {
      if (this.value.reserved) {
        return "\"" + this.value + "\"";
      } else {
        return this.value;
      }
    };
    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };
    return Literal;
  }();
  exports.Return = Return = function() {
    function Return(expression) {
      this.expression = expression;
    }
    __extends(Return, Base);
    Return.prototype.children = ['expression'];
    Return.prototype.isStatement = YES;
    Return.prototype.isPureStatement = YES;
    Return.prototype.makeReturn = THIS;
    Return.prototype.compile = function(o, level) {
      var expr, _ref;
      expr = (_ref = this.expression) != null ? _ref.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compile(o, level);
      } else {
        return Return.__super__.compile.call(this, o, level);
      }
    };
    Return.prototype.compileNode = function(o) {
      o.level = LEVEL_PAREN;
      return this.tab + ("return" + (this.expression ? ' ' + this.expression.compile(o) : '') + ";");
    };
    return Return;
  }();
  exports.Value = Value = function() {
    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }
    __extends(Value, Base);
    Value.prototype.children = ['base', 'properties'];
    Value.prototype.push = function(prop) {
      this.properties.push(prop);
      return this;
    };
    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };
    Value.prototype.isArray = function() {
      return !this.properties.length && this.base instanceof Arr;
    };
    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };
    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };
    Value.prototype.isSimpleNumber = function() {
      return this.base instanceof Literal && SIMPLENUM.test(this.base.value);
    };
    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref;
      _ref = this.properties.concat(this.base);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };
    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };
    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };
    Value.prototype.makeReturn = function() {
      if (this.properties.length) {
        return Value.__super__.makeReturn.call(this);
      } else {
        return this.base.makeReturn();
      }
    };
    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };
    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.push(name), new Value(bref || base.base, [nref || name])];
    };
    Value.prototype.compileNode = function(o) {
      var code, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      code = this.base.compile(o, props.length ? LEVEL_ACCESS : null);
      if (props[0] instanceof Access && this.isSimpleNumber()) {
        code = "(" + code + ")";
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        code += prop.compile(o);
      }
      return code;
    };
    Value.prototype.unfoldSoak = function(o) {
      var fst, i, ifn, prop, ref, snd, _len, _ref;
      if (ifn = this.base.unfoldSoak(o)) {
        Array.prototype.push.apply(ifn.body.properties, this.properties);
        return ifn;
      }
      _ref = this.properties;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        prop = _ref[i];
        if (prop.soak) {
          prop.soak = false;
          fst = new Value(this.base, this.properties.slice(0, i));
          snd = new Value(this.base, this.properties.slice(i));
          if (fst.isComplex()) {
            ref = new Literal(o.scope.freeVariable('ref'));
            fst = new Parens(new Assign(ref, fst));
            snd.base = ref;
          }
          return new If(new Existence(fst), snd, {
            soak: true
          });
        }
      }
      return null;
    };
    return Value;
  }();
  exports.Comment = Comment = function() {
    function Comment(comment) {
      this.comment = comment;
    }
    __extends(Comment, Base);
    Comment.prototype.isPureStatement = YES;
    Comment.prototype.isStatement = YES;
    Comment.prototype.makeReturn = THIS;
    Comment.prototype.compileNode = function(o, level) {
      var code;
      code = '/*' + multident(this.comment, this.tab) + '*/';
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return code;
    };
    return Comment;
  }();
  exports.Call = Call = function() {
    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
    }
    __extends(Call, Base);
    Call.prototype.children = ['variable', 'args'];
    Call.prototype.newInstance = function() {
      this.isNew = true;
      return this;
    };
    Call.prototype.superReference = function(o) {
      var method, name;
      method = o.scope.method;
      if (!method) {
        throw SyntaxError('cannot call super outside of a function.');
      }
      name = method.name;
      if (!name) {
        throw SyntaxError('cannot call super on an anonymous function.');
      }
      if (method.klass) {
        return "" + method.klass + ".__super__." + name;
      } else {
        return "" + name + ".__super__.constructor";
      }
    };
    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, left, list, rite, _i, _len, _ref, _ref2;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref = new Value(this.variable).cacheReference(o), left = _ref[0], rite = _ref[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref2 = list.reverse();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        call = _ref2[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };
    Call.prototype.compileNode = function(o) {
      var arg, args, code, _i, _len, _ref, _ref2, _results;
      if ((_ref = this.variable) != null) {
        _ref.front = this.front;
      }
      if (code = Splat.compileSplattedArray(o, this.args, true)) {
        return this.compileSplat(o, code);
      }
      args = (function() {
        _ref2 = this.args;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          arg = _ref2[_i];
          _results.push(arg.compile(o, LEVEL_LIST));
        }
        return _results;
      }.call(this)).join(', ');
      if (this.isSuper) {
        return this.compileSuper(args, o);
      } else {
        return (this.isNew ? 'new ' : '') + this.variable.compile(o, LEVEL_ACCESS) + ("(" + args + ")");
      }
    };
    Call.prototype.compileSuper = function(args, o) {
      return "" + (this.superReference(o)) + ".call(this" + (args.length ? ', ' : '') + args + ")";
    };
    Call.prototype.compileSplat = function(o, splatArgs) {
      var base, fun, idt, name, ref;
      if (this.isSuper) {
        return "" + (this.superReference(o)) + ".apply(this, " + splatArgs + ")";
      }
      if (!this.isNew) {
        base = new Value(this.variable);
        if ((name = base.properties.pop()) && base.isComplex()) {
          ref = o.scope.freeVariable('this');
          fun = "(" + ref + " = " + (base.compile(o, LEVEL_LIST)) + ")" + (name.compile(o));
        } else {
          fun = ref = base.compile(o, LEVEL_ACCESS);
          if (name) {
            fun += name.compile(o);
          }
        }
        return "" + fun + ".apply(" + ref + ", " + splatArgs + ")";
      }
      idt = this.tab + TAB;
      return "(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return typeof result === \"object\" ? result : child;\n" + this.tab + "})(" + (this.variable.compile(o, LEVEL_LIST)) + ", " + splatArgs + ", function() {})";
    };
    return Call;
  }();
  exports.Extends = Extends = function() {
    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }
    __extends(Extends, Base);
    Extends.prototype.children = ['child', 'parent'];
    Extends.prototype.compile = function(o) {
      utility('hasProp');
      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compile(o);
    };
    return Extends;
  }();
  exports.Access = Access = function() {
    function Access(name, tag) {
      this.name = name;
      this.proto = tag === 'proto' ? '.prototype' : '';
      this.soak = tag === 'soak';
    }
    __extends(Access, Base);
    Access.prototype.children = ['name'];
    Access.prototype.compile = function(o) {
      var name;
      name = this.name.compile(o);
      return this.proto + (IS_STRING.test(name) ? "[" + name + "]" : "." + name);
    };
    Access.prototype.isComplex = NO;
    return Access;
  }();
  exports.Index = Index = function() {
    function Index(index) {
      this.index = index;
    }
    __extends(Index, Base);
    Index.prototype.children = ['index'];
    Index.prototype.compile = function(o) {
      return (this.proto ? '.prototype' : '') + ("[" + (this.index.compile(o, LEVEL_PAREN)) + "]");
    };
    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };
    return Index;
  }();
  exports.Range = Range = function() {
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    __extends(Range, Base);
    Range.prototype.children = ['from', 'to'];
    Range.prototype.compileVariables = function(o) {
      var parts, _ref, _ref2, _ref3;
      o = merge(o, {
        top: true
      });
      _ref = this.from.cache(o, LEVEL_LIST), this.from = _ref[0], this.fromVar = _ref[1];
      _ref2 = this.to.cache(o, LEVEL_LIST), this.to = _ref2[0], this.toVar = _ref2[1];
      _ref3 = [this.fromVar.match(SIMPLENUM), this.toVar.match(SIMPLENUM)], this.fromNum = _ref3[0], this.toNum = _ref3[1];
      parts = [];
      if (this.from !== this.fromVar) {
        parts.push(this.from);
      }
      if (this.to !== this.toVar) {
        return parts.push(this.to);
      }
    };
    Range.prototype.compileNode = function(o) {
      var compare, idx, incr, intro, step, stepPart, vars;
      this.compileVariables(o);
      if (!o.index) {
        return this.compileArray(o);
      }
      if (this.fromNum && this.toNum) {
        return this.compileSimple(o);
      }
      idx = del(o, 'index');
      step = del(o, 'step');
      vars = ("" + idx + " = " + this.from) + (this.to !== this.toVar ? ", " + this.to : '');
      intro = "(" + this.fromVar + " <= " + this.toVar + " ? " + idx;
      compare = "" + intro + " <" + this.equals + " " + this.toVar + " : " + idx + " >" + this.equals + " " + this.toVar + ")";
      stepPart = step ? step.compile(o) : '1';
      incr = step ? "" + idx + " += " + stepPart : "" + intro + " += " + stepPart + " : " + idx + " -= " + stepPart + ")";
      return "" + vars + "; " + compare + "; " + incr;
    };
    Range.prototype.compileSimple = function(o) {
      var from, idx, step, to, _ref;
      _ref = [+this.fromNum, +this.toNum], from = _ref[0], to = _ref[1];
      idx = del(o, 'index');
      step = del(o, 'step');
      step && (step = "" + idx + " += " + (step.compile(o)));
      if (from <= to) {
        return "" + idx + " = " + from + "; " + idx + " <" + this.equals + " " + to + "; " + (step || ("" + idx + "++"));
      } else {
        return "" + idx + " = " + from + "; " + idx + " >" + this.equals + " " + to + "; " + (step || ("" + idx + "--"));
      }
    };
    Range.prototype.compileArray = function(o) {
      var body, clause, i, idt, post, pre, range, result, vars, _i, _ref, _ref2, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          _results = [];
          for (var _i = _ref = +this.fromNum, _ref2 = +this.toNum; _ref <= _ref2 ? _i <= _ref2 : _i >= _ref2; _ref <= _ref2 ? _i += 1 : _i -= 1){ _results.push(_i); }
          return _results;
        }).call(this);
        if (this.exclusive) {
          range.pop();
        }
        return "[" + (range.join(', ')) + "]";
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = this.compileSimple(o);
      } else {
        vars = ("" + i + " = " + this.from) + (this.to !== this.toVar ? ", " + this.to : '');
        clause = "" + this.fromVar + " <= " + this.toVar + " ?";
        body = "var " + vars + "; " + clause + " " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + clause + " " + i + " += 1 : " + i + " -= 1";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      return "(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).call(this)";
    };
    return Range;
  }();
  exports.Slice = Slice = function() {
    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }
    __extends(Slice, Base);
    Slice.prototype.children = ['range'];
    Slice.prototype.compileNode = function(o) {
      var from, to;
      from = this.range.from ? this.range.from.compile(o) : '0';
      to = this.range.to ? this.range.to.compile(o) : '';
      to += !to || this.range.exclusive ? '' : ' + 1';
      if (to) {
        to = ', ' + to;
      }
      return ".slice(" + from + to + ")";
    };
    return Slice;
  }();
  exports.Obj = Obj = function() {
    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }
    __extends(Obj, Base);
    Obj.prototype.children = ['properties'];
    Obj.prototype.compileNode = function(o) {
      var i, idt, indent, join, lastNoncom, nonComments, obj, prop, props, rest, _i, _len, _len2, _len3, _ref, _results, _results2;
      props = this.properties;
      if (!props.length) {
        if (this.front) {
          return '({})';
        } else {
          return '{}';
        }
      }
      for (i = 0, _len = props.length; i < _len; i++) {
        prop = props[i];
        if (prop instanceof Splat || (prop.variable || prop).base instanceof Parens) {
          rest = props.splice(i, 1 / 0);
          break;
        }
      }
      idt = o.indent += TAB;
      nonComments = (function() {
        _ref = this.properties;
        _results = [];
        for (_i = 0, _len2 = _ref.length; _i < _len2; _i++) {
          prop = _ref[_i];
          if (!(prop instanceof Comment)) {
            _results.push(prop);
          }
        }
        return _results;
      }.call(this));
      lastNoncom = last(nonComments);
      props = function() {
        _results2 = [];
        for (i = 0, _len3 = props.length; i < _len3; i++) {
          prop = props[i];
          join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
          indent = prop instanceof Comment ? '' : idt;
          if (prop instanceof Value && prop["this"]) {
            prop = new Assign(prop.properties[0].name, prop, 'object');
          } else if (!(prop instanceof Assign) && !(prop instanceof Comment)) {
            prop = new Assign(prop, prop, 'object');
          }
          _results2.push(indent + prop.compile(o, LEVEL_TOP) + join);
        }
        return _results2;
      }();
      props = props.join('');
      obj = "{" + (props && '\n' + props + '\n' + this.tab) + "}";
      if (rest) {
        return this.compileDynamic(o, obj, rest);
      }
      if (this.front) {
        return "(" + obj + ")";
      } else {
        return obj;
      }
    };
    Obj.prototype.compileDynamic = function(o, code, props) {
      var acc, i, key, oref, prop, ref, val, _len, _ref;
      code = "" + (oref = o.scope.freeVariable('obj')) + " = " + code + ", ";
      for (i = 0, _len = props.length; i < _len; i++) {
        prop = props[i];
        if (prop instanceof Comment) {
          code += prop.compile(o, LEVEL_LIST) + ' ';
          continue;
        }
        if (prop instanceof Assign) {
          acc = prop.variable.base;
          key = acc.compile(o, LEVEL_PAREN);
          val = prop.value.compile(o, LEVEL_LIST);
        } else {
          acc = prop.base;
          _ref = acc.cache(o, LEVEL_LIST, ref), key = _ref[0], val = _ref[1];
          if (key !== val) {
            ref = val;
          }
        }
        key = acc instanceof Literal && IDENTIFIER.test(key) ? '.' + key : '[' + key + ']';
        code += "" + oref + key + " = " + val + ", ";
      }
      code += oref;
      if (o.level <= LEVEL_PAREN) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Obj.prototype.assigns = function(name) {
      var prop, _i, _len, _ref;
      _ref = this.properties;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prop = _ref[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Obj;
  }();
  exports.Arr = Arr = function() {
    function Arr(objs) {
      this.objects = objs || [];
    }
    __extends(Arr, Base);
    Arr.prototype.children = ['objects'];
    Arr.prototype.compileNode = function(o) {
      var code, obj, _i, _len, _ref, _results;
      if (!this.objects.length) {
        return '[]';
      }
      o.indent += TAB;
      if (code = Splat.compileSplattedArray(o, this.objects)) {
        return code;
      }
      code = (function() {
        _ref = this.objects;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          _results.push(obj.compile(o, LEVEL_LIST));
        }
        return _results;
      }.call(this)).join(', ');
      if (code.indexOf('\n') >= 0) {
        return "[\n" + o.indent + code + "\n" + this.tab + "]";
      } else {
        return "[" + code + "]";
      }
    };
    Arr.prototype.assigns = function(name) {
      var obj, _i, _len, _ref;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Arr;
  }();
  exports.Class = Class = function() {
    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Expressions;
      this.boundFuncs = [];
    }
    __extends(Class, Base);
    Class.prototype.children = ['variable', 'parent', 'body'];
    Class.prototype.determineName = function() {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };
    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };
    Class.prototype.addBoundFunctions = function(o) {
      var bname, bvar, _i, _len, _ref, _results;
      if (this.boundFuncs.length) {
        _ref = this.boundFuncs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bvar = _ref[_i];
          bname = bvar.compile(o);
          _results.push(this.ctor.body.unshift(new Literal("this." + bname + " = " + (utility('bind')) + "(this." + bname + ", this);")));
        }
        return _results;
      }
    };
    Class.prototype.addProperties = function(node, name) {
      var assign, base, func, props, _results;
      props = node.base.properties.slice(0);
      _results = [];
      while (assign = props.shift()) {
        if (assign instanceof Assign) {
          base = assign.variable.base;
          delete assign.context;
          func = assign.value;
          if (base.value === 'constructor') {
            if (this.ctor) {
              throw new Error('cannot define more than one constructor in a class');
            }
            if (func.bound) {
              throw new Error('cannot define a constructor as a bound function');
            }
            if (func instanceof Code) {
              this.ctor = func;
            } else {
              this.ctor = new Assign(new Value(new Literal(name)), func);
            }
            assign = null;
          } else {
            if (!assign.variable["this"]) {
              assign.variable = new Value(new Literal(name), [new Access(base, 'proto')]);
            }
            if (func instanceof Code && func.bound) {
              this.boundFuncs.push(base);
              func.bound = false;
            }
          }
        }
        _results.push(assign);
      }
      return _results;
    };
    Class.prototype.walkBody = function(name) {
      return this.traverseChildren(false, __bind(function(child) {
        var exps, i, node, _len, _ref;
        if (child instanceof Expressions) {
          _ref = exps = child.expressions;
          for (i = 0, _len = _ref.length; i < _len; i++) {
            node = _ref[i];
            if (node instanceof Value && node.isObject(true)) {
              exps[i] = compact(this.addProperties(node, name));
            }
          }
          return child.expressions = exps = compact(flatten(exps));
        }
      }, this));
    };
    Class.prototype.ensureConstructor = function(name) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (this.parent) {
          this.ctor.body.push(new Call('super', [new Splat(new Literal('arguments'))]));
        }
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };
    Class.prototype.compileNode = function(o) {
      var decl, klass, lname, name, _ref;
      decl = this.determineName();
      name = decl || this.name || '_Class';
      lname = new Literal(name);
      this.setContext(name);
      this.walkBody(name);
      this.ensureConstructor(name);
      if (this.parent) {
        this.body.expressions.unshift(new Extends(lname, this.parent));
      }
      this.body.expressions.unshift(this.ctor);
      this.body.expressions.push(lname);
      this.addBoundFunctions(o);
      klass = new Parens(new Call(new Code([], this.body)), true);
      if (decl && ((_ref = this.variable) != null ? _ref.isComplex() : void 0)) {
        klass = new Assign(new Value(lname), klass);
      }
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compile(o);
    };
    return Class;
  }();
  exports.Assign = Assign = function() {
    function Assign(variable, value, context) {
      this.variable = variable;
      this.value = value;
      this.context = context;
    }
    __extends(Assign, Base);
    Assign.prototype.METHOD_DEF = /^(?:(\S+)\.prototype\.|\S+?)?\b([$A-Za-z_][$\w]*)$/;
    Assign.prototype.children = ['variable', 'value'];
    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };
    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };
    Assign.prototype.compileNode = function(o) {
      var isValue, match, name, val, _ref;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref = this.context) === '||=' || _ref === '&&=' || _ref === '?=') {
          return this.compileConditional(o);
        }
      }
      name = this.variable.compile(o, LEVEL_LIST);
      if (this.value instanceof Code && (match = this.METHOD_DEF.exec(name))) {
        this.value.name = match[2];
        if (match[1]) {
          this.value.klass = match[1];
        }
      }
      val = this.value.compile(o, LEVEL_LIST);
      if (this.context === 'object') {
        return "" + name + ": " + val;
      }
      if (!this.variable.isAssignable()) {
        throw SyntaxError("\"" + (this.variable.compile(o)) + "\" cannot be assigned.");
      }
      if (!(this.context || isValue && (this.variable.namespaced || this.variable.hasProperties()))) {
        o.scope.find(name);
      }
      val = name + (" " + (this.context || '=') + " ") + val;
      if (o.level <= LEVEL_LIST) {
        return val;
      } else {
        return "(" + val + ")";
      }
    };
    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, i, idx, isObject, ivar, obj, objects, olen, ref, rest, splat, top, val, value, vvar, _len, _ref, _ref2, _ref3, _ref4;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        return value.compile(o);
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref = obj, idx = _ref.variable.base, obj = _ref.value;
        } else {
          if (obj.base instanceof Parens) {
            _ref2 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref2[0], idx = _ref2[1];
          } else {
            idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
          }
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        return new Assign(obj, value).compile(o);
      }
      vvar = value.compile(o, LEVEL_LIST);
      assigns = [];
      splat = false;
      if (!IDENTIFIER.test(vvar) || this.variable.assigns(vvar)) {
        assigns.push("" + (ref = o.scope.freeVariable('ref')) + " = " + vvar);
        vvar = ref;
      }
      for (i = 0, _len = objects.length; i < _len; i++) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref3 = obj, idx = _ref3.variable.base, obj = _ref3.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref4 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref4[0], idx = _ref4[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!splat && obj instanceof Splat) {
          val = "" + olen + " <= " + vvar + ".length ? " + (utility('slice')) + ".call(" + vvar + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvar + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          splat = "" + ivar + "++";
        } else {
          if (obj instanceof Splat) {
            obj = obj.name.compile(o);
            throw SyntaxError("multiple splats are disallowed in an assignment: " + obj + " ...");
          }
          if (typeof idx === 'number') {
            idx = new Literal(splat || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvar), [new (acc ? Access : Index)(idx)]);
        }
        assigns.push(new Assign(obj, val).compile(o, LEVEL_TOP));
      }
      if (!top) {
        assigns.push(vvar);
      }
      code = assigns.join(', ');
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Assign.prototype.compileConditional = function(o) {
      var left, rite, _ref;
      _ref = this.variable.cacheReference(o), left = _ref[0], rite = _ref[1];
      return new Op(this.context.slice(0, -1), left, new Assign(rite, this.value, '=')).compile(o);
    };
    Assign.prototype.compileSplice = function(o) {
      var from, name, plus, range, ref, to, val;
      range = this.variable.properties.pop().range;
      name = this.variable.compile(o);
      plus = range.exclusive ? '' : ' + 1';
      from = range.from ? range.from.compile(o) : '0';
      to = range.to ? range.to.compile(o) + ' - ' + from + plus : "" + name + ".length";
      ref = o.scope.freeVariable('ref');
      val = this.value.compile(o);
      return "([].splice.apply(" + name + ", [" + from + ", " + to + "].concat(" + ref + " = " + val + ")), " + ref + ")";
    };
    return Assign;
  }();
  exports.Code = Code = function() {
    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Expressions;
      this.bound = tag === 'boundfunc';
      if (this.bound) {
        this.context = 'this';
      }
    }
    __extends(Code, Base);
    Code.prototype.children = ['params', 'body'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.compileNode = function(o) {
      var code, exprs, i, idt, lit, p, param, ref, scope, sharedScope, splats, v, val, vars, wasEmpty, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results, _this;
      sharedScope = del(o, 'sharedScope');
      o.scope = scope = sharedScope || new Scope(o.scope, this.body, this);
      o.indent += TAB;
      delete o.bare;
      delete o.globals;
      vars = [];
      exprs = [];
      _ref = this.params;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (param.splat) {
          splats = new Assign(new Value(new Arr(function() {
            _ref2 = this.params;
            _results = [];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              p = _ref2[_j];
              _results.push(p.asReference(o));
            }
            return _results;
          }.call(this))), new Value(new Literal('arguments')));
          break;
        }
      }
      _ref3 = this.params;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        param = _ref3[_k];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '='));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          vars.push(ref);
        }
      }
      scope.startLevel();
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_this = this.body.expressions).unshift.apply(_this, exprs);
      }
      if (!splats) {
        for (i = 0, _len4 = vars.length; i < _len4; i++) {
          v = vars[i];
          scope.parameter(vars[i] = v.compile(o));
        }
      }
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      idt = o.indent;
      code = 'function';
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(' + vars.join(', ') + ') {';
      if (!this.body.isEmpty()) {
        code += "\n" + (this.body.compileWithDeclarations(o)) + "\n" + this.tab;
      }
      code += '}';
      if (this.ctor) {
        return this.tab + code;
      }
      if (this.bound) {
        return utility('bind') + ("(" + code + ", " + this.context + ")");
      }
      if (this.front) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    return Code;
  }();
  exports.Param = Param = function() {
    function Param(name, value, splat) {
      this.name = name;
      this.value = value;
      this.splat = splat;
    }
    __extends(Param, Base);
    Param.prototype.children = ['name', 'value'];
    Param.prototype.compile = function(o) {
      return this.name.compile(o, LEVEL_LIST);
    };
    Param.prototype.asReference = function(o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal('_' + node.value);
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      return this.reference = node;
    };
    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };
    return Param;
  }();
  exports.Splat = Splat = function() {
    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }
    __extends(Splat, Base);
    Splat.prototype.children = ['name'];
    Splat.prototype.isAssignable = YES;
    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };
    Splat.prototype.compile = function(o) {
      if (this.index != null) {
        return this.compileParam(o);
      } else {
        return this.name.compile(o);
      }
    };
    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, code, i, index, node, _i, _len, _len2, _ref, _results;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return '';
      }
      if (list.length === 1) {
        code = list[0].compile(o, LEVEL_LIST);
        if (apply) {
          return code;
        }
        return "" + (utility('slice')) + ".call(" + code + ")";
      }
      args = list.slice(index);
      for (i = 0, _len = args.length; i < _len; i++) {
        node = args[i];
        code = node.compile(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? "" + (utility('slice')) + ".call(" + code + ")" : "[" + code + "]";
      }
      if (index === 0) {
        return args[0] + (".concat(" + (args.slice(1).join(', ')) + ")");
      }
      base = (function() {
        _ref = list.slice(0, index);
        _results = [];
        for (_i = 0, _len2 = _ref.length; _i < _len2; _i++) {
          node = _ref[_i];
          _results.push(node.compile(o, LEVEL_LIST));
        }
        return _results;
      }());
      return "[" + (base.join(', ')) + "].concat(" + (args.join(', ')) + ")";
    };
    return Splat;
  }();
  exports.While = While = function() {
    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }
    __extends(While, Base);
    While.prototype.children = ['condition', 'guard', 'body'];
    While.prototype.isStatement = YES;
    While.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    While.prototype.addBody = function(body) {
      this.body = body;
      return this;
    };
    While.prototype.containsPureStatement = function() {
      var expressions, i, ret, _ref;
      expressions = this.body.expressions;
      i = expressions.length;
      if ((_ref = expressions[--i]) != null ? _ref.containsPureStatement() : void 0) {
        return true;
      }
      ret = function(node) {
        return node instanceof Return;
      };
      while (i--) {
        if (expressions[i].contains(ret)) {
          return true;
        }
      }
      return false;
    };
    While.prototype.compileNode = function(o) {
      var body, code, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = '';
      } else {
        if (o.level > LEVEL_TOP || this.returns) {
          rvar = o.scope.freeVariable('results');
          set = "" + this.tab + rvar + " = [];\n";
          if (body) {
            body = Push.wrap(rvar, body);
          }
        }
        if (this.guard) {
          body = Expressions.wrap([new If(this.guard, body)]);
        }
        body = "\n" + (body.compile(o, LEVEL_TOP)) + "\n" + this.tab;
      }
      code = set + this.tab + ("while (" + (this.condition.compile(o, LEVEL_PAREN)) + ") {" + body + "}");
      if (this.returns) {
        o.indent = this.tab;
        code += '\n' + new Return(new Literal(rvar)).compile(o);
      }
      return code;
    };
    return While;
  }();
  exports.Op = Op = function() {
    var CONVERSIONS, INVERSIONS;
    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'new') {
        if (first instanceof Call) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }
    __extends(Op, Base);
    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };
    INVERSIONS = {
      '!==': '===',
      '===': '!==',
      '>': '<=',
      '<=': '>',
      '<': '>=',
      '>=': '<'
    };
    Op.prototype.children = ['first', 'second'];
    Op.prototype.isUnary = function() {
      return !this.second;
    };
    Op.prototype.isChainable = function() {
      var _ref;
      return (_ref = this.operator) === '<' || _ref === '>' || _ref === '>=' || _ref === '<=' || _ref === '===' || _ref === '!==';
    };
    Op.prototype.invert = function() {
      var fst, op, _ref;
      if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref = fst.operator) === '!' || _ref === 'in' || _ref === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };
    Op.prototype.unfoldSoak = function(o) {
      var _ref;
      return ((_ref = this.operator) === '++' || _ref === '--' || _ref === 'delete') && unfoldSoak(o, this, 'first');
    };
    Op.prototype.compileNode = function(o) {
      var code;
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (this.isChainable() && this.first.isChainable()) {
        return this.compileChain(o);
      }
      if (this.operator === '?') {
        return this.compileExistence(o);
      }
      this.first.front = this.front;
      code = this.first.compile(o, LEVEL_OP) + ' ' + this.operator + ' ' + this.second.compile(o, LEVEL_OP);
      if (o.level <= LEVEL_OP) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Op.prototype.compileChain = function(o) {
      var code, fst, shared, _ref;
      _ref = this.first.second.cache(o), this.first.second = _ref[0], shared = _ref[1];
      fst = this.first.compile(o, LEVEL_OP);
      if (fst.charAt(0) === '(') {
        fst = fst.slice(1, -1);
      }
      code = "" + fst + " && " + (shared.compile(o)) + " " + this.operator + " " + (this.second.compile(o, LEVEL_OP));
      if (o.level < LEVEL_OP) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = o.scope.freeVariable('ref');
        fst = new Parens(new Assign(new Literal(ref), this.first));
      } else {
        fst = this.first;
        ref = fst.compile(o);
      }
      return new Existence(fst).compile(o) + (" ? " + ref + " : " + (this.second.compile(o, LEVEL_LIST)));
    };
    Op.prototype.compileUnary = function(o) {
      var op, parts;
      parts = [op = this.operator];
      if ((op === 'new' || op === 'typeof' || op === 'delete') || (op === '+' || op === '-') && this.first instanceof Op && this.first.operator === op) {
        parts.push(' ');
      }
      parts.push(this.first.compile(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return parts.join('');
    };
    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };
    return Op;
  }();
  exports.In = In = function() {
    function In(object, array) {
      this.object = object;
      this.array = array;
    }
    __extends(In, Base);
    In.prototype.children = ['object', 'array'];
    In.prototype.invert = NEGATE;
    In.prototype.compileNode = function(o) {
      if (this.array instanceof Value && this.array.isArray()) {
        return this.compileOrTest(o);
      } else {
        return this.compileLoopTest(o);
      }
    };
    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, ref, sub, tests, _len, _ref, _ref2, _ref3, _results;
      _ref = this.object.cache(o, LEVEL_OP), sub = _ref[0], ref = _ref[1];
      _ref2 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref2[0], cnj = _ref2[1];
      tests = function() {
        _ref3 = this.array.base.objects;
        _results = [];
        for (i = 0, _len = _ref3.length; i < _len; i++) {
          item = _ref3[i];
          _results.push((i ? ref : sub) + cmp + item.compile(o, LEVEL_OP));
        }
        return _results;
      }.call(this);
      tests = tests.join(cnj);
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return "(" + tests + ")";
      }
    };
    In.prototype.compileLoopTest = function(o) {
      var code, ref, sub, _ref;
      _ref = this.object.cache(o, LEVEL_LIST), sub = _ref[0], ref = _ref[1];
      code = utility('indexOf') + (".call(" + (this.array.compile(o, LEVEL_LIST)) + ", " + ref + ") ") + (this.negated ? '< 0' : '>= 0');
      if (sub === ref) {
        return code;
      }
      code = sub + ', ' + code;
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };
    return In;
  }();
  exports.Try = Try = function() {
    function Try(attempt, error, recovery, ensure) {
      this.attempt = attempt;
      this.error = error;
      this.recovery = recovery;
      this.ensure = ensure;
    }
    __extends(Try, Base);
    Try.prototype.children = ['attempt', 'recovery', 'ensure'];
    Try.prototype.isStatement = YES;
    Try.prototype.makeReturn = function() {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn();
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn();
      }
      return this;
    };
    Try.prototype.compileNode = function(o) {
      var catchPart, errorPart;
      o.indent += TAB;
      errorPart = this.error ? " (" + (this.error.compile(o)) + ") " : ' ';
      catchPart = this.recovery ? " catch" + errorPart + "{\n" + (this.recovery.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : !(this.ensure || this.recovery) ? ' catch (_e) {}' : void 0;
      return ("" + this.tab + "try {\n" + (this.attempt.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" + (catchPart || '')) + (this.ensure ? " finally {\n" + (this.ensure.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : '');
    };
    return Try;
  }();
  exports.Throw = Throw = function() {
    function Throw(expression) {
      this.expression = expression;
    }
    __extends(Throw, Base);
    Throw.prototype.children = ['expression'];
    Throw.prototype.isStatement = YES;
    Throw.prototype.makeReturn = THIS;
    Throw.prototype.compileNode = function(o) {
      return this.tab + ("throw " + (this.expression.compile(o)) + ";");
    };
    return Throw;
  }();
  exports.Existence = Existence = function() {
    function Existence(expression) {
      this.expression = expression;
    }
    __extends(Existence, Base);
    Existence.prototype.children = ['expression'];
    Existence.prototype.invert = NEGATE;
    Existence.prototype.compileNode = function(o) {
      var code, sym;
      code = this.expression.compile(o, LEVEL_OP);
      code = IDENTIFIER.test(code) && !o.scope.check(code) ? this.negated ? "typeof " + code + " == \"undefined\" || " + code + " === null" : "typeof " + code + " != \"undefined\" && " + code + " !== null" : (sym = this.negated ? '==' : '!=', "" + code + " " + sym + " null");
      if (o.level <= LEVEL_COND) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Existence;
  }();
  exports.Parens = Parens = function() {
    function Parens(body) {
      this.body = body;
    }
    __extends(Parens, Base);
    Parens.prototype.children = ['body'];
    Parens.prototype.unwrap = function() {
      return this.body;
    };
    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };
    Parens.prototype.makeReturn = function() {
      return this.body.makeReturn();
    };
    Parens.prototype.compileNode = function(o) {
      var bare, code, expr;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compile(o);
      }
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call);
      code = expr.compile(o, LEVEL_PAREN);
      if (bare) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Parens;
  }();
  exports.For = For = function() {
    function For(body, source, name, index) {
      var _ref;
      this.name = name;
      this.index = index;
      this.source = source.source, this.guard = source.guard, this.step = source.step;
      this.body = Expressions.wrap([body]);
      this.raw = !!source.raw;
      this.object = !!source.object;
      if (this.object) {
        _ref = [this.index, this.name], this.name = _ref[0], this.index = _ref[1];
      }
      if (this.index instanceof Value) {
        throw SyntaxError('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.pattern) {
        throw SyntaxError('cannot pattern match a range loop');
      }
      this.returns = false;
    }
    __extends(For, Base);
    For.prototype.children = ['body', 'source', 'guard', 'step'];
    For.prototype.isStatement = YES;
    For.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    For.prototype.containsPureStatement = While.prototype.containsPureStatement;
    For.prototype.compileNode = function(o) {
      var body, defPart, forPart, guardPart, hasCode, hasPure, idt1, index, ivar, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, stepPart, svar, varPart, _ref;
      body = Expressions.wrap([this.body]);
      hasCode = body.contains(function(node) {
        return node instanceof Code;
      });
      hasPure = (_ref = last(body.expressions)) != null ? _ref.containsPureStatement() : void 0;
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      name = this.name && this.name.compile(o, LEVEL_LIST);
      index = this.index && this.index.compile(o, LEVEL_LIST);
      if (!hasCode) {
        if (name && !this.pattern) {
          scope.find(name, {
            immediate: true
          });
        }
        if (index) {
          scope.find(index, {
            immediate: true
          });
        }
      }
      if (this.returns && !hasPure) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.range ? name : index) || scope.freeVariable('i');
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPart = source.compile(merge(o, {
          index: ivar,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_TOP);
        if ((name || !this.raw) && !IDENTIFIER.test(svar)) {
          defPart = "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        namePart = this.pattern ? new Assign(this.name, new Literal("" + svar + "[" + ivar + "]")).compile(o, LEVEL_TOP) : name ? "" + name + " = " + svar + "[" + ivar + "]" : void 0;
        if (!this.object) {
          lvar = scope.freeVariable('len');
          stepPart = this.step ? "" + ivar + " += " + (this.step.compile(o, LEVEL_OP)) : "" + ivar + "++";
          forPart = "" + ivar + " = 0, " + lvar + " = " + svar + ".length; " + ivar + " < " + lvar + "; " + stepPart;
        }
      }
      if (this.returns && !hasPure) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = '\n' + (new Return(new Literal(rvar)).compile(o, LEVEL_PAREN));
        body = Push.wrap(rvar, body);
      }
      if (this.guard) {
        body = Expressions.wrap([new If(this.guard, body)]);
      }
      if (hasCode) {
        body = Closure.wrap(body, true);
      }
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPart = "" + ivar + " in " + svar;
        if (!this.raw) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp')) + ".call(" + svar + ", " + ivar + ")) continue;";
        }
      }
      if (!this.pattern) {
        defPart += this.pluckDirectCall(o, body, name, index);
      }
      body = body.compile(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (body) {
        body = '\n' + body + '\n';
      }
      return "" + defPart + (resultPart || '') + this.tab + "for (" + forPart + ") {" + guardPart + varPart + body + this.tab + "}" + (returnResult || '');
    };
    For.prototype.pluckDirectCall = function(o, body, name, index) {
      var arg, args, base, defs, expr, fn, i, idx, ref, val, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      defs = '';
      _ref = body.expressions;
      for (idx = 0, _len = _ref.length; idx < _len; idx++) {
        expr = _ref[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = expr.variable.unwrapAll();
        if (!((val instanceof Code) || (val instanceof Value && ((_ref2 = val.base) != null ? _ref2.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref3 = (_ref4 = val.properties[0].name) != null ? _ref4.value : void 0) === 'call' || _ref3 === 'apply')))) {
          continue;
        }
        fn = ((_ref5 = val.base) != null ? _ref5.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        args = compact([name, index]);
        if (this.object) {
          args.reverse();
        }
        for (i = 0, _len2 = args.length; i < _len2; i++) {
          arg = args[i];
          fn.params.push(new Param(args[i] = new Literal(arg)));
        }
        if (val.base) {
          _ref6 = [base, val], val.base = _ref6[0], base = _ref6[1];
          args.unshift(new Literal('this'));
        }
        body.expressions[idx] = new Call(base, args);
        defs += this.tab + new Assign(ref, fn).compile(o, LEVEL_TOP) + ';\n';
      }
      return defs;
    };
    return For;
  }();
  exports.Switch = Switch = function() {
    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }
    __extends(Switch, Base);
    Switch.prototype.children = ['subject', 'cases', 'otherwise'];
    Switch.prototype.isStatement = YES;
    Switch.prototype.makeReturn = function() {
      var pair, _i, _len, _ref, _ref2;
      _ref = this.cases;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pair = _ref[_i];
        pair[1].makeReturn();
      }
      if ((_ref2 = this.otherwise) != null) {
        _ref2.makeReturn();
      }
      return this;
    };
    Switch.prototype.compileNode = function(o) {
      var block, body, code, cond, conditions, expr, i, idt1, idt2, _i, _j, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4, _ref5;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      code = this.tab + ("switch (" + (((_ref = this.subject) != null ? _ref.compile(o, LEVEL_PAREN) : void 0) || false) + ") {\n");
      _ref2 = this.cases;
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        _ref3 = _ref2[i], conditions = _ref3[0], block = _ref3[1];
        _ref4 = flatten([conditions]);
        for (_i = 0, _len2 = _ref4.length; _i < _len2; _i++) {
          cond = _ref4[_i];
          if (!this.subject) {
            cond = cond.invert();
          }
          code += idt1 + ("case " + (cond.compile(o, LEVEL_PAREN)) + ":\n");
        }
        if (body = block.compile(o, LEVEL_TOP)) {
          code += body + '\n';
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        _ref5 = block.expressions;
        for (_j = 0, _len3 = _ref5.length; _j < _len3; _j += -1) {
          expr = _ref5[_j];
          if (!(expr instanceof Comment)) {
            if (!(expr instanceof Return)) {
              code += idt2 + 'break;\n';
            }
            break;
          }
        }
      }
      if (this.otherwise) {
        code += idt1 + ("default:\n" + (this.otherwise.compile(o, LEVEL_TOP)) + "\n");
      }
      return code + this.tab + '}';
    };
    return Switch;
  }();
  exports.If = If = function() {
    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.invert ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }
    __extends(If, Base);
    If.prototype.children = ['condition', 'body', 'elseBody'];
    If.prototype.bodyNode = function() {
      var _ref;
      return (_ref = this.body) != null ? _ref.unwrap() : void 0;
    };
    If.prototype.elseBodyNode = function() {
      var _ref;
      return (_ref = this.elseBody) != null ? _ref.unwrap() : void 0;
    };
    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureExpressions(elseBody);
      }
      return this;
    };
    If.prototype.isStatement = function(o) {
      var _ref;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref = this.elseBodyNode()) != null ? _ref.isStatement(o) : void 0);
    };
    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };
    If.prototype.makeReturn = function() {
      this.body && (this.body = new Expressions([this.body.makeReturn()]));
      this.elseBody && (this.elseBody = new Expressions([this.elseBody.makeReturn()]));
      return this;
    };
    If.prototype.ensureExpressions = function(node) {
      if (node instanceof Expressions) {
        return node;
      } else {
        return new Expressions([node]);
      }
    };
    If.prototype.compileStatement = function(o) {
      var body, child, cond, ifPart;
      child = del(o, 'chainChild');
      cond = this.condition.compile(o, LEVEL_PAREN);
      o.indent += TAB;
      body = this.ensureExpressions(this.body).compile(o);
      if (body) {
        body = "\n" + body + "\n" + this.tab;
      }
      ifPart = "if (" + cond + ") {" + body + "}";
      if (!child) {
        ifPart = this.tab + ifPart;
      }
      if (!this.elseBody) {
        return ifPart;
      }
      return ifPart + ' else ' + (this.isChain ? (o.indent = this.tab, o.chainChild = true, this.elseBody.unwrap().compile(o, LEVEL_TOP)) : "{\n" + (this.elseBody.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}");
    };
    If.prototype.compileExpression = function(o) {
      var alt, body, code, cond;
      cond = this.condition.compile(o, LEVEL_COND);
      body = this.bodyNode().compile(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compile(o, LEVEL_LIST) : 'void 0';
      code = "" + cond + " ? " + body + " : " + alt;
      if (o.level >= LEVEL_COND) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };
    return If;
  }();
  Push = {
    wrap: function(name, exps) {
      if (exps.isEmpty() || last(exps.expressions).containsPureStatement()) {
        return exps;
      }
      return exps.push(new Call(new Value(new Literal(name), [new Access(new Literal('push'))]), [exps.pop()]));
    }
  };
  Closure = {
    wrap: function(expressions, statement, noReturn) {
      var args, call, func, mentionsArgs, meth;
      if (expressions.containsPureStatement()) {
        return expressions;
      }
      func = new Code([], Expressions.wrap([expressions]));
      args = [];
      if ((mentionsArgs = expressions.contains(this.literalArgs)) || (expressions.contains(this.literalThis))) {
        meth = new Literal(mentionsArgs ? 'apply' : 'call');
        args = [new Literal('this')];
        if (mentionsArgs) {
          args.push(new Literal('arguments'));
        }
        func = new Value(func, [new Access(meth)]);
        func.noReturn = noReturn;
      }
      call = new Call(func, args);
      if (statement) {
        return Expressions.wrap([call]);
      } else {
        return call;
      }
    },
    literalArgs: function(node) {
      return node instanceof Literal && node.value === 'arguments';
    },
    literalThis: function(node) {
      return node instanceof Literal && node.value === 'this' || node instanceof Code && node.bound;
    }
  };
  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };
  UTILITIES = {
    "extends": 'function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}',
    bind: 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }',
    indexOf: 'Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}',
    hasProp: 'Object.prototype.hasOwnProperty',
    slice: 'Array.prototype.slice'
  };
  LEVEL_TOP = 1;
  LEVEL_PAREN = 2;
  LEVEL_LIST = 3;
  LEVEL_COND = 4;
  LEVEL_OP = 5;
  LEVEL_ACCESS = 6;
  TAB = '  ';
  TRAILING_WHITESPACE = /[ \t]+$/gm;
  IDENTIFIER = /^[$A-Za-z_][$\w]*$/;
  SIMPLENUM = /^[+-]?\d+$/;
  IS_STRING = /^['"]/;
  utility = function(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]);
    return ref;
  };
  multident = function(code, tab) {
    return code.replace(/\n/g, '$&' + tab);
  };
}).call(this);