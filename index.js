/**
* © Copyright [2015] Hewlett-Packard Development Company, L.P.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var HTMLtoJSX = require('htmltojsx');
var loaderUtils = require('loader-utils');
var jsdom = require('jsdom-no-contextify').jsdom;
var defaultView = jsdom().defaultView;

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

function createElement(tag) {
  return defaultView.document.createElement(tag);
}

function isEmpty(string) {
   return !/[^\s]/.test(string);
}

var ATTRIBUTE_MAPPING = {
  'classname': 'className',
  'activestyle': 'activeStyle',
  'htmlfor': 'htmlFor'
};

var TagToReactRouter = function() {

  return {
    reset: function() {
      this.output = '';

      this.routerLink = false;
    },

    oneLevelOnly: function(element) {

      //based on https://github.com/reactjs/react-magic/blob/master/src/htmltojsx.js#L253
      // Only a single child element
      if (
        element.childNodes.length === 1
        && element.childNodes[0].nodeType === 1
      ) {
        return true;
      }
      // Only one element, and all other children are whitespace
      var foundElement = false;
      for (var i = 0, count = element.childNodes.length; i < count; i++) {
        var child = element.childNodes[i];
        if (child.nodeType === 1) {
          if (foundElement) {
            // Encountered an element after already encountering another one
            // Therefore, more than one element at root level
            return false;
          } else {
            foundElement = true;
          }
        } else if (child.nodeType === 3 && !isEmpty(child.textContent)) {
          // Contains text content
          return false;
        }
      }
      return true;
    },

    parse: function(element) {

      this.reset();

      var wrapper = createElement('div');
      wrapper.innerHTML = element;

      if (this.oneLevelOnly(wrapper)) {
        this.traverse(wrapper);
      } else {
        this.visit(wrapper);
      }

      return this.output;
    },

    traverse: function(element) {
      for (var i = 0, count = element.childNodes.length; i < count; i++) {
        this.visit(element.childNodes[i]);
      }
    },

    visit: function(element) {
      this.begin(element);
      this.traverse(element);
      this.end(element);
    },

    handleText: function(element) {
      var text = element.textContent;
      if (this.routerLink) {
        text = text.replace(/\[/g, '{').replace(/]/g, '}');
      }

      var tempEl = createElement('div');
      tempEl.textContent = text;

      this.output += tempEl.innerHTML;
    },

    beginNode: function(node) {

      var tagName = this.routerLink ? 'Link' : node.tagName.toLowerCase();
      var attributes = [];
      for (var i = 0, count = node.attributes.length; i < count; i++) {
        var value = node.attributes[i].value;
        if (value.indexOf('[') === -1) {
          value = '"' + value + '"';
        } else {
          value = '{' + value.replace(/\[/g, '{').replace(/\]/g, '}') + '}';
        }

        var name = node.attributes[i].name;
        if (this.routerLink) {
          name = name.replace(/data-/g, '');
        }

        for (var key in ATTRIBUTE_MAPPING) {
          if (ATTRIBUTE_MAPPING.hasOwnProperty(key)) {
            name = name.replace(key, ATTRIBUTE_MAPPING[key]);
          }
        }
        attributes.push(name + '=' + value);
      }

      this.output += '<' + tagName;
      if (attributes.length > 0) {
        this.output += ' ' + attributes.join(' ');
      }
      if (node.firstChild) {
        this.output += '>';
      }
    },

    begin: function(node) {
      switch (node.nodeType) {
        case 1:
          if (node.tagName === 'A' && node.getAttribute('data-to')) {
            this.routerLink = true;
          }
          this.beginNode(node);
          break;

        case 3:
          this.handleText(node);
          break;
      }
    },

    end: function(node) {
      if (node.nodeType === 1) {
        var tagName = this.routerLink ? 'Link' : node.tagName.toLowerCase();
        this.routerLink = false;
        if (node.firstChild) {
          this.output += '</' + tagName + '>';
        } else {
          this.output += ' />';
        }
      }
    }
  };
};

function createReactComponent(content) {
  var converter = new HTMLtoJSX({
    createClass: false
  });

  var indent = '  ';
  var output = [
    'React.createClass({\n',
    indent,
    'render: function() {\n',
    indent + indent,
    'return (\n',
      converter.convert(new TagToReactRouter().parse(content)),
    ');\n',
    '}\n',
    '})\n'
  ].join('');

  return output;
}

function getGroupedElements(content) {
  var wrapperEl = createElement('div');
  wrapperEl.innerHTML = content;
  var elements = wrapperEl.getElementsByTagName('*');

  var groupedElements = {};
  for (var i = 0; i < elements.length;) {
    var wrapper = createElement('div');
    wrapper.appendChild(elements[i]);
    var tag = elements[i].tagName;
    if (groupedElements[tag]) {
      groupedElements[tag].push(wrapper.innerHTML);
    } else {
      groupedElements[tag] = [wrapper.innerHTML];
    }
  }

  return groupedElements;
}

function replaceVariables(content, query) {

  var newContent = content;
  for (var key in query) {
    if (query.hasOwnProperty(key)) {
      if (key.indexOf('__') === 0) {
        var re = new RegExp(key, 'g');
        newContent = newContent.replace(re, query[key]);
      }
    }
  }

  return newContent;

}

module.exports = function(content) {

  var query = loaderUtils.parseQuery(this.query);

  content = replaceVariables(content, query);

  var output;

  if (query.group) {

    var groupedElements = getGroupedElements(content);

    var tmp = '{';
    var index = 0;
    for (var key in groupedElements) {
      if (groupedElements.hasOwnProperty(key)) {
        var elements = groupedElements[key];

        tmp += [key.capitalize(), ':', createReactComponent(elements.join(''))].join('');

        if (index < Object.keys(groupedElements).length - 1) {
          tmp += ',';
        }

        index++;
      }

    }
    tmp += '};';

    output = tmp;
  } else {
    output = createReactComponent(content) + ';';
  }
	return 'import React from \'react\'\nmodule.exports = ' + output;
};
