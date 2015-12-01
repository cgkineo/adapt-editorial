;define(['backbone'],function(Backbone){

	var Inherit = {};

	Inherit.prototype = {

		//calls overridden inherited functions on Backbone.Model, Backbone.Router or Backbone.View 
		//allows behaviour to be encapsulated in a single extend layer and brought forward to extended layers

		ascend: function(name, callback, defer) {

			var binder = function() {

				//fetch all the inherited parents and store them on the object
				if (!this.hasOwnProperty('_inheritParents')) {
					this._inheritParents = Inherit.prototype.getInheritParents.call(this);
				}

				var returnValue;
				var deferedParents = [];

				//itereate through the inherited parents
				for (var i = 0, l = this._inheritParents.length; i < l; i++) {
					var parent = this._inheritParents[i];
					var parentReturnValue;

					//check if the parent has the function requested
					if (!parent.hasOwnProperty(binder._callbackName)) continue;

					var callbackFunctionAtParent = parent[binder._callbackName];
					if (!callbackFunctionAtParent) continue;

					//check if the parent function is already ascend/descend bound
					if (callbackFunctionAtParent._performsInherited) {
						//if the parent function should be defered, add it to the defer list
						if (callbackFunctionAtParent._defer) {
							deferedParents.push(parent);
							continue;
						}

						//call the parent function without triggering the cascade backwards
						parentReturnValue = callbackFunctionAtParent._callback.apply(this, arguments);
					} else {

						//the parent function is not bound by ascend/descend so it can be called directly
						parentReturnValue = callbackFunctionAtParent.apply(this, arguments);
					}

					//merge the return value from the parent function into any existing return value
					returnValue = mergeReturnValues(parentReturnValue, returnValue);
				}

				//perform the same routine on the defered parent functions
				for (var i = 0, l = deferedParents.length; i < l; i++) {
					var parent = deferedParents[i];
					var parentReturnValue;
					if (!parent.hasOwnProperty(binder._callbackName)) continue;
					var callbackFunctionAtParent = parent[binder._callbackName];
					if (!callbackFunctionAtParent) continue;
					if (callbackFunctionAtParent._performsInherited) {
						parentReturnValue = callbackFunctionAtParent._callback.apply(this, arguments);
					} else {
						parentReturnValue = callbackFunctionAtParent.apply(this, arguments);
					}
					returnValue = mergeReturnValues(parentReturnValue, returnValue);
				}

				return returnValue;
			};
			//setup the binder function with the appropriate variables
			binder._performsInherited = true;
			binder._callback = callback;
			binder._callbackName = name;
			binder._defer = defer;

			return binder;

		},

		descend: function(name, callback, defer) {

			var binder = function() {

				//fetch all the inherited parents and store them on the object
				if (!this.hasOwnProperty('_inheritParents')) {
					this._inheritParents = Inherit.prototype.getInheritParents.call(this);
				}

				var returnValue;
				var deferedParents = [];

				//itereate through the inherited parents
				for (var i = this._inheritParents.length-1, l = -1; i > l; i--) {
					var parent = this._inheritParents[i];
					var parentReturnValue;

					//check if the parent has the function requested
					if (!parent.hasOwnProperty(binder._callbackName)) continue;

					var callbackFunctionAtParent = parent[binder._callbackName];
					if (!callbackFunctionAtParent) continue;

					//check if the parent function is already ascend/descend bound
					if (callbackFunctionAtParent._performsInherited) {
						//if the parent function should be defered, add it to the defer list
						if (callbackFunctionAtParent._defer) {
							deferedParents.push(parent);
							continue;
						}

						//call the parent function without triggering the cascade backwards
						parentReturnValue = callbackFunctionAtParent._callback.apply(this, arguments);
					} else {

						//the parent function is not bound by ascend/descend so it can be called directly
						parentReturnValue = callbackFunctionAtParent.apply(this, arguments);
					}

					//merge the return value from the parent function into any existing return value
					returnValue = mergeReturnValues(parentReturnValue, returnValue);
				}

				//perform the same routine on the defered parent functions
				for (var i = 0, l = deferedParents.length; i < l; i++) {
					var parent = deferedParents[i];
					var parentReturnValue;
					if (!parent.hasOwnProperty(binder._callbackName)) continue;
					var callbackFunctionAtParent = parent[binder._callbackName];
					if (!callbackFunctionAtParent) continue;
					if (callbackFunctionAtParent._performsInherited) {
						parentReturnValue = callbackFunctionAtParent._callback.apply(this, arguments);
					} else {
						parentReturnValue = callbackFunctionAtParent.apply(this, arguments);
					}
					returnValue = mergeReturnValues(parentReturnValue, returnValue);
				}

				return returnValue;
			};
			//setup the binder function with the appropriate variables
			binder._performsInherited = true;
			binder._callback = callback;
			binder._callbackName = name;
			binder._defer = defer;

			return binder;

			
		},

		//fetches all of the inherited prototypes from the Backbone.Model, Backbone.Router or Backbone.View
		getInheritParents: function() {

			//step back through the inheritance chain and collect all of the inherited parents
			var parents = [ this.constructor.prototype ];
			var parent = this.constructor.__super__;
			parents.unshift(parent)
			while (parent.constructor && parent.constructor.__super__) {
				var parent = parent.constructor.__super__;
				parents.unshift(parent);
			}
			return parents;

		}
		
	};

	Inherit.extend = function(to) {
		return _.extend({}, Inherit.prototype, to);
	};

	//extend Backbone with the three functions ascend, descend and getInheritParents
	_.extend(Backbone, Inherit.prototype);

	/* result
	* Backbone.ascend("functionName", function(sharedArgument) {
	*
	* });
	* Backbone.descend("functionName", function(sharedArgument) {
	*
	* });
	* Backbone.getInheritedParents.call(backboneObject);
	*/

	//merge return values together
	function mergeReturnValues(into, using) {

		var typeofInto = typeof into;
		var typeofUsing = typeof using;

		if (!into || !using) {
			//if one return value is undefined, use the one which is defined or return undefined
			return into || using;
		}
		if (typeofInto == typeofUsing) {
			//if the return values types are equal
			switch (typeofInto) {
			case "object":
				var isArrayInto = into instanceof Array;
				var isArrayUsing = using instanceof Array;
				if (isArrayInto == isArrayUsing && isArrayInto) {
					//if both are arrays, concatinate the results
					return into.concat(using);
				}
				//if both are objects, (shallow) merge them together
				return _.extend(into, using);
			case "string": case "number": 
				//if both a number or string, add the results to each other
				return into + using;
			}
		} else {
			//if the values have different types and both are defined, throw an error
			throw "Cannot merge different types";
		}
		
	}


	return Inherit;

});