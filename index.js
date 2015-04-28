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
var jsdom = require('jsdom').jsdom;
var window = jsdom().defaultView;

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

createElement = function(tag) {
  return window.document.createElement(tag);
};

function parseReactRouters(content) {
  var wrapperEl = createElement('div');
  wrapperEl.innerHTML = content;
  var elements = wrapperEl.getElementsByTagName('*');

  var newContent = '';
  for (var i = 0; i < elements.length; i++) {
    var reactRouterTo = elements[i].getAttribute('data-to');
    if (reactRouterTo) {
      var element = elements[i];

      reactRouterTo = 'to="' + elements[i].getAttribute('data-to') + '"';
      var reactRouterStyle = element.getAttribute('data-style') ?
        ' style={' + element.getAttribute('data-style').replace('[', '{').replace(']', '}') + '}' : '';

      var reactRouterActiveStyle = element.getAttribute('data-activestyle') ?
        ' activeStyle={' + element.getAttribute('data-activestyle').replace('[', '{').replace(']', '}') + '}' : '';

      var reactRouterParams = element.getAttribute('data-params') ?
        ' params={' + element.getAttribute('data-params').replace('[', '{').replace(']', '}') + '}' : '';

      var reactRouterQuery = element.getAttribute('data-query') ?
        ' query={' + element.getAttribute('data-query').replace('[', '{').replace(']', '}') + '}' : '';

      var routerAttributes = reactRouterTo + reactRouterStyle +
        reactRouterActiveStyle + reactRouterParams + reactRouterQuery;

      var linkString = '<Link ' + routerAttributes + '>' + elements[i].innerHTML.replace('[', '{').replace(']', '}') + '</Link>';
      newContent += linkString;
    } else {
      var wrapper = createElement('div');
      wrapper.appendChild(elements[i]);
      newContent += wrapper.innerHTML;
    }
  }

  return newContent;
}

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
    parseReactRouters(converter.convert(content)),
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

module.exports = function(content) {

  var query = loaderUtils.parseQuery(this.query);

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

  return 'module.exports = ' + output;
};